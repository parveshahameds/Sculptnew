import React from 'react';
import { Loader } from './Loader';

export interface JewelrySpec {
    designId: string;
    estimatedWeightGm: number;
    metal: string;
    totalCaratCt: number;
    gemstones: {
        type: string;
        cut: string;
        sizeMm: string;
        quantity: number;
        caratWeight: number;
    }[];
    manufacturingNotes: string[];
}


interface ManufacturingDetailsProps {
  details: JewelrySpec | null;
  isLoading: boolean;
  error: string | null;
}

export const ManufacturingDetails: React.FC<ManufacturingDetailsProps> = ({ details, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 py-12">
        <Loader />
        <p className="text-emerald-700 text-xs font-bold uppercase tracking-widest mt-4">Analyzing Specs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 p-4 rounded-lg text-red-600 text-xs">
        <p>{error}</p>
      </div>
    );
  }

  if (!details) {
    return null;
  }

  return (
    <div>
      <div className="flex justify-between items-end mb-6 pb-4 border-b border-stone-100">
        <div>
            <h3 className="text-lg font-bold text-emerald-900 uppercase tracking-wider">
                Specification Sheet
            </h3>
            <p className="text-xs text-stone-500 mt-1">Technical details for manufacturing</p>
        </div>
        <div className="font-mono text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full font-medium">
            ID: {details.designId}
        </div>
      </div>
      
      {/* Key Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 text-center">
          <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1 font-bold">Metal</p>
          <p className="font-serif text-lg text-stone-800 truncate" title={details.metal}>{details.metal}</p>
        </div>
        <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 text-center">
          <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1 font-bold">Weight</p>
          <p className="font-serif text-lg text-stone-800">{details.estimatedWeightGm}g</p>
        </div>
        <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 text-center">
          <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1 font-bold">Carat</p>
          <p className="font-serif text-lg text-stone-800">{details.totalCaratCt}ct</p>
        </div>
      </div>

      {/* Gemstones Table */}
      <div className="mb-8">
        <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-4 pl-1">Gemstone Breakdown</h4>
        <div className="overflow-hidden rounded-lg border border-stone-200">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="py-3 px-5 font-semibold text-stone-500 text-xs uppercase">Type</th>
                <th className="py-3 px-5 font-semibold text-stone-500 text-xs uppercase">Cut</th>
                <th className="py-3 px-5 font-semibold text-stone-500 text-xs uppercase">Size</th>
                <th className="py-3 px-5 font-semibold text-stone-500 text-xs uppercase text-right">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {details.gemstones.map((gem, index) => (
                <tr key={index} className="hover:bg-stone-50 transition-colors">
                  <td className="py-3 px-5 text-emerald-900 font-medium">{gem.type}</td>
                  <td className="py-3 px-5 text-stone-600">{gem.cut}</td>
                  <td className="py-3 px-5 font-mono text-stone-500 text-xs">{gem.sizeMm}</td>
                  <td className="py-3 px-5 text-stone-800 font-medium text-right">{gem.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100">
        <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
           </svg>
           Artisan Notes
        </h4>
        <ul className="space-y-2">
          {details.manufacturingNotes.map((note, index) => (
            <li key={index} className="text-emerald-900/80 text-sm leading-relaxed flex gap-2 items-start">
                <span className="text-emerald-400 mt-1.5">•</span>
                <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};