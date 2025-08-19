# 📊 State-wise NPS Drill Down - Feature Guide

## ✅ New Feature: State-wise Detailed Analysis

I've added comprehensive state-level NPS drill down functionality that provides deep insights into performance across different states.

## 🎯 How to Use

### 1. Access State Details
1. Navigate to **States** page from the sidebar
2. View the enhanced state performance table
3. Click **"View Details"** button for any state
4. Explore comprehensive state analytics

### 2. Available Tabs in State Detail View

#### 📈 **Overview Tab**
- **State NPS Score**: Current NPS with trend indicator
- **Coverage Metrics**: 
  - Total cities covered
  - Number of stores
  - Total responses
- **Performance Summary**:
  - Top performing city
  - Bottom performing city
  - Average score
- **Response Distribution**: Interactive pie chart showing Promoters/Passives/Detractors

#### 🏙️ **Cities Tab**
- **City-wise Bar Chart**: Visual comparison of NPS across cities
- **Detailed City Table**:
  - NPS score per city
  - Response count
  - Number of stores
  - Color-coded performance indicators

#### 🏪 **Top Stores Tab**
- **Store Ranking**: Top 10 performing stores in the state
- **Metrics per Store**:
  - Store name and code
  - City location
  - NPS score
  - Response count
- **Visual Ranking Badges**: #1, #2, #3 highlighted

#### 📊 **Trends Tab**
- **6-Month NPS Trend**: Line chart showing NPS evolution
- **Response Volume**: Track response patterns over time
- **Dual-axis Chart**: NPS score and response count correlation

#### 💬 **Feedback Tab**
- **Customer Comments**: Recent feedback from the state
- **Comment Details**:
  - Score badge (Promoter/Passive/Detractor)
  - Store and city information
  - Date of feedback
  - Full comment text
- **Scrollable List**: Up to 20 most recent comments

## 🔍 Key Features

### Enhanced State Table
The States page now shows:
- **NPS Score**: Color-coded (Green >50, Yellow 0-50, Red <0)
- **Cities Count**: Number of cities with responses
- **Stores Count**: Active stores in the state
- **Response Metrics**: Total responses and average score
- **Detractor Rate**: Percentage of detractors (highlighted if >30%)
- **View Details Button**: Access comprehensive analysis

### Interactive Analytics
- **Responsive Charts**: Built with Recharts library
- **Real-time Calculations**: All metrics calculated from actual data
- **Filter Integration**: Respects global filters
- **Export Functionality**: Download state report as JSON

## 📊 Data Insights Provided

### State-Level Metrics
1. **Overall NPS Score**: Calculated from all responses in state
2. **Trend Analysis**: Comparing with previous period
3. **Geographic Coverage**: Cities and stores distribution
4. **Customer Sentiment**: Promoter/Passive/Detractor breakdown

### City-Level Analysis
1. **City Rankings**: Best to worst performing cities
2. **Store Distribution**: Stores per city
3. **Response Density**: Responses per city
4. **Performance Gaps**: Identify underperforming areas

### Store-Level Rankings
1. **Top Performers**: Best stores in the state
2. **Location Context**: City-wise store distribution
3. **Response Quality**: Volume and score correlation

## 🎨 Visual Elements

### Color Coding
- **Green**: NPS ≥ 50 (Excellent)
- **Yellow**: NPS 0-49 (Good)
- **Red**: NPS < 0 (Needs Attention)

### Badges & Indicators
- **Trend Arrows**: ↑ Improving, ↓ Declining, → Stable
- **Severity Badges**: Critical, High, Medium, Low
- **Ranking Badges**: #1, #2, #3 for top performers

## 💡 Use Cases

### Regional Manager
- Compare performance across cities
- Identify underperforming locations
- Track improvement trends
- Review customer feedback by area

### State Head
- Monitor overall state NPS
- Benchmark against other states
- Identify top/bottom performers
- Plan targeted interventions

### Corporate Analytics
- Deep dive into state performance
- Export data for presentations
- Track month-over-month changes
- Analyze customer sentiment patterns

## 🚀 Quick Actions

### From State Details
1. **Print Report**: Generate PDF report
2. **Export Data**: Download JSON with all metrics
3. **Navigate to Store**: Click on store to see store details (if implemented)
4. **Filter by City**: Apply city filter from the view

## 📈 Example Insights

When viewing GUJARAT state details, you can:
- See NPS score across all cities in Gujarat
- Identify which cities have the most stores
- Find the top 10 performing stores
- Read recent customer feedback
- Track 6-month NPS trend
- Compare cities like Ahmedabad, Surat, Vadodara

## 🔄 Data Flow

```
States Page → Click "View Details" → State Detail Dialog Opens
     ↓                                        ↓
Filter Applied                          5 Tabs Available
     ↓                                        ↓
Table Updates                    Overview | Cities | Stores | Trends | Feedback
```

## ⚡ Performance

- **Optimized Calculations**: Efficient data processing
- **Lazy Loading**: Tabs load on demand
- **Responsive Design**: Works on all screen sizes
- **Fast Rendering**: Charts optimized for large datasets

## 🎯 Next Steps

The state-wise drill down complements the existing store-wise drill down, providing a complete hierarchical view:
- **Country Level**: Dashboard overview
- **State Level**: State drill down (NEW)
- **Store Level**: Store drill down
- **Customer Level**: Individual feedback

---

**Status**: ✅ **FULLY IMPLEMENTED**
**Added**: State-wise NPS Drill Down with View Details
**Location**: States Page → View Details Button
**Tabs**: Overview, Cities, Top Stores, Trends, Feedback 