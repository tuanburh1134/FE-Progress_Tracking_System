import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

/**
 * Entry point của React application.
 *
 * Sử dụng StrictMode để phát hiện sớm các vấn đề tiềm ẩn
 * (double invoke trong development mode).
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
