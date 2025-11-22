
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
    const [mode, setMode] = useState<'camera' | 'upload'>('camera');
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
        let isMounted = true;

        const loadModel = async () => {
            if (landmarkerRef.current) {
                setIsModelLoaded(true);
                return;
            }

            try {
                setIsModelLoaded(false);
                // Dynamically import MediaPipe Tasks Vision
                // @ts-ignore
                const vision = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/+esm");
                
                if (!isMounted) return;

                const { FaceLandmarker, FilesetResolver } = vision;
                const filesetResolver = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
                );

                if (!isMounted) return;

                landmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                        delegate: "CPU" // Use CPU for broader compatibility
                    },
                    outputFaceBlendshapes: false,
                    runningMode: "VIDEO",
                    numFaces: 1,
                    minFaceDetectionConfidence: 0.3, // Lower threshold for better detection
                    minFacePresenceConfidence: 0.3,
                    minTrackingConfidence: 0.3
                });
                
                console.log("AR Model loaded successfully");
                if (isMounted) setIsModelLoaded(true);
            } catch (err) {
                console.error("Failed to load tracking model", err);
                let errorMessage = "Failed to load AR engine.";
                if (err instanceof Error) errorMessage += ` ${err.message}`;
                if (isMounted) setError(errorMessage);
            }
        };
        
        loadModel();

        return () => {
            isMounted = false;
            stopCamera();
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    // --- 2. Image Processing (Remove Background) ---

    useEffect(() => {
        if (generatedJewelryImage) {
            processImageForAR(generatedJewelryImage);
        }
    }, [generatedJewelryImage]);

    const processImageForAR = (base64: string) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Simple White Background Removal
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                // If pixel is very light (white background), make it transparent
                if (r > 230 && g > 230 && b > 230) {
                    data[i + 3] = 0;
                }
            }
            ctx.putImageData(imageData, 0, 0);
            setArImageSrc(canvas.toDataURL('image/png'));
        };
        img.src = `data:image/png;base64,${base64}`;
    };

    // --- 3. Camera Control ---

    const startCamera = async () => {
        try {
            setError(null);
            
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Browser API not supported. Please use a modern browser with SSL.");
            }

            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } 
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Wait for metadata to ensure dimensions are known
                videoRef.current.onloadedmetadata = () => {
                    if (videoRef.current) {
                        videoRef.current.play().catch(e => console.error("Play failed", e));
                        
                        // Sync state and Ref
                        setIsCameraActive(true);
                        isCameraActiveRef.current = true;

                        // Give video a moment to actually have data before predicting
                        setTimeout(() => predictWebcam(), 100);
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
        // Sync state and Ref
        setIsCameraActive(false);
        isCameraActiveRef.current = false;
        
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
            requestRef.current = null;
        }
        physicsState.current.opacity = 0; // Reset visibility
    };

    // --- 4. The Physics Loop (Tracking) ---

    const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;

    const predictWebcam = () => {
        // Use Ref for checking active state to avoid closure stale state issues
        if (!isCameraActiveRef.current) return;

        // If camera stopped or ref missing, exit loop
        if (!videoRef.current) return;
        
        // If landmarker not ready yet, just loop until it is
        if (!landmarkerRef.current) {
             requestRef.current = requestAnimationFrame(predictWebcam);
             return;
        }

        const video = videoRef.current;

        // IMPORTANT: Ensure video has data before trying to detect
        if (video.readyState < 2) {
             requestRef.current = requestAnimationFrame(predictWebcam);
             return;
        }

        // Perform detection
        try {
            // Using performance.now() for consistent timing
            const startTimeMs = performance.now();
            const results = landmarkerRef.current.detectForVideo(video, startTimeMs);

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                const landmarks = results.faceLandmarks[0];
                
                // --- ANCHOR LOGIC ---
                const nose = landmarks[1];
                const chin = landmarks[152];
                const leftTemple = landmarks[234];
                const rightTemple = landmarks[454];

                // Face Geometry
                const faceWidth = Math.sqrt(Math.pow(rightTemple.x - leftTemple.x, 2) + Math.pow(rightTemple.y - leftTemple.y, 2));
                const faceAngle = Math.atan2(rightTemple.y - leftTemple.y, rightTemple.x - leftTemple.x) * (180 / Math.PI);

                let targetX, targetY, targetScale;

                const typeLower = jewelryType.toLowerCase();
                
                if (typeLower.includes('necklace') || typeLower.includes('haar') || typeLower.includes('mangalsutra') || typeLower.includes('choker')) {
                    // Necklace Logic
                    const vecX = chin.x - nose.x;
                    const vecY = chin.y - nose.y;
                    
                    const drop = typeLower.includes('choker') ? 0.5 : (typeLower.includes('long') ? 2.5 : 1.0);
                    
                    targetX = chin.x + (vecX * drop);
                    targetY = chin.y + (vecY * drop);
                    
                    targetScale = faceWidth * (typeLower.includes('choker') ? 1.4 : NECKLACE_SCALE_FACTOR);

                } else if (typeLower.includes('earring') || typeLower.includes('jhumka')) {
                    // Earring Logic
                    targetX = (leftTemple.x + rightTemple.x) / 2;
                    targetY = chin.y - (chin.y - nose.y) * 0.5; 
                    targetScale = faceWidth * 1.5;
                } else if (typeLower.includes('nath') || typeLower.includes('nose')) {
                    targetX = nose.x;
                    targetY = nose.y;
                    targetScale = faceWidth * 0.5;
                } else if (typeLower.includes('tikka') || typeLower.includes('matha')) {
                    targetX = (leftTemple.x + rightTemple.x) / 2;
                    targetY = leftTemple.y - (chin.y - nose.y);
                    targetScale = faceWidth * 0.8;
                } else {
                    targetX = chin.x;
                    targetY = chin.y + 0.2;
                    targetScale = faceWidth * 2.0;
                }

                // --- PHYSICS ENGINE (LERP) ---
                const ps = physicsState.current;
                ps.x = lerp(ps.x, targetX, SMOOTHING_FACTOR);
                ps.y = lerp(ps.y, targetY, SMOOTHING_FACTOR);
                ps.scale = lerp(ps.scale, targetScale, SMOOTHING_FACTOR);
                ps.rotation = lerp(ps.rotation, faceAngle, SMOOTHING_FACTOR);
                ps.opacity = lerp(ps.opacity, 1, 0.05);

            } else {
                physicsState.current.opacity = lerp(physicsState.current.opacity, 0, 0.1);
            }
        } catch (e) {
            console.warn("Tracking error frame dropped:", e);
            // Don't stop the loop, just skip this frame
        }
        
        drawAROverlay();

        // Continue loop if active
        if (isCameraActiveRef.current) {
            requestRef.current = requestAnimationFrame(predictWebcam);
        }
    };

    const drawAROverlay = () => {
        if (!canvasRef.current || !videoRef.current || !arImageSrc) return;
        
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const videoWidth = videoRef.current.videoWidth;
        const videoHeight = videoRef.current.videoHeight;

        // Ensure canvas matches video
        if (canvasRef.current.width !== videoWidth || canvasRef.current.height !== videoHeight) {
            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;
        }

        ctx.clearRect(0, 0, videoWidth, videoHeight);

        const ps = physicsState.current;
        if (ps.opacity < 0.01) return;

        const img = new Image();
        img.src = arImageSrc;
        
        if (img.complete) {
            ctx.save();
            ctx.globalAlpha = ps.opacity;
            
            // Mirror context to match mirrored video
            ctx.translate(videoWidth, 0);
            ctx.scale(-1, 1);
            
            const drawX = ps.x * videoWidth;
            const drawY = ps.y * videoHeight;
            
            const targetPixelWidth = ps.scale * videoWidth * 2.5;
            const scaleRatio = targetPixelWidth / img.width;

            ctx.translate(drawX, drawY);
            ctx.rotate(ps.rotation * (Math.PI / 180));
            ctx.scale(scaleRatio, scaleRatio);
            
            ctx.drawImage(img, -img.width / 2, -img.height / 2);
            
            ctx.restore();
        }
    };


    // --- 5. Instant Snapshot ---

    const handleInstantSnapshot = () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = videoRef.current.videoWidth;
        outputCanvas.height = videoRef.current.videoHeight;
        const ctx = outputCanvas.getContext('2d');
        if (!ctx) return;

        // 1. Draw Video (Mirrored)
        ctx.save();
        ctx.translate(outputCanvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0);
        ctx.restore();

        // 2. Draw AR Overlay
        ctx.drawImage(canvasRef.current, 0, 0);

        const resultData = outputCanvas.toDataURL('image/png').split(',')[1];
        setTryOnResult(resultData);
        stopCamera();
    };


    // --- 6. Other Modes ---

    const handleUploadMode = () => {
        setMode('upload');
        stopCamera();
        setTryOnResult(null);
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
        <div className="h-full flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100">
             <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-white z-10">
                <h3 className="font-serif text-xl font-bold text-emerald-900">Virtual Studio</h3>
                <div className="flex bg-stone-100 p-1 rounded-lg">
                    <button onClick={() => { setMode('camera'); setTryOnResult(null); }} className={`px-3 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${mode === 'camera' ? 'bg-white text-emerald-900 shadow-sm' : 'text-stone-400'}`}>Live AR</button>
                    <button onClick={handleUploadMode} className={`px-3 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${mode === 'upload' ? 'bg-white text-emerald-900 shadow-sm' : 'text-stone-400'}`}>Upload Photo</button>
                </div>
            </div>

            <div className="flex-1 relative bg-stone-50 overflow-hidden">
                {isLoading && (
                    <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-emerald-900">
                        <Loader />
                        <p className="mt-4 text-xs font-bold uppercase tracking-widest animate-pulse">Processing...</p>
                    </div>
                )}

                {error && (
                     <div className="absolute inset-0 z-40 flex items-center justify-center bg-stone-50 p-8 text-center">
                        <div>
                            <p className="text-red-500 font-bold mb-2">System Error</p>
                            <p className="text-stone-500 text-sm mb-4">{error}</p>
                            <button 
                                onClick={() => { setError(null); setMode('camera'); window.location.reload(); }} 
                                className="bg-stone-200 hover:bg-stone-300 text-stone-700 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors"
                            >
                                Reload App
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
                ) : (
                    mode === 'camera' ? (
                        <div className="w-full h-full relative bg-black flex items-center justify-center overflow-hidden">
                            {/* Start Screen - z-index 10 to sit above video */}
                            {!isCameraActive && (
                                <div className="text-center relative z-10 p-6">
                                    <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-500">
                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.818v6.364a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <button 
                                        onClick={startCamera} 
                                        disabled={!isModelLoaded}
                                        className="bg-emerald-900 disabled:bg-stone-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-emerald-800 transition-all disabled:opacity-70 disabled:cursor-wait"
                                    >
                                        {isModelLoaded ? 'Activate Camera' : 'Loading AR Engine...'}
                                    </button>
                                    <p className="text-stone-500 text-xs mt-4 max-w-xs mx-auto">
                                        {isModelLoaded ? 'Uses AI to map jewelry to your face in real-time.' : 'Initializing computer vision models...'}
                                    </p>
                                </div>
                            )}
                            
                            {/* Video Layer - z-index 0, pointer-events-none to prevent blocking clicks when opacity 0 */}
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                muted 
                                className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 transition-opacity duration-500 z-0 ${isCameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                            />
                            
                            {/* AR Canvas Layer */}
                            <canvas 
                                ref={canvasRef}
                                className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
                            />

                            {/* Camera UI Overlay */}
                            {isCameraActive && (
                                <>
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/30 backdrop-blur px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2 z-20">
                                        <div className={`w-2 h-2 rounded-full ${physicsState.current.opacity > 0.5 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-yellow-500'}`}></div>
                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                                            {physicsState.current.opacity > 0.5 ? 'Tracking Active' : 'Locating Face...'}
                                        </span>
                                    </div>

                                    <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20">
                                        <button 
                                            onClick={handleInstantSnapshot}
                                            className="group relative w-16 h-16 flex items-center justify-center"
                                            aria-label="Take Snapshot"
                                        >
                                            <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse group-hover:animate-none"></div>
                                            <div className="w-14 h-14 rounded-full border-4 border-white bg-transparent group-hover:bg-white/20 transition-all duration-200"></div>
                                            <div className="absolute w-10 h-10 bg-white rounded-full group-hover:scale-90 transition-transform duration-200"></div>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
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
                    )
                )}
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
