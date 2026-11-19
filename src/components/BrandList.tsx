import React from 'react';
import { Collection } from '../types';
import { ArrowRight } from 'lucide-react';
import { cleanMediaUrl } from '../utils/mediaUtils';

interface BrandListProps {
  collections: Collection[];
  onBrandClick: (collectionId: string) => void;
}

/** The /brands page: every collection as a card, using its own image. */
export default function BrandList({ collections, onBrandClick }: BrandListProps) {
  const brandCollections = collections.filter(c => c && c.id !== 'all' && c.title);

  return (
    <div id="brands-container" className="max-w-7xl mx-auto px-4 py-10">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Collections</span>
        <h2 className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">Shop by collection</h2>
        <p className="text-slate-500 text-sm mt-2">Choose a collection to see everything in it.</p>
      </div>

      {brandCollections.length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-16 border border-dashed rounded-2xl">No collections yet.</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {brandCollections.map(col => {
            const count = (col.productIds || []).length;
            const image = col.image ? cleanMediaUrl(col.image) : '';
            return (
              <button
                type="button"
                key={col.id}
                onClick={() => onBrandClick(col.id)}
                className="group text-left bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <div className="aspect-[4/3] bg-slate-100 overflow-hidden flex items-center justify-center">
                  {image ? (
                    <img src={image} alt={col.title} loading="lazy" className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                  ) : (
                    <span className="text-4xl font-semibold text-slate-300">{col.title.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 text-sm">{col.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{count} {count === 1 ? 'product' : 'products'}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-900">
                    Shop now <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
