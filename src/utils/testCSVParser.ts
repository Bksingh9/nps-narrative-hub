import Papa from 'papaparse';

export async function testCSVParse() {
  // Your exact CSV data
  const csvText = `Store No.,Store Franchise,Response Date,State,Region,City,NPS,Comments/feedback,Customer Name,Email,Phone
2024,PRASAD,2024-01-15,California,West,Los Angeles,9,Great service and friendly staff,John Smith,john@email.com,555-0101
2025,SHIV PRASAD,2024-01-16,California,West,San Francisco,8,Good experience overall,Mary Johnson,mary@email.com,555-0102
3018,FRANCHIZ,2024-01-17,Texas,South,Houston,7,Service could be better,Robert Williams,robert@email.com,555-0103
3019,PRASAD,2024-01-18,Texas,South,Dallas,10,Excellent! Best store in the area,Patricia Brown,patricia@email.com,555-0104
3033,FRANCHIZ,2024-01-19,New York,East,New York City,6,Long wait times,James Davis,james@email.com,555-0105
3039,PRASAD,2024-01-20,New York,East,Buffalo,9,Very satisfied with the service,Jennifer Miller,jennifer@email.com,555-0106
4001,SHIV PRASAD,2024-01-21,Illinois,Midwest,Chicago,8,Clean store and helpful staff,Michael Wilson,michael@email.com,555-0107
4002,FRANCHIZ,2024-01-22,Illinois,Midwest,Springfield,5,Product quality needs improvement,Elizabeth Moore,elizabeth@email.com,555-0108`;

  // Parse with exact settings
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false, // Keep everything as strings initially
    transformHeader: header => header, // Don't transform headers - keep exact
  });

  console.log('Parsed columns:', Object.keys(result.data[0]));
  console.log('First record:', result.data[0]);

  // Process and normalize
  const processedData = result.data.map((row: any) => {
    // Create a clean copy with exact column names preserved
    const processedRow: any = {};

    // Copy all fields exactly as they are
    Object.keys(row).forEach(key => {
      processedRow[key] = row[key];
    });

    // Add normalized fields for internal use
    processedRow._normalized = {
      storeCode: row['Store No.'] || '',
      storeName: row['Store Franchise'] || '',
      responseDate: row['Response Date'] || '',
      state: row['State'] || '',
      region: row['Region'] || '',
      city: row['City'] || '',
      nps: parseInt(row['NPS']) || 0,
      comments: row['Comments/feedback'] || '',
      customerName: row['Customer Name'] || '',
      email: row['Email'] || '',
      phone: row['Phone'] || '',
      timestamp: new Date().toISOString(),
    };

    return processedRow;
  });

  return processedData;
}

export function loadExactCSVData() {
  testCSVParse().then(data => {
    console.log('Loading exact CSV data:', data.length, 'records');
    console.log('Sample record:', data[0]);

    // Save to localStorage
    localStorage.setItem('nps-records', JSON.stringify(data));

    // Dispatch events
    window.dispatchEvent(
      new CustomEvent('nps-data-updated', {
        detail: { records: data.length },
      })
    );

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'nps-records',
        newValue: JSON.stringify(data),
        url: window.location.href,
      })
    );

    console.log('Data loaded successfully!');
    return data;
  });
}
