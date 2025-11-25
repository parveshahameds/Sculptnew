import React, { useRef, useState, useEffect } from 'react';

interface VisionInputProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  inspirationFile: File | null;
  onInspirationFileChange: (file: File | null) => void;
}

export const VisionInput: React.FC<VisionInputProps> = ({
  description,
  onDescriptionChange,
  inspirationFile,
  onInspirationFileChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (inspirationFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(inspirationFile);
    } else {
      setImagePreview(null);
    }
  }, [inspirationFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onInspirationFileChange(file);
  };

  const handleClearImage = () => {
    onInspirationFileChange(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

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
        onInspirationFileChange(file);
    }
  };

  return (
    <div className="relative">
        <label htmlFor="description" className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Vision</label>
        <div 
            className={`relative w-full rounded-xl transition-all duration-300 border-2 ${isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200 bg-stone-50 hover:border-emerald-300'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {imagePreview && (
                <div className="p-3 border-b border-stone-200 bg-white rounded-t-xl">
                    <div className="relative w-full h-28 rounded-lg overflow-hidden group/img border border-stone-100">
                        <img src={imagePreview} alt="Inspiration preview" className="w-full h-full object-cover opacity-95" />
                        <div className="absolute inset-0 bg-black/20 hidden group-hover/img:flex items-center justify-center transition-all">
                             <button
                                onClick={handleClearImage}
                                className="text-white bg-red-500 p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-md"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <textarea
                id="description"
                rows={3}
                className="w-full bg-transparent p-4 border-0 text-stone-800 placeholder-stone-400 focus:ring-0 resize-none font-normal text-base"
                placeholder="Describe your masterpiece (e.g., 'A vintage art deco ring with sapphire center')..."
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
            />
            
            <div className="flex justify-between items-center px-4 py-2 border-t border-stone-200/60 bg-white/50 rounded-b-xl">
                 <span className={`text-[10px] uppercase tracking-widest font-bold ${isDragging ? 'text-emerald-600' : 'text-stone-400'}`}>
                    {isDragging ? 'Drop Image Here' : 'Drag Inspiration Image'}
                 </span>
                 <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-stone-400 hover:text-emerald-600 transition-colors p-1"
                    title="Upload Image"
                 >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                 </button>
            </div>
            
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept="image/*"
            />
        </div>
    </div>
  );
};