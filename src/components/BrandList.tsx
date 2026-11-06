import React from 'react';
import { Collection } from '../types';
import { Sparkles, ArrowRight, Library, Building } from 'lucide-react';

interface BrandListProps {
  collections: Collection[];
  onBrandClick: (collectionId: string) => void;
}

export default function BrandList({ collections, onBrandClick }: BrandListProps) {
  // Filter out brand collections (skip 'all')
  const brandCollections = collections.filter(c => c.id !== 'all');

  // Assign aesthetic background gradients and branding icons
  const brandMeta: Record<string, { logoText: string, gradient: string, country: string }> = {
    '77': { logoText: '77', gradient: 'from-blue-650 to-blue-900', country: 'Poland 🇵🇱' },
    'cuba': { logoText: 'CUBA', gradient: 'from-red-600 to-amber-800', country: 'Lithuania 🇱🇹' },
    'clew': { logoText: 'CLEW', gradient: 'from-teal-600 to-cyan-800', country: 'Sweden 🇸🇪' },
    'killa': { logoText: 'KILLA', gradient: 'from-slate-700 to-black', country: 'Denmark 🇩🇰' },
    'maggie': { logoText: 'MAGGIE', gradient: 'from-pink-600 to-purple-800', country: 'Sweden 🇸🇪' },
    'nordic spirit': { logoText: 'NORDIC SPIRIT', gradient: 'from-emerald-600 to-teal-900', country: 'Sweden 🇸🇪' },
    'xqs': { logoText: 'XQS', gradient: 'from-amber-500 to-amber-800', country: 'Sweden 🇸🇪' },
    'zyn': { logoText: 'ZYN', gradient: 'from-blue-500 to-indigo-800', country: 'Sweden 🇸🇪' },
    'pablo': { logoText: 'PABLO', gradient: 'from-rose-700 to-stone-900', country: 'Lithuania 🇱🇹' },
    'fumi': { logoText: 'FUMI', gradient: 'from-indigo-600 to-pink-500', country: 'Sweden 🇸🇪' },
    'velo': { logoText: 'VELO', gradient: 'from-sky-500 to-blue-750', country: 'Sweden 🇸🇪' },
    'white fox': { logoText: 'WHITE FOX', gradient: 'from-slate-350 to-slate-600', country: 'Sweden 🇸🇪' },
    'snu': { logoText: 'SNU', gradient: 'from-purple-700 to-violet-950', country: 'Norway 🇳🇴' }
  };

  return (
    <div id="brands-container" className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Intro display block */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-[10px] bg-slate-100 text-slate-800 font-bold py-1 px-3.5 rounded-full uppercase tracking-widest inline-flex items-center gap-1.5">
          <Library className="h-3.5 w-3.5" /> Pouch Brands Directory
        </span>
        <h2 className="text-3xl font-extrabold text-slate-800 mt-3 tracking-snug">EXPLORE BRAND COLLECTIONS</h2>
        <p className="text-slate-400 text-xs mt-2">
          Click on any premium brand partner to open their dedicated collection page. View ratings, flavor options, and filter based on nicotine levels.
        </p>
      </div>

      {/* Grid of brand Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {brandCollections.map(col => {
          const cleanId = col.id.toLowerCase().replace('collection-', '').replace('-', ' ').trim();
          const meta = brandMeta[cleanId] || brandMeta[col.title.toLowerCase().trim()] || { logoText: col.title, gradient: 'from-slate-650 to-slate-800', country: 'Europe 🇪🇺' };
          return (
            <div 
              key={col.id}
              onClick={() => onBrandClick(col.id)}
              className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-350 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div>
                {/* Brand visually styled can header banner */}
                <div className={`h-36 rounded-xl bg-gradient-to-tr ${meta.gradient} flex items-center justify-center p-4 relative overflow-hidden mb-4 shadow-inner`}>
                  
                  {/* Subtle vector patterns */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                  
                  <div className="text-center">
                    <span className="font-extrabold text-white text-3xl tracking-widest uppercase block drop-shadow-md">{meta.logoText}</span>
                    <span className="text-[9px] text-white/70 tracking-widest uppercase block mt-1">Official Can</span>
                  </div>

                  <span className="absolute bottom-2.5 right-2 text-[9px] bg-black/45 text-white font-bold py-0.5 px-2 rounded-md">
                    {meta.country}
                  </span>
                </div>

                {/* Info and stats summary */}
                <div className="space-y-1.5 px-1">
                  <h3 className="font-black text-slate-800 text-xs uppercase tracking-wide flex items-center justify-between">
                    <span>{col.title}</span>
                    <span className="text-[9px] text-indigo-600 bg-indigo-50 font-bold py-0.5 px-2 rounded-full border border-indigo-100">
                      {col.productIds.length} Canisters
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{col.description}</p>
                </div>
              </div>

              {/* Card visual CTA row */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 px-1">
                <span className="font-bold flex items-center gap-1">
                  <Building className="h-3.5 w-3.5 text-slate-400" /> Go to Collection
                </span>
                <span className="text-indigo-600 font-extrabold group-hover:translate-x-1.5 transition-transform flex items-center gap-1">
                  Browse Pouches <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
