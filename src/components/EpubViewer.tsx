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
          let touchStartX = 0;
          let touchStartY = 0;
          let touchEndX = 0;
          let touchEndY = 0;
          let lastSelectedText = '';

          rendition.hooks.content.register((contents: any) => {
            contents.window.addEventListener('wheel', (e: WheelEvent) => {
              const now = Date.now();
              if (now - lastTime < 500) return;
              if (Math.abs(e.deltaY) > 20) {
                if (e.deltaY > 0) rendition.next();
                else rendition.prev();
                lastTime = now;
                lastSelectedText = '';
                if (onClearSelectionRef.current) onClearSelectionRef.current();
              }
            });
            
            contents.window.addEventListener('click', () => {
              const selection = contents.window.getSelection();
              if (!selection || selection.toString().trim().length === 0) {
                lastSelectedText = '';
                if (onClearSelectionRef.current) onClearSelectionRef.current();
              }
            });
            
            contents.window.addEventListener('touchstart', (e: TouchEvent) => {
              touchStartX = e.changedTouches[0].screenX;
              touchStartY = e.changedTouches[0].screenY;
              const selection = contents.window.getSelection();
              if (!selection || selection.toString().trim().length === 0) {
                lastSelectedText = '';
                if (onClearSelectionRef.current) onClearSelectionRef.current();
              }
            }, { passive: true });

            contents.window.addEventListener('touchend', (e: TouchEvent) => {
              touchEndX = e.changedTouches[0].screenX;
              touchEndY = e.changedTouches[0].screenY;
              
              const SWIPE_THRESHOLD = 50;
              const xDiff = touchStartX - touchEndX;
              const yDiff = touchStartY - touchEndY;

              if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > SWIPE_THRESHOLD) {
                if (xDiff > 0) rendition.next();
                else rendition.prev();
                lastSelectedText = '';
                if (onClearSelectionRef.current) onClearSelectionRef.current();
                return;
              }

              setTimeout(() => {
                const selection = contents.window.getSelection();
                if (selection && selection.toString().trim().length > 0) {
                  const text = selection.toString().trim();
                  if (text === lastSelectedText) return;
                  lastSelectedText = text;

                  const range = selection.getRangeAt(0);
                  let paragraph = range.commonAncestorContainer.textContent || text;
                  if (paragraph.length > 1500) {
                    paragraph = paragraph.substring(0, 1500) + '...';
                  }

                  const iframe = contents.document.defaultView.frameElement;
                  const rect = range.getBoundingClientRect();
                  const iframeRect = iframe.getBoundingClientRect();

                  const adjustedRect = {
                    left: rect.left + iframeRect.left,
                    top: rect.top + iframeRect.top,
                    width: rect.width,
                    height: rect.height,
                    bottom: rect.bottom + iframeRect.top,
                    right: rect.right + iframeRect.left
                  };

                  onSelectionRef.current(text, paragraph, adjustedRect as DOMRect);
                }
              }, 400); // allow mobile native selection UI to draw first
            }, { passive: true });
          });

          rendition.on('selected', (cfiRange: string) => {
            book.getRange(cfiRange).then((range) => {
              if (!range) return;
              const text = range.toString().trim();
              if (!text || text === lastSelectedText) return;
              
              lastSelectedText = text;
              let paragraph = range.commonAncestorContainer.textContent || text;
              if (paragraph.length > 1500) {
                paragraph = paragraph.substring(0, 1500) + '...';
              }
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
            const contentsArray = rendition.getContents() as any;
            const selection = contentsArray[0]?.window?.getSelection();
            if (!selection || selection.toString().trim().length === 0) {
              lastSelectedText = '';
              if (onClearSelectionRef.current) onClearSelectionRef.current();
            }
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
