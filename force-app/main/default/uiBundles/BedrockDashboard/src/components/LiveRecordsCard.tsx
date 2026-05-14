import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LiveRecordsCardProps<T> {
  title: string;
  endpoint: string;
  emptyMessage: string;
  refreshIntervalMs?: number;
  recencyWindowMs?: number;
  renderRow: (record: T, isNew: boolean) => React.ReactNode;
  getKey: (record: T) => string;
  getCreatedAt: (record: T) => string;
}

export function LiveRecordsCard<T>({
  title,
  endpoint,
  emptyMessage,
  refreshIntervalMs = 10_000,
  recencyWindowMs = 60_000,
  renderRow,
  getKey,
  getCreatedAt,
}: LiveRecordsCardProps<T>) {
  const [records, setRecords] = useState<T[]>([]);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(endpoint, { cache: 'no-store' });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`${response.status}: ${text.slice(0, 200)}`);
        }
        const data = (await response.json()) as { records: T[]; error?: string };
        if (data.error) throw new Error(data.error);
        if (cancelled) return;
        setRecords(data.records ?? []);
        setLastFetched(new Date());
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, refreshIntervalMs);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [endpoint, refreshIntervalMs]);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
        <div className="text-xs text-slate-500">
          {loading
            ? 'Loading…'
            : error
              ? <span className="text-rose-600">Error: {error}</span>
              : lastFetched
                ? `Live · last refreshed ${lastFetched.toLocaleTimeString()} · auto-polling`
                : 'Idle'}
        </div>
      </CardHeader>
      <CardContent>
        {!loading && !error && records.length === 0 && (
          <div className="text-xs text-slate-500">{emptyMessage}</div>
        )}
        {records.length > 0 && (
          <div className="space-y-3">
            {records.map((r) => {
              const key = getKey(r);
              const createdAtMs = new Date(getCreatedAt(r)).getTime();
              const isNew = Number.isFinite(createdAtMs) && now - createdAtMs < recencyWindowMs;
              return <div key={key}>{renderRow(r, isNew)}</div>;
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
