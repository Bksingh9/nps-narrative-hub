import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/contexts/DataContext';
import { useMemo } from 'react';

const DRIVER_FIELDS: { label: string; keys: string[] }[] = [
  { label: 'Staff Friendliness', keys: ['Please rate us on the following - Staff Friendliness & Service'] },
  { label: 'Billing Experience', keys: ['Please rate us on the following - Billing Experience'] },
  { label: 'Product Availability', keys: ['Please rate us on the following - Product Size availability'] },
  { label: 'Store Ambience', keys: ['Please rate us on the following - Store Ambience'] },
  { label: 'Trial Room', keys: ['Please rate us on the following - Trial Room Experience'] },
  { label: 'Product Options/Variety', keys: ['Please rate us on the following - Product Options/ Variety'] },
  {
    label: 'Cleanliness',
    keys: [
      'Please rate us on the following - Store Cleanliness',
      'Store Cleanliness',
      'Store Cleanliness & Hygiene',
      'Store Hygiene',
      'Cleanliness',
      'Hygiene',
    ],
  },
];

export function DriverPanel() {
  const { filteredData } = useData();

  const metrics = useMemo(() => {
    return DRIVER_FIELDS.map(({ label, keys }) => {
      let sum = 0;
      let count = 0;
      filteredData?.forEach((row: any) => {
        const k = keys.find(
          key => row[key] !== undefined && row[key] !== null && row[key] !== ''
        );
        if (!k) return;
        const v = parseFloat(String(row[k]).trim());
        if (Number.isFinite(v)) {
          sum += v;
          count++;
        }
      });
      return { label, avg: count ? +(sum / count).toFixed(1) : null, count };
    });
  }, [filteredData]);

  const hasData = metrics.some(m => m?.count > 0);

  return (
    <Card className="bg-card border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="text-left">
          <CardTitle>NPS Driver Averages</CardTitle>
          <p className="text-sm text-muted-foreground">Avg. rating by aspect</p>
        </div>
      </CardHeader>

      <CardContent>
        {!hasData ? (
          <div className="text-muted-foreground text-sm">No driver ratings found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {metrics.map(m => (
              <div key={m.label} className="p-3 rounded-md border bg-muted/30">
                <div className="text-xs text-muted-foreground">{m.label}</div>
                <div className="text-xl font-semibold mt-1">
                  {m.avg !== null ? m.avg.toFixed(1) : '-'}
                </div>
                <div className="text-[11px] text-muted-foreground">{m.count} responses</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
