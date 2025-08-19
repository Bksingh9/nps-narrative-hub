# NPS Dashboard Complete Guide

## 🚀 Quick Start

Your NPS Dashboard is now fully configured and running!

- **Frontend URL**: http://localhost:8081
- **Backend API**: http://localhost:3001
- **Default Login**: admin / admin123

## ✅ Issues Fixed

### 1. Port Configuration
- Frontend now runs on port **8081** as requested
- Backend runs on port **3001**

### 2. Data Synchronization
- All pages (Overview, States, Stores, Regions) now use centralized DataContext
- Filters work consistently across all pages
- Data updates reflect immediately everywhere

### 3. AI Integration
- OpenAI API key is pre-configured
- AI insights generate automatically
- Available analyses: Insights, Trends, Anomalies, Action Plans

## 📊 Using the Dashboard

### Data Upload
1. Navigate to **Upload** page from sidebar
2. Upload your CSV file with NPS data
3. Data will be processed and stored automatically
4. All pages will update with new data

### Filtering Data
Use the **Global Filter Bar** present on all pages:
- **Date Range**: Filter by response dates
- **State**: Filter by specific state
- **Region**: Filter by region
- **Store**: Filter by store code
- **City**: Filter by city
- **NPS Category**: Filter by Promoter/Passive/Detractor

### AI Insights
1. Data is automatically analyzed when filters change
2. Click **Generate Insights** in the AI panel for fresh analysis
3. View different types of analysis:
   - **Insights**: Key patterns and recommendations
   - **Trends**: Temporal analysis and predictions
   - **Anomalies**: Unusual patterns detection
   - **Action Plans**: Critical issues requiring attention

## 🔑 API Configuration

The system comes pre-configured with an OpenAI API key for demo purposes.

To use your own API key:
1. Go to **Settings** page (admin only)
2. Enter your OpenAI API key
3. Click **Save Configuration**
4. Test connection to verify

## 📈 Page Overview

### Dashboard (Overview)
- **KPI Strip**: Real-time NPS score, responses, active stores
- **Trend Panel**: 6-period NPS trend visualization
- **Store Table**: Top/bottom performing stores
- **Driver Panel**: Key drivers affecting NPS
- **AI Insights**: Automated analysis and recommendations

### States Page
- State-wise NPS performance
- Comparative analysis
- Detailed records table with filtering

### Stores Page
- Individual store performance metrics
- Store ranking by NPS score
- Response volume analysis
- Detailed data export options

### Regions Page
- Regional performance overview
- Comparative regional analysis
- Performance indicators

## 🔄 Real-time Features

The dashboard supports real-time data updates:
- Auto-refresh every 30 seconds (configurable)
- Live filter updates
- Instant AI analysis
- WebSocket support for live data feeds

## 🛠️ Troubleshooting

### If pages are not loading:
1. Ensure both services are running:
   - Frontend: `npm run dev` (port 8081)
   - Backend: `cd backend && npm run dev` (port 3001)

### If data is not showing:
1. Check if CSV is uploaded successfully
2. Verify data format matches expected columns
3. Check browser console for errors
4. Clear filters and refresh

### If AI insights fail:
1. Verify API key in Settings
2. Check internet connection
3. Ensure data is loaded
4. Try with smaller date ranges

## 📝 Data Format

Expected CSV columns:
- Store No / Store Code
- State
- Region
- City
- Response Date
- NPS Score (0-10)
- Comments (optional)
- Category (optional)

## 🎯 Best Practices

1. **Regular Data Updates**: Upload fresh CSV data weekly
2. **Filter Usage**: Start broad, then narrow down
3. **AI Analysis**: Generate insights after significant data changes
4. **Performance**: Use date filters to limit data for better performance
5. **Export**: Regularly export analyzed data for reporting

## 💡 Pro Tips

- Use keyboard shortcuts:
  - `Ctrl/Cmd + K`: Quick search
  - `Ctrl/Cmd + F`: Focus filters
  - `Esc`: Close modals

- Combine filters for deep analysis
- Export filtered data for external analysis
- Set up email alerts for critical NPS drops
- Use the drill-down view for detailed investigation

## 📞 Support

For issues or questions:
1. Check the browser console for errors
2. Verify all services are running
3. Ensure data format is correct
4. Clear browser cache if needed

---

**Version**: 1.0.0
**Last Updated**: January 2025 