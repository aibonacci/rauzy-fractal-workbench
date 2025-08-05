import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { I18nProvider } from './i18n/context'
import { ConfigProvider } from './config/ConfigContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ConfigProvider>
  </StrictMode>,
)
