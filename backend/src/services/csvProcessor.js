import { parse } from 'csv-parse/sync';
import fs from 'fs/promises';

class CSVProcessor {
  constructor() {
    // Dynamic column mapping for different CSV formats
    this.columnMappings = {
      responseDate: [
        'Response Date',
        'ResponseDate',
        'response_date',
        'Response_Date',
        'Date',
        'date',
        'DATE',
        'Survey Date',
        'SurveyDate',
        'survey_date',
        'Submission Date',
        'SubmissionDate',
        'submission_date',
        'Created Date',
        'CreatedDate',
        'created_date',
        'Created At',
        'CreatedAt',
        'created_at',
        'Timestamp',
        'timestamp',
        'TIMESTAMP',
        'Date Submitted',
        'DateSubmitted',
        'date_submitted',
        'Response Time',
        'ResponseTime',
        'response_time',
      ],
      state: [
        'State',
        'state',
        'STATE',
        'Location State',
        'Store State',
        'State Name',
        'StateName',
      ],
      storeCode: [
        'Store Code',
        'StoreCode',
        'store_code',
        'Store_Code',
        'Store No.',
        'Store No',
        'StoreNo',
        'Store ID',
        'StoreID',
        'Store Number',
        'StoreNumber',
      ],
      storeName: [
        'Store Name',
        'StoreName',
        'store_name',
        'Store_Name',
        'Store',
        'Outlet Name',
        'OutletName',
        'Description',
        'Place Of Business',
      ],
      city: ['City', 'city', 'CITY', 'Store City', 'StoreCity', 'Location'],
      region: [
        'Region',
        'region',
        'REGION',
        'Area',
        'Zone',
        'Territory',
        'Region Code',
      ],

      // NPS related columns
      rating: [
        'Rating',
        'Score',
        'NPS Score',
        'rating',
        'Customer Rating',
        'Overall Rating',
      ],
      recommendation: [
        'Recommendation',
        'Would Recommend',
        'Recommend',
        'recommendation_score',
      ],
      satisfaction: [
        'Satisfaction',
        'Customer Satisfaction',
        'CSAT',
        'satisfaction_score',
      ],
      likelihoodToRecommend: [
        'Likelihood to Recommend',
        'How likely',
        'NPS Question',
        'likelihood_score',
        'On a scale of 0 to 10, with 0 being the lowest and 10 being the highest rating - how likely are you to recommend Trends to friends and family',
      ],

      // Additional data columns
      comments: [
        'Comments',
        'Feedback',
        'Customer Comments',
        'Review',
        'Text',
        'Any other feedback?',
        'Any other feedback',
      ],
      category: ['Category', 'Type', 'Feedback Type', 'Issue Type'],
      customerName: ['Customer Name', 'Name', 'Customer', 'Respondent'],
      customerEmail: ['Email', 'Customer Email', 'Contact'],
      customerPhone: ['Phone', 'Mobile', 'Contact Number'],
    };
  }

  // Find column in CSV headers using multiple possible names
  findColumn(headers, columnType) {
    const possibleNames = this.columnMappings[columnType] || [];
    for (const name of possibleNames) {
      const found = headers.find(
        h => h.toLowerCase().trim() === name.toLowerCase().trim()
      );
      if (found) return found;
    }
    return null;
  }

  // Calculate NPS from different score types
  calculateNPS(record, headers) {
    // Try to find NPS score directly
    const npsColumn = this.findColumn(headers, 'rating');
    if (npsColumn && record[npsColumn]) {
      const score = parseFloat(record[npsColumn]);
      if (!isNaN(score)) {
        if (score <= 10) return score; // Already 0-10 scale
        if (score <= 100) return Math.round(score / 10); // Convert 0-100 to 0-10
      }
    }

    // Try likelihood to recommend
    const likelihoodColumn = this.findColumn(headers, 'likelihoodToRecommend');
    if (likelihoodColumn && record[likelihoodColumn]) {
      const score = parseFloat(record[likelihoodColumn]);
      if (!isNaN(score)) {
        if (score <= 10) return score;
        if (score <= 100) return Math.round(score / 10);
      }
    }

    // Try recommendation score
    const recColumn = this.findColumn(headers, 'recommendation');
    if (recColumn && record[recColumn]) {
      const score = parseFloat(record[recColumn]);
      if (!isNaN(score)) {
        if (score <= 10) return score;
        if (score <= 5) return Math.round(score * 2); // Convert 1-5 to 0-10
        if (score <= 100) return Math.round(score / 10);
      }
    }

    // Default to neutral if no score found
    return 5;
  }

