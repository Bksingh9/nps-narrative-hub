# NPS Dashboard - Real CSV Data Guide

## Overview
This system automatically processes your real CSV data files containing NPS survey responses. All column headers are automatically detected and mapped.

## Supported CSV Format

Your CSV file is automatically processed with these headers:
- **Store Information**: Store No, Store Code, Format, Sub Format
- **Location Data**: Region Code, State, City, Postal Code, Place Of Business, Description
- **Date Fields**: Trans Date, Response Date
- **NPS Score**: "On a scale of 0 to 10..." question
- **Ratings**: Staff Friendliness, Billing Experience, Product Size availability, Store Ambience, Trial Room Experience, Product Options/Variety
- **Feedback**: "Any other feedback?" column
- **IDs**: rrid, Feedback Id

## How to Upload Your CSV

### Method 1: Simple Upload Page
1. Navigate to `/csv-upload` 
2. Drag and drop your CSV file or click to select
3. Click "Upload CSV"
4. System will automatically:
   - Detect all 7,442 records
   - Map columns correctly
   - Calculate NPS scores
   - Redirect to dashboard

### Method 2: Upload Page with Preview
1. Navigate to `/upload`
2. Use the Upload tab
3. Select your CSV file
4. View data preview and statistics
5. Apply filters as needed

## Dashboard Features

Once your data is loaded:

### Real-Time Filtering
- **Date Range**: Filter by Response Date
- **State**: Filter by state location
- **Store Code**: Filter by specific store
- **Region**: Filter by Region Code

### Automatic Calculations
- **NPS Score**: Calculated from the 0-10 likelihood question
- **Promoters**: Scores 9-10
- **Passives**: Scores 7-8
- **Detractors**: Scores 0-6

### KPI Metrics
- Total Responses
- Average NPS Score
- Promoter/Detractor percentages
- Store performance rankings

## Data Processing

The system automatically:
1. **Detects Headers**: Recognizes your specific column names
2. **Maps Store Names**: Uses Description or Place Of Business fields
3. **Parses Dates**: Handles various date formats in Response Date
4. **Calculates NPS**: From the 0-10 likelihood question
5. **Aggregates Data**: By state, store, region, and time period

## Filter Examples

### Filter by Date
```javascript
// Shows data from January 2024
Date From: 2024-01-01
Date To: 2024-01-31
```

### Filter by State
```javascript
State: "California"
// Shows only California stores
```

### Filter by Store
```javascript
Store Code: "ST001"
// Shows specific store data
```

### Combined Filters
```javascript
State: "Texas"
Date From: 2024-01-15
// Shows Texas data from Jan 15 onwards
```

## API Endpoints

The backend provides these endpoints for your data:

- `POST /api/crawler/csv/upload-realtime` - Upload CSV file
- `POST /api/crawler/csv/filter` - Apply filters
- `GET /api/crawler/csv/current-data` - Check data status
- `GET /api/crawler/csv/filter-options` - Get available filter values
- `GET /api/crawler/csv/debug` - Debug column mapping

## Troubleshooting

### Data Not Showing
1. Check backend is running: `http://localhost:3001/health`
2. Verify CSV upload succeeded (check console)
3. Refresh the dashboard

### Filters Not Working
1. Ensure data is loaded first
2. Check date format matches your CSV
3. Verify state/store values exist in data

### Column Mapping Issues
Visit `/api/crawler/csv/debug` to see:
- Detected headers
- Column mappings
- Sample parsed records

## Tips for Best Results

1. **Consistent Date Format**: Use consistent date formatting in Response Date column
2. **Complete Store Info**: Include Store Code and Description/Place Of Business
3. **Valid NPS Scores**: Ensure the 0-10 question has numeric values
4. **State Names**: Use full state names for better filtering

## Quick Start

1. Start the backend:
```bash
cd backend && npm start
```

2. Start the frontend:
```bash
npm run dev
```

3. Login and navigate to `/csv-upload`

4. Upload your CSV file (with 7,442 records)

5. Dashboard will automatically load with your data

6. Apply filters to analyze specific segments

The system is designed to handle your exact CSV format without any modifications needed! 