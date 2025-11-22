
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { OptionSelector } from './components/OptionSelector';
import { ImageDisplay } from './components/ImageDisplay';
import { generateJewelryImage, analyzeJewelryImage } from './services/geminiService';
import { JEWELRY_TYPES, MATERIALS, GEMSTONES, ENGRAVING_STYLES } from './constants';
import { VisionInput } from './components/VisionInput';
import { FileUpload } from './components/FileUpload';
import { ManufacturingDetails } from './components/ManufacturingDetails';
import { VirtualTryOn } from './components/VirtualTryOn';
import { GalleryModal, type GalleryItem } from './components/GalleryModal';
import type { JewelrySpec } from './components/ManufacturingDetails';


const App: React.FC = () => {
  const [description, setDescription] = useState<string>('');
  const [jewelryType, setJewelryType] = useState<string>(JEWELRY_TYPES[0]);
  const [material, setMaterial] = useState<string>(MATERIALS[0]);
  const [gemstone, setGemstone] = useState<string>(GEMSTONES[0]);
  const [inspirationFile, setInspirationFile] = useState<File | null>(null);
  const [engravingFile, setEngravingFile] = useState<File | null>(null);
  const [engravingStyle, setEngravingStyle] = useState<string>(ENGRAVING_STYLES[0]);

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [specs, setSpecs] = useState<JewelrySpec | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);

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
    setSpecs(null);

    try {
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

        const imageBase64 = await generateJewelryImage(prompt, imageInputs);
        setGeneratedImage(imageBase64);

        const analysis = await analyzeJewelryImage(imageBase64);
        setSpecs(analysis);

    } catch (e) {
        if (e instanceof Error) setError(e.message);
        else setError("An unexpected error occurred");
    } finally {
        setIsLoading(false);
    }
  };

  const handleGallerySelect = async (item: GalleryItem) => {
      setIsGalleryOpen(false);
      setIsLoading(true);
      setError(null);
      setGeneratedImage(null);
      setSpecs(null);

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

              // 3. Analyze the existing image
              try {
                  const analysis = await analyzeJewelryImage(base64String);
                  setSpecs(analysis);
              } catch (analysisErr) {
                  console.error("Analysis failed", analysisErr);
                  // Continue showing image even if analysis fails
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

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <Header onOpenGallery={() => setIsGalleryOpen(true)} />
        
        <main className="pb-12 pt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Controls */}
            <div className="lg:col-span-3 space-y-6 overflow-y-auto h-[calc(100vh-6rem)] custom-scrollbar pr-2 pb-20">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 space-y-5">
                    <h2 className="font-serif text-xl font-bold text-emerald-900 border-b border-stone-100 pb-3">Configuration</h2>
                    
                    <VisionInput 
                        description={description} 
                        onDescriptionChange={setDescription}
                        inspirationFile={inspirationFile}
                        onInspirationFileChange={setInspirationFile}
                    />

                    <div className="space-y-4">
                        <OptionSelector label="Jewelry Type" value={jewelryType} onChange={setJewelryType} options={JEWELRY_TYPES} />
                        <OptionSelector label="Material" value={material} onChange={setMaterial} options={MATERIALS} />
                        <OptionSelector label="Gemstone" value={gemstone} onChange={setGemstone} options={GEMSTONES} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 space-y-5">
                     <h2 className="font-serif text-xl font-bold text-emerald-900 border-b border-stone-100 pb-3">Customization</h2>
                     <FileUpload id="engraving-upload" label="Upload Engraving / Pattern" onFileChange={setEngravingFile} />
                     {engravingFile && (
                         <OptionSelector label="Application Style" value={engravingStyle} onChange={setEngravingStyle} options={ENGRAVING_STYLES} />
                     )}
                </div>

                <button 
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full bg-emerald-900 hover:bg-emerald-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
                >
                    {isLoading ? (
                        <span>Crafting your masterpiece...</span>
                    ) : (
                        <>
                            <span>Generate Design</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </>
                    )}
                </button>
            </div>

            {/* Center Column: Image Display */}
            <div className="lg:col-span-6 h-[calc(100vh-6rem)] rounded-2xl overflow-hidden shadow-xl border border-stone-200 bg-white relative">
                 <ImageDisplay generatedImage={generatedImage} isLoading={isLoading} error={error} />
            </div>

            {/* Right Column: Details & Try-On */}
            <div className="lg:col-span-3 space-y-6 overflow-y-auto h-[calc(100vh-6rem)] custom-scrollbar pl-2 pb-20">
                 <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 min-h-[200px]">
                    <ManufacturingDetails details={specs} isLoading={isLoading && !generatedImage} error={error} />
                 </div>
                 
                 <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 min-h-[300px]">
                    <VirtualTryOn generatedJewelryImage={generatedImage || ''} jewelryType={jewelryType} />
                 </div>
            </div>
        </main>
        
        <GalleryModal isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} onSelectDesign={handleGallerySelect} />
      </div>
    </div>
  );
};

export default App;
