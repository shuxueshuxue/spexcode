import React from 'react'
import ReactDOM from 'react-dom/client'
import { ReactFlowProvider } from '@xyflow/react'
import App from './App.jsx'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ReactFlowProvider>
      <App />
    </ReactFlowProvider>
  </React.StrictMode>,
)
