import React, { useState, useCallback } from 'react';

interface FileUploadProps {
  id: string;
  label: string;
  onFileChange: (file: File | null) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ id, label, onFileChange }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    updateFile(file);
  }, [onFileChange]);

  const updateFile = (file: File | null) => {
    if (file) {
        setFileName(file.name);
        onFileChange(file);
      } else {
        setFileName(null);
        onFileChange(null);
      }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        updateFile(file);
    }
  };

  const handleClear = () => {
    updateFile(null);
    const input = document.getElementById(id) as HTMLInputElement;
    if(input) input.value = '';
  }

  return (
    <div>
      <label className="block text-[11px] font-medium uppercase tracking-[0.15em] mb-2.5" style={{ color: '#8B8680' }}>{label}</label>
      
      {!fileName ? (
          <div 
            className="relative flex flex-col items-center justify-center px-4 py-7 border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer group"
            style={{
              borderColor: isDragging ? '#D4AF37' : 'rgba(44, 44, 44, 0.1)',
              background: isDragging ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(184, 148, 31, 0.08) 100%)' : 'white'
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById(id)?.click()}
          >
            <svg 
              className="h-7 w-7 mb-2.5 transition-all duration-300" 
              style={{ color: isDragging ? '#B8941F' : '#8B8680' }}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth="1.5"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div className="text-center">
                <span className="text-[13px] font-medium" style={{ color: isDragging ? '#B8941F' : '#4A4A4A' }}>Click or Drag to Upload</span>
                <p className="text-[11px] mt-1" style={{ color: '#8B8680' }}>PNG, JPG up to 10MB</p>
            </div>
            <input id={id} name={id} type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
          </div>
      ) : (
        <div className="flex items-center justify-between bg-white border rounded-lg p-3.5 shadow-sm" style={{ borderColor: 'rgba(44, 44, 44, 0.08)' }}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#F5F1E8] to-[#E5E4E2] border" style={{ borderColor: 'rgba(184, 148, 31, 0.15)' }}>
                <svg className="h-[18px] w-[18px]" style={{ color: '#B8941F' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
            <span className="text-[13px] font-medium truncate" style={{ color: '#2C2C2C' }}>{fileName}</span>
          </div>
          <button onClick={handleClear} className="p-1.5 rounded-lg hover:bg-[#FEF2F2] transition-all" style={{ color: '#8B8680' }} title="Remove file">
            <svg className="h-4 w-4 hover:text-[#DC2626] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};