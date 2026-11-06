import React from 'react';
import { Search, Download, Upload, Plus, Tag, Award, X } from 'lucide-react';
import { DiscountCode, DiscountType, Product, Collection } from '../../types';
import DiscountEditor from '../DiscountEditor';

interface DiscountsTabProps {
  isDiscountEditorOpen: boolean;
  setIsDiscountEditorOpen: (val: boolean) => void;
  editingDiscount: DiscountCode | null;
  setEditingDiscount: (disc: DiscountCode | null) => void;
  selectedDiscountType: DiscountType | null;
  setSelectedDiscountType: (type: DiscountType | null) => void;
  localProducts: Product[];
  localCollections: Collection[];
  localCustomers: any[];
  discounts: DiscountCode[];
  onUpdateDiscounts: (discounts: DiscountCode[]) => void;
  discountQuery: string;
  setDiscountQuery: (val: string) => void;
  handleExportDiscounts: () => void;
  handleImportDiscounts: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showDiscountTypeSelector: boolean;
  setShowDiscountTypeSelector: (val: boolean) => void;
  filteredDiscounts: DiscountCode[];
  handleToggleDiscountStatus: (id: string) => void;
  handleDeleteDiscount: (id: string) => void;
}

export const DiscountsTab: React.FC<DiscountsTabProps> = ({
  isDiscountEditorOpen,
  setIsDiscountEditorOpen,
  editingDiscount,
  setEditingDiscount,
  selectedDiscountType,
  setSelectedDiscountType,
  localProducts,
  localCollections,
  localCustomers,
  discounts,
  onUpdateDiscounts,
  discountQuery,
  setDiscountQuery,
  handleExportDiscounts,
  handleImportDiscounts,
  showDiscountTypeSelector,
  setShowDiscountTypeSelector,
  filteredDiscounts,
  handleToggleDiscountStatus,
  handleDeleteDiscount
}) => {
  return (
    <div className="space-y-6">
      
      {isDiscountEditorOpen ? (
        <DiscountEditor
          discount={editingDiscount}
          discountType={selectedDiscountType || 'Amount off order'}
          products={localProducts}
          collections={localCollections}
          customers={localCustomers}
          onCancel={() => {
            setIsDiscountEditorOpen(false);
            setEditingDiscount(null);
            setSelectedDiscountType(null);
          }}
          onSave={(savedDiscount) => {
            if (editingDiscount) {
              const updated = discounts.map(d => d.id === savedDiscount.id ? savedDiscount : d);
              onUpdateDiscounts(updated);
            } else {
              onUpdateDiscounts([...discounts, savedDiscount]);
            }
            setIsDiscountEditorOpen(false);
            setEditingDiscount(null);
            setSelectedDiscountType(null);
          }}
        />
      ) : (
        <>
          {/* Header controls select */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Filter coupons codes..."
                value={discountQuery}
                onChange={(e) => setDiscountQuery(e.target.value)}
                className="w-full text-xs p-2 pb-2 pl-8 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500 bg-slate-50"
              />
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportDiscounts}
                className="bg-white hover:bg-slate-50 border border-slate-200 font-bold p-2.5 px-3 rounded-xl text-xs text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Export all discounts to JSON backup file"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" /> Export Backup
              </button>

              <label
                className="bg-white hover:bg-slate-50 border border-slate-200 font-bold p-2.5 px-3 rounded-xl text-xs text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs cursor-pointer"
                title="Import discounts from JSON backup"
              >
                <Upload className="h-3.5 w-3.5 text-slate-500" /> Import Backup
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportDiscounts}
                />
              </label>

              <button
                onClick={() => setShowDiscountTypeSelector(true)}
                className="bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs p-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Create Discount
              </button>
            </div>
          </div>

          {/* Discounts List database table */}
          <div className="bg-white border rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] text-slate-450 font-bold uppercase tracking-widest">
                    <th className="p-4">Promo code</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Eligibility</th>
                    <th className="p-4">Discount Type</th>
                    <th className="p-4 text-center">Combinations</th>
                    <th className="p-4 text-center">Used</th>
                    <th className="p-4">Details</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDiscounts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400">No promo discount campaigns configured.</td>
                    </tr>
                  ) : (
                    filteredDiscounts.map(disc => {
                      const hasCombos = disc.combineWithProductDiscounts || disc.combineWithOrderDiscounts || disc.combineWithShippingDiscounts;
                      return (
                        <tr key={disc.id} className="hover:bg-slate-50/50">
                          <td className="p-4">
                            <button
                              onClick={() => {
                                setEditingDiscount(disc);
                                setSelectedDiscountType(disc.type);
                                setIsDiscountEditorOpen(true);
                              }}
                              className="font-mono font-black text-slate-900 text-xs tracking-wider uppercase bg-slate-100 hover:bg-slate-200 border rounded border-dashed px-2.5 py-1.5 border-slate-300 transition text-left cursor-pointer"
                            >
                              {disc.title}
                            </button>
                          </td>
                          <td className="p-4">
                            <span className={`inline-block py-0.5 px-2 rounded-full font-black text-[9px] uppercase tracking-wide border ${
                              disc.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-150' : 'bg-rose-50 text-rose-700 border-rose-150'
                            }`}>
                              {disc.status}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-slate-700">{disc.eligibility}</td>
                          <td className="p-4 text-indigo-650 font-bold">{disc.type}</td>
                          <td className="p-4 text-center">
                            <div className="flex justify-center gap-1">
                              {disc.combineWithProductDiscounts && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-black" title="Combines with product discounts">PROD</span>
                              )}
                              {disc.combineWithOrderDiscounts && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-black" title="Combines with order discounts">ORDER</span>
                              )}
                              {disc.combineWithShippingDiscounts && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-black" title="Combines with shipping discounts">SHIP</span>
                              )}
                              {!hasCombos && (
                                <span className="text-slate-400 text-xs">—</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center font-extrabold text-slate-800">{disc.used || 0}</td>
                          <td className="p-4 text-slate-500 max-w-xs truncate" title={disc.details}>{disc.details}</td>
                          <td className="p-4 text-center text-xs space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setEditingDiscount(disc);
                                setSelectedDiscountType(disc.type);
                                setIsDiscountEditorOpen(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-850 font-extrabold cursor-pointer"
                            >
                              Edit
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              onClick={() => handleToggleDiscountStatus(disc.id)}
                              className="text-slate-600 hover:text-slate-800 font-extrabold cursor-pointer"
                            >
                              {disc.status === 'Active' ? 'Disable' : 'Enable'}
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              onClick={() => handleDeleteDiscount(disc.id)}
                              className="text-red-500 hover:text-red-700 font-extrabold cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Select Discount Type Modal Popup */}
      {showDiscountTypeSelector && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-extrabold text-slate-900 text-sm">Select discount type</h3>
              <button 
                onClick={() => setShowDiscountTypeSelector(false)} 
                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Options List */}
            <div className="divide-y divide-slate-100">
              
              <button
                onClick={() => {
                  setShowDiscountTypeSelector(false);
                  setSelectedDiscountType('Amount off products');
                  setEditingDiscount(null);
                  setIsDiscountEditorOpen(true);
                }}
                className="w-full p-4 hover:bg-slate-50 text-left transition flex items-start gap-3.5 cursor-pointer group"
              >
                <div className="p-2 bg-slate-100 group-hover:bg-indigo-50 rounded-lg text-slate-600 group-hover:text-indigo-600 shrink-0 mt-0.5">
                  <Tag className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-xs text-slate-900">Amount off products</p>
                    <span className="text-slate-300 font-bold text-sm group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5 font-medium">Discount specific products or collections of products</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowDiscountTypeSelector(false);
                  setSelectedDiscountType('Buy X get Y');
                  setEditingDiscount(null);
                  setIsDiscountEditorOpen(true);
                }}
                className="w-full p-4 hover:bg-slate-50 text-left transition flex items-start gap-3.5 cursor-pointer group"
              >
                <div className="p-2 bg-slate-100 group-hover:bg-indigo-50 rounded-lg text-slate-600 group-hover:text-indigo-600 shrink-0 mt-0.5">
                  <Tag className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-xs text-slate-900">Buy X get Y</p>
                    <span className="text-slate-300 font-bold text-sm group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5 font-medium">Discount specific products or collections of products</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowDiscountTypeSelector(false);
                  setSelectedDiscountType('Amount off order');
                  setEditingDiscount(null);
                  setIsDiscountEditorOpen(true);
                }}
                className="w-full p-4 hover:bg-slate-50 text-left transition flex items-start gap-3.5 cursor-pointer group"
              >
                <div className="p-2 bg-slate-100 group-hover:bg-indigo-50 rounded-lg text-slate-600 group-hover:text-indigo-600 shrink-0 mt-0.5">
                  <Tag className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-xs text-slate-900">Amount off order</p>
                    <span className="text-slate-300 font-bold text-sm group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5 font-medium">Discount the total order amount</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowDiscountTypeSelector(false);
                  setSelectedDiscountType('Free shipping');
                  setEditingDiscount(null);
                  setIsDiscountEditorOpen(true);
                }}
                className="w-full p-4 hover:bg-slate-50 text-left transition flex items-start gap-3.5 cursor-pointer group"
              >
                <div className="p-2 bg-slate-100 group-hover:bg-indigo-50 rounded-lg text-slate-600 group-hover:text-indigo-600 shrink-0 mt-0.5">
                  <Tag className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-xs text-slate-900">Free shipping</p>
                    <span className="text-slate-300 font-bold text-sm group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5 font-medium">Offer free shipping on an order</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowDiscountTypeSelector(false);
                  setSelectedDiscountType('Loyalty Reward');
                  setEditingDiscount(null);
                  setIsDiscountEditorOpen(true);
                }}
                className="w-full p-4 hover:bg-slate-50 text-left transition flex items-start gap-3.5 cursor-pointer group"
              >
                <div className="p-2 bg-amber-50 group-hover:bg-amber-100 rounded-lg text-amber-700 group-hover:text-amber-800 shrink-0 mt-0.5">
                  <Award className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-xs text-[#071d37]">Loyalty Reward</p>
                    <span className="text-amber-400 font-bold text-sm group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5 font-medium">Issue B1G1, % discounts, or star points specifically to loyal customers</p>
                </div>
              </button>

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDiscountTypeSelector(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-250 text-slate-700 text-xs font-bold rounded-lg transition shadow-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default DiscountsTab;
