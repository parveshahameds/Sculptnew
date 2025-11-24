import React, { useState, useRef, MouseEvent, WheelEvent } from 'react';
import { Loader } from './Loader';
import { FullScreenImageModal } from './FullScreenImageModal';

interface ImageDisplayProps {
  generatedImage: string | null;
  isLoading: boolean;
  isRefining?: boolean;
  error: string | null;
}

const Placeholder = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-stone-50/50">
        <div className="relative w-32 h-32 mb-6">
            <div className="absolute inset-0 bg-emerald-100 blur-3xl rounded-full opacity-50 animate-pulse"></div>
            <svg viewBox="0 0 24 24" fill="currentColor" className="relative w-full h-full text-stone-200">
                 <path d="M12 2L2 8.5V15.5L12 22L22 15.5V8.5L12 2ZM12 4.47L19.53 9.5L12 14.53L4.47 9.5L12 4.47ZM3.5 9.99L12 15.99L20.5 9.99V14.51L12 19.51L3.5 14.51V9.99Z" />
            </svg>
        </div>
        <h3 className="text-3xl font-serif text-stone-400 mb-3">Awaiting Inspiration</h3>
        <p className="max-w-xs text-stone-500 text-sm mx-auto font-medium">
            Configure your vision on the left to begin the rendering process.
        </p>
    </div>
)

export const ImageDisplay: React.FC<ImageDisplayProps> = ({
  generatedImage,
  isLoading,
  isRefining = false,
  error
}) => {
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const isPanning = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (!generatedImage) return;
    e.preventDefault();
    const scaleDelta = e.deltaY * -0.001;
    setTransform(prev => {
        const newScale = Math.min(Math.max(1, prev.scale + scaleDelta), 5);
        if (newScale === 1) return { scale: 1, x: 0, y: 0 };
        return { ...prev, scale: newScale };
    });
  };

  const handleMouseDown = (e: MouseEvent<HTMLImageElement>) => {
    e.preventDefault();
    isPanning.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    if(imageRef.current) imageRef.current.style.cursor = 'grabbing';
  };
  
  const stopPanning = () => {
    isPanning.current = false;
    if(imageRef.current) imageRef.current.style.cursor = transform.scale > 1 ? 'grab' : 'zoom-in';
  };

  const handleMouseUp = (e: MouseEvent<HTMLImageElement>) => {
    stopPanning();
    
    const deltaX = Math.abs(e.clientX - dragStartPos.current.x);
    const deltaY = Math.abs(e.clientY - dragStartPos.current.y);
    
    if (deltaX < 5 && deltaY < 5) {
        setIsModalOpen(true);
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLImageElement>) => {
    if (!isPanning.current || transform.scale === 1) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    setTransform(prev => {
        const newX = prev.x + dx;
        const newY = prev.y + dy;
        return { ...prev, x: newX, y: newY };
    });
  };

  return (
    <div className="w-full h-full min-h-[600px] relative overflow-hidden group cursor-default bg-white" onWheel={handleWheel}>
          {(isLoading || isRefining) && (
            <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
              <Loader />
              <p className="text-emerald-700 mt-6 font-bold text-sm tracking-widest uppercase animate-pulse">
                {isRefining ? 'Refining Design...' : 'Rendering High Fidelity...'}
              </p>
            </div>
          )}
          {error && !isLoading && !isRefining && (
            <div className="flex flex-col items-center justify-center h-full text-center text-red-500 p-8">
              <div className="bg-red-50 p-4 rounded-full mb-4">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Generation Failed</h3>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          {!isLoading && !isRefining && !error && generatedImage && (
            <>
              <div className="w-full h-full flex items-center justify-center bg-white">
                  <img
                    ref={imageRef}
                    src={`data:image/png;base64,${generatedImage}`}
                    alt={`Generated Jewelry`}
                    className="object-contain max-h-full max-w-full transition-transform duration-100 drop-shadow-2xl"
                    style={{
                      transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                      cursor: transform.scale > 1 ? 'grab' : 'zoom-in',
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={stopPanning}
                    onMouseMove={handleMouseMove}
                    draggable="false"
                  />
              </div>

              {/* Overlay Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                   <p className="text-emerald-900 text-xs font-bold uppercase tracking-wider bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm border border-white/20">
                        Scroll to Zoom • Click to Expand
                   </p>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="absolute top-6 right-6 bg-white text-stone-600 hover:text-emerald-600 p-2.5 rounded-xl transition-all shadow-md opacity-0 group-hover:opacity-100 focus:opacity-100 border border-stone-100"
                title="Full Screen"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </>
          )}
          {!isLoading && !isRefining && !error && !generatedImage && <Placeholder />}

      {generatedImage && (
        <FullScreenImageModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            imageSrc={`data:image/png;base64,${generatedImage}`}
            altText="Generated Jewelry Design"
        />
      )}
    </div>
  );
};