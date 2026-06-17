import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { SESSION_LOG } from './data.js'

// @@@ TermPane - the tmux embed pane. capture-pane -> term.write, send-keys <- term.onData.
export default function TermPane({ node, onClose }) {
  const hostRef = useRef(null)

  useEffect(() => {
    const term = new Terminal({
      fontSize: 13,
      fontFamily: 'Menlo, monospace',
      cursorBlink: true,
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

    term.attachCustomKeyEventHandler((e) => {
      if (e.type === 'keydown' && e.key === 'Escape') { onClose(); return false }
      return true
    })

    SESSION_LOG(node).forEach((line) => term.writeln(line))
    term.write('\x1b[36m❯ \x1b[0m')
    term.onData((d) => {
      if (d === '\r') term.write('\r\n\x1b[36m❯ \x1b[0m')
      else if (d === '\x7f') term.write('\b \b')
      else term.write(d)
    })

    let tick
    if (node.session) {
      let n = 0
      tick = setInterval(() => {
        const lines = [
          `\x1b[90m  [${node.session}] still working…\x1b[0m`,
          `\x1b[32m● Read\x1b[0m src/App.jsx`,
          `\x1b[35m✻\x1b[0m verifying B against scenario`,
        ]
        term.write(`\r\n${lines[n++ % lines.length]}\r\n\x1b[36m❯ \x1b[0m`)
      }, 2600)
    }

    const onResize = () => fit.fit()
    window.addEventListener('resize', onResize)
    setTimeout(() => { fit.fit(); term.focus() }, 0)

    return () => {
      if (tick) clearInterval(tick)
      window.removeEventListener('resize', onResize)
      term.dispose()
    }
  }, [node]) // eslint-disable-line

  return <div className="pane-term" ref={hostRef} />
}
