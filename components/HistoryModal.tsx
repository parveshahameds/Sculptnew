import React, { useEffect, useState, useMemo } from 'react';
import { getJewelryDesigns } from '../services/supabaseService';
import { FullScreenImageModal } from './FullScreenImageModal';
import type { JewelrySpec } from './ManufacturingDetails';

export interface HistoryDesign {
  id: string;
  user_id: string;
  prompt: string;
  jewelry_type: string | null;
  material: string | null;
  gemstone: string | null;
  engraving_style: string | null;
  image_url: string;
  design_specs: JewelrySpec;
  parent_design_id: string | null;
  created_at: string;
  updated_at: string;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseDesign: (design: HistoryDesign) => void;
}

const HistoryCard: React.FC<{ 
  design: HistoryDesign;
  onSelect: (design: HistoryDesign) => void;
  onUse: (design: HistoryDesign) => void;
  onDownload: (design: HistoryDesign) => void;
}> = ({ design, onSelect, onUse, onDownload }) => {
    const formattedDate = new Date(design.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-100 flex flex-col h-full">
            {/* Image Section */}
            <div 
                className="w-full aspect-square relative overflow-hidden bg-stone-200 cursor-pointer"
                onClick={() => onSelect(design)}
            >
                 <img 
                    src={design.image_url} 
                    alt={design.prompt} 
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                />
                {design.jewelry_type && (
                    <span className="absolute top-3 left-3 text-white text-xs font-bold px-2 py-1 bg-amber-900/80 backdrop-blur-sm rounded shadow-sm">
                        {design.jewelry_type}
                    </span>
                )}
                {design.parent_design_id && (
                    <span className="absolute top-3 right-3 text-white text-xs font-bold px-2 py-1 bg-purple-600/80 backdrop-blur-sm rounded shadow-sm">
                        Refined
                    </span>
                )}
            </div>
            
            {/* Content Section */}
            <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                    <p className="text-stone-700 text-sm leading-relaxed line-clamp-2 mb-2">{design.prompt}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                        {design.material && (
                            <span className="px-2 py-1 bg-stone-100 text-stone-600 rounded-md border border-stone-200">
                                {design.material}
                            </span>
                        )}
                        {design.gemstone && (
                            <span className="px-2 py-1 bg-stone-100 text-stone-600 rounded-md border border-stone-200">
                                {design.gemstone}
                            </span>
                        )}
                    </div>
                </div>
                
                <div className="pt-3 border-t border-stone-100 flex flex-col gap-2">
                     <span className="text-[10px] text-stone-400 font-medium tracking-wider">{formattedDate}</span>
                     <div className="flex gap-2">
                         <button 
                            onClick={() => onDownload(design)}
                            className="flex-1 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1 transition-all duration-200 text-stone-600 bg-stone-100 hover:bg-stone-200 px-3 py-2 rounded-lg"
                         >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Download</span>
                         </button>
                         <button 
                            onClick={() => onUse(design)}
                            className="flex-1 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1 transition-all duration-200 text-white bg-[#B8941F] hover:bg-[#D4AF37] px-3 py-2 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                         >
                            <span>Use</span>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                         </button>
                     </div>
                </div>
            </div>
        </div>
    );
};

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, onUseDesign }) => {
  const [designs, setDesigns] = useState<HistoryDesign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDesign, setSelectedDesign] = useState<HistoryDesign | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      loadDesigns();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const loadDesigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getJewelryDesigns(100);
      setDesigns(data || []);
    } catch (err) {
      console.error('Error loading designs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load designs');
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
      const types = new Set(designs.filter(d => d.jewelry_type).map(d => d.jewelry_type as string));
      return ['All', ...Array.from(types).sort()];
  }, [designs]);

  const filteredDesigns = useMemo(() => {
      let filtered = designs;
      
      // Filter by category
      if (activeCategory !== 'All') {
          filtered = filtered.filter(d => d.jewelry_type === activeCategory);
      }
      
      // Filter by search query
      if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(d => 
              d.prompt.toLowerCase().includes(query) ||
              d.jewelry_type?.toLowerCase().includes(query) ||
              d.material?.toLowerCase().includes(query) ||
              d.gemstone?.toLowerCase().includes(query)
          );
      }
      
      return filtered;
  }, [designs, activeCategory, searchQuery]);

  const handleUse = (design: HistoryDesign) => {
      onUseDesign(design);
      onClose();
  };

  const handleDownloadCard = async (design: HistoryDesign) => {
      try {
          const response = await fetch(design.image_url);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `jewelry-design-${design.id}-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
      } catch (err) {
          console.error('Download failed:', err);
      }
  };

  const handleDownload = async () => {
      if (!selectedDesign) return;
      
      try {
          const response = await fetch(selectedDesign.image_url);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `jewelry-design-${selectedDesign.id}-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
      } catch (err) {
          console.error('Download failed:', err);
      }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center" role="dialog" aria-modal="true">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        />
        
        {/* Modal Container */}
        <div className="relative w-[95vw] max-w-6xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-white z-10 shrink-0">
            <div>
              <h2 className="text-2xl font-serif font-bold text-amber-900">My Design History</h2>
              <p className="text-xs text-stone-500 uppercase tracking-wider mt-1 font-medium">
                {designs.length} {designs.length === 1 ? 'Design' : 'Designs'} Created
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-stone-600"
              aria-label="Close History"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-6 py-3 border-b border-stone-100 bg-white shrink-0">
              <div className="relative">
                  <input 
                      type="text"
                      placeholder="Search designs by prompt, type, material, or gemstone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-stone-50"
                  />
                  <svg className="w-5 h-5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchQuery && (
                      <button 
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                      </button>
                  )}
              </div>
          </div>

          {/* Filter Bar */}
          {categories.length > 1 && (
            <div className="px-6 py-3 border-b border-stone-100 bg-stone-50/50 overflow-x-auto whitespace-nowrap shrink-0 no-scrollbar">
                <div className="flex gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all border ${
                                activeCategory === cat 
                                ? 'bg-[#B8941F] text-white border-[#B8941F] shadow-md' 
                                : 'bg-white text-stone-500 border-stone-200 hover:border-amber-300 hover:text-amber-700'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-stone-50 custom-scrollbar">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-stone-400">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-stone-200 border-t-amber-900 mb-4"></div>
                    <p>Loading your designs...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center h-full text-red-400">
                    <svg className="w-12 h-12 mb-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    <p className="font-medium">{error}</p>
                    <button 
                        onClick={loadDesigns}
                        className="mt-4 px-4 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition-colors text-sm"
                    >
                        Try Again
                    </button>
                </div>
            ) : filteredDesigns.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                  {filteredDesigns.map((design) => (
                    <HistoryCard 
                        key={design.id} 
                        design={design} 
                        onSelect={setSelectedDesign}
                        onUse={handleUse}
                        onDownload={handleDownloadCard}
                    />
                  ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-stone-400">
                    <svg className="w-16 h-16 mb-4 opacity-20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                    </svg>
                    <p className="text-lg font-medium mb-2">
                        {searchQuery || activeCategory !== 'All' ? 'No designs found' : 'No designs yet'}
                    </p>
                    <p className="text-sm">
                        {searchQuery || activeCategory !== 'All' 
                            ? 'Try adjusting your filters or search query' 
                            : 'Start creating designs to see them here'
                        }
                    </p>
                </div>
            )}
          </div>
          
          {/* Footer Hint */}
          <div className="px-6 py-3 bg-stone-100 border-t border-stone-200 text-center shrink-0">
               <p className="text-[10px] text-stone-500 uppercase tracking-widest">Click a design to view details or use it in the editor</p>
          </div>

        </div>
      </div>

      {/* Full Screen Image Modal */}
      {selectedDesign && (
        <FullScreenImageModal
            imageSrc={selectedDesign.image_url}
            isOpen={!!selectedDesign}
            onClose={() => setSelectedDesign(null)}
            customActions={(
                <div className="flex gap-3">
                    <button
                        onClick={handleDownload}
                        className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium border border-white/20"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                    </button>
                    <button
                        onClick={() => {
                            handleUse(selectedDesign);
                            setSelectedDesign(null);
                        }}
                        className="px-5 py-2.5 bg-[#B8941F] hover:bg-[#D4AF37] text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium shadow-lg"
                    >
                        Use Design
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </button>
                </div>
            )}
        />
      )}
    </>
  );
};
