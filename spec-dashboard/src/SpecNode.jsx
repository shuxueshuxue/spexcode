import { Handle, Position } from '@xyflow/react'

const STATUS = {
  merged:  { label: 'merged',  color: '#859900' },
  active:  { label: 'live',    color: '#cb4b16' },
  pending: { label: 'pending', color: '#93a1a1' },
}

// @@@ SpecNode - the whole node-state model made visible: status color, live pulse, A->B thumb.
export default function SpecNode({ data, selected }) {
  const s = STATUS[data.status]
  return (
    <div className={`spec-node ${data.status} ${selected ? 'focused' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="node-head">
        <span className="node-dot" style={{ background: s.color }}>
          {data.status === 'active' && <span className="pulse" style={{ background: s.color }} />}
        </span>
        <span className="node-title">{data.title}</span>
        <span className="node-ver">{data.version ? `v${data.version}` : '—'}</span>
      </div>
      <img className="node-thumb" src={data.shots.after} alt="" draggable={false} />
      <div className="node-status" style={{ color: s.color }}>{s.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
