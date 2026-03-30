import { useState, useEffect } from 'react';
import { BookUploader } from './components/BookUploader';
import { EpubViewer } from './components/EpubViewer';
import { translateText } from './TranslationService';
import { BookOpen, Settings, ArrowLeft } from 'lucide-react';
import './index.css';

function App() {
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [selectedText, setSelectedText] = useState<{ text: string; context: string; rect: DOMRect } | null>(null);
  const [translation, setTranslation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Приоритет: 1) Вшитый ENV ключ, 2) Кэш браузера, 3) Пусто
  const [apiKey, setApiKey] = useState(() => import.meta.env.VITE_OPENAI_API_KEY || localStorage.getItem('openai_api_key') || '');
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem('openai_base_url') || 'https://api.openai.com/v1');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    localStorage.setItem('openai_base_url', baseUrl);
    // Сохраняем в кэш только если ключ не вшит жестко из ENV
    if (!import.meta.env.VITE_OPENAI_API_KEY && apiKey) {
      localStorage.setItem('openai_api_key', apiKey);
    }
  }, [apiKey, baseUrl]);

  const handleSelection = async (text: string, context: string, rect: DOMRect) => {
    setSelectedText({ text, context, rect });
    setTranslation(null);
    
    if (!apiKey) {
      setTranslation('Please set your OpenAI API Key in settings first.');
      return;
    }

    setLoading(true);
    try {
      const result = await translateText(text, context, apiKey, baseUrl);
      setTranslation(result);
    } catch (err: any) {
      if (err.message.includes('Failed to fetch')) {
        setTranslation('Ошибка соединения 🌐. Ваш провайдер блокирует доступ к OpenAI. Пожалуйста, включите VPN на компьютере, либо укажите URL прокси-сервера в настройках (⚙️ шестеренка).');
      } else {
        setTranslation(`Ошибка: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedText(null);
  };

  const handleCloseBook = () => {
    setBookFile(null);
    setSelectedText(null);
  };

  return (
    <div className="app-container" onClick={handleClearSelection}>
      <header className="app-header">
        <div className="header-content">
          <BookOpen className="logo-icon" size={28} />
          <h1>LingoReader</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {bookFile && (
            <button className="close-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={(e) => { e.stopPropagation(); handleCloseBook(); }}>
              <ArrowLeft size={18} /> К библиотеке
            </button>
          )}
          <button className="nav-btn" onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}>
            <Settings size={24} />
          </button>
        </div>
      </header>

      <main className="app-main">
        {!bookFile ? (
          <BookUploader onFileSelect={setBookFile} />
        ) : (
          <div className="reader-wrapper glass-panel" style={{ width: '100%', minHeight: '88vh', display: 'flex' }}>
            <EpubViewer file={bookFile} onSelection={handleSelection} onClearSelection={handleClearSelection} />
            
            {/* Translation Popover */}
            {selectedText && (
              <div 
                className="translation-popover glass-panel"
                onClick={e => e.stopPropagation()}
                style={{
                  position: 'fixed',
                  left: `${Math.max(20, Math.min(window.innerWidth - 340, selectedText.rect.left + (selectedText.rect.width / 2) - 160))}px`,
                  ...(selectedText.rect.top > 350 
                    ? { bottom: `${window.innerHeight - selectedText.rect.top + 10}px` } 
                    : { top: `${selectedText.rect.bottom + 10}px` }),
                  zIndex: 1000,
                }}
              >
                <div className="popover-header">Translation</div>
                <div className="popover-body">
                  <strong>{selectedText.text}</strong>
                  <div style={{ marginTop: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    {loading ? (
                      <div className="loading-skeleton"></div>
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: translation ? translation.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text);">$1</strong>').replace(/\n/g, '<br/>') : '' }}></div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-modal glass-panel" onClick={e => e.stopPropagation()}>
            <h2>Settings</h2>
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                OpenAI API Key
              </label>
              <input 
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="api-input"
              />
              <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Your key is saved locally in your browser. It is required for context-aware translations.
              </p>
              
              <label style={{ display: 'block', marginBottom: '8px', marginTop: '16px', fontWeight: 500 }}>
                API Base URL (for proxies)
              </label>
              <input 
                type="text"
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                className="api-input"
              />
              <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Change this if you are using an API proxy (e.g., in regions where OpenAI is blocked).
              </p>
            </div>
            <button className="primary-btn" style={{ marginTop: '24px', width: '100%' }} onClick={() => setShowSettings(false)}>
              Save & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
