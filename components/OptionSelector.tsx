import React from 'react';

interface OptionSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

export const OptionSelector: React.FC<OptionSelectorProps> = ({ label, value, onChange, options }) => {
  return (
    <div>
      <label htmlFor={label} className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{label}</label>
      <div className="relative">
        <select
            id={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 text-stone-800 py-3 pl-4 pr-10 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none cursor-pointer text-sm hover:bg-white hover:border-emerald-300 shadow-sm"
        >
            {options.map((option) => (
            <option key={option} value={option} className="bg-white text-stone-800">{option}</option>
            ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-stone-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </div>
    </div>
  );
};