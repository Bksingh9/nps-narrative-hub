# Web Crawler Setup Guide

## 🚀 Quick Start

The web crawler is now fully set up and ready to extract NPS data from websites!

### 1. Start the Backend Server

```bash
cd backend
npm run dev
```

The backend server will start on `http://localhost:3001`

### 2. Access the Crawler UI

Navigate to: `http://localhost:8082/crawler` (or whatever port your frontend is running on)

## 📋 Features

### Single URL Crawling
- Enter any URL to extract NPS data
- Use predefined templates for popular platforms
- Create custom selectors for specific sites

### Batch Processing
- Crawl multiple URLs at once
- Process entire lists of review pages
- Automatic data transformation to NPS format

### Templates Available
- **Google Reviews** - Extract ratings and reviews from Google
- **Trustpilot** - Scrape Trustpilot review data
- **Yelp Reviews** - Get Yelp business reviews
- **SurveyMonkey** - Extract survey results
- **Generic** - Universal template for any site with reviews

## 🎯 How to Use

### Method 1: Using Templates

1. Go to the Crawler page
2. Enter a URL (e.g., `https://www.trustpilot.com/review/example.com`)
3. Select the appropriate template (e.g., "Trustpilot")
4. Click "Start Crawl"
5. Once complete, click "Import to Dashboard"

### Method 2: Custom Selectors

For sites without templates, define custom CSS selectors:

```json
{
  "npsScore": ".rating-value",
  "reviews": ".review-text",
  "storeName": "h1.business-name",
  "dates": ".review-date"
}
```

### Method 3: Batch URLs

1. Switch to "Batch URLs" tab
2. Enter multiple URLs (one per line)
3. Select a template or use custom selectors
4. Click "Start Batch Crawl"

## 🔧 Technical Details

### Architecture
- **Backend**: Node.js + Express server
- **Scraping**: Puppeteer (dynamic sites) + Cheerio (static sites)
- **Queue**: Concurrent job processing with rate limiting
- **Storage**: Data automatically saved to localStorage in NPS format

### Data Transformation
The crawler automatically:
- Converts various rating scales (1-5 stars, percentages) to NPS 0-10 scale
- Maps extracted data to standard NPS fields
- Adds metadata (source URL, crawl timestamp)
- Normalizes data for dashboard consumption

## 🛠️ Troubleshooting

### Backend Not Running?
```bash
# Make sure you're in the backend directory
cd backend

# Install dependencies if not done
npm install

# Start the server
npm run dev
```

### Puppeteer Issues?
If Puppeteer fails to launch:
```bash
# Install Chrome dependencies (macOS)
brew install chromium

# Or download Chrome manually
# Puppeteer will use your system Chrome
```

### CORS Errors?
The backend is configured to accept requests from:
- http://localhost:5173
- http://localhost:8080
- http://localhost:8081
- http://localhost:8082

## 📊 Extracted Data Format

The crawler transforms scraped data into this format:
```json
{
  "Store No.": "CRAWL-001",
  "Store Name": "Example Store",
  "State": "California",
  "Region": "West",
  "City": "San Francisco",
  "NPS Score": 8,
  "Response Date": "2024-01-15",
  "Comments": "Great service!",
  "Category": "Web Crawled",
  "Source URL": "https://example.com/reviews",
  "Crawled At": "2024-01-15T10:30:00Z"
}
```

## 🎉 Ready to Crawl!

Your crawler is set up and ready to extract NPS data from any website. Start with the templates for popular platforms or create custom selectors for your specific needs! 