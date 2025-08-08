import { useEffect, useMemo, useState } from "react";
import { HeaderBar } from "@/components/layout/HeaderBar";
import { SideNav } from "@/components/layout/SideNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload as UploadIcon, FileText, Clock, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import Papa from 'papaparse';

interface NpsRow {
  "Response Date": string;
  State: string;
  Region: string;
  City: string;
  "Store Code": string | number;
  "NPS Score": string | number;
  [key: string]: any;
}

interface UploadItem {
  id: string;
  filename: string;
  date: string;
  status: "completed" | "failed" | "processing";
  records: number;
  processing_time?: string;
  error?: string;
}

function loadHistory(): UploadItem[] {
  try { return JSON.parse(localStorage.getItem('nps-upload-history') || '[]'); } catch { return []; }
}
function saveHistory(items: UploadItem[]) { localStorage.setItem('nps-upload-history', JSON.stringify(items)); }
function loadRecords(): any[] { try { return JSON.parse(localStorage.getItem('nps-records') || '[]'); } catch { return []; } }
function saveRecords(rows: any[]) { localStorage.setItem('nps-records', JSON.stringify(rows)); }

export default function Upload() {
  const [userRole] = useState<"admin" | "user" | "store_manager">("admin");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [history, setHistory] = useState<UploadItem[]>(loadHistory());
  const [totalRecords, setTotalRecords] = useState(loadRecords().length);

  const handleLogout = () => {};

  const dedupeMerge = (existing: any[], incoming: any[]) => {
    const seen = new Set(existing.map(r => JSON.stringify(r)));
    const merged = [...existing];
    for (const row of incoming) {
      const key = JSON.stringify(row);
      if (!seen.has(key)) {
        merged.push(row);
        seen.add(key);
      }
    }
    return merged;
  };

  const parseAndPersist = async (files: FileList) => {
    const start = performance.now();
    const allNew: any[] = [];

    for (const file of Array.from(files)) {
      const text = await file.text();
      const result = Papa.parse<NpsRow>(text, { header: true, skipEmptyLines: true });
      const rows = (result.data || []).filter(r => r && r["Response Date"] && r["NPS Score"] !== undefined);
      const normalized = rows.map(r => ({
        responseDate: r["Response Date"],
        state: (r.State || '').toString().trim(),
        region: (r.Region || '').toString().trim(),
        city: (r.City || '').toString().trim(),
        storeCode: String(r["Store Code"]).trim(),
        nps: Number(r["NPS Score"]),
        raw: r,
      }));
      allNew.push(...normalized);

      // update history entry for this file
      const item: UploadItem = {
        id: `${Date.now()}-${file.name}`,
        filename: file.name,
        date: new Date().toLocaleString(),
        status: 'completed',
        records: normalized.length,
        processing_time: `${Math.max(1, Math.round((performance.now()-start)/1000))}s`
      };
      setHistory(prev => {
        const next = [item, ...prev];
        saveHistory(next);
        return next;
      });
    }

    // Merge and persist records
    const existing = loadRecords();
    const merged = dedupeMerge(existing, allNew);
    saveRecords(merged);
    setTotalRecords(merged.length);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadProgress(0);

    // fake progress while parsing
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + 12;
      });
    }, 200);

    parseAndPersist(files)
      .catch(() => {})
      .finally(() => setIsUploading(false));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer.files);
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4 text-nps-promoter" />;
      case "failed": return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "processing": return <Clock className="w-4 h-4 text-nps-passive animate-spin" />;
      default: return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const deleteHistoryItem = (id: string) => {
    const next = history.filter(h => h.id !== id);
    setHistory(next);
    saveHistory(next);
  };

  return (
    <div className="min-h-screen bg-background">
      <HeaderBar userRole={userRole} onLogout={handleLogout} />
      <div className="flex">
        <SideNav userRole={userRole} />
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold">Data Upload</h1>
            <p className="text-muted-foreground">Upload CSV files. Data is persisted locally and deduplicated.</p>
          </div>

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
                  isDragging ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <UploadIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Drag & drop your files here</h3>
                <p className="text-muted-foreground mb-4">Supports CSV up to 50MB</p>
                <Button onClick={() => document.getElementById('file-input')?.click()} disabled={isUploading}>Choose Files</Button>
                <input id="file-input" type="file" accept=".csv" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
              </div>

              {isUploading && (
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-sm"><span>Uploading...</span><span>{uploadProgress}%</span></div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              <div className="mt-6 p-4 bg-background/50 rounded-lg">
                <h4 className="font-medium mb-2">Current dataset</h4>
                <p className="text-sm text-muted-foreground">{totalRecords.toLocaleString()} records stored locally</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-chart border-muted">
            <CardHeader>
              <CardTitle>Upload History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {history.map(upload => (
                  <div key={upload.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(upload.status)}
                      <div>
                        <h4 className="font-medium">{upload.filename}</h4>
                        <p className="text-sm text-muted-foreground">
                          {upload.date}
                          {upload.status === 'completed' && (<>
                            {' '}• {upload.records.toLocaleString()} records • {upload.processing_time}
                          </>)}
                          {upload.status === 'failed' && (<> • {upload.error}</>)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={upload.status === 'completed' ? 'default' : upload.status === 'failed' ? 'destructive' : 'secondary'}>
                        {upload.status}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => deleteHistoryItem(upload.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="text-sm text-muted-foreground">No uploads yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}