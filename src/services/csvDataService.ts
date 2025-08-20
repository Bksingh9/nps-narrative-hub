const API_BASE_URL = 'http://localhost:3001/api/crawler';

export interface CSVUploadResponse {
  success: boolean;
  message?: string;
  metadata?: {
    totalRecords: number;
    columns: string[];
    columnMapping: Record<string, string | null>;
    dateRange: {
      from: string | null;
      to: string | null;
    };
    aggregates: {
      averageNPS: number;
      npsScore: number;
      promoters: number;
      passives: number;
      detractors: number;
      totalResponses: number;
      stateBreakdown: Record<string, any>;
      storeBreakdown: Record<string, any>;
    };
  };
  dataPreview?: any[];
  totalRecords?: number;
  error?: string;
}

export interface FilterOptions {
  dateFrom?: string;
  dateTo?: string;
  state?: string;
  storeCode?: string;
  region?: string;
  npsCategory?: 'Promoter' | 'Passive' | 'Detractor';
}

export interface FilteredDataResponse {
  success: boolean;
  data: any[];
  aggregates: any;
  totalRecords: number;
  lastUpdated: string;
}

export interface FilterOptionsResponse {
  success: boolean;
  states: string[];
  stores: { code: string; name: string }[];
  regions: string[];
  dateRange: { from: string | null; to: string | null };
}

class CSVDataService {
  private currentData: any[] = [];
  private metadata: any = {};
  private lastUpdated: string | null = null;

  // Upload CSV file for real-time processing
  async uploadCSV(file: File): Promise<CSVUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/csv/upload-realtime`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload CSV');
      }

      const result = await response.json();

      // Store data locally for quick access
      if (result.success) {
        this.metadata = result.metadata;
        this.lastUpdated = new Date().toISOString();

        // Also save to localStorage for persistence
        this.saveToLocalStorage(result);
      }

      return result;
    } catch (error) {
      console.error('CSV Upload Error:', error);
      throw error;
    }
  }

  // Apply filters to get filtered data
  async filterData(filters: FilterOptions): Promise<FilteredDataResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/csv/filter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filters }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to filter data');
      }

      const result = await response.json();

      // Cache filtered data
      if (result.success) {
        this.currentData = result.data;
      }

      return result;
    } catch (error) {
      console.error('Filter Error:', error);
      throw error;
    }
  }

  // Get available filter options
  async getFilterOptions(): Promise<FilterOptionsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/csv/filter-options`);

      if (!response.ok) {
        throw new Error('Failed to get filter options');
      }

      return response.json();
    } catch (error) {
      console.error('Get Filter Options Error:', error);
      throw error;
    }
  }

  // Get current data state
  async getCurrentDataState(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/csv/current-data`);

      if (!response.ok) {
        throw new Error('Failed to get current data state');
      }

      return response.json();
    } catch (error) {
      console.error('Get Current Data Error:', error);
      throw error;
    }
  }

  // Clear all data
  async clearData(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/csv/clear`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear data');
      }

      // Clear local cache
      this.currentData = [];
      this.metadata = {};
      this.lastUpdated = null;

      // Clear localStorage
      localStorage.removeItem('csv-realtime-data');
    } catch (error) {
      console.error('Clear Data Error:', error);
      throw error;
    }
  }

  // Save to localStorage for persistence
  private saveToLocalStorage(data: any): void {
    const storageData = {
      metadata: data.metadata,
      lastUpdated: this.lastUpdated,
      uploadedAt: new Date().toISOString(),
    };

    localStorage.setItem('csv-realtime-data', JSON.stringify(storageData));

    // Dispatch event for UI updates
    window.dispatchEvent(
      new CustomEvent('csv-data-uploaded', {
        detail: {
          totalRecords: data.metadata?.totalRecords || 0,
          metadata: data.metadata,
        },
      })
    );
  }

  // Load metadata from localStorage
  loadFromLocalStorage(): any {
    const stored = localStorage.getItem('csv-realtime-data');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.metadata = data.metadata;
        this.lastUpdated = data.lastUpdated;
        return data;
      } catch (error) {
        console.error('Error loading from localStorage:', error);
      }
    }
    return null;
  }

  // Get current metadata
  getMetadata(): any {
    return this.metadata;
  }

  // Get last updated time
  getLastUpdated(): string | null {
    return this.lastUpdated;
  }

  // Calculate NPS metrics from data
  calculateNPSMetrics(data: any[]): {
    score: number;
    promoters: number;
    passives: number;
    detractors: number;
    total: number;
  } {
    if (!data || data.length === 0) {
      return { score: 0, promoters: 0, passives: 0, detractors: 0, total: 0 };
    }

    const promoters = data.filter(d => d.npsScore >= 9).length;
    const passives = data.filter(d => d.npsScore >= 7 && d.npsScore < 9).length;
    const detractors = data.filter(d => d.npsScore < 7).length;
    const total = data.length;

    const score = total > 0 ? ((promoters - detractors) / total) * 100 : 0;

    return {
      score: Math.round(score),
      promoters,
      passives,
      detractors,
      total,
    };
  }

  // Get trend data for charts
  getTrendData(data: any[], groupBy: 'day' | 'week' | 'month' = 'day'): any[] {
    if (!data || data.length === 0) return [];

    const grouped = new Map<string, any[]>();

    data.forEach(record => {
      const date = new Date(record.responseDate);
      let key: string;

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      }

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(record);
    });

    // Calculate NPS for each group
    const trendData = Array.from(grouped.entries()).map(([date, records]) => {
      const metrics = this.calculateNPSMetrics(records);
      return {
        date,
        npsScore: metrics.score,
        responses: records.length,
        promoters: metrics.promoters,
        passives: metrics.passives,
        detractors: metrics.detractors,
      };
    });

    return trendData.sort((a, b) => a.date.localeCompare(b.date));
  }

  // Export data to CSV
  exportToCSV(data: any[]): void {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Prepare CSV content
    const headers = [
      'Store Code',
      'Store Name',
      'State',
      'Region',
      'City',
      'NPS Score',
      'NPS Category',
      'Response Date',
      'Comments',
    ];

    const rows = data.map(record => [
      record.storeCode || '',
      record.storeName || '',
      record.state || '',
      record.region || '',
      record.city || '',
      record.npsScore || '',
      record.npsCategory || '',
      record.responseDate || '',
      `"${(record.comments || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nps-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export default new CSVDataService();
