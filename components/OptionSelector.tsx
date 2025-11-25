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
      <label 
        htmlFor={label} 
        className="block text-[11px] font-medium uppercase tracking-[0.15em] mb-2.5" 
        style={{ color: '#8B8680' }}
      >
        {label}
      </label>
      <div className="relative group">
        <select
            id={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white border py-3.5 pl-4 pr-10 rounded-lg focus:outline-none transition-all appearance-none cursor-pointer text-[14px] hover:border-[#D4AF37]/40 shadow-sm"
            style={{ 
              borderColor: 'rgba(44, 44, 44, 0.1)', 
              color: '#2C2C2C',
              boxShadow: '0 1px 3px rgba(44, 44, 44, 0.04)'
            }}
        >
            {options.map((option) => (
            <option key={option} value={option} className="bg-white" style={{ color: '#2C2C2C' }}>{option}</option>
            ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 transition-colors" style={{ color: '#8B8680' }}>
            <svg className="fill-current h-4 w-4 group-hover:text-[#B8941F] transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
        </div>
        {/* Subtle accent line on hover */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#B8941F] to-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity rounded-b-lg"></div>
      </div>
    </div>
  );
};