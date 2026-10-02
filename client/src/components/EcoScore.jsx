import { ecoTone } from '../lib/format';

/** Circular 0-100 gauge used for venues and trips. */
export function EcoScore({ value, size = 64, label = 'eco', stroke = 6 }) {
  const score = value === null || value === undefined ? null : Math.max(0, Math.min(100, Math.round(value)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = score === null ? c : c - (c * score) / 100;
  const fontSize = size * 0.3;
  return (
    <div className={`ring ${ecoTone(score)}`} style={{ width: size, height: size }} role="img" aria-label={`Eco score ${score ?? 'unknown'} out of 100`}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
        <circle className="ring-value" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <div className="ring-label">
        <strong style={{ fontSize }}>{score ?? '–'}</strong>
        {label && size >= 56 && <span>{label}</span>}
      </div>
    </div>
  );
}
