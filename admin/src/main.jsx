import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './index.css'

// Vite sets BASE_URL from `base` in vite.config.js: "/" in development, "/admin/" in production
// where this app is served from a subdirectory of the public site's deploy. Deriving the router
// basename from it means the two cannot drift apart. Trailing slash is trimmed because React
// Router expects "/admin", not "/admin/".
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
