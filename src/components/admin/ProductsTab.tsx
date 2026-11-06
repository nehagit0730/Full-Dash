import React from 'react';
import { Search, Package, Download, Upload, Plus, CheckCircle2, EyeOff, Trash2, Pencil, Copy, Eye } from 'lucide-react';
import { Product, Collection } from '../../types';
import ProductEditor from '../ProductEditor';

interface ProductsTabProps {
  editingProduct: Product | null;
  showAddProduct: boolean;
  setEditingProduct: (prod: Product | null) => void;
  setShowAddProduct: (val: boolean) => void;
  collections: Collection[];
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  onUpdateCollections: (collections: Collection[]) => void;
  productQuery: string;
  setProductQuery: (val: string) => void;
  filteredProductsAdmin: Product[];
  handleExportProducts: () => void;
  handleImportProducts: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedProductIds: string[];
  handleSelectAllProducts: (checked: boolean) => void;
  handleBulkStatusProducts: (status: 'Active' | 'Draft') => void;
  handleBulkDeleteProducts: () => void;
  handleSelectProduct: (id: string, checked: boolean) => void;
  handleEditProductClick: (prod: Product) => void;
  handleDuplicateProduct: (prod: Product) => void;
  handlePreviewProduct: (prod: Product) => void;
  handleDeleteProduct: (id: string) => void;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({
  editingProduct,
  showAddProduct,
  setEditingProduct,
  setShowAddProduct,
  collections,
  products,
  onUpdateProducts,
  onUpdateCollections,
  productQuery,
  setProductQuery,
  filteredProductsAdmin,
  handleExportProducts,
  handleImportProducts,
  selectedProductIds,
  handleSelectAllProducts,
  handleBulkStatusProducts,
  handleBulkDeleteProducts,
  handleSelectProduct,
  handleEditProductClick,
  handleDuplicateProduct,
  handlePreviewProduct,
  handleDeleteProduct
}) => {
  return (
    <div className="space-y-6">
      {editingProduct || showAddProduct ? (
        <ProductEditor
          product={editingProduct}
          allCollections={collections}
          onCancel={() => {
            setEditingProduct(null);
            setShowAddProduct(false);
          }}
          onSave={(savedProduct, selectedCollectionIds) => {
            const isNew = !products.some(p => p.id === savedProduct.id);
            let updatedProducts;
            if (isNew) {
              updatedProducts = [savedProduct, ...products];
            } else {
              updatedProducts = products.map(p => p.id === savedProduct.id ? savedProduct : p);
            }
            onUpdateProducts(updatedProducts);

            // Synchronize Collection Memberships
            const updatedCollections = collections.map(col => {
              const belongs = selectedCollectionIds.includes(col.id);
              const alreadyHas = col.productIds.includes(savedProduct.id);

              if (belongs && !alreadyHas) {
                return { ...col, productIds: [...col.productIds, savedProduct.id] };
              } else if (!belongs && alreadyHas) {
                return { ...col, productIds: col.productIds.filter(id => id !== savedProduct.id) };
              }
              return col;
            });
            onUpdateCollections(updatedCollections);

            setEditingProduct(null);
            setShowAddProduct(false);
          }}
          onDelete={(productId) => {
            const updated = products.filter(p => p.id !== productId);
            onUpdateProducts(updated);

            // Clean up collection references
            const updatedColls = collections.map(c => ({
              ...c,
              productIds: c.productIds.filter(id => id !== productId)
            }));
            onUpdateCollections(updatedColls);

            setEditingProduct(null);
            setShowAddProduct(false);
          }}
        />
      ) : (
        <>
          {/* Header menu filter */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Seach products via titles, vendors..."
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  className="w-full text-xs p-2 pb-2 pl-8 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500 bg-slate-50"
                />
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-slate-600 text-xs font-bold whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5 border border-slate-150">
                <Package className="h-3.5 w-3.5 text-slate-500" />
                <span>{filteredProductsAdmin.length} products on list</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportProducts}
                className="bg-white hover:bg-slate-50 border border-slate-200 font-bold p-2.5 px-3 rounded-xl text-xs text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Export all products to JSON backup file"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" /> Export Backup
              </button>

              <label
                className="bg-white hover:bg-slate-50 border border-slate-200 font-bold p-2.5 px-3 rounded-xl text-xs text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Import products from JSON or CSV backup"
              >
                <Upload className="h-3.5 w-3.5 text-slate-500" /> Import Backup
                <input
                  type="file"
                  accept=".json,.csv"
                  className="hidden"
                  onChange={handleImportProducts}
                />
              </label>

              <button
                onClick={() => {
                  setEditingProduct(null);
                  setShowAddProduct(true);
                }}
                className="bg-slate-900 hover:bg-slate-850 font-bold p-2.5 px-4 rounded-xl text-xs text-white flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap"
              >
                <Plus className="h-4 w-4" /> Add Product Item
              </button>
            </div>
          </div>

          {/* Products Inventory Grid table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            {/* Bulk Actions Bar */}
            {selectedProductIds.length > 0 && (
              <div className="bg-slate-50 border-b border-slate-200 p-3 px-4 flex flex-wrap items-center justify-between gap-2 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox"
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 h-4 w-4 cursor-pointer"
                    checked={filteredProductsAdmin.length > 0 && filteredProductsAdmin.every(p => selectedProductIds.includes(p.id))}
                    onChange={(e) => handleSelectAllProducts(e.target.checked)}
                  />
                  <span className="text-xs font-bold text-slate-700">
                    {selectedProductIds.length} selected <span className="text-slate-400 font-normal">({filteredProductsAdmin.length} total on list)</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkStatusProducts('Active')}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-extrabold text-slate-700 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Set as active
                  </button>
                  <button
                    onClick={() => handleBulkStatusProducts('Draft')}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-extrabold text-slate-700 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <EyeOff className="h-3.5 w-3.5 text-slate-500" />
                    Set as draft
                  </button>
                  <button
                    onClick={handleBulkDeleteProducts}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-extrabold text-red-650 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete bulk
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] text-slate-450 font-semibold uppercase tracking-widest">
                    <th className="p-4 w-12 text-center">
                      <input 
                        type="checkbox"
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 h-4 w-4 cursor-pointer"
                        checked={filteredProductsAdmin.length > 0 && filteredProductsAdmin.every(p => selectedProductIds.includes(p.id))}
                        onChange={(e) => handleSelectAllProducts(e.target.checked)}
                      />
                    </th>
                    <th className="p-4">Image</th>
                    <th className="p-4">Product Title</th>
                    <th className="p-4">Brand</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">In Stock Inventory</th>
                    <th className="p-4 text-right">Selling Price</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150/70">
                  {filteredProductsAdmin.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400">No products configured yet.</td>
                    </tr>
                  ) : (
                    filteredProductsAdmin.map(prod => (
                      <tr 
                        key={prod.id} 
                        className="hover:bg-slate-50/60 cursor-pointer transition-colors"
                        onClick={() => handleEditProductClick(prod)}
                      >
                        <td className="p-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox"
                            className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 h-4 w-4 cursor-pointer"
                            checked={selectedProductIds.includes(prod.id)}
                            onChange={(e) => handleSelectProduct(prod.id, e.target.checked)}
                          />
                        </td>
                        <td className="p-4 shrink-0">
                          <img
                            src={prod.image}
                            alt=""
                            className="w-10 h-10 object-cover rounded-md bg-slate-50 border border-slate-100"
                            referrerPolicy="no-referrer"
                          />
                        </td>
                        <td className="p-4 font-bold text-slate-900 leading-normal max-w-xs">{prod.title}</td>
                        <td className="p-4 font-bold text-indigo-650">{prod.vendor}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-block py-0.5 px-2 rounded-full font-black text-[9px] uppercase tracking-wider ${
                            prod.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {prod.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`font-black text-xs ${prod.inventory <= 15 ? 'text-rose-500' : 'text-slate-800'}`}>
                            {prod.inventory} units {prod.inventory <= 15 ? '⚠️ low' : ''}
                          </span>
                        </td>
                        <td className="p-4 text-right font-extrabold text-slate-900">£{(Number(prod.price) || 0).toFixed(2)}</td>
                        <td className="p-4 text-center text-xs whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            {/* Edit Product Action */}
                            <div className="relative group/tooltip">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditProductClick(prod);
                                }}
                                className="p-1.5 bg-indigo-50 hover:bg-indigo-150 text-indigo-700 rounded-md transition-all cursor-pointer hover:scale-105"
                                aria-label="Edit"
                                title="Edit product"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                                Edit
                              </div>
                            </div>

                            {/* Duplicate Action */}
                            <div className="relative group/tooltip">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicateProduct(prod);
                                }}
                                className="p-1.5 bg-teal-50 hover:bg-teal-150 text-teal-700 rounded-md transition-all cursor-pointer hover:scale-105"
                                aria-label="Duplicate"
                                title="Duplicate product"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                                Dup
                              </div>
                            </div>

                            {/* View Action */}
                            <div className="relative group/tooltip">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePreviewProduct(prod);
                                }}
                                className="p-1.5 bg-sky-50 hover:bg-sky-150 text-sky-700 rounded-md transition-all cursor-pointer hover:scale-105"
                                aria-label="View"
                                title="Preview product"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                                View
                              </div>
                            </div>

                            {/* Delete Action */}
                            <div className="relative group/tooltip">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteProduct(prod.id);
                                }}
                                className="p-1.5 bg-red-50 hover:bg-red-150 text-red-650 rounded-md transition-all cursor-pointer hover:scale-105"
                                aria-label="Delete"
                                title="Delete product"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                                Del
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductsTab;
