
import React, { useState, useRef, useEffect } from 'react';
import { FileUpload } from './FileUpload';
import { generateTryOnImage } from '../services/geminiService';
import { Loader } from './Loader';
import { FullScreenImageModal } from './FullScreenImageModal';

interface VirtualTryOnProps {
    generatedJewelryImage: string;
    jewelryType: string;
}

// Physics Constants
const SMOOTHING_FACTOR = 0.15; // Lower = smoother/slower, Higher = more responsive
const NECKLACE_SCALE_FACTOR = 1.8; // Width relative to face

export const VirtualTryOn: React.FC<VirtualTryOnProps> = ({ generatedJewelryImage, jewelryType }) => {
    // UI State
    const [mode, setMode] = useState<'camera' | 'upload'>('upload');
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Result State
    const [tryOnResult, setTryOnResult] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Image Processing State
    const [arImageSrc, setArImageSrc] = useState<string | null>(null);
    const [personFile, setPersonFile] = useState<File | null>(null);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

    // Refs for Tracking Loop
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null); // For drawing results
    const requestRef = useRef<any>(null);
    const landmarkerRef = useRef<any>(null);
    
    // We use a Ref for active state to avoid closure staleness in the recursive animation loop
    const isCameraActiveRef = useRef(false);
    
    // Physics State (Current interpolated values)
    const physicsState = useRef({
        x: 0.5, // 0 to 1 (screen coordinates)
        y: 0.5,
        scale: 1,
        rotation: 0,
        opacity: 0 // Fade in when tracking starts
    });

    // --- 1. Initialization & Cleanup ---

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    // --- 2. Camera Capture for Upload ---

    // --- 3. Camera Control ---

    const startCamera = async () => {
        try {
            setError(null);
            setCapturedPhoto(null);
            
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Camera not supported. Please use a modern browser.");
            }

            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } 
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    if (videoRef.current) {
                        videoRef.current.play().catch(e => console.error("Play failed", e));
                        setIsCameraActive(true);
                    }
                };
            }
        } catch (err) {
            console.error(err);
            setError("Camera access denied. Please check permissions.");
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    };

    // --- 4. Camera Capture ---

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const video = videoRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw mirrored video frame
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0);
        ctx.restore();

        // Store the captured photo
        const photoData = canvas.toDataURL('image/jpeg', 0.95);
        setCapturedPhoto(photoData);
        stopCamera();
    };

    const retakePhoto = () => {
        setCapturedPhoto(null);
        startCamera();
    };

    const useCapturedPhoto = async () => {
        if (!capturedPhoto || !generatedJewelryImage) return;
        
        setIsLoading(true);
        try {
            const base64 = capturedPhoto.split(',')[1];
            const result = await generateTryOnImage(base64, 'image/jpeg', generatedJewelryImage, jewelryType);
            setTryOnResult(result);
            setCapturedPhoto(null);
        } catch (e) {
            setError("Processing failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };


    // --- 5. Mode Switching ---

    const handleCameraMode = () => {
        setMode('camera');
        setTryOnResult(null);
        setCapturedPhoto(null);
        setError(null);
    };

    const handleUploadMode = () => {
        setMode('upload');
        stopCamera();
        setTryOnResult(null);
        setCapturedPhoto(null);
        setError(null);
    };

    const handleUploadFit = async () => {
        if (!personFile || !generatedJewelryImage) return;
        setIsLoading(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(personFile);
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];
                 const result = await generateTryOnImage(base64, personFile.type, generatedJewelryImage, jewelryType);
                 setTryOnResult(result);
            }
        } catch (e) { setError("Upload failed"); } 
        finally { setIsLoading(false); }
    };

    return (
        <div className="h-full flex flex-col bg-white rounded-xl lg:rounded-2xl overflow-hidden shadow-sm border" style={{ borderColor: 'rgba(44, 44, 44, 0.08)' }}>
             <div className="p-4 lg:p-5 border-b flex justify-between items-center bg-white z-10" style={{ borderColor: 'rgba(44, 44, 44, 0.06)' }}>
                <h3 className="font-serif text-[18px] lg:text-[20px]" style={{ color: '#2C2C2C', fontWeight: 500, letterSpacing: '0.01em' }}>Virtual Studio</h3>
                <div className="flex bg-gradient-to-br from-[#F5F1E8] to-[#E5E4E2] p-1 rounded-lg border" style={{ borderColor: 'rgba(184, 148, 31, 0.15)' }}>
                    <button 
                        onClick={handleUploadMode} 
                        className={`px-3 lg:px-4 py-1.5 lg:py-2 text-[11px] lg:text-[12px] font-medium uppercase tracking-wide rounded-md transition-all ${mode === 'upload' ? 'bg-white shadow-sm' : ''}`}
                        style={{ color: mode === 'upload' ? '#2C2C2C' : '#8B8680' }}
                    >
                        Upload
                    </button>
                    <button 
                        onClick={handleCameraMode} 
                        className={`px-3 lg:px-4 py-1.5 lg:py-2 text-[11px] lg:text-[12px] font-medium uppercase tracking-wide rounded-md transition-all ${mode === 'camera' ? 'bg-white shadow-sm' : ''}`}
                        style={{ color: mode === 'camera' ? '#2C2C2C' : '#8B8680' }}
                    >
                        Camera
                    </button>
                </div>
            </div>

            <div className="flex-1 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F1E8 100%)' }}>
                {isLoading && (
                    <div className="absolute inset-0 z-50 backdrop-blur-md flex flex-col items-center justify-center" style={{ background: 'rgba(253, 251, 247, 0.95)' }}>
                        <Loader />
                        <p className="mt-4 text-[12px] font-medium uppercase tracking-[0.15em] animate-pulse" style={{ color: '#B8941F' }}>Processing...</p>
                    </div>
                )}

                {error && (
                     <div className="absolute inset-0 z-40 flex items-center justify-center p-8 text-center">
                        <div>
                            <div className="p-4 rounded-2xl mb-5 mx-auto w-fit" style={{ background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)' }}>
                                <svg className="h-9 w-9 mx-auto" style={{ color: '#DC2626' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <p className="font-serif text-[20px] mb-2" style={{ color: '#991B1B', fontWeight: 500 }}>Access Error</p>
                            <p className="text-[14px] mb-5 max-w-sm mx-auto" style={{ color: '#DC2626' }}>{error}</p>
                            <button
                                onClick={() => { setError(null); if (mode === 'camera') handleCameraMode(); }}
                                className="bg-gradient-to-r from-[#B8941F] to-[#D4AF37] hover:from-[#9A7D19] hover:to-[#B8941F] text-white px-5 py-2.5 rounded-lg text-[13px] font-medium uppercase tracking-wide transition-all shadow-sm"
                            >
                                Try Again
                            </button>
                        </div>
                     </div>
                )}

                {tryOnResult ? (
                    <div className="w-full h-full relative animate-in fade-in">
                        <img src={`data:image/png;base64,${tryOnResult}`} className="w-full h-full object-contain bg-black" alt="Result" />

                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col items-center gap-3">
                            <div className="flex gap-3">
                                <button onClick={() => { setTryOnResult(null); if(mode === 'camera') startCamera(); }} className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-xl text-xs font-bold uppercase border border-white/20 transition-all">
                                    Retake
                                </button>
                                <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-900/20 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download
                                </button>
                            </div>
                        </div>
                    </div>
                ) : mode === 'camera' ? (
                    <div className="w-full h-full relative flex items-center justify-center overflow-hidden" style={{ background: '#000' }}>
                        {/* Captured Photo Preview */}
                        {capturedPhoto && !tryOnResult && (
                            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6" style={{ background: '#000' }}>
                                <img src={capturedPhoto} alt="Captured" className="max-w-full max-h-[70%] object-contain rounded-xl shadow-2xl" />
                                
                                <div className="mt-6 flex gap-3">
                                    <button
                                        onClick={retakePhoto}
                                        className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-lg text-[13px] font-medium border transition-all"
                                        style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
                                    >
                                        Retake Photo
                                    </button>
                                    <button
                                        onClick={useCapturedPhoto}
                                        disabled={!generatedJewelryImage}
                                        className="px-5 py-2.5 bg-gradient-to-r from-[#B8941F] to-[#D4AF37] hover:from-[#9A7D19] hover:to-[#B8941F] text-white rounded-lg text-[13px] font-medium shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Use This Photo
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Start Screen */}
                        {!isCameraActive && !capturedPhoto && (
                            <div className="text-center relative z-10 p-6">
                                <div className="w-20 h-20 bg-gradient-to-br from-[#F5F1E8] to-[#E5E4E2] rounded-2xl flex items-center justify-center mx-auto mb-5 border" style={{ borderColor: 'rgba(184, 148, 31, 0.2)' }}>
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" style={{ color: '#B8941F' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <button
                                    onClick={startCamera}
                                    className="bg-gradient-to-r from-[#B8941F] to-[#D4AF37] hover:from-[#9A7D19] hover:to-[#B8941F] text-white px-6 py-3 rounded-lg font-medium text-[14px] shadow-lg transition-all tracking-wide"
                                >
                                    Start Camera
                                </button>
                                <p className="text-[13px] mt-4 max-w-xs mx-auto" style={{ color: '#8B8680' }}>
                                    Capture a portrait photo to try on your jewelry design
                                </p>
                            </div>
                        )}

                        {/* Video Layer */}
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 transition-opacity duration-500 z-0 ${isCameraActive && !capturedPhoto ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        />

                        {/* Canvas for capture */}
                        <canvas
                            ref={canvasRef}
                            className="hidden"
                        />

                        {/* Camera Controls */}
                        {isCameraActive && !capturedPhoto && (
                            <>
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border flex items-center gap-2 z-20" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                    <span className="text-[11px] font-medium text-white uppercase tracking-wider">
                                        Camera Active
                                    </span>
                                </div>

                                <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20">
                                    <button
                                        onClick={capturePhoto}
                                        className="group relative w-16 h-16 flex items-center justify-center"
                                        aria-label="Capture Photo"
                                    >
                                        <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse group-hover:animate-none"></div>
                                        <div className="w-14 h-14 rounded-full border-4 border-white bg-transparent group-hover:bg-white/20 transition-all duration-200"></div>
                                        <div className="absolute w-10 h-10 bg-white rounded-full group-hover:scale-90 transition-transform duration-200"></div>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ) : mode === 'upload' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-stone-50">
                         <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-sm border border-stone-100 text-center">
                            <FileUpload id="tryon-upload" label="Upload Portrait" onFileChange={setPersonFile} />
                            {personFile ? (
                                <button onClick={handleUploadFit} className="w-full mt-4 bg-emerald-900 text-white py-3 rounded-xl text-xs font-bold uppercase hover:bg-emerald-800 transition-colors shadow-lg">
                                    Generate Fitting
                                </button>
                            ) : (
                                <p className="text-xs text-stone-400 mt-4">Upload a clear portrait photo for best results.</p>
                            )}
                         </div>
                    </div>
                ) : null}
            </div>

            {tryOnResult && (
                <FullScreenImageModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    imageSrc={`data:image/png;base64,${tryOnResult}`} 
                />
            )}
        </div>
    );
};
