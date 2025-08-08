import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { I18nProvider } from './i18n/context'
import { ConfigProvider } from './config/ConfigContext'
import { createConfigManager } from './config/ConfigManager'
import { ConfigLoader } from './components/ConfigLoader/ConfigLoader'
import { ConfigErrorBoundary } from './components/ErrorBoundary/ConfigErrorBoundary'

// 创建配置管理器实例
const configManager = createConfigManager({
  enableValidation: true,
  enableHotReload: process.env.NODE_ENV === 'development',
  configPath: '/config.json',
  onConfigChange: (config, errors) => {
    if (errors.length > 0) {
      console.warn('配置更新时发现错误:', errors);
    } else {
      console.log('配置已更新');
    }
  },
  onValidationError: (errors, warnings) => {
    if (errors.length > 0) {
      console.error('配置验证错误:', errors);
    }
    if (warnings.length > 0) {
      console.warn('配置验证警告:', warnings);
    }
  },
  onFileError: (error, operation) => {
    console.error(`配置文件${operation}错误:`, error);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigErrorBoundary>
      <ConfigLoader configManager={configManager}>
        <ConfigProvider configManager={configManager}>
          <I18nProvider>
            <App />
          </I18nProvider>
        </ConfigProvider>
      </ConfigLoader>
    </ConfigErrorBoundary>
  </StrictMode>,
)
