export function safeGetRecords(): any[] {
  try {
    return JSON.parse(localStorage.getItem('nps-records') || '[]');
  } catch {
    return [];
  }
}

export function setRecords(rows: any[]) {
  try {
    localStorage.setItem('nps-records', JSON.stringify(rows));
  } catch {}
  window.dispatchEvent(new CustomEvent('nps-data-updated', { detail: { records: rows.length } }));
}

export function onNpsDataUpdated(cb: () => void) {
  window.addEventListener('nps-data-updated', cb as any);
  return () => window.removeEventListener('nps-data-updated', cb as any);
}

export function extractDate(r: any) {
  return (
    r?._normalized?.responseDate ||
    r["Response Date"] ||
    r["Survey Date"] ||
    r["Submission Time"] ||
    r["Timestamp"] ||
    r["Date"]
  );
}

export function extractScore(r: any) {
  const v =
    r?._normalized?.nps ??
    r["NPS Score"] ??
    r["NPS_Score"] ??
    r["NPS"] ??
    r["Overall Rating"] ??
    r["Rating"] ??
    r["Score"];
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[, ]/g, ''));
  return Number.isFinite(n) ? Math.max(0, Math.min(10, n)) : undefined;
}

export function extractStore(r: any) {
  return (
    r?._normalized?.storeCode ||
    r["Store No."] ||
    r["Store No"] ||
    r["Store Number"] ||
    r["Store Code"] ||
    r["Store_ID"] ||
    r["Outlet Code"] ||
    r["Location Code"] ||
    r["Store"] ||
    r["Outlet"]
  );
}

export function extractState(r: any) {
  return r?._normalized?.state || r["State"] || r["STATE"];
}

export function extractRegion(r: any) {
  // First check if region is already normalized
  if (r?._normalized?.region) {
    return r._normalized.region;
  }
  
  // Check for existing region field
  const existingRegion = r["Region"] || r["REGION"] || r["Zone"] || r["Cluster"] || r["Area"];
  if (existingRegion) {
    // Map short codes or existing regions to standard regions
    const regionMap: { [key: string]: string } = {
      'MAH': 'West',
      'KAR': 'South', 
      'GMU': 'North',
      'DELHI': 'North',
      'GUJ': 'West',
      'RAJ': 'North',
      'TN': 'South',
      'MAHARASHTRA': 'West',
      'KARNATAKA': 'South',
      'GUJARAT': 'West',
      'RAJASTHAN': 'North',
      'TAMIL NADU': 'South',
      'WEST BENGAL': 'East'
    };
    
    const mapped = regionMap[existingRegion.toUpperCase()];
    if (mapped) return mapped;
  }
  
  // Map based on state if no region exists
  const state = (r?._normalized?.state || r["State"] || r["STATE"] || "").toUpperCase();
  
  const stateToRegion: { [key: string]: string } = {
    // North India
    'DELHI': 'North',
    'HARYANA': 'North',
    'PUNJAB': 'North',
    'HIMACHAL PRADESH': 'North',
    'UTTARAKHAND': 'North',
    'UTTAR PRADESH': 'North',
    'JAMMU AND KASHMIR': 'North',
    'LADAKH': 'North',
    'CHANDIGARH': 'North',
    
    // South India
    'KARNATAKA': 'South',
    'TAMIL NADU': 'South',
    'KERALA': 'South',
    'ANDHRA PRADESH': 'South',
    'TELANGANA': 'South',
    'PUDUCHERRY': 'South',
    'LAKSHADWEEP': 'South',
    'ANDAMAN AND NICOBAR': 'South',
    
    // East India
    'WEST BENGAL': 'East',
    'ODISHA': 'East',
    'BIHAR': 'East',
    'JHARKHAND': 'East',
    'SIKKIM': 'East',
    'ASSAM': 'East',
    'ARUNACHAL PRADESH': 'East',
    'MANIPUR': 'East',
    'MEGHALAYA': 'East',
    'MIZORAM': 'East',
    'NAGALAND': 'East',
    'TRIPURA': 'East',
    
    // West India
    'MAHARASHTRA': 'West',
    'GUJARAT': 'West',
    'RAJASTHAN': 'West',
    'GOA': 'West',
    'DAMAN AND DIU': 'West',
    'DADRA AND NAGAR HAVELI': 'West',
    
    // Central India
    'MADHYA PRADESH': 'Central',
    'CHHATTISGARH': 'Central'
  };
  
  return stateToRegion[state] || existingRegion || 'Unknown';
}

export function extractCity(r: any) {
  return r?._normalized?.city || r["City"] || r["CITY"] || r["Town"] || r["Location"];
}

