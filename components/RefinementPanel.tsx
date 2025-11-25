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
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-emerald-100 rounded-lg">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-emerald-700"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </div>
                <h3 className="font-serif text-base font-bold text-emerald-900">Refine Design</h3>
            </div>

            {/* Refinement Input */}
            <div className="space-y-3">
                <textarea
                    value={refinementText}
                    onChange={(e) => setRefinementText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isRefining || disabled}
                    placeholder={disabled ? "Generate an image first..." : "e.g., 'make the center stone larger'"}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none resize-none transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    rows={2}
                />

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={handleSubmit}
                        disabled={!refinementText.trim() || isRefining || disabled}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-sm shadow-sm"
                    >
                        {isRefining ? (
                            <>
                                <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Refining...</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Apply</span>
                            </>
                        )}
                    </button>

                    {hasOriginal && (
                        <button
                            onClick={onReset}
                            disabled={isRefining || disabled}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-2 px-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm"
                            title="Reset to original"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Refinement History */}
                {history.length > 0 && (
                    <div className="pt-3 border-t border-stone-200">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-stone-600 uppercase tracking-wide">
                                Refinements ({history.length})
                            </p>
                        </div>
                        <div className="space-y-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                            {history.slice(-3).reverse().map((item, index) => (
                                <div
                                    key={index}
                                    className="bg-stone-50 p-2 rounded text-xs text-stone-700 border border-stone-100"
                                >
                                    <p className="line-clamp-1">{item.prompt}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
