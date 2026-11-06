import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { cleanMediaUrl, PLACEHOLDER_IMAGE } from '../utils/mediaUtils';

interface Slide {
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
}

interface PremiumSlideshowProps {
  slides?: Slide[];
  fullWidth?: boolean;
  backgroundColor?: string;
  headingColor?: string;
  textColor?: string;
  onLinkClick: (link?: string) => void;
}

const DEFAULT_SLIDES: Slide[] = [
  {
    title: 'Precision-Engineered Pouch Purity',
    description: 'Sourced directly from certified laboratories utilizing medical-grade plant fiber and vacuum-fresh locks.',
    imageUrl: PLACEHOLDER_IMAGE,
    buttonText: 'View Laboratory Journal',
    buttonLink: 'blogs'
  },
  {
    title: 'Extreme Mint Cryo Freeze',
    description: 'Sub-zero locking technology delivering an immediate, absolute sensory refreshing experience.',
    imageUrl: PLACEHOLDER_IMAGE,
    buttonText: 'Explore Sub-Zero Bundles',
    buttonLink: 'frontend-shop'
  }
];

export default function PremiumSlideshow({
  slides = DEFAULT_SLIDES,
  fullWidth = true,
  backgroundColor = '#FFFFFF',
  headingColor = '#0F172A',
  textColor = '#475569',
  onLinkClick
}: PremiumSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const autoplayTimer = useRef<NodeJS.Timeout | null>(null);

  const activeSlides = slides && slides.length > 0 ? slides : DEFAULT_SLIDES;

  useEffect(() => {
    if (!isHovered && activeSlides.length > 1) {
      autoplayTimer.current = setInterval(() => {
        handleNext();
      }, 5500);
    }
    return () => {
      if (autoplayTimer.current) {
        clearInterval(autoplayTimer.current);
      }
    };
  }, [currentIndex, isHovered, activeSlides]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden transition-all duration-300 ${
        fullWidth 
          ? 'w-full h-[380px] sm:h-[460px] md:h-[540px]' 
          : 'max-w-7xl mx-auto rounded-3xl border border-slate-200/60 shadow-md h-[400px] sm:h-[480px]'
      }`}
      style={{ backgroundColor }}
    >
      {/* Slides track */}
      <div className="w-full h-full relative">
        {activeSlides.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div
              key={idx}
              className={`absolute inset-0 w-full h-full transition-all duration-700 ease-out flex items-center ${
                isActive 
                  ? 'opacity-100 translate-x-0 pointer-events-auto z-10' 
                  : 'opacity-0 translate-x-4 pointer-events-none z-0'
              }`}
            >
              {/* Background cover image with sleek gradient overlay */}
              <div className="absolute inset-0">
                <img
                  src={cleanMediaUrl(slide.imageUrl)}
                  alt={slide.title}
                  className="w-full h-full object-cover transition-transform duration-10000 ease-linear scale-100 group-hover:scale-102"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-transparent sm:block hidden" />
                <div className="absolute inset-0 bg-slate-950/75 sm:hidden" /> {/* Stronger dark overlay on mobile */}
              </div>

              {/* Slide Content card */}
              <div className="max-w-7xl mx-auto px-6 sm:px-12 md:px-16 w-full relative z-20 text-left text-white">
                <div className="max-w-2xl space-y-4 sm:space-y-6">
                  
                  {/* Subtle Top Badge */}
                  <div className="inline-flex items-center gap-1.5 bg-indigo-600/90 text-white font-extrabold uppercase tracking-widest text-[8px] sm:text-[9px] py-1 px-3 rounded-full border border-indigo-400/30 animate-pulse">
                    <span>Exclusive Collection</span>
                  </div>

                  {/* High display elegant title */}
                  <h2 
                    className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight leading-tight stroke-slate-900"
                    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}
                  >
                    {slide.title}
                  </h2>

                  {/* Description subtext */}
                  <p 
                    className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg hidden sm:block"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                  >
                    {slide.description}
                  </p>
                  
                  {/* Mobile-only description (shorter) */}
                  <p className="text-[11px] text-slate-205 leading-relaxed block sm:hidden">
                    {slide.description.substring(0, 100)}...
                  </p>

                  {/* Actions buttons */}
                  {slide.buttonText && (
                    <div className="pt-2">
                      <button
                        onClick={() => onLinkClick(slide.buttonLink)}
                        className="bg-white hover:bg-slate-150 text-slate-950 font-black text-[10px] sm:text-xs py-3 px-6 sm:px-8 rounded-xl shadow-lg transition-all duration-300 cursor-pointer flex items-center gap-2 uppercase tracking-wider group"
                      >
                        <span>{slide.buttonText}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </button>
                    </div>
                  )}

                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Nav Controls - Left/Right arrows (Show only if multiple slides) */}
      {activeSlides.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-md border border-white/10 transition-colors z-20 cursor-pointer hidden sm:block select-none"
            aria-label="Previous slide"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-md border border-white/10 transition-colors z-20 cursor-pointer hidden sm:block select-none"
            aria-label="Next slide"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Bottom slide dots Indicators */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-20">
          {activeSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                idx === currentIndex ? 'w-6 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}

    </div>
  );
}
