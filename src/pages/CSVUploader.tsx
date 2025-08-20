import { useState, useCallback } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function CSVUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [dataInfo, setDataInfo] = useState<any>(null);
  const navigate = useNavigate();

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile && selectedFile.type === 'text/csv') {
        setFile(selectedFile);
        setUploadStatus('idle');
      } else {
        toast.error('Please select a valid CSV file');
      }
    },
    []
  );

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        'http://localhost:3001/api/crawler/csv/upload-realtime',
        {
          method: 'POST',
          body: formData,
        }
      );

      const result = await response.json();

      if (result.success) {
        setUploadStatus('success');
        setDataInfo({
          totalRecords: result.totalRecords,
          aggregates: result.aggregates,
          headers: result.headers,
          dateRange: result.dateRange,
        });

        toast.success(`Successfully loaded ${result.totalRecords} records!`);

        // Dispatch event to update dashboard
        window.dispatchEvent(
          new CustomEvent('nps-data-updated', {
            detail: {
              records: result.totalRecords,
              aggregates: result.aggregates,
            },
          })
        );

        // Navigate to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setUploadStatus('error');
        toast.error(result.error || 'Failed to upload CSV');
      }
    } catch (error) {
      setUploadStatus('error');
      toast.error(
        'Failed to connect to server. Please ensure backend is running.'
      );
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      setFile(droppedFile);
      setUploadStatus('idle');
    } else {
      toast.error('Please drop a valid CSV file');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Upload NPS Data CSV</CardTitle>
          <CardDescription>
            Upload your CSV file containing NPS survey responses. The system
            will automatically detect columns for Response Date, State, Store
            Code, and NPS scores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              file
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-2">
                <FileText className="mx-auto h-12 w-12 text-green-600" />
                <p className="text-lg font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setUploadStatus('idle');
                    setDataInfo(null);
                  }}
                >
                  Remove File
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="text-lg font-medium">
                  Drag & Drop your CSV file here
                </p>
                <p className="text-sm text-gray-500">
                  Or click to select a file
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload-input"
                />
                <label
                  htmlFor="csv-upload-input"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  Select File
                </label>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            className="w-full"
            disabled={!file || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload CSV'
            )}
          </Button>

          {/* Status Messages */}
          {uploadStatus === 'success' && dataInfo && (
            <div className="space-y-3">
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                <AlertDescription className="text-green-800">
                  CSV uploaded successfully! Redirecting to dashboard...
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-blue-600 font-medium">Total Records</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {dataInfo.totalRecords}
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-purple-600 font-medium">NPS Score</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {dataInfo.aggregates?.npsScore?.toFixed(1) || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}
          {uploadStatus === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>
                Upload failed. Please try again or check console for details.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
