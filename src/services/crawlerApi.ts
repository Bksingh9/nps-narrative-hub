const API_BASE_URL = 'http://localhost:3001/api/crawler';

export interface CrawlJob {
  url: string;
  template?: string;
  customSelectors?: any;
  usePuppeteer?: boolean;
}

export interface CrawlResponse {
  jobId?: string;
  batchId?: string;
  message: string;
  status: string;
}

export interface CrawlTemplate {
  id: string;
  name: string;
  usePuppeteer: boolean;
  selectors: any;
}

export interface JobStatus {
  status: 'processing' | 'completed' | 'failed';
  result?: any;
  npsData?: any[];
  error?: string;
  completedAt?: string;
}

class CrawlerAPI {
  // Crawl a single URL
  async crawlSingle(job: CrawlJob): Promise<CrawlResponse> {
    const response = await fetch(`${API_BASE_URL}/crawl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(job),
    });

    if (!response.ok) {
      throw new Error(`Crawl failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Crawl multiple URLs
  async crawlBatch(jobs: CrawlJob[]): Promise<CrawlResponse> {
    const response = await fetch(`${API_BASE_URL}/crawl-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobs }),
    });

    if (!response.ok) {
      throw new Error(`Batch crawl failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Get available templates
  async getTemplates(): Promise<{ templates: CrawlTemplate[]; total: number }> {
    const response = await fetch(`${API_BASE_URL}/templates`);

    if (!response.ok) {
      throw new Error(`Failed to fetch templates: ${response.statusText}`);
    }

    return response.json();
  }

  // Test crawler with a URL
  async testCrawler(job: CrawlJob): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(job),
    });

    if (!response.ok) {
      throw new Error(`Test crawl failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Get job status
  async getJobStatus(jobId: string): Promise<JobStatus> {
    const response = await fetch(`${API_BASE_URL}/job/${jobId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch job status: ${response.statusText}`);
    }

    return response.json();
  }

  // Poll job until complete
  async pollJobStatus(
    jobId: string,
    maxAttempts = 30,
    delayMs = 2000
  ): Promise<JobStatus> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getJobStatus(jobId);

      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    throw new Error('Job polling timeout');
  }

  // Import crawled data to local storage
  importToLocalStorage(npsData: any[]): void {
    if (!npsData || npsData.length === 0) {
      throw new Error('No data to import');
    }

    // Get existing records
    const existingRecords = JSON.parse(
      localStorage.getItem('nps-records') || '[]'
    );

    // Add crawled data with normalized format
    const normalizedData = npsData.map(record => ({
      ...record,
      _normalized: {
        storeCode: record['Store No.'] || record['Store Code'],
        storeName: record['Store Name'],
        state: record['State'],
        region: record['Region'],
        city: record['City'],
        nps:
          typeof record['NPS Score'] === 'number'
            ? record['NPS Score']
            : parseInt(record['NPS Score'] || '5'),
        responseDate: record['Response Date'],
        comments: record['Comments'],
        category: record['Category'] || 'Web Crawled',
        sourceUrl: record['Source URL'],
        crawledAt: record['Crawled At'],
        timestamp: new Date().toISOString(),
      },
    }));

    // Combine and save
    const allRecords = [...existingRecords, ...normalizedData];
    localStorage.setItem(
      'nps-records',
      JSON.stringify(allRecords?.slice(0, 500))
    );

    // Dispatch event to update UI
    window.dispatchEvent(
      new CustomEvent('nps-data-updated', {
        detail: { records: allRecords.length },
      })
    );
  }

  // Check if backend is running
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3001/health');
      const data = await response.json();
      return data.status === 'ok';
    } catch {
      return false;
    }
  }

  // Process CSV file
  async processCSV(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/csv`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`CSV processing failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Process multiple CSV files
  async processMultipleCSVs(files: File[]): Promise<any> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_BASE_URL}/csv-batch`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Batch CSV processing failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Process CSV from URL
  async processCSVFromURL(url: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/csv-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`CSV URL processing failed: ${response.statusText}`);
    }

    return response.json();
  }
}

export default new CrawlerAPI();
