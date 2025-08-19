# NPS Intelligence Dashboard - Data Format Guide

## ✅ Your Application is Now Ready!

The app has been updated to automatically detect and process your CSV data with the following capabilities:

## 📊 Supported CSV Formats

The system automatically detects and maps the following column types:

### Store Information
- **Store No.** / Store No / Store Number / Store_No / Store Code / Store ID
- **Store Franchise** / Store Name / Franchise / Outlet Name

### Date Fields
- **Response Date** / ResponseDate / Date / Survey Date / Submission Date / Created Date

### Location Fields  
- **State** / STATE / Province
- **Region** / REGION / Zone / Area / Territory
- **City** / CITY / Location / Town

### NPS Score Fields
- **NPS** / NPS Score / Score / Rating / NPS Rating (0-10 scale)

### Feedback Fields
- **Comments** / Comment / Feedback / Comments/feedback / Remarks / Customer Feedback

### Customer Information (Optional)
- **Customer Name** / Name / Respondent Name
- **Email** / Customer Email / Email Address
- **Phone** / Mobile / Contact / Phone Number

## 🎯 How to Use

### 1. Upload Your CSV Data
- Go to **Upload** page
- Drag & drop your CSV file or click to browse
- The system will automatically:
  - Detect all columns
  - Map common fields
  - Display detected columns
  - Show total records

### 2. Test with Sample Data
- Click **"Load Sample Data"** on Dashboard or Upload page
- Uses your exact column format (Store No., Store Franchise, etc.)
- 20 sample records matching your structure

### 3. Real-Time Filtering
All data updates in real-time when you:
- Select date range (uses Response Date)
- Filter by Store, State, Region, or City
- Upload new data

### 4. AI Intelligence Features
Go to **Settings** page:
- API Key is pre-configured: `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`
- Click **Generate Insights** - AI analyzes your data patterns
- Click **Action Plans** - Get actionable recommendations
- Click **Detect Anomalies** - Find unusual NPS drops
- Click **Benchmark Analysis** - Compare performance periods

### 5. Dashboard Components
All components now use real data:
- **KPI Strip** - Overall NPS, Total Responses, Active Stores
- **Trend Panel** - NPS over time with 6-month view
- **Store Table** - Individual store performance
- **AI Insights** - Generated insights and escalations

### 6. NPS Calculation Formula
```
NPS = (% Promoters) - (% Detractors)

Where:
- Promoters: Score 9-10
- Passives: Score 7-8  
- Detractors: Score 0-6
```

## 📁 Sample CSV File Available

A sample file matching your format is available at:
`/public/sample-nps-data.csv`

## 🔄 Data Flow

1. **Upload CSV** → Parsed with PapaParse
2. **Dynamic Column Detection** → All columns preserved
3. **Smart Normalization** → Common fields mapped to standard names
4. **LocalStorage** → Data persisted client-side
5. **Real-time Events** → Components auto-update via custom events
6. **Filter Application** → All views filtered simultaneously
7. **AI Analysis** → OpenAI API processes filtered data

## ⚡ Features

- ✅ **100% Dynamic** - Works with any CSV structure
- ✅ **Real-time Updates** - Like Looker Studio
- ✅ **Smart Column Mapping** - Auto-detects common fields
- ✅ **Data Persistence** - Survives page refresh
- ✅ **AI-Powered** - OpenAI integration for insights
- ✅ **Export Capability** - Download processed data
- ✅ **Multi-format Support** - Handles various date/number formats

## 🚀 Quick Test

1. Open app at http://localhost:8080
2. Click "Load Sample Data" 
3. Watch all metrics populate
4. Try filters - see real-time updates
5. Go to Settings → Generate AI insights

Your NPS Intelligence Dashboard is now fully operational! 