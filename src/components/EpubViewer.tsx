import React, { useEffect, useRef, useState } from 'react';
import ePub, { Book, Rendition } from 'epubjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  file: File;
  onSelection: (text: string, paragraph: string, rect: DOMRect) => void;
  onClearSelection?: () => void;
}

export const EpubViewer: React.FC<Props> = ({ file, onSelection, onClearSelection }) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const bookRef = useRef<Book | null>(null);
  const [errorObj, setErrorObj] = useState<string>('');

  const onSelectionRef = useRef(onSelection);
  const onClearSelectionRef = useRef(onClearSelection);
  useEffect(() => {
    onSelectionRef.current = onSelection;
    onClearSelectionRef.current = onClearSelection;
  }, [onSelection, onClearSelection]);

  useEffect(() => {
    if (!viewerRef.current) return;
    let isMounted = true;
    setErrorObj(''); // reset error on new file

    try {
      file.arrayBuffer().then((buffer) => {
        if (!isMounted) return;
        
        try {
          const book = ePub(buffer);
          bookRef.current = book;
          
          const rendition = book.renderTo(viewerRef.current!, {
            width: '100%',
            height: '100%',
            spread: 'none',
            manager: 'continuous',
            flow: 'paginated'
          });
          renditionRef.current = rendition;

          rendition.themes.default({
            body: { 
              background: 'transparent !important', 
              color: '#333 !important', 
              'font-family': '"Inter", sans-serif !important' 
            },
            '::selection': { 
              background: 'rgba(59, 130, 246, 0.3)' 
            }
          });

          rendition.display().catch(e => {
             if (isMounted) setErrorObj('Display error: ' + (e.message || e.toString()));
          });
          
          let lastTime = 0;
          rendition.hooks.content.register((contents: any) => {
            contents.window.addEventListener('wheel', (e: WheelEvent) => {
              const now = Date.now();
              if (now - lastTime < 500) return;
              if (Math.abs(e.deltaY) > 20) {
                if (e.deltaY > 0) rendition.next();
                else rendition.prev();
                lastTime = now;
                if (onClearSelectionRef.current) onClearSelectionRef.current();
              }
            });
            contents.window.addEventListener('click', () => {
              if (onClearSelectionRef.current) onClearSelectionRef.current();
            });
            contents.window.addEventListener('touchstart', () => {
              if (onClearSelectionRef.current) onClearSelectionRef.current();
            }, { passive: true });
          });

          rendition.on('selected', (cfiRange: string) => {
            book.getRange(cfiRange).then((range) => {
              if (!range) return;
              const text = range.toString();
              const paragraph = range.commonAncestorContainer.textContent || text;
              const contentsArray = rendition.getContents() as any;
              const iframe = contentsArray[0]?.document?.defaultView?.frameElement as HTMLIFrameElement;
              const rect = range.getBoundingClientRect();
              const iframeRect = iframe?.getBoundingClientRect();
              
              let adjustedRect = rect;
              if (iframeRect) {
                adjustedRect = new DOMRect(
                  rect.left + iframeRect.left,
                  rect.top + iframeRect.top,
                  rect.width,
                  rect.height
                );
              }

              onSelectionRef.current(text, paragraph, adjustedRect);
            });
          });

          rendition.on('click', () => {
            if (onClearSelectionRef.current) onClearSelectionRef.current();
          });
        } catch (err: any) {
          if (isMounted) setErrorObj('ePub init error: ' + (err.message || err.toString()));
        }
      }).catch(err => {
        if (isMounted) setErrorObj('File file.arrayBuffer() error: ' + (err.message || err.toString()));
      });
    } catch (err: any) {
      if (isMounted) setErrorObj('Sync error: ' + (err.message || err.toString()));
    }

    return () => {
      isMounted = false;
      if (bookRef.current) {
        bookRef.current.destroy();
      }
    };
  }, [file]);

  const next = () => {
    renditionRef.current?.next();
    if (onClearSelectionRef.current) onClearSelectionRef.current();
  };
  const prev = () => {
    renditionRef.current?.prev();
    if (onClearSelectionRef.current) onClearSelectionRef.current();
  };

  return (
    <div className="viewer-container" style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'stretch' }}>
      <button className="nav-btn prev-btn" onClick={prev}>
        <ChevronLeft size={32} />
      </button>
      
      {errorObj && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: '#ef4444', color: 'white', padding: '16px', zIndex: 100, borderRadius: '8px', fontWeight: 'bold' }}>
          ОШИБКА: {errorObj}
        </div>
      )}

      <div ref={viewerRef} className="viewer-content" style={{ flex: 1, height: '100%', width: '100%', minHeight: '60vh' }} />
      
      <button className="nav-btn next-btn" onClick={next}>
        <ChevronRight size={32} />
      </button>
    </div>
  );
};
