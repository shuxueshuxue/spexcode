// @@@ Modal - the shared centered-popup chrome: a backdrop + a panel with a titled header (× close)
// and a scrollable body. Reused by the help/legend (`?`) and settings (`,`) popups, and the home for
// any future centered popup. Backdrop click closes; the inner panel stops propagation so a click inside
// doesn't. Esc / the opener hotkey also close it (handled in App's key router). The CSS classes are
// historically named `legend-*` (the legend was the first such modal) and are shared verbatim, so both
// popups look and behave identically without a second copy of the markup.
export default function Modal({ title, closeLabel, onClose, className, children }) {
  return (
    <div className="legend-backdrop" onClick={onClose}>
      <div
        className={className ? `legend ${className}` : 'legend'}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="legend-head">
          <span className="legend-title">{title}</span>
          <button className="legend-close" onClick={onClose} title={closeLabel}>×</button>
        </div>
        <div className="legend-body">{children}</div>
      </div>
    </div>
  )
}
