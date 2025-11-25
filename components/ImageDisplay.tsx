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
    <div className="flex flex-col items-center justify-center h-full text-center p-8" style={{ background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F1E8 100%)' }}>
        <div className="relative w-32 h-32 mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/20 to-[#B8941F]/10 blur-3xl rounded-full animate-pulse"></div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="relative w-full h-full" style={{ color: 'rgba(184, 148, 31, 0.2)' }}>
                 <path d="M12 2L2 8.5V15.5L12 22L22 15.5V8.5L12 2ZM12 4.47L19.53 9.5L12 14.53L4.47 9.5L12 4.47ZM3.5 9.99L12 15.99L20.5 9.99V14.51L12 19.51L3.5 14.51V9.99Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
        <h3 className="text-[32px] font-serif mb-3" style={{ color: '#8B8680', fontWeight: 400, letterSpacing: '0.02em' }}>
            Awaiting Inspiration
        </h3>
        <p className="max-w-sm text-[14px] mx-auto leading-relaxed" style={{ color: '#8B8680', fontWeight: 400 }}>
            Configure your design specifications to begin crafting your bespoke piece
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
    <div className="w-full h-full min-h-[500px] relative overflow-hidden group cursor-default" onWheel={handleWheel} style={{ background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F1E8 100%)' }}>
          {(isLoading || isRefining) && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-md" style={{ background: 'rgba(253, 251, 247, 0.95)' }}>
              <Loader />
              <p className="mt-4 text-[13px] font-medium tracking-[0.15em] uppercase animate-pulse" style={{ color: '#B8941F' }}>
                {isRefining ? 'Refining Design...' : 'Crafting Masterpiece...'}
              </p>
            </div>
          )}
          {error && !isLoading && !isRefining && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="p-4 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)' }}>
                <svg className="h-8 w-8" style={{ color: '#DC2626' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="font-serif text-[22px] mb-2.5" style={{ color: '#991B1B', fontWeight: 500 }}>Unable to Generate Design</h3>
              <p className="text-[14px] max-w-md" style={{ color: '#DC2626', fontWeight: 400 }}>{error}</p>
            </div>
          )}
          {!isLoading && !isRefining && !error && generatedImage && (
            <>
              <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F1E8 100%)' }}>
                  <img
                    ref={imageRef}
                    src={`data:image/png;base64,${generatedImage}`}
                    alt={`Generated Jewelry`}
                    className="object-contain max-h-full max-w-full transition-transform duration-100"
                    style={{
                      transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                      cursor: transform.scale > 1 ? 'grab' : 'zoom-in',
                      filter: 'drop-shadow(0 8px 32px rgba(44, 44, 44, 0.15)) drop-shadow(0 2px 8px rgba(184, 148, 31, 0.1))'
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={stopPanning}
                    onMouseMove={handleMouseMove}
                    draggable="false"
                  />
              </div>

              {/* Overlay Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300">
                   <p className="text-[11px] font-medium uppercase tracking-[0.15em] bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full shadow-lg border" style={{ color: '#2C2C2C', borderColor: 'rgba(184, 148, 31, 0.2)' }}>
                        Scroll to Zoom • Click to Expand
                   </p>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm p-3 rounded-xl transition-all shadow-lg opacity-0 group-hover:opacity-100 focus:opacity-100 border hover:border-[#D4AF37]/40"
                style={{ color: '#8B8680', borderColor: 'rgba(44, 44, 44, 0.1)' }}
                title="Full Screen"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 hover:text-[#B8941F] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
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