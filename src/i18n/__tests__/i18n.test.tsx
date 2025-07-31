import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { I18nProvider, useI18n } from '../context';
import { LANGUAGE_CONFIG } from '../types';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Test component that uses i18n
const TestComponent: React.FC = () => {
  const { language, setLanguage, t } = useI18n();
  
  return (
    <div>
      <div data-testid="current-language">{language}</div>
      <div data-testid="translated-text">{t('app.title')}</div>
      <button 
        data-testid="switch-language" 
        onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
      >
        Switch Language
      </button>
    </div>
  );
};

const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nProvider>
      {component}
    </I18nProvider>
  );
};

describe('I18n System', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    console.warn = vi.fn();
    console.error = vi.fn();
  });

  test('should use default language (English) initially', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    renderWithI18n(<TestComponent />);
    
    expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    expect(screen.getByTestId('translated-text')).toHaveTextContent('Rauzy Fractal Workbench');
  });

  test('should load saved language from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('zh');
    
    renderWithI18n(<TestComponent />);
    
    expect(screen.getByTestId('current-language')).toHaveTextContent('zh');
    expect(screen.getByTestId('translated-text')).toHaveTextContent('Rauzy 分形工作台');
  });

  test('should switch language when setLanguage is called', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    renderWithI18n(<TestComponent />);
    
    // Initially English
    expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    expect(screen.getByTestId('translated-text')).toHaveTextContent('Rauzy Fractal Workbench');
    
    // Switch to Chinese
    fireEvent.click(screen.getByTestId('switch-language'));
    
    expect(screen.getByTestId('current-language')).toHaveTextContent('zh');
    expect(screen.getByTestId('translated-text')).toHaveTextContent('Rauzy 分形工作台');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(LANGUAGE_CONFIG.STORAGE_KEY, 'zh');
  });

  test('should handle missing translation keys gracefully', () => {
    const { result } = renderHook(() => useI18n(), {
      wrapper: I18nProvider
    });

    const translation = result.current.t('nonexistent.key');
    expect(translation).toBe('nonexistent.key');
    expect(console.warn).toHaveBeenCalledWith(
      'Translation missing for key: nonexistent.key in language: en'
    );
  });

  test('should handle parameter interpolation', () => {
    const { result } = renderHook(() => useI18n(), {
      wrapper: I18nProvider
    });

    const translation = result.current.t('controls.pathList.totalPaths', { count: '5' });
    expect(translation).toBe('Total paths: 5');
  });

  test('should handle localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    renderWithI18n(<TestComponent />);
    
    // Should still work with default language
    expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    expect(console.warn).toHaveBeenCalledWith(
      'Failed to load language preference from localStorage:',
      expect.any(Error)
    );
  });

  test('should handle unsupported language gracefully', () => {
    const { result } = renderHook(() => useI18n(), {
      wrapper: I18nProvider
    });

    act(() => {
      // @ts-ignore - testing invalid language
      result.current.setLanguage('fr');
    });

    expect(result.current.language).toBe('en');
    expect(console.warn).toHaveBeenCalledWith(
      'Unsupported language: fr, falling back to default'
    );
  });

  test('should throw error when useI18n is used outside provider', () => {
    const TestComponentWithoutProvider = () => {
      useI18n();
      return <div>Test</div>;
    };

    expect(() => render(<TestComponentWithoutProvider />)).toThrow(
      'useI18n must be used within an I18nProvider'
    );
  });
});