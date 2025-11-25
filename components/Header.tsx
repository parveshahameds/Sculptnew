import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
    onOpenGallery: () => void;
}

const GemIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 8.5V15.5L12 22L22 15.5V8.5L12 2ZM12 4.47L19.53 9.5L12 14.53L4.47 9.5L12 4.47ZM3.5 9.99L12 15.99L20.5 9.99V14.51L12 19.51L3.5 14.51V9.99Z" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-[#B8941F]" />
    </svg>
);

export const Header: React.FC<HeaderProps> = ({ onOpenGallery }) => {
    const { user, logout } = useAuth();

    return (
        <header className="py-4 lg:py-5 xl:py-6 flex items-center justify-between border-b" style={{ borderColor: 'rgba(44, 44, 44, 0.08)' }}>
            {/* Brand Identity */}
            <div className="flex items-center gap-3 lg:gap-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 to-[#B8941F]/5 blur-xl"></div>
                    <div className="relative p-2 lg:p-2.5 bg-gradient-to-br from-white to-[#F5F1E8] rounded-lg lg:rounded-xl border" style={{ borderColor: 'rgba(184, 148, 31, 0.2)' }}>
                        <GemIcon />
                    </div>
                </div>
                <div className="flex flex-col">
                    <h1 className="text-[22px] lg:text-[26px] xl:text-[28px] font-serif tracking-[0.08em]" style={{ color: '#2C2C2C', fontWeight: 500 }}>
                        SCULPT
                    </h1>
                    <span className="hidden sm:block text-[9px] lg:text-[10px] uppercase tracking-[0.2em] -mt-1" style={{ color: '#8B8680', fontWeight: 500 }}>
                        Atelier de Haute Joaillerie
                    </span>
                </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center gap-2 lg:gap-3 xl:gap-4">
                {/* User Profile */}
                <div className="flex items-center gap-2 lg:gap-3 xl:gap-4 px-3 lg:px-4 xl:px-5 py-2 lg:py-2.5 bg-white border rounded-full shadow-sm" style={{ borderColor: 'rgba(44, 44, 44, 0.08)', boxShadow: '0 2px 8px rgba(44, 44, 44, 0.04)' }}>
                    <div className="flex items-center gap-2 lg:gap-3">
                        <div className="w-8 h-8 lg:w-9 lg:h-9 bg-gradient-to-br from-[#F5F1E8] to-[#E5E4E2] rounded-full flex items-center justify-center border" style={{ borderColor: 'rgba(184, 148, 31, 0.15)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:h-[18px] lg:w-[18px]" style={{ color: '#B8941F' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div className="hidden md:flex flex-col">
                            <span className="text-[9px] lg:text-[10px] uppercase tracking-wider leading-none mb-1" style={{ color: '#8B8680', fontWeight: 500 }}>
                                Client
                            </span>
                            <span className="text-[12px] lg:text-[13px] leading-none truncate max-w-[120px] lg:max-w-[150px]" style={{ color: '#2C2C2C', fontWeight: 500 }}>
                                {user?.email}
                            </span>
                        </div>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={logout}
                        className="p-1.5 lg:p-2 rounded-lg hover:bg-[#F5F1E8] transition-all group"
                        title="Sign Out"
                        style={{ color: '#8B8680' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:h-[18px] lg:w-[18px] group-hover:text-[#2C2C2C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>

                {/* Gallery Access */}
                <button
                    onClick={onOpenGallery}
                    className="group flex items-center gap-2 lg:gap-2.5 px-3 lg:px-4 xl:px-5 py-2 lg:py-2.5 bg-gradient-to-r from-[#B8941F] to-[#D4AF37] text-white rounded-full shadow-sm hover:shadow-md text-[12px] lg:text-[13px] font-medium tracking-wide"
                    style={{ boxShadow: '0 2px 12px rgba(184, 148, 31, 0.25)' }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:h-[18px] lg:w-[18px] group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span className="hidden sm:inline">Collection</span>
                </button>
            </div>
        </header>
    );
};