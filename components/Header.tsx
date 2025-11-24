import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
    onOpenGallery: () => void;
}

const GemIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-700" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 8.5V15.5L12 22L22 15.5V8.5L12 2ZM12 4.47L19.53 9.5L12 14.53L4.47 9.5L12 4.47ZM3.5 9.99L12 15.99L20.5 9.99V14.51L12 19.51L3.5 14.51V9.99Z" />
    </svg>
);

export const Header: React.FC<HeaderProps> = ({ onOpenGallery }) => {
    const { user, logout } = useAuth();

    return (
        <header className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg">
                    <GemIcon />
                </div>
                <h1 className="text-2xl text-stone-800 font-serif tracking-wide">
                    <span className="font-normal">SCULPT</span>
                </h1>
            </div>

            <div className="flex items-center gap-3">
                {/* User Info */}
                <div className="flex items-center gap-3 px-4 py-2 bg-white border border-stone-200 rounded-full shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-stone-500 leading-none mb-0.5">Logged in as</span>
                            <span className="text-sm font-medium text-stone-700 leading-none">{user?.email}</span>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={logout}
                        className="ml-2 p-1.5 hover:bg-stone-100 rounded-lg transition-colors text-stone-600 hover:text-red-600 group"
                        title="Logout"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>

                {/* Gallery Button */}
                <button
                    onClick={onOpenGallery}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full shadow-sm text-stone-600 hover:text-emerald-800 hover:border-emerald-200 transition-all text-sm font-medium group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span>Inspiration Gallery</span>
                </button>
            </div>
        </header>
    );
};