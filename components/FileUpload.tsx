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
      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">{label}</label>
      
      {!fileName ? (
          <div 
            className={`relative flex flex-col items-center justify-center px-4 py-6 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer group ${isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200 hover:border-emerald-400 hover:bg-stone-50'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById(id)?.click()}
          >
            <svg className={`h-6 w-6 mb-2 transition-colors ${isDragging ? 'text-emerald-600' : 'text-stone-400 group-hover:text-emerald-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div className="text-center">
                <span className={`text-xs font-medium ${isDragging ? 'text-emerald-700' : 'text-stone-500'}`}>Click or Drag to Upload</span>
            </div>
            <input id={id} name={id} type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
          </div>
      ) : (
        <div className="flex items-center justify-between bg-white border border-stone-200 rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-emerald-100 p-1.5 rounded">
                <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
            <span className="text-xs font-medium truncate text-stone-700">{fileName}</span>
          </div>
          <button onClick={handleClear} className="text-stone-400 hover:text-red-500 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};