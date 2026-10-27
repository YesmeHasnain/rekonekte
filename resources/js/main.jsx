import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { I18nProvider } from './i18n.jsx'
import { StoreProvider } from './store.jsx'
import { initPwa } from './pwa.js'
import './styles/base.css'
import './styles/home.css'
import './styles/pages.css'
import './styles/app.css'
import './styles/heart.css'
import './styles/luxe.css'

initPwa()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <StoreProvider>
          <App />
        </StoreProvider>
      </I18nProvider>
    </BrowserRouter>
  </React.StrictMode>
)
