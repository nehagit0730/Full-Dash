import React from 'react';

interface PlansCanOverlayProps {
  type: 'lite' | 'core' | 'pro' | 'ultimate' | string;
  className?: string;
}

export default function PlansCanOverlay({ type, className = '' }: PlansCanOverlayProps) {
  const lower = type.toLowerCase();

  // Helper to render a high-fidelity 3D tin canister mockup with pure CSS & SVGs
  const renderTin = (brand: string, color: string, textColor: string, badgeText?: string, rotate: string = '0', translate: string = '0') => {
    return (
      <div 
        className="relative w-20 h-20 rounded-full flex flex-col items-center justify-center select-none cursor-pointer transition-all duration-300 hover:scale-105"
        style={{
          background: `radial-gradient(circle at 35% 35%, #ffffff 0%, rgba(255,255,255,0.2) 20%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.4) 100%), ${color}`,
          boxShadow: '0 8px 16px -2px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.4)',
          transform: `rotate(${rotate}) translate(${translate})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Inner rim ridge */}
        <div 
          className="absolute inset-1.5 rounded-full border border-white/25 pointer-events-none"
          style={{
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2), 0 1px 1px rgba(255,255,255,0.2)'
          }}
        />

        {/* Gloss overlay */}
        <div className="absolute top-1 left-2 w-10 h-6 bg-gradient-to-b from-white/30 to-transparent rounded-full transform -rotate-12 pointer-events-none filter blur-[0.5px]" />

        {/* Brand label */}
        <span 
          className="text-[10px] font-black tracking-widest leading-none z-10"
          style={{ 
            color: textColor, 
            textShadow: '0px 1px 2px rgba(0,0,0,0.3), 0px 0px 1px rgba(255,255,255,0.5)',
            fontFamily: '"Space Grotesk", "Inter", sans-serif'
          }}
        >
          {brand}
        </span>

        {/* Strength stars or tiny subtext */}
        {badgeText && (
          <div 
            className="absolute bottom-3 px-1.5 py-0.5 rounded-full text-[6px] font-black tracking-wider leading-none z-10"
            style={{
              backgroundColor: 'rgba(0,0,0,0.65)',
              color: '#ffffff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }}
          >
            {badgeText}
          </div>
        )}
      </div>
    );
  };

  if (lower.includes('ultimate')) {
    // Premium cardboard subscription box showing tins inside
    return (
      <div className={`relative h-28 w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center py-4 shadow-inner ${className}`}>
        {/* Abstract Box structure */}
        <div 
          className="relative w-56 h-20 rounded-lg flex flex-col justify-between p-2"
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            boxShadow: '0 12px 24px -4px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.1)',
            border: '1.5px solid #dfb55a'
          }}
        >
          {/* Box interior lid flap */}
          <div className="absolute -top-3 left-3 right-3 h-3 bg-[#131b2c] border-t border-x border-[#dfb55a]/60 rounded-t-xs opacity-80" />
          
          <div className="flex justify-between items-center px-1">
            <span className="text-[9px] font-black tracking-[0.2em] text-[#dfb55a]">POUCH SUPPLY</span>
            <span className="text-[7px] font-bold tracking-wider text-slate-400">12 PACK</span>
          </div>

          {/* Overlapping tins visible in box */}
          <div className="flex justify-center -space-x-3 mt-1 scale-90">
            <div className="w-10 h-10 rounded-full bg-sky-600 border border-white/20 shadow-md flex items-center justify-center transform -rotate-12">
              <span className="text-[5px] font-black text-white">VELO</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#ec4899] border border-white/20 shadow-md flex items-center justify-center transform rotate-6 z-10">
              <span className="text-[5px] font-black text-white">FUMI</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-300 shadow-md flex items-center justify-center transform -rotate-6 z-20">
              <span className="text-[5px] font-black text-rose-600">PABLO</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-600 border border-white/20 shadow-md flex items-center justify-center transform rotate-12 z-10">
              <span className="text-[5px] font-black text-white">ZYN</span>
            </div>
          </div>

          <div className="flex justify-between items-center px-1 text-[6px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">
            <span>LAB DIRECT</span>
            <span className="text-[#dfb55a] font-bold animate-pulse">PREMIUM BUNDLE</span>
          </div>
        </div>
      </div>
    );
  }

  // overlapping tins representing plans
  let tins = [
    { brand: 'VELO', color: '#14b8a6', textColor: '#ffffff', badge: 'MINT', rotate: '-12deg', translate: '-12px, 2px' },
    { brand: 'FUMI', color: '#8b5cf6', textColor: '#ffffff', badge: 'BERRY', rotate: '5deg', translate: '0px, -4px' },
    { brand: 'PABLO', color: '#f8fafc', textColor: '#dc2626', badge: 'STRONG', rotate: '15deg', translate: '12px, 4px' }
  ];

  if (lower.includes('core')) {
    tins = [
      { brand: '77', color: '#1e293b', textColor: '#facc15', badge: 'ICE', rotate: '-15deg', translate: '-15px, 2px' },
      { brand: 'VELO', color: '#06b6d4', textColor: '#ffffff', badge: 'FREEZE', rotate: '0deg', translate: '0px, -6px' },
      { brand: 'ZYN', color: '#f1f5f9', textColor: '#0284c7', badge: 'COOL', rotate: '12deg', translate: '15px, 4px' }
    ];
  } else if (lower.includes('pro')) {
    tins = [
      { brand: 'VELO', color: '#0d9488', textColor: '#ffffff', badge: 'CITRUS', rotate: '-10deg', translate: '-14px, 1px' },
      { brand: 'PABLO', color: '#ffffff', textColor: '#b91c1c', badge: 'X-TREME', rotate: '8deg', translate: '0px, -5px' },
      { brand: 'ZYN', color: '#1d4ed8', textColor: '#ffffff', badge: 'SPEARMINT', rotate: '-5deg', translate: '14px, 3px' }
    ];
  }

  return (
    <div className={`relative h-28 w-full bg-transparent rounded-2xl flex items-center justify-center py-4 overflow-hidden ${className}`}>
      {/* Background shadow glow */}
      <div className="absolute inset-0 bg-radial-gradient from-white/10 to-transparent pointer-events-none" />
      
      {/* 3D Glass Shelf Reflection shadow */}
      <div 
        className="absolute bottom-5 inset-x-6 h-[4px] rounded-full blur-[2px]" 
        style={{ background: 'rgba(0,0,0,0.15)' }}
      />

      <div className="flex items-center justify-center -space-x-8 scale-90">
        <div style={{ zIndex: 10 }}>
          {renderTin(tins[0].brand, tins[0].color, tins[0].textColor, tins[0].badge, tins[0].rotate, tins[0].translate)}
        </div>
        <div style={{ zIndex: 30 }}>
          {renderTin(tins[1].brand, tins[1].color, tins[1].textColor, tins[1].badge, tins[1].rotate, tins[1].translate)}
        </div>
        <div style={{ zIndex: 20 }}>
          {renderTin(tins[2].brand, tins[2].color, tins[2].textColor, tins[2].badge, tins[2].rotate, tins[2].translate)}
        </div>
      </div>
    </div>
  );
}