export function applyFilters(rows: any[], filters: any) {
  let r = [...rows];
  if (filters?.dateRange?.from || filters?.dateRange?.to) {
    r = r.filter((x) => {
      const d = extractDate(x);
      if (!d) return true;
      const t = new Date(d).getTime();
      if (filters.dateRange?.from && t < filters.dateRange.from.getTime()) return false;
      if (filters.dateRange?.to && t > filters.dateRange.to.getTime()) return false;
      return true;
    });
  }
  if (filters?.selectedStore) r = r.filter((x) => String(extractStore(x)) === filters.selectedStore);
  if (filters?.selectedState) r = r.filter((x) => String(extractState(x)) === filters.selectedState);
  if (filters?.selectedRegion) r = r.filter((x) => String(extractRegion(x)) === filters.selectedRegion);
  if (filters?.selectedCity) r = r.filter((x) => String(extractCity(x)) === filters.selectedCity);
  return r;
}

export function groupBy<T>(arr: T[], keyFn: (t: T) => any) {
  const m = new Map<any, T[]>();
  for (const it of arr) {
    const k = keyFn(it) ?? '';
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(it);
  }
  return m;
}

export function dailyBuckets(rows: any[]) {
  const m = new Map<string, any[]>();
  for (const r of rows) {
    const d = extractDate(r);
    if (!d) continue;
    const k = new Date(d).toISOString().slice(0, 10);
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(r);
  }
  return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function computeNps(rows: any[]) {
  const scores = rows.map(extractScore).filter((v: any) => v !== undefined);
  const total = scores.length;
  const pro = scores.filter((s: number) => s >= 9).length;
  const det = scores.filter((s: number) => s <= 6).length;
  const nps = total ? Math.round(((pro - det) / total) * 100) : 0;
  const avg = total ? +(scores.reduce((a: number, b: number) => a + b, 0) / total).toFixed(1) : 0;
  return { nps, total, avg };
}

export function detectAnomalies(rows: any[]) {
  const anomalies: any[] = [];
  for (const [store, items] of groupBy(rows, extractStore)) {
    const days = dailyBuckets(items).map(([day, rs]) => ({ day, ...computeNps(rs) }));
    const mean = days.length ? days.reduce((a, b) => a + b.nps, 0) / days.length : 0;
    const sd = Math.sqrt(days.reduce((a, b) => a + Math.pow(b.nps - mean, 2), 0) / (days.length || 1));
    for (const d of days) {
      const z = sd ? (d.nps - mean) / sd : 0;
      if (Math.abs(z) >= 2) anomalies.push({ store, day: d.day, nps: d.nps, z: +z.toFixed(2) });
    }
  }
  return anomalies;
}

export function detectBenchmarkDrops(rows: any[]) {
  const now = Date.now(), day = 86400000;
  const lastFrom = now - 30 * day, prevFrom = now - 60 * day, prevTo = now - 30 * day;
  const inRange = (d: any, from: number, to: number) => {
    const t = new Date(d).getTime();
    return t >= from && t <= to;
  };
  const dims = [
    ["store", extractStore],
    ["state", extractState],
    ["region", extractRegion],
  ] as const;
  const out: any[] = [];
  for (const [label, keyFn] of dims) {
    for (const [key, items] of groupBy(rows, keyFn)) {
      if (!key) continue;
      const cur = computeNps(items.filter((r: any) => inRange(extractDate(r), lastFrom, now)));
      const prv = computeNps(items.filter((r: any) => inRange(extractDate(r), prevFrom, prevTo)));
      const delta = cur.nps - prv.nps;
      if (prv.total >= 20 && cur.total >= 20 && delta <= -10)
        out.push({ dimension: label, key, currentNps: cur.nps, previousNps: prv.nps, delta, currentResponses: cur.total });
    }
  }
  return out;
}

export function topReasons(rows: any[]) {
  const texts = rows
    .map((r) => r["Comments"] || r["Feedback"] || r["Remark"] || r["Observation"] || r?._normalized?.comments)
    .filter(Boolean);
  const bag = new Map<string, number>();
  for (const t of texts) {
    for (const w of String(t).toLowerCase().match(/[a-z]+/g) || []) {
      if (w.length < 4) continue;
      bag.set(w, (bag.get(w) || 0) + 1);
    }
  }
  const keywords = [...bag.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([keyword, count]) => ({ keyword, count }));
  const catKey = (r: any) => r["Category"] || r["Department"] || r["Segment"] || r["Division"] || r?._normalized?.category;
  const g = groupBy(rows.filter((r) => catKey(r)), (r: any) => catKey(r));
  const categories = [...g.entries()]
    .map(([k, rs]) => ({ category: k, ...computeNps(rs) }))
    .sort((a, b) => a.nps - b.nps)
    .slice(0, 5);
  return { keywords, categories };
} 