  // Parse date with multiple format support
  parseDate(dateStr) {
    if (!dateStr || dateStr === '') {
      return new Date().toISOString();
    }

    // Clean the date string
    const cleanDateStr = String(dateStr).trim();

    // Try multiple date formats
    const formats = [
      // ISO formats (2024-01-15, 2024-01-15T10:30:00)
      d => {
        const date = new Date(d);
        if (!isNaN(date.getTime())) return date;
        return null;
      },
      // US format MM/DD/YYYY or M/D/YYYY
      d => {
        const match = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (match) {
          const [_, month, day, year] = match;
          return new Date(year, month - 1, day);
        }
        return null;
      },
      // European format DD/MM/YYYY or D/M/YYYY
      d => {
        const match = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (match) {
          const [_, day, month, year] = match;
          // Check if it makes sense as DD/MM/YYYY
          if (parseInt(month) <= 12 && parseInt(day) > 12) {
            return new Date(year, month - 1, day);
          }
        }
        return null;
      },
      // Format YYYY-MM-DD
      d => {
        const match = d.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (match) {
          const [_, year, month, day] = match;
          return new Date(year, month - 1, day);
        }
        return null;
      },
      // Format DD-MM-YYYY
      d => {
        const match = d.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
        if (match) {
          const [_, day, month, year] = match;
          return new Date(year, month - 1, day);
        }
        return null;
      },
      // Format with month names (Jan 15, 2024 or 15 Jan 2024)
      d => {
        const months = [
          'jan',
          'feb',
          'mar',
          'apr',
          'may',
          'jun',
          'jul',
          'aug',
          'sep',
          'oct',
          'nov',
          'dec',
        ];
        const lowerD = d.toLowerCase();
        for (let i = 0; i < months.length; i++) {
          if (lowerD.includes(months[i])) {
            const date = new Date(d);
            if (!isNaN(date.getTime())) return date;
          }
        }
        return null;
      },
    ];

    for (const format of formats) {
      try {
        const date = format(cleanDateStr);
        if (date && !isNaN(date.getTime())) {
          // Validate the date is reasonable (between 2000 and 2030)
          const year = date.getFullYear();
          if (year >= 2000 && year <= 2030) {
            return date.toISOString();
          }
        }
      } catch (e) {
        continue;
      }
    }

    // If all parsing fails, return current date
    console.log(
      `Warning: Could not parse date "${cleanDateStr}", using current date`
    );
    return new Date().toISOString();
  }

