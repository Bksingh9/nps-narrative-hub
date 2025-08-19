import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CSVDataTableProps {
  data: any[];
  columns?: string[];
  title?: string;
  showPagination?: boolean;
  pageSize?: number;
}

export function CSVDataTable({ 
  data, 
  columns,
  title = "CSV Data",
  showPagination = true,
  pageSize = 50
}: CSVDataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Get columns from data if not provided
  const displayColumns = columns || (data.length > 0 ? Object.keys(data[0]) : []);
  
  // Pagination
  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = showPagination ? data.slice(startIndex, endIndex) : data;
  
  // Export to CSV
  const exportToCSV = () => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    const headers = displayColumns.join(',');
    const rows = data.map(row => 
      displayColumns.map(col => {
        const value = row[col] || '';
        // Escape quotes and wrap in quotes if contains comma
        const escaped = String(value).replace(/"/g, '""');
        return escaped.includes(',') ? `"${escaped}"` : escaped;
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nps-data-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success("Data exported successfully");
  };
  
  // Get NPS category color
  const getNPSColor = (score: number) => {
    if (score >= 9) return "bg-green-100 text-green-800";
    if (score >= 7) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };
  
  // Format cell value for display
  const formatCellValue = (value: any, column: string) => {
    if (value === null || value === undefined) return '-';
    
    // Special formatting for NPS scores
    if (column.toLowerCase().includes('nps') || column.toLowerCase().includes('score')) {
      const score = parseFloat(value);
      if (!isNaN(score)) {
        return (
          <Badge className={getNPSColor(score)}>
            {score.toFixed(1)}
          </Badge>
        );
      }
    }
    
    // Format dates
    if (column.toLowerCase().includes('date')) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString();
        }
      } catch {
        // Fall through to default
      }
    }
    
    // Truncate long text
    const strValue = String(value);
    if (strValue.length > 50) {
      return (
        <span title={strValue}>
          {strValue.substring(0, 47)}...
        </span>
      );
    }
    
    return strValue;
  };
  
  // View record details
  const viewDetails = (record: any) => {
    setSelectedRecord(record);
    setShowDetails(true);
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{title}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Badge variant="secondary">
                {data.length} records
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  {displayColumns.slice(0, 8).map(column => (
                    <TableHead key={column}>
                      {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </TableHead>
                  ))}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={displayColumns.length + 2} className="text-center text-muted-foreground">
                      No data available. Please upload a CSV file or apply different filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">
                        {startIndex + index + 1}
                      </TableCell>
                      {displayColumns.slice(0, 8).map(column => (
                        <TableCell key={column}>
                          {formatCellValue(row[column], column)}
                        </TableCell>
                      ))}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewDetails(row)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {showPagination && totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} records
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = currentPage - 2 + i;
                    if (page < 1 || page > totalPages) return null;
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Details</DialogTitle>
            <DialogDescription>
              Complete information for this NPS record
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              {Object.entries(selectedRecord).map(([key, value]) => (
                <div key={key} className="grid grid-cols-3 gap-4 items-start">
                  <div className="font-medium text-sm text-muted-foreground">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                  <div className="col-span-2 text-sm">
                    {formatCellValue(value, key)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CSVDataTable; 