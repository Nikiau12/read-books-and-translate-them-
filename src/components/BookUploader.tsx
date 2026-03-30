import React, { useCallback, useState } from 'react';
import { UploadCloud, BookOpen } from 'lucide-react';
import libraryData from '../library.json';

interface Props {
  onFileSelect: (file: File) => void;
}

export const BookUploader: React.FC<Props> = ({ onFileSelect }) => {
  const [loadingBook, setLoadingBook] = useState<string | null>(null);

  const loadPreloadedBook = async (book: any) => {
    setLoadingBook(book.filename);
    try {
      const urlPath = book.url.startsWith('/') ? book.url.substring(1) : book.url;
      const res = await fetch(`${import.meta.env.BASE_URL}${urlPath}`);
      if (!res.ok) throw new Error('Failed to fetch book');
      const blob = await res.blob();
      const file = new File([blob], book.filename, { type: 'application/epub+zip' });
      onFileSelect(file);
    } catch (err) {
      console.error('Failed to load book', err);
      alert('Failed to load book from library.');
    } finally {
      setLoadingBook(null);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith('.epub')) {
        onFileSelect(file);
      } else {
        alert('Please drop an .epub file');
      }
    },
    [onFileSelect]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.epub')) {
        onFileSelect(file);
      } else {
        alert('Please select an .epub file');
      }
    }
  };

  return (
    <div 
      className="uploader-container"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="glass-panel uploader-content">
        <UploadCloud size={64} className="upload-icon" />
        <h2 className="title">Drop your English Book here</h2>
        <p className="subtitle">Supported format: .epub (electronic format)</p>
        <div className="upload-actions">
           <input 
             type="file" 
             accept=".epub"
             onChange={handleChange}
             id="file-upload"
             className="file-input-hidden"
           />
           <label htmlFor="file-upload" className="primary-btn">
             Browse Computer
           </label>
        </div>
      </div>

      {libraryData && libraryData.length > 0 && (
        <div style={{ marginTop: '2rem', width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ marginBottom: '1.5rem', textAlign: 'center', fontWeight: '500', color: 'var(--text)' }}>📚 Выберите книгу из библиотеки</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem', width: '100%' }}>
            {libraryData.map((book: any) => (
              <div 
                key={book.filename}
                className="glass-panel"
                style={{
                  padding: book.cover ? '0' : '1.5rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                  border: loadingBook === book.filename ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.1)'
                }}
                onClick={() => loadPreloadedBook(book)}
              >
                {book.cover ? (
                  <img 
                    src={`${import.meta.env.BASE_URL}${book.cover.substring(1)}`} 
                    alt={book.title} 
                    style={{ width: '100%', height: '260px', objectFit: 'cover', opacity: loadingBook === book.filename ? 0.5 : 1 }} 
                  />
                ) : (
                  <BookOpen size={48} style={{ marginBottom: '1rem', color: 'var(--accent)', opacity: 0.8 }} />
                )}
                
                <div style={{ padding: '1rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', background: book.cover ? 'rgba(0,0,0,0.6)' : 'transparent', position: book.cover ? 'absolute' : 'relative', bottom: 0 }}>
                  <span style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 500, color: '#fff', textShadow: book.cover ? '0 1px 3px rgba(0,0,0,0.8)' : 'none' }}>{book.title}</span>
                  {loadingBook === book.filename && <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#ccc' }}>Загрузка...</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
