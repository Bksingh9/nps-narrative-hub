# CSV Crawler Integration Guide

## ✨ CSV Processing in Web Crawler

Your NPS application now supports **CSV data crawling** through the Web Crawler interface!

## 🎯 Features

### Three Ways to Process CSV Data:

1. **Direct File Upload** - Upload CSV files from your computer
2. **URL Processing** - Fetch and process CSV files from URLs
3. **Batch Processing** - Process multiple CSV files at once

## 📁 Accessing CSV Crawler

1. Navigate to `http://localhost:8082/crawler`
2. Click on the **"CSV Files"** tab
3. Choose your preferred method:
   - Upload local CSV file
   - Process CSV from URL

## 🚀 How to Use

### Method 1: Upload Local CSV File

1. Click "Choose File" button
2. Select your CSV file
3. Data is automatically:
   - Parsed and validated
   - Normalized to NPS format
   - Imported to dashboard

### Method 2: Process CSV from URL

1. Enter the CSV file URL (e.g., `https://example.com/data.csv`)
2. Click "Process URL"
3. The system will:
   - Download the CSV
   - Parse and transform data
   - Import to your dashboard

## 📊 Supported CSV Formats

The CSV processor **automatically detects** these column headers:

### Store Identifiers
- Store No., Store No, Store Number
- Store Code, Store_Code, Store ID
- Store, Outlet Code, StoreID

### Location Fields
- State, STATE, Province
- Region, REGION, Zone, Area, Territory
- City, CITY, Location, Town

### NPS Fields
- NPS, NPS Score, NPS_Score
- Score, Rating, NPS Rating

### Date Fields
- Response Date, ResponseDate, Date
- Survey Date, Submission Date
- Created Date

### Customer Information
- Customer Name, Name, Respondent Name
- Email, Customer Email
- Phone, Mobile, Contact

### Feedback
- Comments, Comment, Feedback
- Remarks, Response, Review

## 🔄 Data Transformation

The CSV processor automatically:

1. **Normalizes Scores** - Converts any rating scale to 0-10 NPS format
2. **Maps Regions** - Automatically assigns regions based on states
3. **Handles Missing Data** - Provides sensible defaults
4. **Validates Data** - Ensures data integrity

## 💡 Example CSV Structure

```csv
Store No,State,Region,City,NPS Score,Response Date,Comments
ST001,Maharashtra,West,Mumbai,9,2024-01-15,Excellent service
ST002,Karnataka,South,Bangalore,8,2024-01-16,Good experience
ST003,Tamil Nadu,South,Chennai,7,2024-01-17,Quick service
```

## 🛠️ Technical Details

### Backend Processing
- **Location**: `/backend/src/services/csvService.js`
- **Parser**: csv-parse library
- **File Upload**: Multer middleware
- **Max File Size**: 10MB

### API Endpoints
- `POST /api/crawler/csv` - Single CSV file
- `POST /api/crawler/csv-batch` - Multiple CSV files
- `POST /api/crawler/csv-url` - CSV from URL

### Frontend Integration
- **Location**: `/src/pages/Crawler.tsx`
- **API Service**: `/src/services/crawlerApi.ts`
- **Storage**: localStorage with normalized format

## ⚡ Quick Start

1. **Start Backend Server**:
```bash
cd backend
npm run dev
```

2. **Access Crawler**:
- Go to `http://localhost:8082/crawler`
- Select "CSV Files" tab

3. **Upload Your Data**:
- Choose file or enter URL
- Click process
- View data in dashboard

## 🎉 Benefits

- **No Manual Entry** - Bulk import thousands of records
- **Flexible Format** - Works with various CSV structures
- **Real-time Processing** - Instant dashboard updates
- **Error Handling** - Clear feedback on issues
- **Data Validation** - Ensures data quality

## 📈 Use Cases

1. **Historical Data Import** - Import past NPS surveys
2. **Regular Updates** - Schedule CSV imports from URLs
3. **Data Migration** - Move from other systems
4. **Bulk Operations** - Process multiple store data at once

## 🔍 Troubleshooting

### CSV Not Processing?
- Ensure backend is running (`cd backend && npm run dev`)
- Check CSV has headers in first row
- Verify at least one NPS score column exists

### Data Not Appearing?
- Check browser console for errors
- Verify localStorage has space
- Refresh dashboard after import

### Backend Errors?
- Check `backend/node_modules` exists
- Run `npm install` in backend directory
- Ensure port 3001 is available

## 🎯 Next Steps

Your CSV crawler is ready! You can now:
1. Import existing NPS data from CSV files
2. Process CSV data from online sources
3. Combine with web crawling for comprehensive data collection

The CSV data will automatically populate all your dashboards with properly normalized and formatted NPS metrics! 