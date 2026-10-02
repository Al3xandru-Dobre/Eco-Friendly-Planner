import { useEffect } from 'react';
import { X } from './Icons';

export function Modal({ title, subtitle, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={wide ? { maxWidth: 980 } : undefined}>
        <div className="modal-head">
          <div>
            {title && <h2 style={{ margin: 0 }}>{title}</h2>}
            {subtitle && <div className="muted small">{subtitle}</div>}
          </div>
          <button type="button" className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Close"><X /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
