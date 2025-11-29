
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { OptionSelector } from './components/OptionSelector';
import { ImageDisplay } from './components/ImageDisplay';
import { RefinementPanel } from './components/RefinementPanel';
import { generateJewelryImage, analyzeJewelryImage } from './services/geminiService';
import { refineJewelryImage } from './services/imageEditService';
import { JEWELRY_TYPES, MATERIALS, GEMSTONES, ENGRAVING_STYLES } from './constants';
import { VisionInput } from './components/VisionInput';
import { FileUpload } from './components/FileUpload';
import { ManufacturingDetails } from './components/ManufacturingDetails';
import { VirtualTryOn } from './components/VirtualTryOn';
import { GalleryModal, type GalleryItem } from './components/GalleryModal';
import type { JewelrySpec } from './components/ManufacturingDetails';
import { useAuth } from './contexts/AuthContext';
import LoginModal from './components/LoginModal';
import { ScrollPanel } from './components/ScrollPanel';
import { withCreditCheck, InsufficientCreditsError } from './services/creditGuard';

interface RefinementHistory {
  prompt: string;
  timestamp: Date;
}


const App: React.FC = () => {
  const { user, loading, refreshCredits } = useAuth();
  const [description, setDescription] = useState<string>('');
  const [jewelryType, setJewelryType] = useState<string>(JEWELRY_TYPES[0]);
  const [material, setMaterial] = useState<string>(MATERIALS[0]);
  const [gemstone, setGemstone] = useState<string>(GEMSTONES[0]);
  const [inspirationFile, setInspirationFile] = useState<File | null>(null);
  const [engravingFile, setEngravingFile] = useState<File | null>(null);
  const [engravingStyle, setEngravingStyle] = useState<string>(ENGRAVING_STYLES[0]);

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [currentDesignId, setCurrentDesignId] = useState<string | null>(null);
  const [specs, setSpecs] = useState<JewelrySpec | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [refinementHistory, setRefinementHistory] = useState<RefinementHistory[]>([]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setOriginalImage(null);
    setCurrentDesignId(null);
    setSpecs(null);
    setRefinementHistory([]);

    try {
        // 2 credits: 1 for generation + 1 for analysis
        await withCreditCheck(2, 'generate', async () => {
            const prompt = `Design a ${jewelryType} made of ${material} with ${gemstone} gemstones.
            Style: High jewelry, photorealistic, 8k resolution, white background, soft studio lighting.
            Description: ${description}.
            ${engravingFile ? `Feature this engraving pattern/image subtly on the metal surface: ${engravingStyle}.` : ''}`;

            const imageInputs = [];
            if (inspirationFile) {
                 const base64 = await fileToBase64(inspirationFile);
                 imageInputs.push({ base64, mimeType: inspirationFile.type });
            }
            if (engravingFile) {
                 const base64 = await fileToBase64(engravingFile);
                 imageInputs.push({ base64, mimeType: engravingFile.type });
            }

            const imageBase64 = await generateJewelryImage(prompt, imageInputs, {
                jewelryType,
                material,
                gemstone,
                engravingStyle: engravingFile ? engravingStyle : undefined
            });
            setGeneratedImage(imageBase64);
            setOriginalImage(imageBase64);

            const analysis = await analyzeJewelryImage(imageBase64, true);
            setSpecs(analysis);

            // Capture the design ID if saved
            if ('designId' in analysis && analysis.designId) {
                setCurrentDesignId(analysis.designId);
            }
        });

        await refreshCredits();

    } catch (e) {
        if (e instanceof InsufficientCreditsError) {
            setError("Insufficient credits. You need 2 credits to generate a design.");
        } else if (e instanceof Error) {
            setError(e.message);
        } else {
            setError("An unexpected error occurred");
        }
    } finally {
        setIsLoading(false);
    }
  };

  const handleRefine = async (refinementPrompt: string) => {
    if (!generatedImage) return;

    setIsRefining(true);
    setError(null);

    try {
        // 2 credits: 1 for refinement + 1 for automatic analysis
        await withCreditCheck(2, 'refine', async () => {
            const contextPrompt = `${jewelryType} made of ${material} with ${gemstone} gemstones. ${description}`;

            const result = await refineJewelryImage({
                originalImageBase64: generatedImage,
                refinementPrompt,
                contextPrompt,
                designId: currentDesignId || undefined
            });

            setGeneratedImage(result.refinedImageBase64);
            setRefinementHistory(prev => [...prev, {
                prompt: refinementPrompt,
                timestamp: new Date()
            }]);

            // Use updated specs from refinement if available
            if (result.updatedSpecs) {
                setSpecs(result.updatedSpecs);
            }
        });

        await refreshCredits();

    } catch (e) {
        if (e instanceof InsufficientCreditsError) {
            setError("Insufficient credits. Refinement requires 2 credits.");
        } else if (e instanceof Error) {
            setError(e.message);
        } else {
            setError("Refinement failed. Please try again.");
        }
    } finally {
        setIsRefining(false);
    }
  };

  const handleResetToOriginal = () => {
    if (originalImage) {
        setGeneratedImage(originalImage);
        setRefinementHistory([]);
    }
  };

  const handleGallerySelect = async (item: GalleryItem) => {
      setIsGalleryOpen(false);
      setIsLoading(true);
      setError(null);
      setGeneratedImage(null);
      setOriginalImage(null);
      setSpecs(null);
      setRefinementHistory([]);

      // Pre-fill data
      setDescription(item.description);
      // Attempt to fuzzy match type
      const foundType = JEWELRY_TYPES.find(t => item.type.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(item.type.toLowerCase()));
      if (foundType) setJewelryType(foundType);

      try {
          // 1. Fetch the image
          // Using fetch to get the image blob, assuming CORS is handled by the source (Unsplash allows it)
          const response = await fetch(item.imageUrl);
          if (!response.ok) throw new Error('Failed to fetch gallery image');
          const blob = await response.blob();

          // 2. Convert to Base64 for consistency with Generate flow
          const reader = new FileReader();
          reader.onloadend = async () => {
              const base64Data = reader.result as string;
              // data:image/jpeg;base64,....
              const base64String = base64Data.split(',')[1];
              setGeneratedImage(base64String);
              setOriginalImage(base64String);

              // 3. Analyze the existing image (costs 1 credit)
              try {
                  await withCreditCheck(1, 'analyze', async () => {
                      const analysis = await analyzeJewelryImage(base64String);
                      setSpecs(analysis);
                  });
                  await refreshCredits();
              } catch (analysisErr) {
                  if (analysisErr instanceof InsufficientCreditsError) {
                      setError("Insufficient credits to analyze this design.");
                  } else {
                      console.error("Analysis failed", analysisErr);
                      // Continue showing image even if analysis fails
                  }
              }
              setIsLoading(false);
          };
          reader.readAsDataURL(blob);

      } catch (err) {
          console.error(err);
          setError("Could not load the selected gallery design. The image source might be restricted.");
          setIsLoading(false);
      }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F1E8 100%)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 mx-auto mb-5" style={{ border: '3px solid transparent', borderTopColor: '#B8941F', borderRightColor: '#D4AF37' }}></div>
          <p className="font-medium text-[14px] tracking-wide" style={{ color: '#8B8680' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Show login modal if user is not authenticated
  if (!user) {
    return <LoginModal />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden font-sans" style={{ background: 'linear-gradient(to bottom, #FDFBF7 0%, #F5F1E8 100%)', color: '#2C2C2C' }}>
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 w-full flex flex-col h-full">
        <div className="flex-shrink-0">
          <Header onOpenGallery={() => setIsGalleryOpen(true)} />
        </div>
        
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 xl:gap-6 pt-4 lg:pt-5 min-h-0">
            {/* Left Column: Controls */}
            <div className="lg:col-span-3 min-h-0 flex flex-col">
              <ScrollPanel className="px-1">
                <div className="space-y-4 lg:space-y-5 pb-6">
                <div className="bg-white p-4 lg:p-5 xl:p-6 rounded-xl lg:rounded-2xl shadow-sm border space-y-4 lg:space-y-5" style={{ borderColor: 'rgba(44, 44, 44, 0.08)' }}>
                    <h2 className="font-serif text-[18px] lg:text-[20px] border-b pb-3 lg:pb-4" style={{ color: '#2C2C2C', fontWeight: 500, letterSpacing: '0.01em', borderColor: 'rgba(44, 44, 44, 0.06)' }}>Configuration</h2>
                    <div className="space-y-4">
                        <OptionSelector label="Jewelry Type" value={jewelryType} onChange={setJewelryType} options={JEWELRY_TYPES} />
                        <OptionSelector label="Material" value={material} onChange={setMaterial} options={MATERIALS} />
                        <OptionSelector label="Gemstone" value={gemstone} onChange={setGemstone} options={GEMSTONES} />
                    </div>

                    <VisionInput 
                        description={description} 
                        onDescriptionChange={setDescription}
                        inspirationFile={inspirationFile}
                        onInspirationFileChange={setInspirationFile}
                    />

                </div>

                <div className="bg-white p-4 lg:p-5 xl:p-6 rounded-xl lg:rounded-2xl shadow-sm border space-y-4 lg:space-y-5" style={{ borderColor: 'rgba(44, 44, 44, 0.08)' }}>
                     <h2 className="font-serif text-[18px] lg:text-[20px] border-b pb-3 lg:pb-4" style={{ color: '#2C2C2C', fontWeight: 500, letterSpacing: '0.01em', borderColor: 'rgba(44, 44, 44, 0.06)' }}>Customization</h2>
                     <FileUpload id="engraving-upload" label="Upload Engraving / Pattern" onFileChange={setEngravingFile} />
                     {engravingFile && (
                         <OptionSelector label="Application Style" value={engravingStyle} onChange={setEngravingStyle} options={ENGRAVING_STYLES} />
                     )}
                </div>

                <button 
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-[#B8941F] to-[#D4AF37] hover:from-[#9A7D19] hover:to-[#B8941F] text-white font-medium py-3 lg:py-3.5 xl:py-4 px-5 lg:px-6 rounded-lg lg:rounded-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 lg:gap-2.5 group text-[13px] lg:text-[14px]"
                    style={{ letterSpacing: '0.03em' }}
                >
                    {isLoading ? (
                        <span>Crafting your masterpiece...</span>
                    ) : (
                        <>
                            <span>Generate Design</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </>
                    )}
                </button>
                </div>
              </ScrollPanel>
            </div>

            {/* Center Column: Image Display */}
            <div className="lg:col-span-6 mb-4 min-h-0 rounded-xl lg:rounded-2xl overflow-hidden shadow-xl border relative" style={{ borderColor: 'rgba(44, 44, 44, 0.08)', boxShadow: '0 4px 24px rgba(44, 44, 44, 0.08), 0 2px 8px rgba(184, 148, 31, 0.05)' }}>
                 <ImageDisplay
                    generatedImage={generatedImage}
                    isLoading={isLoading}
                    isRefining={isRefining}
                    error={error}
                 />
            </div>

            {/* Right Column: Details, Refinement & Try-On */}
            <div className="lg:col-span-3 min-h-0 flex flex-col">
              <ScrollPanel className="px-1">
                <div className="space-y-4 lg:space-y-5 pb-6">
                 <div className="bg-white p-4 lg:p-5 xl:p-6 rounded-xl lg:rounded-2xl shadow-sm border min-h-[180px] lg:min-h-[200px]" style={{ borderColor: 'rgba(44, 44, 44, 0.08)' }}>
                    <ManufacturingDetails details={specs} isLoading={isLoading && !generatedImage} error={error} />
                 </div>

                 <RefinementPanel
                    onRefine={handleRefine}
                    isRefining={isRefining}
                    history={refinementHistory}
                    onReset={handleResetToOriginal}
                    hasOriginal={!!originalImage && originalImage !== generatedImage}
                    disabled={!generatedImage}
                 />

                 <div className="bg-white rounded-2xl shadow-sm border overflow-hidden h-[400px]" style={{ borderColor: 'rgba(44, 44, 44, 0.08)', minHeight: '350px', maxHeight: '450px' }}>
                    <VirtualTryOn generatedJewelryImage={generatedImage || ''} jewelryType={jewelryType} />
                 </div>
                </div>
              </ScrollPanel>
            </div>
        </main>
        
        <GalleryModal isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} onSelectDesign={handleGallerySelect} />
      </div>
    </div>
  );
};

export default App;
