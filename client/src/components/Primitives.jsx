import { humanize } from '../lib/format';

export function Spinner({ center = false }) {
  return <div className={`spinner${center ? ' center' : ''}`} role="progressbar" aria-label="Loading" />;
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="empty">
      {title && <h3>{title}</h3>}
      {children && <p className="small" style={{ margin: 0 }}>{children}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

export function ErrorBanner({ error, prefix }) {
  if (!error) return null;
  const message = typeof error === 'string' ? error : error.message;
  return <div className="banner error" role="alert">{prefix ? `${prefix}: ` : ''}{message}</div>;
}

export function Field({ label, hint, error, children, htmlFor }) {
  return (
    <div className="field">
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}

export function Stat({ label, value, unit, tone = '' }) {
  return (
    <div className={`stat ${tone}`}>
      <div className="label">{label}</div>
      <div className="value mono">{value}{unit && <small>{unit}</small>}</div>
    </div>
  );
}

export function Badges({ items = [], max = 3, variant = 'badge', onArt = false }) {
  if (!items.length) return null;
  const shown = items.slice(0, max);
  const rest = items.length - shown.length;
  const cls = `badge ${onArt ? 'badge-onart' : variant === 'badge' ? '' : variant}`;
  return (
    <div className="badges">
      {shown.map((c) => <span key={c} className={cls}>{humanize(c)}</span>)}
      {rest > 0 && <span className={cls}>+{rest}</span>}
    </div>
  );
}

/** Visual comparison of a booking's footprint against the conventional baseline. */
export function ImpactBar({ impact, compact = false }) {
  if (!impact) return null;
  const pct = impact.baselineKgCO2e > 0 ? Math.min(100, Math.round((impact.carbonKgCO2e / impact.baselineKgCO2e) * 100)) : 100;
  return (
    <div className="impact-bar">
      <div className="row between small">
        <span><strong className="mono">{impact.carbonKgCO2e} kg</strong> CO₂e</span>
        <span className="muted">conventional: {impact.baselineKgCO2e} kg</span>
      </div>
      <div className="track"><div className="fill" style={{ width: `${pct}%` }} /></div>
      {!compact && <div className="tiny muted">Saves about {impact.carbonSavedKgCO2e} kg ({impact.savingsPercent}%) against a conventional equivalent, on indicative factors.</div>}
    </div>
  );
}

export function Rating({ value }) {
  if (value === null || value === undefined) return null;
  return <span className="badge badge-accent" title={`${value} out of 5`}>★ {Number(value).toFixed(1)}</span>;
}
