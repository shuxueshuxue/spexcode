import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { SESSION_LOG } from './data.js'

// @@@ TermPane - the tmux embed as a READ-ONLY display; the command line lives OUTSIDE the
// terminal (.term-input below). xterm renders capture-pane output; our external input mimics
// the prompt and echoes commands into the display. Keeping the input external means the arrow
// keys are ours, not xterm's: when the line is empty, ←/→ walk the tree (parent/child) and
// ↑/↓ walk siblings instead of being swallowed by the terminal.
export default function TermPane({ node, onNav }) {
  const hostRef = useRef(null)
  const inputRef = useRef(null)
  const termRef = useRef(null)
  const [cmd, setCmd] = useState('')

  useEffect(() => {
    const term = new Terminal({
      fontSize: 13,
      fontFamily: 'Menlo, monospace',
      cursorBlink: false,
      disableStdin: true, // display only — xterm captures no keys
      theme: {
        background: '#fdf6e3', foreground: '#586e75', cursor: '#268bd2',
        selectionBackground: '#eee8d5',
        black: '#073642', red: '#dc322f', green: '#859900', yellow: '#b58900',
        blue: '#268bd2', magenta: '#d33682', cyan: '#2aa198', white: '#eee8d5',
        brightBlack: '#93a1a1', brightRed: '#cb4b16', brightGreen: '#586e75',
        brightYellow: '#657b83', brightBlue: '#839496', brightMagenta: '#6c71c4',
        brightCyan: '#2aa198', brightWhite: '#fdf6e3',
      },
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(hostRef.current)
    fit.fit()
    termRef.current = term

    SESSION_LOG(node).forEach((line) => term.writeln(line))

    let tick
    if (node.session) {
      let n = 0
      tick = setInterval(() => {
        const lines = [
          `\x1b[90m  [${node.session}] still working…\x1b[0m`,
          `\x1b[32m● Read\x1b[0m src/App.jsx`,
          `\x1b[35m✻\x1b[0m verifying B against scenario`,
        ]
        term.writeln(lines[n++ % lines.length])
      }, 2600)
    }

    const onResize = () => fit.fit()
    window.addEventListener('resize', onResize)
    setTimeout(() => fit.fit(), 0)

    return () => {
      if (tick) clearInterval(tick)
      window.removeEventListener('resize', onResize)
      term.dispose()
      termRef.current = null
    }
  }, [node]) // eslint-disable-line

  // focus the external input on each node, so typing + arrow-nav stay live as you toggle nodes.
  useEffect(() => {
    setCmd('')
    const id = setTimeout(() => inputRef.current?.focus(), 0)
    return () => clearTimeout(id)
  }, [node])

  const run = () => {
    const line = cmd.trim()
    if (!line) return
    termRef.current?.writeln(`\x1b[36m❯\x1b[0m ${line}`) // mimic: echo the command into the display
    setCmd('')
  }

  // @@@ arrow fall-through - the whole point. When the line is EMPTY the arrows are navigation,
  // not text editing, so we hand them to the tree. With text present they edit the line as usual
  // (and we stop them bubbling so nothing double-fires).
  const NAV = { ArrowLeft: 'parent', ArrowRight: 'child', ArrowUp: 'up', ArrowDown: 'down' }
  const onKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); run(); return }
    if (NAV[e.key] && cmd === '') { e.preventDefault(); onNav?.(NAV[e.key]); return }
    e.stopPropagation()
  }

  return (
    <div className="pane-term">
      <div className="term-host" ref={hostRef} />
      <div className="term-input">
        <span className="term-prompt">❯</span>
        <input
          ref={inputRef}
          className="term-line"
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="type a command · ←/→ switch nodes when empty"
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  )
}
