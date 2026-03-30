import React, { useCallback } from 'react';
import { UploadCloud } from 'lucide-react';

interface Props {
  onFileSelect: (file: File) => void;
}

export const BookUploader: React.FC<Props> = ({ onFileSelect }) => {
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
    </div>
  );
};
