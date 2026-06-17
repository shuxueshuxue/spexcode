import TermPane from './TermPane.jsx'

// @@@ pane registry - add a face for a spec node by adding one entry + one render case below.
export const PANES = [
  { key: 'spec',     label: 'spec' },
  { key: 'term',     label: 'terminal' },
  { key: 'evidence', label: 'evidence' },
  { key: 'history',  label: 'history' },
]

function SpecPane({ node }) {
  return (
    <div className="pane-doc">
      <h1># {node.title}</h1>
      <blockquote>{node.desc}</blockquote>
      <div className="doc-meta">
        status: <b>{node.status}</b> · version: <b>v{node.version || 0}</b> · session: <b>{node.session || 'idle'}</b>
      </div>
      <p className="doc-note">// the spec body is the latest ground truth — open the terminal pane to change it in place.</p>
    </div>
  )
}

function EvidencePane({ node }) {
  return (
    <div className="pane-ev">
      <figure>
        <img src={node.shots.before} alt="before" />
        <figcaption>A · before (v{Math.max((node.version || 0) - 1, 0)})</figcaption>
      </figure>
      <div className="ev-arrow">→</div>
      <figure>
        <img src={node.shots.after} alt="after" />
        <figcaption>B · {node.version ? `after (v${node.version})` : 'pending'}</figcaption>
      </figure>
    </div>
  )
}

function HistoryPane({ node }) {
  if (!node.version) return <div className="pane-hist empty">no versions yet — open the terminal pane to begin.</div>
  const rows = []
  for (let v = node.version; v >= 1; v--) {
    rows.push({
      v,
      sess: v === node.version && node.session ? node.session : `sess-${node.id.slice(0, 2)}${(v * 37 % 90 + 10)}`,
      msg: v === node.version ? 'current — latest ground truth' : 'edited spec content',
    })
  }
  return (
    <div className="pane-hist">
      {rows.map((r) => (
        <div className="hist-row" key={r.v}>
          <span className="hist-v">v{r.v}</span>
          <span className="hist-sess">{r.sess}</span>
          <span className="hist-msg">{r.msg}</span>
        </div>
      ))}
    </div>
  )
}

export default function NodeView({ node, pane, setPane, onClose }) {
  return (
    <div className="ov-backdrop" onMouseDown={onClose}>
      <div className="ov-panel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ov-head">
          <span className="ov-title">{node.title}</span>
          <div className="ov-tabs">
            {PANES.map((p, i) => (
              <button key={p.key} className={p.key === pane ? 'ov-tab on' : 'ov-tab'} onClick={() => setPane(p.key)}>
                <kbd>{i + 1}</kbd> {p.label}
              </button>
            ))}
          </div>
          <span className="ov-hint">tab ↹ switch · esc back</span>
        </div>
        <div className="ov-body">
          {pane === 'spec' && <SpecPane node={node} />}
          {pane === 'term' && <TermPane node={node} onClose={onClose} />}
          {pane === 'evidence' && <EvidencePane node={node} />}
          {pane === 'history' && <HistoryPane node={node} />}
        </div>
      </div>
    </div>
  )
}
