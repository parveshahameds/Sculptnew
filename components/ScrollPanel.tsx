import React, { useState, useEffect, useRef, ReactNode } from 'react';

interface ScrollPanelProps {
  children: ReactNode;
  className?: string;
  fadeColor?: string;
}

export const ScrollPanel: React.FC<ScrollPanelProps> = ({ 
  children, 
  className = '',
  fadeColor = '#f8f5ef' // Pearl white default
}) => {
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isScrollable = scrollHeight > clientHeight;

    if (!isScrollable) {
      setShowTopFade(false);
      setShowBottomFade(false);
      return;
    }

    // Show top fade if scrolled down (threshold: 20px)
    setShowTopFade(scrollTop > 20);

    // Show bottom fade if not at bottom (threshold: 20px from bottom)
    setShowBottomFade(scrollTop < scrollHeight - clientHeight - 20);
  };

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    // Initial check
    handleScroll();

    // Listen to scroll events
    scrollElement.addEventListener('scroll', handleScroll);

    // Listen to resize events (content might change)
    const resizeObserver = new ResizeObserver(handleScroll);
    resizeObserver.observe(scrollElement);

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [children]);

  return (
    <div className="relative h-full">
      {/* Top Fade Overlay */}
      <div
        className="absolute top-0 left-0 right-0 h-12 pointer-events-none z-10 transition-opacity duration-500"
        style={{
          background: `linear-gradient(180deg, ${fadeColor} 0%, transparent 100%)`,
          opacity: showTopFade ? 1 : 0,
        }}
      />

      {/* Scrollable Content */}
      <div
        ref={scrollRef}
        className={`h-full overflow-y-auto overflow-x-hidden ${className}`}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(184, 148, 31, 0.3) rgba(245, 241, 232, 0.5)',
        }}
      >
        {children}
      </div>

      {/* Bottom Fade Overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none z-10 transition-opacity duration-500"
        style={{
          background: `linear-gradient(0deg, ${fadeColor} 0%, transparent 100%)`,
          opacity: showBottomFade ? 1 : 0,
        }}
      />
    </div>
  );
};
