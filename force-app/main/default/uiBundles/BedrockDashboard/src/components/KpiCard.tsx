import { Card, CardContent } from '@/components/ui/card';

interface KpiCardProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  betterIs: 'lower' | 'higher';
  formatter?: (value: number) => string;
}

function defaultFormat(value: number, unit: string): string {
  if (unit === '$') return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (unit) return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}${unit}`;
  return value.toLocaleString();
}

export function KpiCard({ label, current, target, unit, betterIs, formatter }: KpiCardProps) {
  const fmt = formatter ?? ((v: number) => defaultFormat(v, unit));
  const meetsTarget =
    betterIs === 'lower' ? current <= target : current >= target;

  return (
    <Card className="border-slate-200">
      <CardContent className="pt-6">
        <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-slate-900">{fmt(current)}</span>
          <span className="text-sm text-slate-400">/ target {fmt(target)}</span>
        </div>
        <div
          className={`mt-2 text-xs font-medium ${
            meetsTarget ? 'text-emerald-600' : 'text-amber-600'
          }`}
        >
          {meetsTarget ? '● meets target' : `● ${betterIs === 'lower' ? 'above' : 'below'} target`}
        </div>
      </CardContent>
    </Card>
  );
}
