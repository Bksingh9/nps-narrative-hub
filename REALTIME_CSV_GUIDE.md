# Real-Time CSV Data Processing System

## Overview
The NPS Narrative Hub now includes a powerful real-time CSV processing system that automatically detects columns, calculates NPS scores, and provides dynamic filtering capabilities.

## Features

### 🚀 Automatic Column Detection
The system intelligently detects and maps CSV columns including:
- **Response Date**: Various date formats supported (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, ISO)
- **State**: Location state information
- **Store Code**: Unique store identifiers
- **Store Name**: Store descriptions
- **Region**: Geographic regions
- **City**: City locations
- **NPS Scores**: Supports multiple formats (0-10, 0-100, 1-5 scales)
- **Comments**: Customer feedback text
- **Category**: Feedback categories

### 📊 Dynamic NPS Calculation
The system automatically calculates NPS from various column types:
- Direct NPS scores (0-10)
- Likelihood to recommend scores
- Recommendation ratings
- Customer satisfaction scores
- Automatic scale conversion (0-100 → 0-10, 1-5 → 0-10)

### 🔍 Real-Time Filtering
Apply filters instantly without page reload:
- **Date Range**: Filter by response date period
- **State**: Filter by specific states
- **Store Code**: Filter by individual stores
- **Region**: Filter by geographic regions
- **NPS Category**: Filter by Promoters (9-10), Passives (7-8), or Detractors (0-6)

## How to Use

### 1. Access the Upload Page
Navigate to http://localhost:8081/upload or click "Upload" in the sidebar

### 2. Upload CSV File
1. Click "Choose File" or drag-and-drop your CSV file
2. The system accepts CSV files up to 10MB
3. Click "Upload and Process"

### 3. View Processing Results
After upload, you'll see:
- Total records processed
- Date range of responses
- Average NPS score
- Breakdown by promoters, passives, and detractors

### 4. Apply Real-Time Filters
Switch to the "Filters" tab to:
1. Select date ranges using the calendar picker
2. Choose specific states from the dropdown
3. Select store codes
4. Filter by region or NPS category
5. Click "Apply Filters" to update data instantly

### 5. Preview and Export Data
- View filtered data in the "Data Preview" tab
- Export filtered results using the "Export" button
- Clear all data with the "Clear Data" button

## CSV Format Requirements

### Supported Column Names
The system recognizes multiple variations of column names:

#### Date Columns
- Response Date, Date, response_date, ResponseDate, Timestamp, Created At

#### Location Columns
- State, state, STATE, Location State, Store State
- Store Code, Store No., Store ID, store_code, StoreCode, Store Number
- City, city, CITY, Store City
- Region, region, REGION, Area, Zone

#### Score Columns
- Rating, Score, NPS Score, rating, Customer Rating, Overall Rating
- Likelihood to Recommend, How likely, NPS Question
- Recommendation, Would Recommend, Recommend

#### Additional Columns
- Comments, Feedback, Customer Comments, Review, Text
- Category, Type, Feedback Type, Issue Type
- Customer Name, Name, Customer, Respondent
- Email, Customer Email, Contact

### Sample CSV Format
```csv
Response Date,Store Code,Store Name,State,Region,City,NPS Score,Comments,Category
2024-01-15,ST001,Main Street Store,California,West,Los Angeles,9,Excellent service,Service
2024-01-16,ST002,Downtown Plaza,New York,East,NYC,8,Good experience,Product
```

## API Endpoints

### Upload CSV with Real-Time Processing
```
POST /api/crawler/csv/upload-realtime
Content-Type: multipart/form-data
Body: file (CSV file)
```

### Apply Filters
```
POST /api/crawler/csv/filter
Content-Type: application/json
Body: {
  "filters": {
    "dateFrom": "2024-01-01T00:00:00.000Z",
    "dateTo": "2024-02-01T00:00:00.000Z",
    "state": "California",
    "storeCode": "ST001",
    "region": "West",
    "npsCategory": "Promoter"
  }
}
```

### Get Filter Options
```
GET /api/crawler/csv/filter-options
Response: {
  "states": ["California", "New York", ...],
  "stores": [{"code": "ST001", "name": "Main Street Store"}, ...],
  "regions": ["West", "East", ...],
  "dateRange": {"from": "2024-01-01", "to": "2024-02-14"}
}
```

### Get Current Data State
```
GET /api/crawler/csv/current-data
Response: {
  "hasData": true,
  "totalRecords": 30,
  "metadata": {...},
  "lastUpdated": "2024-02-14T10:30:00.000Z"
}
```

### Clear All Data
```
DELETE /api/crawler/csv/clear
```

## Testing

A sample CSV file is available at:
```
/public/test-realtime-nps.csv
```

This file contains 30 sample NPS records with various scores, states, and dates for testing the filtering system.

## Architecture

### Backend Components
- **csvProcessor.js**: Core CSV processing logic with dynamic column mapping
- **crawlerRoutes.js**: API endpoints for CSV operations
- **In-memory data store**: Fast filtering without database queries

### Frontend Components
- **Upload.tsx**: Enhanced upload page with real-time filtering UI
- **csvDataService.ts**: Frontend service for API communication
- **Real-time updates**: Instant filter application without page reload

## Performance

- **Fast Processing**: In-memory data storage for instant filtering
- **Smart Caching**: Filter results cached for quick access
- **Efficient Updates**: Only filtered data transmitted to frontend
- **Scalable**: Handles thousands of records efficiently

## Troubleshooting

### Common Issues

1. **"No data available" error**
   - Upload a CSV file first
   - Check if backend server is running on port 3001

2. **Columns not detected**
   - Ensure column names match supported variations
   - Check CSV file encoding (UTF-8 recommended)

3. **Date filtering not working**
   - Verify date format in CSV (ISO, US, or European formats supported)
   - Check date range selection in UI

4. **NPS scores incorrect**
   - Ensure scores are numeric values
   - Check if scale conversion is needed (0-100 → 0-10)

## Next Steps

1. **Add more visualizations**: Charts for filtered data
2. **Batch processing**: Handle multiple CSV files
3. **Export templates**: Download filter configurations
4. **Scheduled imports**: Automatic CSV processing
5. **Data validation**: Enhanced error handling and validation

## Support

For issues or questions, check:
- Backend logs: `backend/` directory
- Browser console for frontend errors
- Network tab for API responses 