  // Process CSV file with dynamic column mapping
  async processCSV(filePath, options = {}) {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');

      // Parse CSV with auto-detect delimiter
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: options.delimiter || ',',
        relax_quotes: true,
        relax_column_count: true,
      });

      if (records.length === 0) {
        throw new Error('No data found in CSV file');
      }

      // Get headers from first record
      const headers = Object.keys(records[0]);

      console.log('CSV Headers found:', headers);

      // Detect columns
      const columnMap = {
        responseDate: this.findColumn(headers, 'responseDate'),
        state: this.findColumn(headers, 'state'),
        storeCode: this.findColumn(headers, 'storeCode'),
        storeName: this.findColumn(headers, 'storeName'),
        city: this.findColumn(headers, 'city'),
        region: this.findColumn(headers, 'region'),
        comments: this.findColumn(headers, 'comments'),
        category: this.findColumn(headers, 'category'),
        customerName: this.findColumn(headers, 'customerName'),
        customerEmail: this.findColumn(headers, 'customerEmail'),
      };

      console.log('Column mapping detected:', {
        responseDate: columnMap.responseDate || 'NOT FOUND',
        state: columnMap.state || 'NOT FOUND',
        storeCode: columnMap.storeCode || 'NOT FOUND',
        storeName: columnMap.storeName || 'NOT FOUND',
        npsRelatedColumns: headers.filter(
          h =>
            h.toLowerCase().includes('nps') ||
            h.toLowerCase().includes('score') ||
            h.toLowerCase().includes('rating')
        ),
      });

      // Process each record
      const processedData = records.map((record, index) => {
        const npsScore = this.calculateNPS(record, headers);

        // Try to get store name from multiple possible columns
        const storeName =
          record[columnMap.storeName] ||
          record['Description'] ||
          record['Place Of Business'] ||
          record['Store Name'] ||
          `Store ${record[columnMap.storeCode] || index}`;

        return {
          // Core fields
          id: `csv_${Date.now()}_${index}`,
          storeCode:
            record[columnMap.storeCode] ||
            record['Store No'] ||
            `STORE_${index}`,
          storeName: storeName,
          state: record[columnMap.state] || 'Unknown',
          region:
            record[columnMap.region] || record['Region Code'] || 'Unknown',
          city: record[columnMap.city] || 'Unknown',

          // NPS Data
          npsScore: npsScore,
          npsCategory:
            npsScore >= 9
              ? 'Promoter'
              : npsScore >= 7
                ? 'Passive'
                : 'Detractor',

          // Dates
          responseDate: this.parseDate(record[columnMap.responseDate]),
          uploadDate: new Date().toISOString(),

          // Additional data
          comments: record[columnMap.comments] || '',
          category: record[columnMap.category] || 'General',
          customerName: record[columnMap.customerName] || 'Anonymous',
          customerEmail: record[columnMap.customerEmail] || '',

          // Metadata
          source: 'CSV Upload',
          rawData: record,
          _normalized: {
            storeCode: record[columnMap.storeCode] || `STORE_${index}`,
            storeName: record[columnMap.storeName] || 'Unknown Store',
            state: record[columnMap.state] || 'Unknown',
            region: record[columnMap.region] || 'Unknown',
            city: record[columnMap.city] || 'Unknown',
            nps: npsScore,
            responseDate: this.parseDate(record[columnMap.responseDate]),
            comments: record[columnMap.comments] || '',
            category: record[columnMap.category] || 'General',
            timestamp: new Date().toISOString(),
          },
        };
      });

      // Calculate aggregates
      const aggregates = this.calculateAggregates(processedData);

      return {
        success: true,
        data: processedData,
        metadata: {
          totalRecords: processedData.length,
          columns: headers,
          columnMapping: columnMap,
          dateRange: {
            from: aggregates.dateRange.from,
            to: aggregates.dateRange.to,
          },
          aggregates,
        },
      };
    } catch (error) {
      console.error('CSV Processing Error:', error);
      throw error;
    }
  }

  // Calculate aggregate statistics
  calculateAggregates(data) {
    if (!data || data.length === 0) {
      return {
        averageNPS: 0,
        promoters: 0,
        passives: 0,
        detractors: 0,
        totalResponses: 0,
        dateRange: { from: null, to: null },
        stateBreakdown: {},
        storeBreakdown: {},
      };
    }

    const dates = data
      .map(d => new Date(d.responseDate))
      .filter(d => !isNaN(d));
    const promoters = data.filter(d => d.npsScore >= 9).length;
    const passives = data.filter(d => d.npsScore >= 7 && d.npsScore < 9).length;
    const detractors = data.filter(d => d.npsScore < 7).length;

    // State breakdown
    const stateBreakdown = {};
    data.forEach(record => {
      const state = record.state || 'Unknown';
      if (!stateBreakdown[state]) {
        stateBreakdown[state] = {
          count: 0,
          totalNPS: 0,
          promoters: 0,
          passives: 0,
          detractors: 0,
        };
      }
      stateBreakdown[state].count++;
      stateBreakdown[state].totalNPS += record.npsScore;
      if (record.npsScore >= 9) stateBreakdown[state].promoters++;
      else if (record.npsScore >= 7) stateBreakdown[state].passives++;
      else stateBreakdown[state].detractors++;
    });

    // Calculate average NPS for each state
    Object.keys(stateBreakdown).forEach(state => {
      const stateData = stateBreakdown[state];
      stateData.averageNPS = stateData.totalNPS / stateData.count;
      stateData.npsScore =
        ((stateData.promoters - stateData.detractors) / stateData.count) * 100;
    });

    // Store breakdown
    const storeBreakdown = {};
    data.forEach(record => {
      const store = record.storeCode || 'Unknown';
      if (!storeBreakdown[store]) {
        storeBreakdown[store] = {
          storeName: record.storeName,
          count: 0,
          totalNPS: 0,
          state: record.state,
          region: record.region,
        };
      }
      storeBreakdown[store].count++;
      storeBreakdown[store].totalNPS += record.npsScore;
    });

    // Calculate average NPS for each store
    Object.keys(storeBreakdown).forEach(store => {
      storeBreakdown[store].averageNPS =
        storeBreakdown[store].totalNPS / storeBreakdown[store].count;
    });

    return {
      averageNPS: data.reduce((sum, d) => sum + d.npsScore, 0) / data.length,
      npsScore: ((promoters - detractors) / data.length) * 100,
      promoters,
      passives,
      detractors,
      totalResponses: data.length,
      dateRange: {
        from: dates.length > 0 ? new Date(Math.min(...dates)) : null,
        to: dates.length > 0 ? new Date(Math.max(...dates)) : null,
      },
      stateBreakdown,
      storeBreakdown,
    };
  }

  // Filter data based on criteria
  filterData(data, filters) {
    let filtered = [...data];

    console.log('Applying filters:', filters);
    console.log('Total records before filtering:', filtered.length);

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : null;
      const dateTo = filters.dateTo ? new Date(filters.dateTo) : null;

      // Set time to start and end of day for proper comparison
      if (dateFrom) {
        dateFrom.setHours(0, 0, 0, 0);
      }
      if (dateTo) {
        dateTo.setHours(23, 59, 59, 999);
      }

      filtered = filtered.filter(record => {
        if (!record.responseDate) return false;

        const recordDate = new Date(record.responseDate);
        if (isNaN(recordDate.getTime())) {
          console.log('Invalid date in record:', record.responseDate);
          return false;
        }

        if (dateFrom && recordDate < dateFrom) return false;
        if (dateTo && recordDate > dateTo) return false;
        return true;
      });

      console.log(
        `Date filter applied. Records after date filter: ${filtered.length}`
      );
    }

    // State filter (case-insensitive)
    if (filters.state && filters.state !== 'all') {
      filtered = filtered.filter(
        record => record.state?.toLowerCase() === filters.state.toLowerCase()
      );
    }

    // Store code filter (case-insensitive)
    if (filters.storeCode && filters.storeCode !== 'all') {
      filtered = filtered.filter(
        record =>
          record.storeCode?.toLowerCase() === filters.storeCode.toLowerCase()
      );
    }

    // Region filter (case-insensitive)
    if (filters.region && filters.region !== 'all') {
      filtered = filtered.filter(
        record =>
          record.region?.toLowerCase() === filters.region.toLowerCase() ||
          record['Region Code']?.toLowerCase() === filters.region.toLowerCase()
      );
    }

    // City filter (case-insensitive)
    if (filters.city && filters.city !== 'all') {
      filtered = filtered.filter(
        record =>
          record.city?.toLowerCase() === filters.city.toLowerCase() ||
          record['City']?.toLowerCase() === filters.city.toLowerCase()
      );
    }

    // Store No filter
    if (filters.storeNo) {
      filtered = filtered.filter(
        record =>
          record['Store No']?.toString().includes(filters.storeNo) ||
          record.storeCode?.toString().includes(filters.storeNo)
      );
    }

    // Format filter
    if (filters.format && filters.format !== 'all') {
      filtered = filtered.filter(
        record =>
          record['Format']?.toLowerCase() === filters.format.toLowerCase()
      );
    }

    // Sub Format filter
    if (filters.subFormat && filters.subFormat !== 'all') {
      filtered = filtered.filter(
        record =>
          record['Sub Format']?.toLowerCase() ===
          filters.subFormat.toLowerCase()
      );
    }

    // Search text filter (searches in comments and feedback)
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(
        record =>
          record.comments?.toLowerCase().includes(searchLower) ||
          record['Any other feedback?']?.toLowerCase().includes(searchLower) ||
          record.customerName?.toLowerCase().includes(searchLower) ||
          record.storeName?.toLowerCase().includes(searchLower)
      );
    }

    // NPS category filter
    if (filters.npsCategory) {
      filtered = filtered.filter(
        record => record.npsCategory === filters.npsCategory
      );
    }

    return filtered;
  }
}

export default new CSVProcessor();
