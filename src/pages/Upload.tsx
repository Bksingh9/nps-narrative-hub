import { useState } from "react";
import { HeaderBar } from "@/components/layout/HeaderBar";
import { SideNav } from "@/components/layout/SideNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload as UploadIcon, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";

// Mock upload history
const uploadHistory = [
  {
    id: 1,
    filename: "nps_survey_june_2024.csv",
    date: "2024-06-15 14:30",
    status: "completed",
    records: 1247,
    processing_time: "42s"
  },
  {
    id: 2,
    filename: "nps_survey_may_2024.csv", 
    date: "2024-05-20 09:15",
    status: "completed",
    records: 1389,
    processing_time: "38s"
  },
  {
    id: 3,
    filename: "nps_survey_april_2024.csv",
    date: "2024-04-18 16:45",
    status: "failed",
    records: 0,
    error: "Invalid CSV format"
  }
];

export default function Upload() {
  const [userRole] = useState<"admin" | "user" | "store_manager">("admin");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleLogout = () => {
    console.log("Logout clicked");
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-nps-promoter" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "processing":
        return <Clock className="w-4 h-4 text-nps-passive animate-spin" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <HeaderBar userRole={userRole} onLogout={handleLogout} />
      
      <div className="flex">
        <SideNav userRole={userRole} />
        
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold">Data Upload</h1>
            <p className="text-muted-foreground">
              Upload CSV/Excel files for NPS analysis
            </p>
          </div>

          {/* Upload Area */}
          <Card className="bg-gradient-chart border-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UploadIcon className="w-5 h-5 text-primary" />
                Upload Survey Data
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                  isDragging 
                    ? "border-primary bg-primary/5" 
                    : "border-muted hover:border-primary/50"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <UploadIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Drag & drop your files here
                </h3>
                <p className="text-muted-foreground mb-4">
                  Supports CSV and Excel files up to 50MB
                </p>
                <Button
                  onClick={() => document.getElementById('file-input')?.click()}
                  disabled={isUploading}
                >
                  Choose Files
                </Button>
                <input
                  id="file-input"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              {/* File Requirements */}
              <div className="mt-6 p-4 bg-background/50 rounded-lg">
                <h4 className="font-medium mb-2">File Requirements:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• CSV or Excel format (.csv, .xlsx, .xls)</li>
                  <li>• Required columns: store_id, customer_id, nps_score, survey_date</li>
                  <li>• Optional columns: state, city, response_drivers</li>
                  <li>• Maximum file size: 50MB</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Upload History */}
          <Card className="bg-gradient-chart border-muted">
            <CardHeader>
              <CardTitle>Upload History</CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {uploadHistory.map((upload) => (
                  <div 
                    key={upload.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/50"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(upload.status)}
                      <div>
                        <h4 className="font-medium">{upload.filename}</h4>
                        <p className="text-sm text-muted-foreground">
                          {upload.date}
                          {upload.status === "completed" && (
                            <> • {upload.records.toLocaleString()} records • {upload.processing_time}</>
                          )}
                          {upload.status === "failed" && (
                            <> • {upload.error}</>
                          )}
                        </p>
                      </div>
                    </div>

                    <Badge 
                      variant={
                        upload.status === "completed" ? "default" :
                        upload.status === "failed" ? "destructive" : "secondary"
                      }
                    >
                      {upload.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}