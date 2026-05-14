interface TelemetryPoint {
  rpm: number;
  coolantC: number;
  hydPressurePsi: number;
}

interface TelemetryChartProps {
  data: TelemetryPoint[];
}

function sparkline(values: number[], color: string, height: number, width: number) {
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return <polyline fill="none" stroke={color} strokeWidth="2" points={points} />;
}

export function TelemetryChart({ data }: TelemetryChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        No recent telemetry for this asset.
      </div>
    );
  }
  const rpm = data.map((d) => d.rpm);
  const coolant = data.map((d) => d.coolantC);
  const pressure = data.map((d) => d.hydPressurePsi);
  const W = 300;
  const H = 50;

  const series = [
    { label: 'RPM', values: rpm, color: '#0ea5e9' },
    { label: 'Coolant °C', values: coolant, color: '#f97316' },
    { label: 'Hyd PSI', values: pressure, color: '#a855f7' },
  ];

  return (
    <div className="space-y-3">
      {series.map((s) => (
        <div key={s.label} className="flex items-center gap-4">
          <div className="w-20 text-xs text-slate-500">{s.label}</div>
          <svg width={W} height={H} className="overflow-visible">
            {sparkline(s.values, s.color, H, W)}
          </svg>
          <div className="text-xs font-mono text-slate-600">
            {s.values[s.values.length - 1].toLocaleString()}{' '}
            <span className="text-slate-400">
              (min {Math.min(...s.values)} · max {Math.max(...s.values)})
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
