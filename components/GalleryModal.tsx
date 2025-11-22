
import React, { useEffect, useState, useMemo } from 'react';

export interface GalleryItem {
  title: string;
  type: string;
  description: string;
  imageUrl: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    title: "The Maharani's Grace",
    type: "Rani Haar",
    description: "A majestic five-layered Rani Haar in 22K antique temple gold. The piece features intricate peacock motifs hand-carved into the gold, strung with freshwater pearls and uncut Polki diamonds.",
    imageUrl: "https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Jaipur Royal Choker",
    type: "Choker",
    description: "A heavy bridal Kundan choker setting. Large, flat-cut diamonds (Polki) are set in gold foil with red enamel (Meenakari) work on the reverse, accented by cascading emerald beads.",
    imageUrl: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Temple Heritage Jhumkas",
    type: "Jhumka",
    description: "Traditional bell-shaped Jhumkas depicting Goddess Lakshmi in the upper stud. Crafted in oxidized silver with ruby cabochons and hanging gold pearls for movement.",
    imageUrl: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Navratna Geometric Kada",
    type: "Kada",
    description: "A contemporary interpretation of the sacred Navratna stones. Nine distinct gemstones flush-set in a thick, brushed yellow gold geometric bangle with sharp edges.",
    imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Emerald Cut Solitaire",
    type: "Ring",
    description: "A timeless 3-carat emerald-cut diamond set in platinum with tapered baguette side stones. A minimalist modern classic designed for maximum brilliance.",
    imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Peacock Enamel Nath",
    type: "Nath",
    description: "A delicate gold nose ring featuring vibrant blue and green Meenakari enamel work in a peacock motif, accented with small pearls and a delicate gold chain.",
    imageUrl: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "South Sea Pearl Strand",
    type: "Necklace",
    description: "A single strand of perfectly matched, lustrous white South Sea pearls (12mm), finished with a white gold and diamond pave clasp.",
    imageUrl: "https://images.unsplash.com/photo-1599643478518-17488fbbcd75?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Ruby & Diamond Chandbali",
    type: "Chandbali",
    description: "Crescent-shaped statement earrings featuring pigeon-blood rubies surrounded by uncut diamonds in a traditional Jadau setting with pearl drops.",
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Rose Gold Tennis Bracelet",
    type: "Bracelet",
    description: "A fluid line of round brilliant diamonds bezel-set in 18K rose gold, offering a modern and feminine twist on the classic tennis bracelet.",
    imageUrl: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Vanki Armlet Design",
    type: "Bajuband",
    description: "A V-shaped armlet (Vanki) featuring a central motif of Lord Krishna, encrusted with rubies and emeralds in a closed setting, typical of South Indian temple jewelry.",
    imageUrl: "https://images.unsplash.com/photo-1608042314453-ae338d80c427?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Art Deco Sapphire Ring",
    type: "Ring",
    description: "A vintage-inspired ring featuring a deep blue cushion-cut sapphire surrounded by a geometric halo of calibrated sapphires and diamonds in platinum.",
    imageUrl: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Floral Vines Waist Belt",
    type: "Kamarband",
    description: "A heavy 22K gold waist belt featuring intricate repoussé work of floral vines and mythical creatures, finished with dangling gold balls.",
    imageUrl: "https://images.unsplash.com/photo-1596902852522-6e9039708e12?auto=format&fit=crop&q=80&w=800"
  }
];

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDesign: (item: GalleryItem) => void;
}

const GalleryCard: React.FC<{ item: GalleryItem, onSelect?: (item: GalleryItem) => void }> = ({ item, onSelect }) => {
    return (
        <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-100 flex flex-col md:flex-row h-full">
            {/* Image Section */}
            <div className="w-full md:w-2/5 h-48 md:h-auto relative overflow-hidden bg-stone-200 shrink-0">
                 <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    crossOrigin="anonymous"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 md:hidden"></div>
                <span className="absolute bottom-3 left-3 text-white text-xs font-bold px-2 py-1 bg-emerald-900/80 backdrop-blur-sm rounded md:hidden shadow-sm">
                    {item.type}
                </span>
            </div>
            
            {/* Content Section */}
            <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div>
                    <div className="flex justify-between items-start mb-2 gap-2">
                        <h3 className="font-serif text-xl font-semibold text-emerald-950 leading-tight">{item.title}</h3>
                        <span className="hidden md:inline-block text-[10px] font-bold px-2 py-1 bg-stone-100 text-stone-500 rounded uppercase tracking-wider border border-stone-200 whitespace-nowrap shrink-0">
                            {item.type}
                        </span>
                    </div>
                    <p className="text-stone-600 text-sm leading-relaxed line-clamp-3 md:line-clamp-4">{item.description}</p>
                </div>
                
                <div className="pt-4 border-t border-stone-100 flex justify-between items-center mt-auto">
                     <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wider hidden sm:inline-block">Generated by Sculpt AI</span>
                     <button 
                        onClick={() => onSelect && onSelect(item)}
                        className="w-full sm:w-auto text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all duration-200 text-white bg-emerald-900 hover:bg-emerald-800 px-4 py-2 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                     >
                        <span>Use Design</span>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                     </button>
                </div>
            </div>
        </div>
    );
};

export const GalleryModal: React.FC<GalleryModalProps> = ({ isOpen, onClose, onSelectDesign }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const categories = useMemo(() => {
      const types = new Set(GALLERY_ITEMS.map(item => item.type));
      return ['All', ...Array.from(types).sort()];
  }, []);

  const filteredItems = useMemo(() => {
      if (activeCategory === 'All') return GALLERY_ITEMS;
      return GALLERY_ITEMS.filter(item => item.type === activeCategory);
  }, [activeCategory]);

  const handleSelect = (item: GalleryItem) => {
      if(onSelectDesign) {
          onSelectDesign(item);
          onClose();
      }
  }

  if (!isOpen) return null;

  return (
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
            <h2 className="text-2xl font-serif font-bold text-emerald-900">Inspiration Gallery</h2>
            <p className="text-xs text-stone-500 uppercase tracking-wider mt-1 font-medium">Featured Collections created with Sculpt</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-stone-600"
            aria-label="Close Gallery"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-3 border-b border-stone-100 bg-stone-50/50 overflow-x-auto whitespace-nowrap shrink-0 no-scrollbar">
            <div className="flex gap-2">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all border ${
                            activeCategory === cat 
                            ? 'bg-emerald-900 text-white border-emerald-900 shadow-md' 
                            : 'bg-white text-stone-500 border-stone-200 hover:border-emerald-300 hover:text-emerald-700'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-50 custom-scrollbar">
          {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                {filteredItems.map((item, index) => (
                  <GalleryCard key={`${item.title}-${index}`} item={item} onSelect={handleSelect} />
                ))}
              </div>
          ) : (
              <div className="flex flex-col items-center justify-center h-full text-stone-400">
                  <svg className="w-12 h-12 mb-2 opacity-20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 8.5V15.5L12 22L22 15.5V8.5L12 2ZM12 4.47L19.53 9.5L12 14.53L4.47 9.5L12 4.47ZM3.5 9.99L12 15.99L20.5 9.99V14.51L12 19.51L3.5 14.51V9.99Z" />
                  </svg>
                  <p>No items found in this category.</p>
              </div>
          )}
        </div>
        
        {/* Footer Hint */}
        <div className="px-6 py-3 bg-stone-100 border-t border-stone-200 text-center shrink-0">
             <p className="text-[10px] text-stone-500 uppercase tracking-widest">Select a design to automatically load it into the Controls</p>
        </div>

      </div>
    </div>
  );
};
