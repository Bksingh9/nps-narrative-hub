import crawlerService from '../services/crawlerService.js';
import csvService from '../services/csvService.js';

// Store for job status (in production, use Redis or database)
const jobStore = new Map();

// Predefined templates for common platforms
const templates = {
  googleReviews: {
    name: 'Google Reviews',
    selectors: {
      storeName: 'h1[data-attrid="title"]',
      ratings: '.jANrlb .fontBodyMedium',
      reviews: '.MyEned',
      dates: '.rsqaWe',
      npsScore: 'span[aria-label*="stars"]',
    },
    usePuppeteer: true,
  },
  trustpilot: {
    name: 'Trustpilot',
    selectors: {
      storeName: 'h1 span',
      ratings: '[data-rating]',
      reviews: '.styles_reviewCardInner__EwDq2 p',
      dates: 'time',
      npsScore: '.styles_rating__pY5Pk',
    },
    usePuppeteer: false,
  },
  yelp: {
    name: 'Yelp Reviews',
    selectors: {
      storeName: 'h1',
      ratings: '[aria-label*="star rating"]',
      reviews: 'span[lang="en"]',
      dates: '.css-chan6m',
      waitFor: '.review',
    },
    usePuppeteer: true,
  },
  surveyMonkey: {
    name: 'SurveyMonkey Results',
    selectors: {
      dataTable: 'table.results-table',
      npsScore: '.nps-score',
      waitFor: '.survey-results',
    },
    usePuppeteer: true,
  },
  generic: {
    name: 'Generic Crawler',
    selectors: {
      dataTable: 'table',
      reviews: '.review, .comment, .feedback',
      ratings: '.rating, .score, .stars',
      dates: '.date, time, .timestamp',
    },
    usePuppeteer: false,
  },
};

const crawlerController = {
  // Crawl a single URL
  async crawlSingle(req, res) {
    try {
      const { url, template, customSelectors, usePuppeteer = false } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      // Get selectors from template or use custom
      let selectors = customSelectors || {};
      let shouldUsePuppeteer = usePuppeteer;

      if (template && templates[template]) {
        selectors = templates[template].selectors;
        shouldUsePuppeteer = templates[template].usePuppeteer;
      }

      // Create job
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      jobStore.set(jobId, {
        status: 'processing',
        startedAt: new Date().toISOString(),
      });

      // Start crawling (async)
      crawlerService[
        shouldUsePuppeteer ? 'crawlWithPuppeteer' : 'crawlWithCheerio'
      ](url, selectors)
        .then(result => {
          const npsData = crawlerService.transformToNPSFormat(result);
          jobStore.set(jobId, {
            status: 'completed',
            result,
            npsData,
            completedAt: new Date().toISOString(),
          });
        })
        .catch(error => {
          jobStore.set(jobId, {
            status: 'failed',
            error: error.message,
            completedAt: new Date().toISOString(),
          });
        });

      res.json({
        jobId,
        message: 'Crawl job started',
        status: 'processing',
      });
    } catch (error) {
      console.error('Crawl error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Crawl multiple URLs
  async crawlBatch(req, res) {
    try {
      const { jobs } = req.body;

      if (!jobs || !Array.isArray(jobs)) {
        return res.status(400).json({ error: 'Jobs array is required' });
      }

      // Prepare jobs with IDs
      const preparedJobs = jobs.map(job => ({
        ...job,
        id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        selectors:
          job.template && templates[job.template]
            ? templates[job.template].selectors
            : job.selectors || {},
        usePuppeteer:
          job.template && templates[job.template]
            ? templates[job.template].usePuppeteer
            : job.usePuppeteer || false,
      }));

      // Store batch job
      const batchId = `batch_${Date.now()}`;
      jobStore.set(batchId, {
        status: 'processing',
        jobs: preparedJobs.map(j => j.id),
        startedAt: new Date().toISOString(),
      });

      // Start crawling
      crawlerService
        .crawlMultiple(preparedJobs)
        .then(results => {
          jobStore.set(batchId, {
            status: 'completed',
            results,
            completedAt: new Date().toISOString(),
          });
        })
        .catch(error => {
          jobStore.set(batchId, {
            status: 'failed',
            error: error.message,
            completedAt: new Date().toISOString(),
          });
        });

      res.json({
        batchId,
        message: `Batch crawl started with ${preparedJobs.length} jobs`,
        status: 'processing',
      });
    } catch (error) {
      console.error('Batch crawl error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get available templates
  getTemplates(req, res) {
    const templateList = Object.entries(templates).map(([key, value]) => ({
      id: key,
      name: value.name,
      usePuppeteer: value.usePuppeteer,
      selectors: value.selectors,
    }));

    res.json({
      templates: templateList,
      total: templateList.length,
    });
  },

  // Test crawler with a URL
  async testCrawler(req, res) {
    try {
      const { url, selectors = {}, usePuppeteer = false } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      const result = await crawlerService[
        usePuppeteer ? 'crawlWithPuppeteer' : 'crawlWithCheerio'
      ](url, selectors);
      const npsData = crawlerService.transformToNPSFormat(result);

      res.json({
        success: result.success,
        rawData: result.data,
        transformedData: npsData,
        recordsFound: npsData.length,
        timestamp: result.timestamp,
      });
    } catch (error) {
      console.error('Test crawl error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get job status
  getJobStatus(req, res) {
    const { jobId } = req.params;

    if (!jobStore.has(jobId)) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = jobStore.get(jobId);
    res.json(job);
  },

  // Process single CSV file
  async processCSV(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No CSV file provided' });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const result = await csvService.parseCSV(csvContent);

      if (result.success) {
        res.json({
          success: true,
          message: `Successfully processed ${result.totalRecords} records`,
          data: result.data,
          totalRecords: result.totalRecords,
          columns: result.columns,
          timestamp: result.timestamp,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          timestamp: result.timestamp,
        });
      }
    } catch (error) {
      console.error('CSV processing error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },

  // Process multiple CSV files
  async processMultipleCSVs(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No CSV files provided' });
      }

      const csvContents = req.files.map(file => file.buffer.toString('utf-8'));
      const result = await csvService.processMultipleCSVs(csvContents);

      res.json({
        success: true,
        message: `Successfully processed ${result.totalRecords} records from ${result.filesProcessed} files`,
        data: result.data,
        totalRecords: result.totalRecords,
        filesProcessed: result.filesProcessed,
        timestamp: result.timestamp,
      });
    } catch (error) {
      console.error('Batch CSV processing error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },

  // Process CSV from URL
  async processCSVFromURL(req, res) {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      const result = await csvService.processCSVFromURL(url);

      if (result.success) {
        res.json({
          success: true,
          message: `Successfully processed ${result.totalRecords} records from URL`,
          data: result.data,
          totalRecords: result.totalRecords,
          columns: result.columns,
          sourceUrl: url,
          timestamp: result.timestamp,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          sourceUrl: url,
          timestamp: result.timestamp,
        });
      }
    } catch (error) {
      console.error('CSV URL processing error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
};

export default crawlerController;
