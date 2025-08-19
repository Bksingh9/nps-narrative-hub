import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Table, FileSpreadsheet, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import authService from '@/services/authService';

interface DataExportButtonProps {
  data: any[];
  filename?: string;
  className?: string;
  showFormats?: boolean;
  allowedRoles?: string[];
}

export function DataExportButton({ 
  data, 
  filename = 'nps-data',
  className = '',
  showFormats = true,
  allowedRoles = ['admin', 'store_manager', 'user']
}: DataExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const currentUser = authService.getCurrentUser();
  
  // Check if user has permission to export
  const hasPermission = currentUser && allowedRoles.includes(currentUser.role);
  
  if (!hasPermission) {
    return null;
  }

  const exportToCSV = async () => {
    if (!data || data.length === 0) {
      toast.error('No data available to export');
      return;
    }

    setIsExporting(true);
    
    try {
      // Get headers from first object
      const headers = Object.keys(data[0]);
      
      // Create CSV content
      const csvContent = [
        // Headers
        headers.join(','),
        // Data rows
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Handle special characters and commas
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            // Escape quotes and wrap in quotes if contains comma or newline
            if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(',')
        )
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${data.length} records successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = async () => {
    if (!data || data.length === 0) {
      toast.error('No data available to export');
      return;
    }

    setIsExporting(true);
    
    try {
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${data.length} records as JSON`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const exportFromBackend = async () => {
    try {
      setIsExporting(true);
      
      // Fetch current filtered data from backend
      const response = await fetch('http://localhost:3001/api/crawler/csv/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: {} }) // Get all data
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Use the fetched data for export
        const exportData = result.data;
        
        // Get headers from first object
        const headers = Object.keys(exportData[0]);
        
        // Create CSV content
        const csvContent = [
          headers.join(','),
          ...exportData.map((row: any) => 
            headers.map(header => {
              const value = row[header];
              if (value === null || value === undefined) return '';
              const stringValue = String(value);
              if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
              }
              return stringValue;
            }).join(',')
          )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `complete-nps-data-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`Exported ${exportData.length} records from server`);
      } else {
        toast.error('No data available on server');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data from server');
    } finally {
      setIsExporting(false);
    }
  };

  // Show role-specific button for non-admin users
  if (currentUser?.role !== 'admin' && !showFormats) {
    return (
      <Button
        onClick={exportToCSV}
        disabled={isExporting || !data || data.length === 0}
        className={className}
        variant="outline"
      >
        {isExporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Download Data
          </>
        )}
      </Button>
    );
  }

  // Show dropdown menu for admin users
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={className}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Export Options
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={exportToCSV} disabled={!data || data.length === 0}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>Export as CSV</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {data?.length || 0} rows
          </span>
        </DropdownMenuItem>
        
        {showFormats && (
          <DropdownMenuItem onClick={exportToJSON} disabled={!data || data.length === 0}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Export as JSON</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {data?.length || 0} rows
            </span>
          </DropdownMenuItem>
        )}
        
        {currentUser?.role === 'admin' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={exportFromBackend}>
              <Table className="mr-2 h-4 w-4" />
              <span>Export All Data</span>
              <span className="ml-auto text-xs text-muted-foreground">
                Full dataset
              </span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default DataExportButton; 