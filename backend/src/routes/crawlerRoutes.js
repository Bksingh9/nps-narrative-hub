import express from 'express';
import multer from 'multer';
import crawlerController from '../controllers/crawlerController.js';
import csvProcessor from '../services/csvProcessor.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// In-memory data store for real-time filtering
let csvDataStore = {
  data: [],
  metadata: {},
  lastUpdated: null
};

// Configure multer for CSV uploads with disk storage
const upload = multer({ 
  dest: path.join(__dirname, '../../uploads/'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Crawl a single URL
router.post('/crawl', crawlerController.crawlSingle);

// Crawl multiple URLs
router.post('/crawl-batch', crawlerController.crawlBatch);

// Process CSV file
router.post('/csv', upload.single('file'), crawlerController.processCSV);

// Process multiple CSV files
router.post('/csv-batch', upload.array('files', 10), crawlerController.processMultipleCSVs);

// Process CSV from URL
router.post('/csv-url', crawlerController.processCSVFromURL);

// Enhanced CSV processing with real-time capabilities
router.post('/csv/upload-realtime', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const result = await csvProcessor.processCSV(req.file.path);
    
    // Store in memory for real-time filtering
    csvDataStore.data = result.data;
    csvDataStore.metadata = result.metadata;
    csvDataStore.lastUpdated = new Date().toISOString();
    
    // Clean up uploaded file
    try {
      await fs.unlink(req.file.path);
    } catch (cleanupError) {
      console.error('Error cleaning up file:', cleanupError);
    }
    
    res.json({
      success: true,
      message: 'CSV processed successfully',
      metadata: result.metadata,
      dataPreview: result.data.slice(0, 5),
      totalRecords: result.data.length
    });
  } catch (error) {
    console.error('CSV Processing Error:', error);
    
    // Clean up file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Real-time data filtering endpoint
router.post('/csv/filter', (req, res) => {
  try {
    const { filters } = req.body;
    
    if (!csvDataStore.data || csvDataStore.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No data available. Please upload a CSV file first.'
      });
    }
    
    // Apply filters
    const filteredData = csvProcessor.filterData(csvDataStore.data, filters || {});
    
    // Calculate new aggregates for filtered data
    const aggregates = csvProcessor.calculateAggregates(filteredData);
    
    res.json({
      success: true,
      data: filteredData,
      aggregates,
      totalRecords: filteredData.length,
      lastUpdated: csvDataStore.lastUpdated
    });
  } catch (error) {
    console.error('Filter Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get current data state
router.get('/csv/current-data', (req, res) => {
  res.json({
    success: true,
    hasData: csvDataStore.data.length > 0,
    totalRecords: csvDataStore.data.length,
    metadata: csvDataStore.metadata,
    lastUpdated: csvDataStore.lastUpdated,
    dataPreview: csvDataStore.data.slice(0, 5)
  });
});

// Get available filter options
router.get('/csv/filter-options', (req, res) => {
  if (!csvDataStore.data || csvDataStore.data.length === 0) {
    return res.json({
      success: false,
      states: [],
      stores: [],
      regions: [],
      cities: [],
      formats: [],
      subFormats: [],
      dateRange: { from: null, to: null }
    });
  }
  
  // Extract unique values for filters
  const states = [...new Set(csvDataStore.data.map(d => d.state))].filter(Boolean).sort();
  const storesMap = new Map();
  csvDataStore.data.forEach(d => {
    if (d.storeCode) {
      storesMap.set(d.storeCode, {
        code: d.storeCode,
        name: d.storeName || d.storeCode
      });
    }
  });
  const stores = Array.from(storesMap.values()).sort((a, b) => a.code.localeCompare(b.code));
  const regions = [...new Set(csvDataStore.data.map(d => d.region || d['Region Code']))].filter(Boolean).sort();
  const cities = [...new Set(csvDataStore.data.map(d => d.city || d['City']))].filter(Boolean).sort();
  const formats = [...new Set(csvDataStore.data.map(d => d['Format']))].filter(Boolean).sort();
  const subFormats = [...new Set(csvDataStore.data.map(d => d['Sub Format']))].filter(Boolean).sort();
  
  res.json({
    success: true,
    states,
    stores,
    regions,
    cities,
    formats,
    subFormats,
    dateRange: csvDataStore.metadata?.aggregates?.dateRange || { from: null, to: null }
  });
});

// Clear current data
router.delete('/csv/clear', (req, res) => {
  csvDataStore = {
    data: [],
    metadata: {},
    lastUpdated: null
  };
  
  res.json({
    success: true,
    message: 'Data cleared successfully'
  });
});

// Get predefined crawler templates for common sites
router.get('/templates', crawlerController.getTemplates);

// Test crawler with a URL
router.post('/test', crawlerController.testCrawler);

// Get crawler job status
router.get('/job/:jobId', crawlerController.getJobStatus);

// Debug endpoint to check CSV data and column detection
router.get('/csv/debug', (req, res) => {
  if (!csvDataStore.data || csvDataStore.data.length === 0) {
    return res.json({
      success: false,
      message: 'No data available. Please upload a CSV file first.',
      dataStore: {
        hasData: false,
        recordCount: 0
      }
    });
  }
  
  // Get sample records
  const sampleRecords = csvDataStore.data.slice(0, 5);
  
  // Check date fields
  const dateFieldAnalysis = {
    totalRecords: csvDataStore.data.length,
    recordsWithValidDates: csvDataStore.data.filter(r => r.responseDate && !isNaN(new Date(r.responseDate).getTime())).length,
    sampleDates: sampleRecords.map(r => ({
      original: r.rawData?.['Response Date'] || r.rawData?.['Date'] || 'N/A',
      parsed: r.responseDate,
      isValid: !isNaN(new Date(r.responseDate).getTime())
    })),
    dateRange: csvDataStore.metadata?.aggregates?.dateRange || { from: null, to: null }
  };
  
  // Column detection info
  const columnInfo = {
    detectedColumns: csvDataStore.metadata?.columnMapping || {},
    availableColumns: csvDataStore.metadata?.columns || []
  };
  
  res.json({
    success: true,
    debug: {
      dateFieldAnalysis,
      columnInfo,
      sampleRecords: sampleRecords.map(r => ({
        storeCode: r.storeCode,
        state: r.state,
        responseDate: r.responseDate,
        npsScore: r.npsScore,
        hasRawData: !!r.rawData
      })),
      metadata: csvDataStore.metadata
    }
  });
});

// Export data store for use in other modules
export { csvDataStore };

export default router; 