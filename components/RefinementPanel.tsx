import React, { useState } from 'react';

interface RefinementHistory {
    prompt: string;
    timestamp: Date;
}

interface RefinementPanelProps {
    onRefine: (prompt: string) => Promise<void>;
    isRefining: boolean;
    history: RefinementHistory[];
    onReset: () => void;
    hasOriginal: boolean;
    disabled?: boolean;
}

export const RefinementPanel: React.FC<RefinementPanelProps> = ({
    onRefine,
    isRefining,
    history,
    onReset,
    hasOriginal,
    disabled = false
}) => {
    const [refinementText, setRefinementText] = useState('');

    const handleSubmit = async () => {
        if (!refinementText.trim() || isRefining || disabled) return;

        await onRefine(refinementText.trim());
        setRefinementText('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="bg-white p-4 lg:p-5 xl:p-6 rounded-xl lg:rounded-2xl shadow-sm border" style={{ borderColor: 'rgba(44, 44, 44, 0.08)' }}>
            <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-5 pb-3 lg:pb-4 border-b" style={{ borderColor: 'rgba(44, 44, 44, 0.06)' }}>
                <div className="p-1.5 lg:p-2 bg-gradient-to-br from-[#F5F1E8] to-[#E5E4E2] rounded-lg border" style={{ borderColor: 'rgba(184, 148, 31, 0.15)' }}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 lg:h-[18px] lg:w-[18px]"
                        style={{ color: '#B8941F' }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </div>
                <h3 className="font-serif text-[16px] lg:text-[18px]" style={{ color: '#2C2C2C', fontWeight: 500, letterSpacing: '0.01em' }}>Refine Design</h3>
            </div>

            {/* Refinement Input */}
            <div className="space-y-2.5 lg:space-y-3">
                <textarea
                    value={refinementText}
                    onChange={(e) => setRefinementText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isRefining || disabled}
                    placeholder={disabled ? "Generate a design first..." : "Describe your refinement, e.g. 'enlarge the center stone'"}
                    className="w-full px-3 lg:px-4 py-2.5 lg:py-3 border rounded-lg outline-none resize-none transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[13px] lg:text-[14px]"
                    style={{ 
                      borderColor: 'rgba(44, 44, 44, 0.1)',
                      color: '#2C2C2C',
                      background: 'white'
                    }}
                    rows={2}
                />

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={handleSubmit}
                        disabled={!refinementText.trim() || isRefining || disabled}
                        className="flex-1 bg-gradient-to-r from-[#B8941F] to-[#D4AF37] hover:from-[#9A7D19] hover:to-[#B8941F] text-white font-medium py-2.5 lg:py-3 px-3 lg:px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 lg:gap-2 text-[12px] lg:text-[13px] shadow-sm"
                        style={{ letterSpacing: '0.02em' }}
                    >
                        {isRefining ? (
                            <>
                                <svg className="animate-spin h-3.5 w-3.5 lg:h-4 lg:w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="hidden sm:inline">Refining...</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 lg:h-4 lg:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="hidden sm:inline">Apply</span>
                                <span className="sm:hidden">Apply</span>
                            </>
                        )}
                    </button>

                    {hasOriginal && (
                        <button
                            onClick={onReset}
                            disabled={isRefining || disabled}
                            className="bg-white hover:bg-[#F5F1E8] font-medium py-2.5 lg:py-3 px-3 lg:px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-[12px] lg:text-[13px] border"
                            style={{ color: '#8B8680', borderColor: 'rgba(44, 44, 44, 0.1)' }}
                            title="Reset to original"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 lg:h-4 lg:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Refinement History */}
                {history.length > 0 && (
                    <div className="pt-4 mt-4 border-t" style={{ borderColor: 'rgba(44, 44, 44, 0.06)' }}>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[11px] font-medium uppercase tracking-[0.15em]" style={{ color: '#8B8680' }}>
                                History ({history.length})
                            </p>
                        </div>
                        <div className="space-y-2 max-h-28 overflow-y-auto custom-scrollbar">
                            {history.slice(-3).reverse().map((item, index) => (
                                <div
                                    key={index}
                                    className="p-3 rounded-lg border text-[12px] leading-relaxed"
                                    style={{ 
                                      background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F1E8 100%)',
                                      borderColor: 'rgba(44, 44, 44, 0.06)',
                                      color: '#4A4A4A'
                                    }}
                                >
                                    <p className="line-clamp-2">{item.prompt}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
