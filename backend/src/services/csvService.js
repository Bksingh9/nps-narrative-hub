import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';
import axios from 'axios';

class CSVService {
  // Parse CSV content and extract NPS data
  async parseCSV(csvContent, options = {}) {
    try {
      // Parse CSV with headers
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        ...options,
      });

      // Transform CSV records to NPS format
      const npsData = records.map((record, index) =>
        this.transformToNPSFormat(record, index)
      );

      return {
        success: true,
        data: npsData,
        totalRecords: npsData.length,
        columns: Object.keys(records[0] || {}),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('CSV parsing error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Transform CSV record to NPS format
  transformToNPSFormat(record, index) {
    // Helper function to find column value (case-insensitive)
    const findValue = possibleKeys => {
      for (const key of possibleKeys) {
        // Check exact match first
        if (
          record[key] !== undefined &&
          record[key] !== null &&
          record[key] !== ''
        ) {
          return record[key];
        }
        // Then check case-insensitive
        const actualKey = Object.keys(record).find(
          k => k.toLowerCase() === key.toLowerCase()
        );
        if (
          actualKey &&
          record[actualKey] !== undefined &&
          record[actualKey] !== null &&
          record[actualKey] !== ''
        ) {
          return record[actualKey];
        }
      }
      return null;
    };

    // Helper to parse date
    const parseDate = val => {
      if (!val) return new Date().toISOString();
      try {
        const date = new Date(val);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch {}
      return val; // Return as string if can't parse
    };

    // Helper to parse NPS score
    const parseNpsScore = val => {
      if (val === null || val === undefined || val === '') return 5;
      const num =
        typeof val === 'number' ? val : parseFloat(String(val).trim());
      if (isNaN(num)) return 5;
      // NPS scores should be 0-10
      return Math.max(0, Math.min(10, Math.round(num)));
    };

    // Extract fields using multiple possible column names
    const storeCode = findValue([
      'Store No.',
      'Store No',
      'Store Number',
      'Store_No',
      'Store Code',
      'Store_Code',
      'Store ID',
      'Store',
      'Outlet Code',
      'StoreID',
    ]);
    const storeName = findValue([
      'Store Franchise',
      'Store Name',
      'Store_Name',
      'Franchise',
      'Outlet Name',
      'Branch',
    ]);
    const state = findValue(['State', 'STATE', 'Province']);
    const region = findValue([
      'Region',
      'REGION',
      'Zone',
      'Area',
      'Territory',
      'Cluster',
    ]);
    const city = findValue(['City', 'CITY', 'Location', 'Town']);
    const npsScore = parseNpsScore(
      findValue([
        'NPS',
        'NPS Score',
        'NPS_Score',
        'Score',
        'Rating',
        'NPS Rating',
      ])
    );
    const responseDate = parseDate(
      findValue([
        'Response Date',
        'ResponseDate',
        'Date',
        'Survey Date',
        'Submission Date',
        'Created Date',
      ])
    );
    const comments = findValue([
      'Comments',
      'Comment',
      'Feedback',
      'Comments/feedback',
      'Remarks',
      'Response',
      'Customer Feedback',
      'Review',
    ]);
    const category = findValue([
      'Category',
      'Department',
      'Type',
      'Service Type',
      'Transaction Type',
    ]);
    const customerName = findValue([
      'Customer Name',
      'Name',
      'Respondent Name',
      'Client Name',
    ]);
    const customerEmail = findValue([
      'Email',
      'Customer Email',
      'Email Address',
      'E-mail',
    ]);
    const customerPhone = findValue([
      'Phone',
      'Mobile',
      'Contact',
      'Phone Number',
      'Mobile Number',
    ]);

    // Map region from state if not provided
    const regionMap = this.getRegionFromState(state, region);

    return {
      'Store No.': storeCode || `CSV-${Date.now()}-${index}`,
      'Store Name': storeName || 'Unknown Store',
      State: state || '',
      Region: regionMap || 'Unknown',
      City: city || '',
      'NPS Score': npsScore,
      'Response Date': responseDate,
      Comments: comments || '',
      Category: category || 'CSV Import',
      'Customer Name': customerName || '',
      'Customer Email': customerEmail || '',
      'Customer Phone': customerPhone || '',
      Source: 'CSV Upload',
      'Imported At': new Date().toISOString(),
      _normalized: {
        storeCode: storeCode,
        storeName: storeName,
        state: state,
        region: regionMap,
        city: city,
        nps: npsScore,
        responseDate: responseDate,
        comments: comments,
        category: category || 'CSV Import',
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Map state to region
  getRegionFromState(state, existingRegion) {
    if (existingRegion) {
      // Map short codes to regions
      const regionMap = {
        MAH: 'West',
        KAR: 'South',
        GMU: 'North',
        DELHI: 'North',
        GUJ: 'West',
        RAJ: 'North',
        TN: 'South',
      };
      const mapped = regionMap[existingRegion.toUpperCase()];
      if (mapped) return mapped;
    }

    if (!state) return existingRegion || 'Unknown';

    const stateToRegion = {
      // North India
      DELHI: 'North',
      HARYANA: 'North',
      PUNJAB: 'North',
      'HIMACHAL PRADESH': 'North',
      UTTARAKHAND: 'North',
      'UTTAR PRADESH': 'North',
      'JAMMU AND KASHMIR': 'North',
      LADAKH: 'North',
      CHANDIGARH: 'North',

      // South India
      KARNATAKA: 'South',
      'TAMIL NADU': 'South',
      KERALA: 'South',
      'ANDHRA PRADESH': 'South',
      TELANGANA: 'South',
      PUDUCHERRY: 'South',

      // East India
      'WEST BENGAL': 'East',
      ODISHA: 'East',
      BIHAR: 'East',
      JHARKHAND: 'East',
      SIKKIM: 'East',
      ASSAM: 'East',
      'ARUNACHAL PRADESH': 'East',
      MANIPUR: 'East',
      MEGHALAYA: 'East',
      MIZORAM: 'East',
      NAGALAND: 'East',
      TRIPURA: 'East',

      // West India
      MAHARASHTRA: 'West',
      GUJARAT: 'West',
      RAJASTHAN: 'West',
      GOA: 'West',

      // Central India
      'MADHYA PRADESH': 'Central',
      CHHATTISGARH: 'Central',
    };

    return stateToRegion[state.toUpperCase()] || existingRegion || 'Unknown';
  }

  // Process CSV from URL
  async processCSVFromURL(url) {
    try {
      const response = await axios.get(url, {
        responseType: 'text',
        timeout: 30000,
      });

      return await this.parseCSV(response.data);
    } catch (error) {
      console.error('Error fetching CSV from URL:', error);
      return {
        success: false,
        error: `Failed to fetch CSV from URL: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Process multiple CSV files
  async processMultipleCSVs(csvContents) {
    const results = [];

    for (const csvContent of csvContents) {
      const result = await this.parseCSV(csvContent);
      results.push(result);
    }

    // Combine all NPS data
    const allNpsData = results.filter(r => r.success).flatMap(r => r.data);

    return {
      success: true,
      data: allNpsData,
      totalRecords: allNpsData.length,
      filesProcessed: results.length,
      timestamp: new Date().toISOString(),
    };
  }

  // Validate CSV structure
  validateCSVStructure(records) {
    if (!records || records.length === 0) {
      return { valid: false, errors: ['No records found in CSV'] };
    }

    const errors = [];
    const warnings = [];

    // Check for required fields (at least one identifier and score)
    const hasStoreIdentifier = records.some(
      r =>
        r['Store No.'] ||
        r['Store No'] ||
        r['Store Code'] ||
        r['Store'] ||
        r['Store ID']
    );

    const hasScore = records.some(
      r => r['NPS'] || r['NPS Score'] || r['Score'] || r['Rating']
    );

    if (!hasStoreIdentifier) {
      warnings.push(
        'No store identifier column found (Store No., Store Code, etc.)'
      );
    }

    if (!hasScore) {
      errors.push('No NPS score column found (NPS, NPS Score, Score, Rating)');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

export default new CSVService();
