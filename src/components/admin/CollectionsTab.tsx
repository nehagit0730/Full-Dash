import React from 'react';
import { Search, FolderHeart, Download, Upload, Plus, Trash2, Pencil, Copy, Eye } from 'lucide-react';
import { Collection, Product } from '../../types';
import CollectionEditor from '../CollectionEditor';

interface CollectionsTabProps {
  editingCollection: Collection | null;
  setEditingCollection: (col: Collection | null) => void;
  products: Product[];
  collections: Collection[];
  onUpdateCollections: (collections: Collection[]) => void;
  collectionQuery: string;
  setCollectionQuery: (val: string) => void;
  filteredCollections: Collection[];
  handleExportCollections: () => void;
  handleImportCollections: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedCollectionIds: string[];
  handleSelectAllCollections: (checked: boolean) => void;
  handleBulkDeleteCollections: () => void;
  handleSelectCollection: (id: string, checked: boolean) => void;
  setNewCollectionForm: (col: Collection) => void;
  handleDuplicateCollection: (col: Collection) => void;
  handlePreviewCollection: (col: Collection) => void;
  handleDeleteCollection: (id: string) => void;
}

export const CollectionsTab: React.FC<CollectionsTabProps> = ({
  editingCollection,
  setEditingCollection,
  products,
  collections,
  onUpdateCollections,
  collectionQuery,
  setCollectionQuery,
  filteredCollections,
  handleExportCollections,
  handleImportCollections,
  selectedCollectionIds,
  handleSelectAllCollections,
  handleBulkDeleteCollections,
  handleSelectCollection,
  setNewCollectionForm,
  handleDuplicateCollection,
  handlePreviewCollection,
  handleDeleteCollection
}) => {
  return (
    <div className="space-y-6">
      {editingCollection ? (
        <CollectionEditor
          collection={editingCollection.id === 'new_temp_draft_col' ? null : editingCollection}
          allProducts={products}
          onSave={(savedCol) => {
            const cleanedCol: Collection = {
              ...savedCol,
              id: editingCollection.id === 'new_temp_draft_col' ? savedCol.id : editingCollection.id
            };
            const exists = collections.some(c => c.id === cleanedCol.id);
            let updatedColls;
            if (exists) {
              updatedColls = collections.map(c => c.id === cleanedCol.id ? cleanedCol : c);
            } else {
              let finalId = cleanedCol.id;
              while (collections.some(c => c.id === finalId)) {
                finalId = `${finalId}-${Math.floor(Math.random() * 100)}`;
              }
              updatedColls = [...collections, { ...cleanedCol, id: finalId }];
            }
            onUpdateCollections(updatedColls);
            setEditingCollection(null);
          }}
          onCancel={() => {
            setEditingCollection(null);
          }}
          onDelete={(deletedId) => {
            const updatedColls = collections.filter(c => c.id !== deletedId);
            onUpdateCollections(updatedColls);
            setEditingCollection(null);
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
                  placeholder="Search collections..."
                  value={collectionQuery}
                  onChange={(e) => setCollectionQuery(e.target.value)}
                  className="w-full text-xs p-2 pb-2 pl-8 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500 bg-slate-50"
                />
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-slate-600 text-xs font-bold whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5 border border-slate-150">
                <FolderHeart className="h-3.5 w-3.5 text-slate-500" />
                <span>{filteredCollections.length} collections on list</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportCollections}
                className="bg-white hover:bg-slate-50 border border-slate-200 font-bold p-2.5 px-3 rounded-xl text-xs text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Export all collections to JSON backup file"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" /> Export Backup
              </button>

              <label
                className="bg-white hover:bg-slate-50 border border-slate-200 font-bold p-2.5 px-3 rounded-xl text-xs text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs cursor-pointer"
                title="Import collections from JSON backup"
              >
                <Upload className="h-3.5 w-3.5 text-slate-500" /> Import Backup
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportCollections}
                />
              </label>

              <button
                onClick={() => setEditingCollection({
                  id: 'new_temp_draft_col',
                  title: '',
                  description: '',
                  type: 'Manual',
                  image: '',
                  productIds: []
                })}
                className="bg-slate-900 hover:bg-slate-850 font-bold p-2.5 px-4 rounded-xl text-xs text-white flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Create Collection Box
              </button>
            </div>
          </div>

          {/* Collections Table Grid list */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            {/* Bulk Actions Bar */}
            {selectedCollectionIds.length > 0 && (
              <div className="bg-slate-50 border-b border-slate-200 p-3 px-4 flex flex-wrap items-center justify-between gap-2 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox"
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 h-4 w-4 cursor-pointer"
                    checked={filteredCollections.filter(c => c.id !== 'all').length > 0 && filteredCollections.filter(c => c.id !== 'all').every(c => selectedCollectionIds.includes(c.id))}
                    onChange={(e) => handleSelectAllCollections(e.target.checked)}
                  />
                  <span className="text-xs font-bold text-slate-700">
                    {selectedCollectionIds.length} selected <span className="text-slate-400 font-normal">({filteredCollections.filter(c => c.id !== 'all').length} total deletable)</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkDeleteCollections}
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
                        checked={filteredCollections.filter(c => c.id !== 'all').length > 0 && filteredCollections.filter(c => c.id !== 'all').every(c => selectedCollectionIds.includes(c.id))}
                        onChange={(e) => handleSelectAllCollections(e.target.checked)}
                      />
                    </th>
                    <th className="p-4">Image</th>
                    <th className="p-4">Collection Title</th>
                    <th className="p-4">Type</th>
                    <th className="p-4 text-center">Products Count</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150/70">
                  {filteredCollections.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">No collections match the criteria or configured yet.</td>
                    </tr>
                  ) : (
                    filteredCollections.map(col => (
                      <tr 
                        key={col.id} 
                        className="hover:bg-slate-50/60 cursor-pointer transition-colors"
                        onClick={() => {
                          setEditingCollection(col);
                          setNewCollectionForm(col);
                        }}
                      >
                        <td className="p-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                          {col.id !== 'all' ? (
                            <input 
                              type="checkbox"
                              className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 h-4 w-4 cursor-pointer"
                              checked={selectedCollectionIds.includes(col.id)}
                              onChange={(e) => handleSelectCollection(col.id, e.target.checked)}
                            />
                          ) : (
                            <span className="text-slate-300 text-[9px] font-bold uppercase">System</span>
                          )}
                        </td>
                        <td className="p-4 shrink-0">
                          <img
                            src={col.image}
                            alt=""
                            className="w-10 h-10 object-cover rounded-md bg-slate-50 border border-slate-100"
                            referrerPolicy="no-referrer"
                          />
                        </td>
                        <td className="p-4 font-bold text-slate-900 leading-normal max-w-xs">{col.title}</td>
                        <td className="p-4">
                          <span className={`inline-block py-0.5 px-2 rounded-full font-black text-[9px] uppercase tracking-wider ${
                            col.type === 'Smart' ? 'bg-indigo-50 text-indigo-700 border border-indigo-150' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {col.type}
                          </span>
                        </td>
                        <td className="p-4 text-center font-black text-xs text-slate-800">
                          {col.id === 'all' ? products.length : col.productIds.length} products
                        </td>
                        <td className="p-4 text-center text-xs whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            {/* Edit Action */}
                            <div className="relative group/tooltip">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingCollection(col);
                                  setNewCollectionForm(col);
                                }}
                                className="p-1.5 bg-indigo-50 hover:bg-indigo-150 text-indigo-700 rounded-md transition-all cursor-pointer hover:scale-105"
                                aria-label="Edit"
                                title="Edit collection"
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
                                  handleDuplicateCollection(col);
                                }}
                                className="p-1.5 bg-teal-50 hover:bg-teal-150 text-teal-700 rounded-md transition-all cursor-pointer hover:scale-105"
                                aria-label="Duplicate"
                                title="Duplicate collection"
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
                                  handlePreviewCollection(col);
                                }}
                                className="p-1.5 bg-sky-50 hover:bg-sky-150 text-sky-700 rounded-md transition-all cursor-pointer hover:scale-105"
                                aria-label="View"
                                title="Preview collection"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                                View
                              </div>
                            </div>

                            {/* Delete Action */}
                            {col.id !== 'all' && (
                              <div className="relative group/tooltip">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCollection(col.id);
                                  }}
                                  className="p-1.5 bg-red-50 hover:bg-red-150 text-red-650 rounded-md transition-all cursor-pointer hover:scale-105"
                                  aria-label="Delete"
                                  title="Delete collection"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                                  Del
                                </div>
                              </div>
                            )}
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

export default CollectionsTab;
