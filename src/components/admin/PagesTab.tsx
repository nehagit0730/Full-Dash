import React, { useState } from 'react';
import { 
  CustomPage, PageSection, Product, Collection, BlogPost 
} from '../../types';
import { 
  Download, Upload, Plus, Settings, Clipboard, Eye, Trash2, Globe, MoveUp, MoveDown, 
  GripVertical, RefreshCw, Check, Save, Search, X, ImageIcon, Columns, Grid, ShoppingBag, 
  FolderHeart, PlaySquare, Video, FileText, Sparkles, Layers, Award, HelpCircle, BookOpen, 
  LayoutGrid, Compass, Flame, ChevronLeft, ChevronRight, Info, Edit3
} from 'lucide-react';
import ImageUploadInput, { renderMediaThumbnail, isVideoUrl, isPdfOrDocUrl } from '../ImageUploadInput';
import { cleanMediaUrl, PLACEHOLDER_IMAGE } from '../../utils/mediaUtils';
import { AVAILABLE_SECTION_TEMPLATES, getSectionLabel, getSectionIcon } from '../AdminDashboard';
import PageRenderer from '../PageRenderer';

export interface PagesTabProps {
  /**
   * Moves a page to the recycle bin, server-side. Resolves false when the
   * server refused, so the caller leaves its list alone rather than hiding a
   * page that is still live.
   */
  onRecyclePage: (id: string) => Promise<boolean>;
  localPages: CustomPage[];
  setLocalPages: React.Dispatch<React.SetStateAction<CustomPage[]>>;
  onUpdateCustomPages: (newPages: CustomPage[]) => void;
  selectedBuilderPageId: string | null;
  setSelectedBuilderPageId: (id: string | null) => void;
  selectedBuilderSectionId: string | null;
  setSelectedBuilderSectionId: (id: string | null) => void;
  currentlyEditingPage?: CustomPage;
  currentlyEditingSection?: PageSection;
  showAddPage: boolean;
  setShowAddPage: (show: boolean) => void;
  newPageForm: { title: string; slug: string };
  setNewPageForm: React.Dispatch<React.SetStateAction<{ title: string; slug: string }>>;
  handleAddPageSubmit: (e: React.FormEvent) => void;
  handleExportPages: () => void;
  handleImportPages: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSetPageAsHomepage: (id: string) => void;
  handleDuplicatePage: (page: CustomPage) => void;
  handlePreviewPage: (page: CustomPage) => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (val: boolean) => void;
  isSaving: boolean;
  handleGlobalSave: () => void;
  handleGlobalDiscard: () => void;
  handleMoveSection: (index: number, direction: 'up' | 'down') => void;
  handleMoveSectionTo: (fromIndex: number, toIndex: number) => void;
  handleRemoveSectionFromPage: (sectionId: string) => void;
  handleAddSectionToPage: (type: any) => void;
  handleUpdateSectionSettings: (key: string, value: any) => void;
  moduleSearchQuery: string;
  setModuleSearchQuery: (val: string) => void;
  products: Product[];
  collections: Collection[];
  blogs: BlogPost[];
}

export const PagesTab: React.FC<PagesTabProps> = ({
  onRecyclePage,
  localPages,
  setLocalPages,
  onUpdateCustomPages,
  selectedBuilderPageId,
  setSelectedBuilderPageId,
  selectedBuilderSectionId,
  setSelectedBuilderSectionId,
  currentlyEditingPage,
  currentlyEditingSection,
  showAddPage,
  setShowAddPage,
  newPageForm,
  setNewPageForm,
  handleAddPageSubmit,
  handleExportPages,
  handleImportPages,
  handleSetPageAsHomepage,
  handleDuplicatePage,
  handlePreviewPage,
  hasUnsavedChanges,
  setHasUnsavedChanges,
  isSaving,
  handleGlobalSave,
  handleGlobalDiscard,
  handleMoveSection,
  handleMoveSectionTo,
  handleRemoveSectionFromPage,
  handleAddSectionToPage,
  handleUpdateSectionSettings,
  moduleSearchQuery,
  setModuleSearchQuery,
  products,
  collections,
  blogs,
}) => {
  const [editingMetaPageId, setEditingMetaPageId] = useState<string | null>(null);

  const handleUpdatePageMeta = (pageId: string, updates: { title?: string; slug?: string; visibility?: 'Visible' | 'Hidden' }) => {
    const updated = localPages.map(p => {
      if (p.id === pageId || p.slug === pageId) {
        let cleanSlug = updates.slug !== undefined ? updates.slug : p.slug;
        if (updates.slug !== undefined && !p.isHomepage) {
          cleanSlug = updates.slug
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9-/]+/g, '-')
            .replace(/^-+|-+$/g, '');
        }
        return {
          ...p,
          title: updates.title !== undefined ? updates.title : p.title,
          slug: cleanSlug,
          visibility: updates.visibility !== undefined ? updates.visibility : p.visibility,
          updatedAt: 'Just Now'
        };
      }
      return p;
    });
    setLocalPages(updated);
    onUpdateCustomPages(updated);
    setHasUnsavedChanges(true);
  };

  return (
    <div className="space-y-6">
      
      {/* If no page is selected for editing/building, list customizable pages */}
      {!selectedBuilderPageId ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
            <span className="text-xs text-slate-500 font-extrabold uppercase tracking-wider">List of customizable templates ({localPages.length})</span>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportPages}
                className="bg-white hover:bg-slate-50 border border-slate-200 font-bold p-2.5 px-3 rounded-xl text-xs text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Export all pages to JSON backup file"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" /> Export Backup
              </button>

              <label
                className="bg-white hover:bg-slate-50 border border-slate-200 font-bold p-2.5 px-3 rounded-xl text-xs text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs cursor-pointer"
                title="Import pages from JSON backup"
              >
                <Upload className="h-3.5 w-3.5 text-slate-500" /> Import Backup
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportPages}
                />
              </label>

              <button
                onClick={() => setShowAddPage(true)}
                className="bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs p-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Page Template
              </button>
            </div>
          </div>

          <div className="bg-white border rounded-xl divide-y divide-slate-100 shadow-xs">
            {localPages.map(page => {
              const isEditingThis = editingMetaPageId === page.id;
              return (
                <div key={page.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50/50">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          {page.title}
                        </h4>
                        <span className={`text-[8px] py-0.5 px-1.5 font-bold uppercase tracking-widest rounded ${
                          page.visibility === 'Visible' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {page.visibility}
                        </span>
                        {page.isHomepage && (
                          <span className="text-[8px] py-0.5 px-1.5 font-black uppercase tracking-widest rounded bg-amber-500 text-white flex items-center gap-1">
                            🏠 Active Homepage
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] text-slate-400">
                          Route URL: <span className="font-mono bg-slate-100 font-bold text-slate-700 px-1 py-0.5 rounded border border-slate-200">{page.isHomepage ? '/' : `/pages/${page.slug}`}</span> • Last updated {page.updatedAt || 'Just Now'}
                        </p>
                        {!page.isHomepage && (
                          <button
                            onClick={() => setEditingMetaPageId(isEditingThis ? null : page.id)}
                            className="text-[9px] font-extrabold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition cursor-pointer flex items-center gap-1"
                            title="Edit Title and Slug"
                          >
                            <Edit3 className="h-2.5 w-2.5" /> Edit Slug & Title
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      {!page.isHomepage && (
                        <button
                          onClick={() => handleSetPageAsHomepage(page.id)}
                          className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-extrabold py-1.5 px-3 rounded-lg border border-indigo-100 cursor-pointer"
                        >
                          Set as Homepage
                        </button>
                      )}
                      {/* Customize Layout (Settings Icon) */}
                      <div className="relative group/tooltip">
                        <button
                          onClick={() => setSelectedBuilderPageId(page.id)}
                          className="p-1.5 bg-teal-50 hover:bg-teal-150 text-teal-700 rounded-md transition-all cursor-pointer hover:scale-105"
                          aria-label="Customize Layout"
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                          Customize Layout
                        </div>
                      </div>

                      {/* Duplicate (Duplicate Icon) */}
                      <div className="relative group/tooltip">
                        <button
                          onClick={() => handleDuplicatePage(page)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-all cursor-pointer hover:scale-105"
                          aria-label="Duplicate"
                        >
                          <Clipboard className="h-3.5 w-3.5" />
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-0.5 bg-[#1a1c1d] text-white text-[9px] font-black rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                          Duplicate Page
                        </div>
                      </div>

                      {/* Preview (Eye/Preview Icon) */}
                      <div className="relative group/tooltip">
                        <button
                          onClick={() => handlePreviewPage(page)}
                          className="p-1.5 bg-sky-50 hover:bg-sky-150 text-sky-700 rounded-md transition-all cursor-pointer hover:scale-105"
                          aria-label="Preview"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                          Preview Page
                        </div>
                      </div>

                      {/* Delete (Trash Icon - disable if active homepage for safety) */}
                      <div className="relative group/tooltip">
                        <button
                          disabled={page.isHomepage}
                          onClick={async () => {
                            // Through the recycle bin, like every other delete
                            // in the dashboard. This used to fire DELETE
                            // /api/custompages/:id twice — once by id, once by
                            // slug — without awaiting either, which destroyed
                            // the page outright and bypassed the bin entirely.
                            if (!confirm(`Delete "${page.title}"? It will be moved to the Recycle Bin, where you can restore it for 30 days.`)) return;
                            const pageId = page.id || page.slug;
                            if (!pageId) return;
                            if (!(await onRecyclePage(pageId))) return;
                            const updated = localPages.filter(p => p.id !== page.id && p.slug !== page.slug);
                            setLocalPages(updated);
                            onUpdateCustomPages(updated);
                          }}
                          className={`p-1.5 rounded-md transition-all flex items-center justify-center ${
                            page.isHomepage
                              ? 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                              : 'bg-red-50 hover:bg-red-150 text-red-650 cursor-pointer hover:scale-105'
                          }`}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                          {page.isHomepage ? 'Homepage Cannot Be Deleted' : 'Delete Page'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isEditingThis && (
                    <div className="bg-indigo-50/70 border border-indigo-200 p-3.5 rounded-xl space-y-3 mt-1 shadow-inner">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                          <Edit3 className="h-3.5 w-3.5 text-indigo-600" /> Modify Page Metadata & Route Slug
                        </span>
                        <button
                          onClick={() => setEditingMetaPageId(null)}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Page Title</label>
                          <input
                            type="text"
                            value={page.title}
                            onChange={(e) => handleUpdatePageMeta(page.id, { title: e.target.value })}
                            className="bg-white border border-indigo-200 text-slate-900 font-bold text-xs p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                          />
                        </div>
                        {!page.isHomepage && (
                          <div>
                            <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Route Slug (/pages/)</label>
                            <input
                              type="text"
                              value={page.slug}
                              onChange={(e) => handleUpdatePageMeta(page.id, { slug: e.target.value })}
                              className="bg-white border border-indigo-200 text-indigo-950 font-mono font-bold text-xs p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                            />
                          </div>
                        )}
                        <div>
                          <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Visibility</label>
                          <select
                            value={page.visibility}
                            onChange={(e) => handleUpdatePageMeta(page.id, { visibility: e.target.value as 'Visible' | 'Hidden' })}
                            className="bg-white border border-indigo-200 text-slate-900 font-bold text-xs p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                          >
                            <option value="Visible">Visible</option>
                            <option value="Hidden">Hidden</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setEditingMetaPageId(null)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-1.5 px-4 rounded-lg cursor-pointer shadow-xs"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Page Modal */}
          {showAddPage && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-sm w-full shadow-2xl">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                  <h3 className="font-extrabold text-slate-800 text-sm">Create Customizable Page</h3>
                  <button onClick={() => setShowAddPage(false)} className="text-slate-400 cursor-pointer text-xs font-bold">Close</button>
                </div>

                <form onSubmit={handleAddPageSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 uppercase tracking-widest text-[9px] mb-1">Page Name</label>
                    <input
                      id="page-form-title"
                      type="text"
                      required
                      placeholder="e.g. Summer Promos"
                      value={newPageForm.title}
                      onChange={(e) => setNewPageForm({ ...newPageForm, title: e.target.value })}
                      className="w-full border p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 uppercase tracking-widest text-[9px] mb-1">Route Slug parameter</label>
                    <input
                      id="page-form-slug"
                      type="text"
                      placeholder="e.g. summer-promotions"
                      value={newPageForm.slug}
                      onChange={(e) => setNewPageForm({ ...newPageForm, slug: e.target.value })}
                      className="w-full border p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 text-white font-bold py-2 rounded-lg cursor-pointer"
                  >
                    Create Page Container
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        // ----------------------------------------------------
        // THE EXQUISITE VISUAL SECTION LAYOUT BUILDER SCREEN
        // ----------------------------------------------------
        <div className="space-y-4">
          {/* Save Options Action Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 text-white p-3.5 px-4 rounded-xl shadow-md border border-slate-800 gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  if (hasUnsavedChanges && !confirm("You have unsaved adjustments! Exit anyway and discard modifications?")) {
                    return;
                  }
                  setSelectedBuilderPageId(null);
                  setSelectedBuilderSectionId(null);
                  setHasUnsavedChanges(false);
                }}
                className="text-white hover:text-slate-300 cursor-pointer text-xs font-bold flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 p-2 py-1 rounded-lg border border-slate-700 transition"
              >
                ← Exit Builder
              </button>

              <div className="flex flex-wrap items-center gap-2 border-l border-slate-800 pl-3">
                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Page Title</label>
                  <input
                    type="text"
                    value={currentlyEditingPage?.title || ''}
                    onChange={(e) => {
                      if (currentlyEditingPage) {
                        handleUpdatePageMeta(currentlyEditingPage.id, { title: e.target.value });
                      }
                    }}
                    className="bg-slate-800 border border-slate-700 text-white font-black text-xs px-2 py-1 rounded focus:outline-none focus:border-indigo-400 w-36 sm:w-44"
                    placeholder="Page Title"
                  />
                </div>
                {!currentlyEditingPage?.isHomepage && (
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">URL Slug (/pages/)</label>
                    <input
                      type="text"
                      value={currentlyEditingPage?.slug || ''}
                      onChange={(e) => {
                        if (currentlyEditingPage) {
                          handleUpdatePageMeta(currentlyEditingPage.id, { slug: e.target.value });
                        }
                      }}
                      className="bg-slate-800 border border-slate-700 text-amber-300 font-mono font-bold text-xs px-2 py-1 rounded focus:outline-none focus:border-indigo-400 w-36 sm:w-48"
                      placeholder="page-slug"
                    />
                  </div>
                )}
                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Visibility</label>
                  <select
                    value={currentlyEditingPage?.visibility || 'Visible'}
                    onChange={(e) => {
                      if (currentlyEditingPage) {
                        handleUpdatePageMeta(currentlyEditingPage.id, { visibility: e.target.value as 'Visible' | 'Hidden' });
                      }
                    }}
                    className="bg-slate-800 border border-slate-700 text-white font-bold text-xs px-2 py-1 rounded focus:outline-none focus:border-indigo-400 cursor-pointer"
                  >
                    <option value="Visible">Visible</option>
                    <option value="Hidden">Hidden</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {hasUnsavedChanges && (
                <button
                  onClick={() => {
                    if (confirm("Revert layout to the last saved state?")) {
                      handleGlobalDiscard();
                      setSelectedBuilderSectionId(null);
                    }
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] py-1.5 px-3 rounded-lg border border-slate-700 cursor-pointer transition"
                >
                  Revert Draft
                </button>
              )}
              <button
                onClick={handleGlobalSave}
                disabled={!hasUnsavedChanges || isSaving}
                className={`font-extrabold text-[10px] py-1.5 px-4 rounded-lg flex items-center gap-1.5 uppercase tracking-wider transition-all duration-300 shadow-sm border ${
                  isSaving
                    ? 'bg-slate-700 text-slate-300 border-slate-700 cursor-wait'
                    : hasUnsavedChanges
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 cursor-pointer ring-4 ring-emerald-400/40 animate-pulse shadow-md shadow-emerald-900/30 font-black'
                    : 'bg-slate-800 text-slate-400 border-slate-700 cursor-not-allowed select-none'
                }`}
              >
                {isSaving ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-300" />
                ) : !hasUnsavedChanges ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                <span>{isSaving ? 'Saving...' : !hasUnsavedChanges ? 'All Saved & Live' : 'Save Changes'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-slate-100 p-5 rounded-2xl border border-slate-250">
            
            {/* 1. Left controls column: Section stacking */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white border rounded-xl p-4 shadow-xs space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h4 className="font-black text-slate-700 uppercase tracking-wide text-xs">Page Sections</h4>
                  <button
                    onClick={() => {
                      if (hasUnsavedChanges && !confirm("You have unsaved adjustments! Exit anyway and discard modifications?")) {
                        return;
                      }
                      setSelectedBuilderPageId(null);
                      setSelectedBuilderSectionId(null);
                      setHasUnsavedChanges(false);
                    }}
                    className="text-[10px] text-slate-400 font-semibold hover:text-slate-600"
                  >
                    ← Exit
                  </button>
                </div>

                {/* Section stacking list */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {currentlyEditingPage?.sections.map((sec, idx) => (
                    <div 
                      key={sec.id}
                      onClick={() => setSelectedBuilderSectionId(sec.id)}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', idx.toString());
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const dragIdxStr = e.dataTransfer.getData('text/plain');
                        if (dragIdxStr !== '') {
                          const dragIdx = parseInt(dragIdxStr, 10);
                          handleMoveSectionTo(dragIdx, idx);
                        }
                      }}
                      className={`p-2 rounded-xl border text-xs flex justify-between items-center transition-all cursor-grab active:cursor-grabbing ${
                        selectedBuilderSectionId === sec.id 
                          ? 'border-indigo-600 bg-indigo-50/30 text-slate-900 shadow-sm' 
                          : 'bg-slate-50 border-slate-200/70 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate pr-1">
                        <GripVertical className="h-3 w-3 text-slate-400 shrink-0 cursor-grab" />
                        <div className="shrink-0 p-1 bg-white border border-slate-200 rounded-lg shadow-2xs">
                          {getSectionIcon(sec.type)}
                        </div>
                        <div className="truncate text-left font-bold text-slate-800">
                          <span className="text-[8px] text-slate-400 block font-mono uppercase leading-none mb-0.5">Sec {idx + 1}</span>
                          <span className="truncate block leading-tight">{getSectionLabel(sec.type)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          disabled={idx === 0}
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleMoveSection(idx, 'up'); }}
                          className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-755 cursor-pointer disabled:opacity-30"
                        >
                          <MoveUp className="h-3 w-3" />
                        </button>
                        <button
                          disabled={idx === (currentlyEditingPage.sections.length - 1)}
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleMoveSection(idx, 'down'); }}
                          className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-755 cursor-pointer disabled:opacity-30"
                        >
                          <MoveDown className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveSectionFromPage(sec.id); }}
                          className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!currentlyEditingPage?.sections || currentlyEditingPage.sections.length === 0) && (
                    <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                      <p className="text-[10px] text-slate-400">No layout modules created yet.</p>
                    </div>
                  )}
                </div>

                {/* Add Section toolbar dropdown */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide mb-1.5">Add Layout Module</label>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Search layout modules..."
                        value={moduleSearchQuery}
                        onChange={(e) => setModuleSearchQuery(e.target.value)}
                        className="w-full text-[11px] p-1.5 pb-2 pl-7 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-650 font-medium"
                      />
                      <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-slate-400" />
                      {moduleSearchQuery && (
                        <button 
                          type="button"
                          onClick={() => setModuleSearchQuery('')}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-605"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-[260px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
                    {AVAILABLE_SECTION_TEMPLATES.filter(item => 
                      item.label.toLowerCase().includes(moduleSearchQuery.toLowerCase()) ||
                      item.desc.toLowerCase().includes(moduleSearchQuery.toLowerCase()) ||
                      item.type.toLowerCase().includes(moduleSearchQuery.toLowerCase())
                    ).map(item => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => handleAddSectionToPage(item.type as any)}
                        className="w-full text-left p-1.5 border border-slate-200 bg-slate-50 hover:bg-indigo-50/40 hover:border-indigo-250 hover:shadow-2xs rounded-xl cursor-pointer flex items-start gap-2.5 transition-all group"
                      >
                        <div className="shrink-0 p-1 rounded-lg bg-white border border-slate-200 group-hover:border-indigo-200 transition-colors shadow-2xs">
                          {getSectionIcon(item.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold text-slate-800 group-hover:text-indigo-650 transition-colors uppercase tracking-tight">{item.label}</span>
                            <Plus className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                          </div>
                          <p className="text-[9px] text-slate-450 leading-tight mt-0.5 line-clamp-1">{item.desc}</p>
                        </div>
                      </button>
                    ))}
                    {AVAILABLE_SECTION_TEMPLATES.filter(item => 
                      item.label.toLowerCase().includes(moduleSearchQuery.toLowerCase()) ||
                      item.desc.toLowerCase().includes(moduleSearchQuery.toLowerCase()) ||
                      item.type.toLowerCase().includes(moduleSearchQuery.toLowerCase())
                    ).length === 0 && (
                      <p className="text-[10px] text-slate-400 text-center py-4">No matching modules found.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* 2. Middle Visual Template Previewer (Interactive Sandbox canvas!) */}
            <div className="lg:col-span-2">
              <div className="bg-white border rounded-xl shadow-md min-h-[60vh] overflow-hidden">
                
                {/* Live browser frame header */}
                <div className="bg-slate-100 border-b border-slate-200 p-3 px-4 flex justify-between items-center text-[10px] text-slate-400 font-bold tracking-wider">
                  <div className="flex gap-1.5 items-center">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="bg-white border border-slate-250 rounded-lg py-1 px-3 text-center text-slate-600 w-auto max-w-md flex items-center justify-center gap-1 font-mono text-xs shadow-2xs">
                    <span className="text-slate-400 select-none">pouch-supply.com/pages/</span>
                    <input
                      type="text"
                      value={currentlyEditingPage?.slug || ''}
                      disabled={currentlyEditingPage?.isHomepage}
                      onChange={(e) => {
                        if (currentlyEditingPage && !currentlyEditingPage.isHomepage) {
                          handleUpdatePageMeta(currentlyEditingPage.id, { slug: e.target.value });
                        }
                      }}
                      placeholder="page-slug"
                      className="bg-amber-50/80 border border-amber-300 text-slate-900 font-bold px-1.5 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono disabled:bg-slate-100 disabled:border-slate-200 cursor-text"
                      title="Click to modify page route slug"
                    />
                  </div>
                  <Globe className="h-3.5 w-3.5" />
                </div>

                {/* Rendering the Page builder canvas content directly */}
                <div className="p-4 space-y-6">
                  
                  {!currentlyEditingPage ? (
                    <div className="text-center py-24 text-slate-400">
                      <p className="font-bold text-slate-600 mb-1">No Page Selected</p>
                      <p className="text-xs">Click on a page from the list to start building.</p>
                    </div>
                  ) : (!currentlyEditingPage.sections || currentlyEditingPage.sections.length === 0) ? (
                    <div className="text-center py-24 text-slate-400">
                      <p className="font-bold text-slate-600 mb-1">Empty Page Template</p>
                      <p className="text-xs">Add section blocks using the left panel menu to build this page.</p>
                    </div>
                  ) : (
                    currentlyEditingPage.sections.map((sec, sIdx) => {
                      const isFocused = selectedBuilderSectionId === sec.id;

                      return (
                        <div 
                          id={`sec-wrapper-${sec.id}`}
                          key={sec.id}
                          onClickCapture={() => setSelectedBuilderSectionId(sec.id)}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', sIdx.toString());
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const dragIdxStr = e.dataTransfer.getData('text/plain');
                            if (dragIdxStr !== '') {
                              const dragIdx = parseInt(dragIdxStr, 10);
                              handleMoveSectionTo(dragIdx, sIdx);
                            }
                          }}
                          className={`relative group rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                            isFocused 
                              ? 'ring-2 ring-indigo-600 border-indigo-600 bg-white shadow-lg scale-[1.002] z-10' 
                              : 'border-slate-200/80 hover:border-indigo-400 bg-white hover:shadow-sm'
                          }`}
                        >
                          {/* Floating action tools overlay */}
                          <div className="absolute right-3 top-2.5 z-30 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity bg-slate-900/90 backdrop-blur-md p-1 px-1.5 rounded-lg shadow-lg border border-slate-700">
                            <button
                              disabled={sIdx === 0}
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleMoveSection(sIdx, 'up'); }}
                              className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                              title="Move Section Up"
                            >
                              <MoveUp className="h-3 w-3" />
                            </button>
                            <button
                              disabled={sIdx === (currentlyEditingPage.sections.length - 1)}
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleMoveSection(sIdx, 'down'); }}
                              className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                              title="Move Section Down"
                            >
                              <MoveDown className="h-3 w-3" />
                            </button>
                            <div className="w-px h-3 bg-slate-700 mx-0.5" />
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleRemoveSectionFromPage(sec.id); }}
                              className="p-1 hover:bg-red-950 rounded-md text-slate-400 hover:text-red-500 cursor-pointer"
                              title="Remove Section"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Overlay tag indicator */}
                          <span className="absolute top-2.5 left-3 bg-slate-900 text-white text-[8px] font-black tracking-widest uppercase py-0.5 px-1.5 rounded-md pointer-events-none opacity-80">
                            {getSectionLabel(sec.type)} {isFocused ? '• EDITING' : ''}
                          </span>

                          {/* Render section in exact live-website fidelity */}
                          <div className="pointer-events-none">
                            <PageRenderer
                              page={{ ...currentlyEditingPage, sections: [sec] }}
                              allProducts={products}
                              allCollections={collections}
                              allBlogs={blogs}
                              loggedInCustomer={null}
                              onAddToCart={() => {}}
                              onToggleWishlist={() => {}}
                              onNavigate={() => {}}
                            />
                          </div>
                          <div className="hidden">
                            
                            {/* 1. IMAGE BANNER */}
                            {sec.type === 'Image banner' && (
                              <div className="text-center space-y-3 py-4">
                                <div className="relative h-28 w-full rounded-xl bg-slate-100 overflow-hidden border">
                                  <img 
                                    src={cleanMediaUrl(sec.settings.imageUrl) || PLACEHOLDER_IMAGE} 
                                    className="h-full w-full object-cover" 
                                    alt="" 
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-0 bg-black/40" />
                                </div>
                                <h3 className="text-sm font-black uppercase" style={{ color: sec.settings.headingColor || '#1E293B' }}>
                                  {sec.settings.title || 'Exclusive Pouch Launch'}
                                </h3>
                                <p className="text-[10px] leading-relaxed max-w-sm mx-auto text-slate-500">{sec.settings.description || 'Banner details...'}</p>
                                {sec.settings.buttonText && (
                                  <button type="button" className="bg-slate-900 text-white font-extrabold text-[8px] py-1 px-3.5 rounded-md uppercase tracking-wider">
                                    {sec.settings.buttonText}
                                  </button>
                                )}
                              </div>
                            )}

                            {/* 2. IMAGE WITH TEXT */}
                            {sec.type === 'Image with text' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center py-4 text-left">
                                <div className="h-28 w-full rounded-xl bg-slate-50 border overflow-hidden relative shadow-inner">
                                  <img 
                                    src={cleanMediaUrl(sec.settings.imageUrl) || PLACEHOLDER_IMAGE} 
                                    className="h-full w-full object-cover" 
                                    alt="" 
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <h4 className="font-extrabold text-xs" style={{ color: sec.settings.headingColor || '#1E293B' }}>
                                    {sec.settings.title || 'Curate Your Premium Package'}
                                  </h4>
                                  <p className="text-[9.5px] text-slate-500 leading-snug line-clamp-3">{sec.settings.description}</p>
                                  {sec.settings.buttonText && (
                                    <span className="inline-block bg-slate-950 text-white font-black text-[8px] py-1 px-3 rounded-lg uppercase tracking-wide">
                                      {sec.settings.buttonText}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* 3. TEXT COLUMN WITH IMAGE */}
                            {sec.type === 'Text column with image' && (
                              <div className="space-y-3 py-4 text-center">
                                <h4 className="font-extrabold text-xs uppercase tracking-tight" style={{ color: sec.settings.headingColor || '#1E293B' }}>
                                  {sec.settings.title || 'Our Laboratory Certified Foundations'}
                                </h4>
                                <p className="text-[9.5px] text-slate-450 max-w-md mx-auto leading-snug">{sec.settings.description}</p>
                                <div className="grid grid-cols-3 gap-2 pt-2">
                                  {[
                                    { label: 'Global Testing', badge: 'LAB VERIFIED', img: PLACEHOLDER_IMAGE },
                                    { label: 'Aroma Boost', badge: '100% FREE', img: 'https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?auto=format&fit=crop&w=200&q=80' },
                                    { label: 'Vacuum Sealed', badge: 'FRESH LOCK', img: 'https://images.unsplash.com/photo-1576186726115-4d51596775d1?auto=format&fit=crop&w=200&q=80' }
                                  ].map((col, cIdx) => (
                                    <div key={cIdx} className="bg-slate-50 border border-slate-200/60 rounded-xl p-2 text-center text-[9px] hover:shadow-2xs transition-shadow">
                                      <div className="h-10 bg-slate-200 min-w-full rounded-md mb-1 bg-cover bg-center overflow-hidden">
                                        <img src={col.img} className="h-full w-full object-cover" alt="" referrerPolicy="no-referrer" />
                                      </div>
                                      <span className="font-extrabold text-slate-800 leading-tight block truncate text-[8.5px]">{col.label}</span>
                                      <span className="text-[7px] text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-1 inline-block mt-0.5 tracking-wider font-extrabold font-mono uppercase">{col.badge}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 4. VIDEO BANNER */}
                            {sec.type === 'Video banner' && (() => {
                              const extractYouTubeId = (str: string) => {
                                if (!str) return '';
                                const trimmed = str.trim();
                                if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed) && !trimmed.toLowerCase().endsWith('.mp4') && !trimmed.toLowerCase().endsWith('.webm')) {
                                  return trimmed;
                                }
                                const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
                                const match = trimmed.match(regExp);
                                return (match && match[1]) ? match[1] : '';
                              };

                              const rawYouTube = (sec.settings.videoUrl || '').trim();
                              const rawMp4 = (sec.settings.videoMp4Url || '').trim();

                              let ytId = '';
                              let isYouTube = false;
                              let videoSource = '';

                              if (rawMp4) {
                                const ytFromMp4 = extractYouTubeId(rawMp4);
                                if (ytFromMp4) {
                                  ytId = ytFromMp4;
                                  isYouTube = true;
                                } else {
                                  videoSource = rawMp4;
                                  isYouTube = false;
                                }
                              } else if (rawYouTube) {
                                const ytFromUrl = extractYouTubeId(rawYouTube);
                                if (ytFromUrl) {
                                  ytId = ytFromUrl;
                                  isYouTube = true;
                                } else {
                                  videoSource = rawYouTube;
                                  isYouTube = false;
                                }
                              }

                              if (!isYouTube && !videoSource) {
                                videoSource = 'https://assets.mixkit.co/videos/preview/mixkit-laboratory-test-tubes-40436-large.mp4';
                              }

                              const cleanedVideoUrl = cleanMediaUrl(videoSource);

                              return (
                                <div className="text-center space-y-2 py-3">
                                  <div className="relative h-28 w-full rounded-xl bg-slate-900 overflow-hidden flex flex-col items-center justify-center border border-slate-800 text-white font-mono text-[9px] uppercase tracking-widest gap-1 p-4 shadow-inner">
                                    {isYouTube && ytId ? (
                                      <iframe
                                        className="absolute inset-0 w-full h-full object-cover border-0 opacity-80 pointer-events-none"
                                        src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&playlist=${ytId}&loop=1&controls=0&showinfo=0&rel=0`}
                                        title="Video Banner Preview"
                                      />
                                    ) : (
                                      <video
                                        key={cleanedVideoUrl}
                                        ref={(vEl) => { if (vEl) { vEl.muted = true; vEl.defaultMuted = true; vEl.play().catch(() => {}); } }}
                                        className="absolute inset-0 w-full h-full object-cover opacity-90 pointer-events-none"
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        src={cleanedVideoUrl}
                                      />
                                    )}
                                    <div className="relative z-10 flex flex-col items-center justify-center gap-1 bg-slate-950/60 p-2 rounded-lg backdrop-blur-xs">
                                      <PlaySquare className="h-6 w-6 text-indigo-400 animate-pulse" />
                                      <span className="text-white font-extrabold">{isYouTube ? 'Active YouTube Video' : 'Active MP4 Video'}</span>
                                    </div>
                                  </div>
                                  <p className="font-extrabold text-xs text-slate-700" style={{ color: sec.settings.headingColor || '#1E293B' }}>
                                    {sec.settings.title || 'Laboratory Showcase Highlights'}
                                  </p>
                                </div>
                              );
                            })()}

                            {/* 5. RICH TEXT */}
                            {sec.type === 'Rich text' && (
                              <div className="text-center space-y-2 py-4">
                                <h3 className="text-sm font-black uppercase" style={{ color: sec.settings.headingColor || '#1E293B' }}>
                                  {sec.settings.title || 'Editorial Showcase'}
                                </h3>
                                <p className="text-[10px] leading-relaxed max-w-sm mx-auto text-slate-500 font-medium">{sec.settings.description || 'Craft premium experiences under your own terms.'}</p>
                              </div>
                            )}

                            {/* 6. MARQUEE TEXT */}
                            {sec.type === 'Marquee text' && (() => {
                              const rawText = sec.settings.title || 'DELIVERY // CANCEL ANYTIME // LOYALTY SCHEME // NEVER RUN OUT // DELIVERED ON YOUR SCHEDULE // SAVE VS. SHOP PRICES // DISCREET DELIVERY';
                              const items = rawText.includes('//') 
                                ? rawText.split('//').map(item => item.trim()).filter(Boolean)
                                : rawText.includes('•')
                                ? rawText.split('•').map(item => item.trim()).filter(Boolean)
                                : [rawText];
                              return (
                                <div 
                                  className="overflow-hidden p-2.5 rounded-lg border border-amber-500/10 text-center relative shadow-xs"
                                  style={{ backgroundColor: sec.settings.backgroundColor || '#E8BE74' }}
                                >
                                  <p 
                                    className="font-bold text-[9px] uppercase tracking-wider font-sans truncate flex items-center justify-center gap-1.5"
                                    style={{ color: sec.settings.textColor || '#1A1C1D' }}
                                  >
                                    {items.map((item, index) => (
                                      <React.Fragment key={index}>
                                        <span className="shrink-0">{item}</span>
                                        {index < items.length - 1 && (
                                          <span className="text-[#071d37]/40 shrink-0 select-none">•</span>
                                        )}
                                      </React.Fragment>
                                    ))}
                                  </p>
                                </div>
                              );
                            })()}

                            {/* 7. COLLECTION LIST */}
                            {sec.type === 'Collection list' && (() => {
                              const filteredCols = sec.settings.selectedCollectionIds && sec.settings.selectedCollectionIds.length > 0
                                ? collections.filter(c => sec.settings.selectedCollectionIds!.includes(c.id))
                                : collections.slice(0, Math.min(sec.settings.itemsCount || 4, collections.length));

                              return (
                                <div className="space-y-3 py-3 text-center">
                                  <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: sec.settings.headingColor || '#0F172A' }}>
                                    {sec.settings.title || 'EXPLORE BRAND COLLECTIONS'}
                                  </h3>
                                  {sec.settings.description && (
                                    <p className="text-[10px] text-slate-500 max-w-md mx-auto">{sec.settings.description}</p>
                                  )}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                                    {filteredCols.map(col => (
                                      <div key={col.id} className="bg-white border rounded-xl p-3 text-center shadow-2xs">
                                        <div className="h-16 bg-slate-50 rounded-lg overflow-hidden mb-2 flex items-center justify-center">
                                          {col.image ? (
                                            <img src={cleanMediaUrl(col.image)} className="h-full w-full object-cover" alt="" referrerPolicy="no-referrer" />
                                          ) : (
                                            <span className="text-2xl">🥫</span>
                                          )}
                                        </div>
                                        <h4 className="font-extrabold text-[10px] text-slate-800 uppercase tracking-wide truncate">{col.title}</h4>
                                        <p className="text-[9px] text-slate-400 font-mono mt-0.5">{col.productIds.length} FLAVORS</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* 8. FEATURED COLLECTION */}
                            {sec.type === 'Featured collection' && (() => {
                              const featCol = sec.settings.collectionId ? collections.find(c => c.id === sec.settings.collectionId) : collections[0];
                              const featProds = featCol
                                ? products.filter(p => featCol.productIds.includes(p.id)).slice(0, sec.settings.itemsCount || 4)
                                : products.slice(0, sec.settings.itemsCount || 4);

                              return (
                                <div className="space-y-3 py-3 text-center">
                                  <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: sec.settings.headingColor || '#0F172A' }}>
                                    {sec.settings.title || featCol?.title || 'FEATURED COLLECTION'}
                                  </h3>
                                  {sec.settings.description && (
                                    <p className="text-[10px] text-slate-500 max-w-md mx-auto">{sec.settings.description}</p>
                                  )}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                                    {featProds.map(prod => (
                                      <div key={prod.id} className="bg-white border rounded-xl p-3 text-center shadow-2xs space-y-1">
                                        <div className="h-16 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center">
                                          {prod.image ? (
                                            <img src={cleanMediaUrl(prod.image)} className="h-full w-full object-contain p-1" alt="" referrerPolicy="no-referrer" />
                                          ) : (
                                            <span className="text-2xl">⚡</span>
                                          )}
                                        </div>
                                        <span className="text-[8px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded inline-block">
                                          {prod.vendor || 'POUCH'}
                                        </span>
                                        <h4 className="font-bold text-[10px] text-slate-800 truncate block">{prod.title}</h4>
                                        <div className="text-[10px] font-black text-slate-900">£{prod.price.toFixed(2)}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* 9. BRAND LIST / BRANDS WE OFFER */}
                            {(sec.type === 'Brand list' || sec.type === 'Brands we offer') && (() => {
                              const brandItems = (sec.settings.brandItems || []).filter((b: any) => b.imageUrl || b.name || b.title);
                              const displayItems = brandItems.length > 0 ? brandItems : collections.slice(0, 6);

                              return (
                                <div className="space-y-3 py-3 text-center">
                                  <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: sec.settings.headingColor || '#0F172A' }}>
                                    {sec.settings.title || 'BRANDS WE OFFER'}
                                  </h3>
                                  {sec.settings.description && (
                                    <p className="text-[10px] text-slate-500 max-w-md mx-auto">{sec.settings.description}</p>
                                  )}
                                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-2">
                                    {displayItems.map((item: any, idx: number) => {
                                      const name = item.name || item.title || `Brand ${idx + 1}`;
                                      const img = item.imageUrl || item.image || PLACEHOLDER_IMAGE;
                                      return (
                                        <div key={idx} className="bg-white border rounded-xl p-2.5 text-center flex flex-col items-center justify-center shadow-2xs">
                                          <div className="h-10 w-full overflow-hidden flex items-center justify-center mb-1">
                                            <img src={cleanMediaUrl(img)} className="max-h-full max-w-full object-contain" alt="" referrerPolicy="no-referrer" />
                                          </div>
                                          <span className="font-bold text-[9px] text-slate-700 truncate w-full block">{name}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* 10. SLIDESHOW */}
                            {sec.type === 'Slideshow' && (
                              <div className="relative h-36 w-full rounded-xl bg-slate-900 overflow-hidden border text-white flex flex-col items-center justify-center p-4 text-center space-y-1">
                                {sec.settings.imageUrl && (
                                  <img src={cleanMediaUrl(sec.settings.imageUrl)} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" referrerPolicy="no-referrer" />
                                )}
                                <div className="relative z-10 space-y-1 max-w-md">
                                  <span className="text-[8px] bg-indigo-600 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">HERO SLIDESHOW</span>
                                  <h3 className="text-xs font-black uppercase tracking-tight" style={{ color: sec.settings.headingColor || '#FFFFFF' }}>
                                    {sec.settings.title || 'PREMIUM NICOTINE POUCHES'}
                                  </h3>
                                  <p className="text-[9px] text-slate-200 line-clamp-2">{sec.settings.description || 'Discover ultra clean, tobacco-free nicotine pouches.'}</p>
                                  {sec.settings.buttonText && (
                                    <span className="inline-block bg-white text-slate-900 font-extrabold text-[8px] py-1 px-3 rounded-md uppercase tracking-wider mt-1">
                                      {sec.settings.buttonText}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* 11. IMAGES GALLERY / MARQUEE IMAGES / LOGO LIST */}
                            {(sec.type === 'Images gallery' || sec.type === 'Marquee images' || sec.type === 'Logo list') && (() => {
                              const images = (sec.settings.galleryImages || sec.settings.logoImages || []).filter(Boolean);
                              const displayImgs = images.length > 0 ? images : [PLACEHOLDER_IMAGE, PLACEHOLDER_IMAGE, PLACEHOLDER_IMAGE, PLACEHOLDER_IMAGE];

                              return (
                                <div className="space-y-3 py-3 text-center">
                                  <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: sec.settings.headingColor || '#0F172A' }}>
                                    {sec.settings.title || getSectionLabel(sec.type)}
                                  </h3>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                                    {displayImgs.map((img: string, idx: number) => (
                                      <div key={idx} className="h-16 rounded-xl overflow-hidden border bg-slate-50 flex items-center justify-center">
                                        <img src={cleanMediaUrl(img)} className="h-full w-full object-cover" alt="" referrerPolicy="no-referrer" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* 12. FAQS */}
                            {sec.type === 'FAQs' && (() => {
                              const rawFaqs = (sec.settings.faqs && sec.settings.faqs.length > 0) ? sec.settings.faqs 
                                            : (sec.settings.faqItems && sec.settings.faqItems.length > 0) ? sec.settings.faqItems 
                                            : null;
                              const faqs = rawFaqs || [
                                { question: 'How long does shipping take?', answer: 'Orders placed before 3 PM ship same day via Royal Mail Tracked Delivery.' },
                                { question: 'Are all products tobacco-free?', answer: 'Yes, 100% tobacco-free white nicotine pouches.' }
                              ];

                              return (
                                <div className="space-y-3 py-3 text-center max-w-md mx-auto">
                                  <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: sec.settings.headingColor || '#0F172A' }}>
                                    {sec.settings.title || 'FREQUENTLY ASKED QUESTIONS'}
                                  </h3>
                                  <div className="space-y-2 text-left pt-1">
                                    {faqs.map((faq: any, fIdx: number) => (
                                      <div key={fIdx} className="bg-slate-50 border rounded-xl p-2.5 text-[9.5px]">
                                        <p className="font-extrabold text-slate-800">{faq.question || faq.q || ''}</p>
                                        <p className="text-slate-500 mt-0.5">{faq.answer || faq.a || ''}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* 13. HOW IT WORKS */}
                            {sec.type === 'How it works' && (
                              <div className="space-y-3 py-3 text-center">
                                <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: sec.settings.headingColor || '#0F172A' }}>
                                  {sec.settings.title || 'HOW IT WORKS'}
                                </h3>
                                <div className="grid grid-cols-3 gap-2.5 pt-2">
                                  {[
                                    { step: '01', title: 'Choose Flavors', desc: 'Select from 50+ Swedish nicotine pouch tins.' },
                                    { step: '02', title: 'Fast Dispatch', desc: 'Discreet packaging delivered to your door.' },
                                    { step: '03', title: 'Enjoy Anywhere', desc: 'Smoke-free, spit-free, discreet nicotine fix.' }
                                  ].map((st, idx) => (
                                    <div key={idx} className="bg-white border rounded-xl p-2.5 text-center space-y-1">
                                      <span className="font-mono text-indigo-600 font-extrabold text-[10px] block">{st.step}</span>
                                      <h4 className="font-extrabold text-[9.5px] text-slate-800">{st.title}</h4>
                                      <p className="text-[8.5px] text-slate-400">{st.desc}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 14. PLANS */}
                            {sec.type === 'Plans' && (
                              <div className="space-y-3 py-3 text-center">
                                <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: sec.settings.headingColor || '#0F172A' }}>
                                  {sec.settings.title || 'SUBSCRIPTION PLANS'}
                                </h3>
                                <div className="grid grid-cols-2 gap-3 pt-2 max-w-md mx-auto">
                                  <div className="bg-white border rounded-xl p-3 text-center space-y-1">
                                    <span className="text-[8px] font-extrabold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Standard</span>
                                    <div className="text-xs font-black text-slate-900">3 Canisters / Mo</div>
                                    <div className="text-indigo-600 font-bold text-[10px]">£11.99 / mo</div>
                                  </div>
                                  <div className="bg-indigo-900 text-white border border-indigo-700 rounded-xl p-3 text-center space-y-1 shadow-md">
                                    <span className="text-[8px] font-extrabold uppercase bg-amber-400 text-indigo-950 px-2 py-0.5 rounded">Pro Saver</span>
                                    <div className="text-xs font-black text-white">10 Canisters / Mo</div>
                                    <div className="text-amber-400 font-bold text-[10px]">£34.99 / mo</div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 15. ICON WITH TEXT / TRUST BADGES */}
                            {(sec.type === 'Icon with text' || sec.type === 'Trust badges') && (
                              <div className="space-y-3 py-3 text-center">
                                <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: sec.settings.headingColor || '#0F172A' }}>
                                  {sec.settings.title || 'WHY POUCH SUPPLY'}
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                                  {[
                                    { title: 'Royal Mail Tracked 24', sub: 'Fast Tracked UK Delivery' },
                                    { title: '100% Authentic', sub: 'Direct Swedish Imports' },
                                    { title: 'Lab Tested', sub: 'Purity & Quality Guaranteed' },
                                    { title: 'Discreet Package', sub: 'No Brand Outer Logos' }
                                  ].map((badge, idx) => (
                                    <div key={idx} className="bg-slate-50 border rounded-xl p-2.5 text-center space-y-0.5">
                                      <span className="text-base">🛡️</span>
                                      <h4 className="font-extrabold text-[9.5px] text-slate-800">{badge.title}</h4>
                                      <p className="text-[8.5px] text-slate-400">{badge.sub}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 16. CLEARANCE SALE */}
                            {sec.type === 'Clearance Sale' && (
                              <div className="space-y-2 py-3 text-center bg-rose-50/50 border border-rose-200 rounded-2xl p-3">
                                <span className="bg-rose-600 text-white font-black text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider">CLEARANCE SALE</span>
                                <h3 className="text-xs font-black uppercase tracking-widest text-rose-950" style={{ color: sec.settings.headingColor || '#881337' }}>
                                  {sec.settings.title || 'LIMITED TIME OFFERS'}
                                </h3>
                                <p className="text-[9.5px] text-rose-700 max-w-md mx-auto">{sec.settings.description || 'Up to 40% off selected pouch canisters.'}</p>
                              </div>
                            )}

                            {/* 17. BLOG POST */}
                            {sec.type === 'Blog post' && (() => {
                              const displayBlogs = blogs.length > 0 ? blogs.slice(0, 2) : [
                                { id: '1', title: 'Top Nicotine Strengths Explained', category: 'Guides', date: '2026-07-20' },
                                { id: '2', title: 'Swedish Pouch Manufacturing Standards', category: 'Quality', date: '2026-07-15' }
                              ];

                              return (
                                <div className="space-y-3 py-3 text-center">
                                  <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: sec.settings.headingColor || '#0F172A' }}>
                                    {sec.settings.title || 'LATEST EDITORIAL ARTICLES'}
                                  </h3>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-left">
                                    {displayBlogs.map((b: any) => (
                                      <div key={b.id} className="bg-white border rounded-xl p-2.5 space-y-1 shadow-2xs">
                                        <span className="text-[8px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">{b.category || 'Article'}</span>
                                        <h4 className="font-extrabold text-[10px] text-slate-800 line-clamp-1">{b.title}</h4>
                                        <p className="text-[8.5px] text-slate-400">{b.date}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}

                          </div>
                        </div>
                      );
                    })
                  )}

                </div>
              </div>
            </div>

            {/* 3. Right Column: Live Section Properties Inspector Panel */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white border rounded-xl p-4 shadow-xs space-y-4 sticky top-4">
                <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
                  <h4 className="font-black text-slate-700 uppercase tracking-wide text-xs">Module Inspector</h4>
                  {currentlyEditingSection && (
                    <span className="text-[8px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-mono font-bold">
                      {getSectionLabel(currentlyEditingSection.type)}
                    </span>
                  )}
                </div>

                {currentlyEditingSection ? (
                  <div className="space-y-4 text-xs">
                    
                    {/* General Settings */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Headline Title</label>
                      <input
                        type="text"
                        value={currentlyEditingSection.settings.title || ''}
                        onChange={(e) => handleUpdateSectionSettings('title', e.target.value)}
                        className="w-full text-xs p-2 border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-650"
                        placeholder="Enter section headline..."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Description / Subtitle</label>
                      <textarea
                        rows={2}
                        value={currentlyEditingSection.settings.description || ''}
                        onChange={(e) => handleUpdateSectionSettings('description', e.target.value)}
                        className="w-full text-xs p-2 border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-650"
                        placeholder="Enter description text..."
                      />
                    </div>

                    {/* Image / Media Uploads */}
                    {['Image banner', 'Image with text', 'Text column with image'].includes(currentlyEditingSection.type) && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Banner Image Source</label>
                        <ImageUploadInput
                          value={currentlyEditingSection.settings.imageUrl || ''}
                          onChange={(url) => handleUpdateSectionSettings('imageUrl', url)}
                          placeholder="Select image or upload custom media..."
                        />
                      </div>
                    )}

                    {/* Video Banner inputs */}
                    {currentlyEditingSection.type === 'Video banner' && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Video MP4 Direct URL / File Upload</label>
                          <ImageUploadInput
                            value={currentlyEditingSection.settings.videoMp4Url || ''}
                            onChange={(url) => handleUpdateSectionSettings('videoMp4Url', url)}
                            placeholder="Select MP4 file or upload video..."
                            mediaType="video"
                            accept="video/mp4,video/webm,video/quicktime,video/*"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Or YouTube URL Link</label>
                          <input
                            type="text"
                            value={currentlyEditingSection.settings.videoUrl || ''}
                            onChange={(e) => handleUpdateSectionSettings('videoUrl', e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-650 font-mono"
                            placeholder="e.g. https://www.youtube.com/watch?v=..."
                          />
                        </div>
                      </div>
                    )}

                    {/* Section Buttons & Link Targets */}
                    <div className="space-y-2.5 bg-slate-50/90 p-3 rounded-xl border border-slate-200/80">
                      <span className="block text-[10px] font-black text-slate-900 uppercase tracking-wider">🔗 Section Buttons & Link Target URLs</span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Primary Button Label</label>
                          <input
                            type="text"
                            value={currentlyEditingSection.settings.buttonText || ''}
                            onChange={(e) => handleUpdateSectionSettings('buttonText', e.target.value)}
                            className="w-full text-xs p-1.5 border rounded-lg bg-white"
                            placeholder="SHOP NOW / SUBSCRIBE"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Primary Link Target URL</label>
                          <input
                            type="text"
                            value={currentlyEditingSection.settings.buttonLink || ''}
                            onChange={(e) => handleUpdateSectionSettings('buttonLink', e.target.value)}
                            className="w-full text-xs p-1.5 border rounded-lg bg-white font-mono text-[10px]"
                            placeholder="frontend-shop, /subscribe, etc."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Secondary Button Label</label>
                          <input
                            type="text"
                            value={currentlyEditingSection.settings.buttonText2 || ''}
                            onChange={(e) => handleUpdateSectionSettings('buttonText2', e.target.value)}
                            className="w-full text-xs p-1.5 border rounded-lg bg-white"
                            placeholder="LEARN MORE"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Secondary Link Target URL</label>
                          <input
                            type="text"
                            value={currentlyEditingSection.settings.buttonLink2 || ''}
                            onChange={(e) => handleUpdateSectionSettings('buttonLink2', e.target.value)}
                            className="w-full text-xs p-1.5 border rounded-lg bg-white font-mono text-[10px]"
                            placeholder="frontend-subscribe, /about, etc."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Banner / Image Click Target URL</label>
                        <input
                          type="text"
                          value={currentlyEditingSection.settings.imageLink || currentlyEditingSection.settings.bannerLink || ''}
                          onChange={(e) => {
                            handleUpdateSectionSettings('imageLink', e.target.value);
                            handleUpdateSectionSettings('bannerLink', e.target.value);
                          }}
                          className="w-full text-xs p-1.5 border rounded-lg bg-white font-mono text-[10px]"
                          placeholder="e.g. frontend-shop, /collections/all, or https://..."
                        />
                      </div>
                    </div>

                    {/* CLEARANCE SALE CONTROLS */}
                    {currentlyEditingSection.type === 'Clearance Sale' && (
                      <div className="space-y-2.5 bg-rose-50/50 p-3 rounded-xl border border-rose-200">
                        <span className="block text-[10px] font-black text-rose-800 uppercase tracking-wider">🏷️ Clearance Event Settings</span>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 uppercase mb-1">Discount Badge Banner</label>
                          <input
                            type="text"
                            value={currentlyEditingSection.settings.discountBadge || ''}
                            onChange={(e) => handleUpdateSectionSettings('discountBadge', e.target.value)}
                            className="w-full text-xs p-1.5 border rounded-lg bg-white font-bold text-rose-700"
                            placeholder="UP TO 50% OFF"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 uppercase mb-1">Countdown Timer Label</label>
                          <input
                            type="text"
                            value={currentlyEditingSection.settings.countdownText || ''}
                            onChange={(e) => handleUpdateSectionSettings('countdownText', e.target.value)}
                            className="w-full text-xs p-1.5 border rounded-lg bg-white font-mono text-[10px]"
                            placeholder="ENDS IN 02D 14H 32M"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 uppercase mb-1">Clearance Background Image</label>
                          <ImageUploadInput
                            value={currentlyEditingSection.settings.imageUrl || ''}
                            onChange={(url) => handleUpdateSectionSettings('imageUrl', url)}
                            placeholder="Upload or choose banner image..."
                          />
                        </div>
                      </div>
                    )}

                    {/* CONTACT FORM CONTROLS */}
                    {currentlyEditingSection.type === 'Contact Form' && (
                      <div className="space-y-2.5 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
                        <span className="block text-[10px] font-black text-emerald-800 uppercase tracking-wider">✉️ Contact Form Settings</span>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 uppercase mb-1">Heading Title</label>
                          <input
                            type="text"
                            value={currentlyEditingSection.settings.title || ''}
                            onChange={(e) => handleUpdateSectionSettings('title', e.target.value)}
                            className="w-full text-xs p-1.5 border rounded-lg bg-white font-bold text-slate-800"
                            placeholder="Get in Touch with Our Team"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 uppercase mb-1">Subheading Description</label>
                          <textarea
                            rows={2}
                            value={currentlyEditingSection.settings.description || ''}
                            onChange={(e) => handleUpdateSectionSettings('description', e.target.value)}
                            className="w-full text-xs p-1.5 border rounded-lg bg-white text-slate-700 font-sans"
                            placeholder="Have questions about your order or shipping? Fill out the form..."
                          />
                        </div>
                      </div>
                    )}

                    {/* FEATURED COLLECTION & COLLECTION LIST CONTROLS */}
                    {(currentlyEditingSection.type === 'Featured collection' || currentlyEditingSection.type === 'Collection list') && (
                      <div className="space-y-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-200">
                        <span className="block text-[10px] font-black text-indigo-900 uppercase tracking-wider">🛍️ Collection Source & Layout</span>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 uppercase mb-1">Select Target Collection</label>
                          <select
                            value={currentlyEditingSection.settings.collectionSlug || currentlyEditingSection.settings.collectionId || 'all'}
                            onChange={(e) => {
                              handleUpdateSectionSettings('collectionSlug', e.target.value);
                              handleUpdateSectionSettings('collectionId', e.target.value);
                            }}
                            className="w-full text-xs p-2 border rounded-lg bg-white cursor-pointer font-medium"
                          >
                            <option value="all">All Products</option>
                            {collections.map((col) => (
                              <option key={col.id} value={col.slug || col.id}>
                                {col.title} ({col.productIds ? col.productIds.length : 0} items)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1 text-[8px] font-bold text-slate-600 uppercase">
                            <span>Max Products Displayed</span>
                            <span className="font-mono text-indigo-700">{currentlyEditingSection.settings.productsCount || 8}</span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="24"
                            step="2"
                            value={currentlyEditingSection.settings.productsCount || 8}
                            onChange={(e) => handleUpdateSectionSettings('productsCount', parseInt(e.target.value, 10))}
                            className="w-full accent-indigo-600 cursor-pointer"
                          />
                        </div>
                      </div>
                    )}

                    {/* FAQS BLOCK MANAGER */}
                    {currentlyEditingSection.type === 'FAQs' && (() => {
                      const rawFaqs = currentlyEditingSection.settings.faqs || currentlyEditingSection.settings.faqItems;
                      const faqs = (Array.isArray(rawFaqs) && rawFaqs.length > 0)
                        ? rawFaqs.map((f: any) => ({
                            question: f.question || f.q || '',
                            answer: f.answer || f.a || '',
                            q: f.q || f.question || '',
                            a: f.a || f.answer || '',
                            linkUrl: f.linkUrl || ''
                          }))
                        : [];

                      const saveFaqs = (updatedList: any[]) => {
                        const normalized = updatedList.map((f: any) => ({
                          question: f.question || f.q || '',
                          answer: f.answer || f.a || '',
                          q: f.q || f.question || '',
                          a: f.a || f.answer || '',
                          linkUrl: f.linkUrl || ''
                        }));
                        handleUpdateSectionSettings('faqs', normalized);
                        handleUpdateSectionSettings('faqItems', normalized);
                      };

                      const handleUpdateFaq = (idx: number, field: string, val: string) => {
                        const updated = faqs.map((f, i) => i === idx ? { ...f, [field]: val, [field === 'question' ? 'q' : 'a']: val } : f);
                        saveFaqs(updated);
                      };

                      const handleAddFaq = () => {
                        const updated = [...faqs, { question: 'New Frequently Asked Question', answer: 'Enter detailed answer text here...', q: 'New Frequently Asked Question', a: 'Enter detailed answer text here...' }];
                        saveFaqs(updated);
                      };

                      const handleRemoveFaq = (idx: number) => {
                        const updated = faqs.filter((_, i) => i !== idx);
                        saveFaqs(updated);
                      };

                      const handleMoveFaq = (fromIdx: number, toIdx: number) => {
                        if (toIdx < 0 || toIdx >= faqs.length) return;
                        const updated = [...faqs];
                        const [moved] = updated.splice(fromIdx, 1);
                        updated.splice(toIdx, 0, moved);
                        saveFaqs(updated);
                      };

                      return (
                        <div className="space-y-3 bg-slate-50/90 p-3 rounded-xl border border-slate-250">
                          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                              <span>❓ FAQ Items ({faqs.length})</span>
                            </label>
                            <button
                              type="button"
                              onClick={handleAddFaq}
                              className="text-[9px] font-black bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-md flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                            >
                              <Plus className="h-3 w-3" /> Add FAQ
                            </button>
                          </div>

                          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                            {faqs.map((faq, fIdx) => (
                              <div key={fIdx} className="bg-white p-3 rounded-xl border border-slate-250 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                  <span className="font-extrabold text-[9px] text-indigo-700 font-mono">FAQ #{fIdx + 1}</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleMoveFaq(fIdx, fIdx - 1)}
                                      disabled={fIdx === 0}
                                      className="text-slate-400 hover:text-slate-700 disabled:opacity-20 p-1"
                                    >
                                      <MoveUp className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveFaq(fIdx, fIdx + 1)}
                                      disabled={fIdx === faqs.length - 1}
                                      className="text-slate-400 hover:text-slate-700 disabled:opacity-20 p-1"
                                    >
                                      <MoveDown className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveFaq(fIdx)}
                                      className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Question</label>
                                  <input
                                    type="text"
                                    value={faq.question || ''}
                                    onChange={(e) => handleUpdateFaq(fIdx, 'question', e.target.value)}
                                    className="w-full text-xs p-1.5 border rounded bg-slate-50 font-medium"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Answer</label>
                                  <textarea
                                    rows={2}
                                    value={faq.answer || ''}
                                    onChange={(e) => handleUpdateFaq(fIdx, 'answer', e.target.value)}
                                    className="w-full text-xs p-1.5 border rounded bg-slate-50"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Link Target URL (Optional)</label>
                                  <input
                                    type="text"
                                    value={faq.linkUrl || ''}
                                    onChange={(e) => handleUpdateFaq(fIdx, 'linkUrl', e.target.value)}
                                    className="w-full text-xs p-1.5 border rounded bg-slate-50 font-mono text-[10px]"
                                    placeholder="e.g. frontend-subscribe or https://..."
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* ICON WITH TEXT BLOCK MANAGER */}
                    {currentlyEditingSection.type === 'Icon with text' && (() => {
                      const items = (currentlyEditingSection.settings.iconItems as any[]) || [];

                      const handleUpdateItem = (idx: number, field: string, val: string) => {
                        const updated = items.map((it, i) => i === idx ? { ...it, [field]: val } : it);
                        handleUpdateSectionSettings('iconItems', updated);
                      };

                      const handleAddItem = () => {
                        const updated = [...items, { iconName: 'Truck', title: 'New Feature Title', description: 'Enter feature benefit details...', linkUrl: 'frontend-shop' }];
                        handleUpdateSectionSettings('iconItems', updated);
                      };

                      const handleRemoveItem = (idx: number) => {
                        const updated = items.filter((_, i) => i !== idx);
                        handleUpdateSectionSettings('iconItems', updated);
                      };

                      const handleMoveItem = (fromIdx: number, toIdx: number) => {
                        if (toIdx < 0 || toIdx >= items.length) return;
                        const updated = [...items];
                        const [moved] = updated.splice(fromIdx, 1);
                        updated.splice(toIdx, 0, moved);
                        handleUpdateSectionSettings('iconItems', updated);
                      };

                      return (
                        <div className="space-y-3 bg-slate-50/90 p-3 rounded-xl border border-slate-250">
                          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                              <span>✨ Feature Cards ({items.length})</span>
                            </label>
                            <button
                              type="button"
                              onClick={handleAddItem}
                              className="text-[9px] font-black bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-md flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                            >
                              <Plus className="h-3 w-3" /> Add Feature
                            </button>
                          </div>

                          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                            {items.map((item, iIdx) => (
                              <div key={iIdx} className="bg-white p-3 rounded-xl border border-slate-250 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                  <span className="font-extrabold text-[9px] text-indigo-700 font-mono">Feature #{iIdx + 1}</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleMoveItem(iIdx, iIdx - 1)}
                                      disabled={iIdx === 0}
                                      className="text-slate-400 hover:text-slate-700 disabled:opacity-20 p-1"
                                    >
                                      <MoveUp className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveItem(iIdx, iIdx + 1)}
                                      disabled={iIdx === items.length - 1}
                                      className="text-slate-400 hover:text-slate-700 disabled:opacity-20 p-1"
                                    >
                                      <MoveDown className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveItem(iIdx)}
                                      className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Icon Style</label>
                                    <select
                                      value={item.iconName || 'Truck'}
                                      onChange={(e) => handleUpdateItem(iIdx, 'iconName', e.target.value)}
                                      className="w-full text-xs p-1.5 border rounded bg-slate-50 cursor-pointer"
                                    >
                                      <option value="Truck">Truck / Fast Delivery</option>
                                      <option value="Zap">Zap / Best Prices</option>
                                      <option value="Shield">Shield / Discreet Packaging</option>
                                      <option value="Clock">Clock / Cancel Anytime</option>
                                      <option value="Award">Award / Loyalty Rewards</option>
                                      <option value="Package">Package / Never Run Out</option>
                                      <option value="Heart">Heart / Customer Choice</option>
                                      <option value="Star">Star / Premium Rating</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Title</label>
                                    <input
                                      type="text"
                                      value={item.title || ''}
                                      onChange={(e) => handleUpdateItem(iIdx, 'title', e.target.value)}
                                      className="w-full text-xs p-1.5 border rounded bg-slate-50 font-bold"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Description</label>
                                  <textarea
                                    rows={2}
                                    value={item.description || ''}
                                    onChange={(e) => handleUpdateItem(iIdx, 'description', e.target.value)}
                                    className="w-full text-xs p-1.5 border rounded bg-slate-50"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Link Target URL</label>
                                  <input
                                    type="text"
                                    value={item.linkUrl || ''}
                                    onChange={(e) => handleUpdateItem(iIdx, 'linkUrl', e.target.value)}
                                    className="w-full text-xs p-1.5 border rounded bg-slate-50 font-mono text-[10px]"
                                    placeholder="frontend-shop or https://..."
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* HOW IT WORKS BLOCK MANAGER */}
                    {currentlyEditingSection.type === 'How it works' && (() => {
                      const steps = (currentlyEditingSection.settings.stepItems as any[]) || [];

                      const handleUpdateStep = (idx: number, field: string, val: string) => {
                        const updated = steps.map((st, i) => i === idx ? { ...st, [field]: val } : st);
                        handleUpdateSectionSettings('stepItems', updated);
                      };

                      const handleAddStep = () => {
                        const updated = [...steps, { number: steps.length + 1, title: 'New Step Title', description: 'Describe step action details...' }];
                        handleUpdateSectionSettings('stepItems', updated);
                      };

                      const handleRemoveStep = (idx: number) => {
                        const updated = steps.filter((_, i) => i !== idx);
                        handleUpdateSectionSettings('stepItems', updated);
                      };

                      const handleMoveStep = (fromIdx: number, toIdx: number) => {
                        if (toIdx < 0 || toIdx >= steps.length) return;
                        const updated = [...steps];
                        const [moved] = updated.splice(fromIdx, 1);
                        updated.splice(toIdx, 0, moved);
                        handleUpdateSectionSettings('stepItems', updated);
                      };

                      return (
                        <div className="space-y-3 bg-slate-50/90 p-3 rounded-xl border border-slate-250">
                          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                              <span>⚡ Step By Step Cards ({steps.length})</span>
                            </label>
                            <button
                              type="button"
                              onClick={handleAddStep}
                              className="text-[9px] font-black bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-md flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                            >
                              <Plus className="h-3 w-3" /> Add Step
                            </button>
                          </div>

                          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                            {steps.map((step, sIdx) => (
                              <div key={sIdx} className="bg-white p-3 rounded-xl border border-slate-250 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                  <span className="font-extrabold text-[9px] text-indigo-700 font-mono">Step #{sIdx + 1}</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleMoveStep(sIdx, sIdx - 1)}
                                      disabled={sIdx === 0}
                                      className="text-slate-400 hover:text-slate-700 disabled:opacity-20 p-1"
                                    >
                                      <MoveUp className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveStep(sIdx, sIdx + 1)}
                                      disabled={sIdx === steps.length - 1}
                                      className="text-slate-400 hover:text-slate-700 disabled:opacity-20 p-1"
                                    >
                                      <MoveDown className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveStep(sIdx)}
                                      className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Step #</label>
                                    <input
                                      type="number"
                                      value={step.number || sIdx + 1}
                                      onChange={(e) => handleUpdateStep(sIdx, 'number', e.target.value)}
                                      className="w-full text-xs p-1.5 border rounded bg-slate-50 font-bold"
                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Title</label>
                                    <input
                                      type="text"
                                      value={step.title || ''}
                                      onChange={(e) => handleUpdateStep(sIdx, 'title', e.target.value)}
                                      className="w-full text-xs p-1.5 border rounded bg-slate-50 font-bold"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Description</label>
                                  <textarea
                                    rows={2}
                                    value={step.description || ''}
                                    onChange={(e) => handleUpdateStep(sIdx, 'description', e.target.value)}
                                    className="w-full text-xs p-1.5 border rounded bg-slate-50"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Custom Image Visual</label>
                                  <ImageUploadInput
                                    value={step.imageUrl || ''}
                                    onChange={(url) => handleUpdateStep(sIdx, 'imageUrl', url)}
                                    placeholder="Upload step visual or select image..."
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Link Target URL</label>
                                  <input
                                    type="text"
                                    value={step.linkUrl || ''}
                                    onChange={(e) => handleUpdateStep(sIdx, 'linkUrl', e.target.value)}
                                    className="w-full text-xs p-1.5 border rounded bg-slate-50 font-mono text-[10px]"
                                    placeholder="frontend-subscribe or https://..."
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* TRUST BADGES BLOCK MANAGER */}
                    {currentlyEditingSection.type === 'Trust badges' && (() => {
                      const badges = (currentlyEditingSection.settings.trustBadges as any[]) || [];

                      const handleUpdateBadge = (idx: number, field: string, val: string) => {
                        const updated = badges.map((b, i) => i === idx ? { ...b, [field]: val } : b);
                        handleUpdateSectionSettings('trustBadges', updated);
                      };

                      const handleAddBadge = () => {
                        const updated = [...badges, { iconType: 'badge', title: '100% AUTHENTIC', description: 'Direct from official suppliers.' }];
                        handleUpdateSectionSettings('trustBadges', updated);
                      };

                      const handleRemoveBadge = (idx: number) => {
                        const updated = badges.filter((_, i) => i !== idx);
                        handleUpdateSectionSettings('trustBadges', updated);
                      };

                      const handleMoveBadge = (fromIdx: number, toIdx: number) => {
                        if (toIdx < 0 || toIdx >= badges.length) return;
                        const updated = [...badges];
                        const [moved] = updated.splice(fromIdx, 1);
                        updated.splice(toIdx, 0, moved);
                        handleUpdateSectionSettings('trustBadges', updated);
                      };

                      return (
                        <div className="space-y-3 bg-slate-50/90 p-3 rounded-xl border border-slate-250">
                          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                              <span>🛡️ Trust Badges ({badges.length})</span>
                            </label>
                            <button
                              type="button"
                              onClick={handleAddBadge}
                              className="text-[9px] font-black bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-md flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                            >
                              <Plus className="h-3 w-3" /> Add Badge
                            </button>
                          </div>

                          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                            {badges.map((badge, bIdx) => (
                              <div key={bIdx} className="bg-white p-3 rounded-xl border border-slate-250 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                  <span className="font-extrabold text-[9px] text-indigo-700 font-mono">Badge #{bIdx + 1}</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleMoveBadge(bIdx, bIdx - 1)}
                                      disabled={bIdx === 0}
                                      className="text-slate-400 hover:text-slate-700 disabled:opacity-20 p-1"
                                    >
                                      <MoveUp className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveBadge(bIdx, bIdx + 1)}
                                      disabled={bIdx === badges.length - 1}
                                      className="text-slate-400 hover:text-slate-700 disabled:opacity-20 p-1"
                                    >
                                      <MoveDown className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveBadge(bIdx)}
                                      className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Icon Style</label>
                                    <select
                                      value={badge.iconType || 'badge'}
                                      onChange={(e) => handleUpdateBadge(bIdx, 'iconType', e.target.value)}
                                      className="w-full text-xs p-1.5 border rounded bg-slate-50 cursor-pointer"
                                    >
                                      <option value="badge">Gold Award / Star</option>
                                      <option value="shield">Shield Check</option>
                                      <option value="globe">Global Shipping</option>
                                      <option value="tag">Discount Tag</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Badge Title</label>
                                    <input
                                      type="text"
                                      value={badge.title || ''}
                                      onChange={(e) => handleUpdateBadge(bIdx, 'title', e.target.value)}
                                      className="w-full text-xs p-1.5 border rounded bg-slate-50 font-bold"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Description</label>
                                  <input
                                    type="text"
                                    value={badge.description || ''}
                                    onChange={(e) => handleUpdateBadge(bIdx, 'description', e.target.value)}
                                    className="w-full text-xs p-1.5 border rounded bg-slate-50"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Link Target URL</label>
                                  <input
                                    type="text"
                                    value={badge.linkUrl || ''}
                                    onChange={(e) => handleUpdateBadge(bIdx, 'linkUrl', e.target.value)}
                                    className="w-full text-xs p-1.5 border rounded bg-slate-50 font-mono text-[10px]"
                                    placeholder="frontend-shop or https://..."
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* SUBSCRIPTION PLANS BLOCK MANAGER */}
                    {currentlyEditingSection.type === 'Plans' && (() => {
                      const plans = (currentlyEditingSection.settings.planItems as any[]) || [];

                      const handleUpdatePlan = (idx: number, field: string, val: any) => {
                        const updated = plans.map((p, i) => i === idx ? { ...p, [field]: val } : p);
                        handleUpdateSectionSettings('planItems', updated);
                      };

                      const handleAddPlan = () => {
                        const updated = [
                          ...plans,
                          {
                            slug: `plan-${plans.length + 1}`,
                            name: `PLAN TIER ${plans.length + 1}`,
                            subtitle: 'Custom subscription option',
                            price: 29.99,
                            limit: 6,
                            saveAmountText: 'Save £5.00/month',
                            imageUrl: '',
                            features: ['6 cans included', 'Change flavours anytime', 'Pause or cancel anytime'],
                            isPopular: false
                          }
                        ];
                        handleUpdateSectionSettings('planItems', updated);
                      };

                      const handleRemovePlan = (idx: number) => {
                        const updated = plans.filter((_, i) => i !== idx);
                        handleUpdateSectionSettings('planItems', updated);
                      };

                      const handleMovePlan = (fromIdx: number, toIdx: number) => {
                        if (toIdx < 0 || toIdx >= plans.length) return;
                        const updated = [...plans];
                        const [moved] = updated.splice(fromIdx, 1);
                        updated.splice(toIdx, 0, moved);
                        handleUpdateSectionSettings('planItems', updated);
                      };

                      return (
                        <div className="space-y-3 bg-slate-50/90 p-3 rounded-xl border border-slate-250">
                          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                              <span>💎 Plan Cards ({plans.length})</span>
                            </label>
                            <button
                              type="button"
                              onClick={handleAddPlan}
                              className="text-[9px] font-black bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-md flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                            >
                              <Plus className="h-3 w-3" /> Add Plan
                            </button>
                          </div>

                          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                            {plans.map((plan, pIdx) => (
                              <div key={pIdx} className="bg-white p-3 rounded-xl border border-slate-250 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                  <span className="font-extrabold text-[9px] text-indigo-700 font-mono">Plan #{pIdx + 1}</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleMovePlan(pIdx, pIdx - 1)}
                                      disabled={pIdx === 0}
                                      className="text-slate-400 hover:text-slate-700 disabled:opacity-20 p-1"
                                    >
                                      <MoveUp className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMovePlan(pIdx, pIdx + 1)}
                                      disabled={pIdx === plans.length - 1}
                                      className="text-slate-400 hover:text-slate-700 disabled:opacity-20 p-1"
                                    >
                                      <MoveDown className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePlan(pIdx)}
                                      className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Plan Name</label>
                                    <input
                                      type="text"
                                      value={plan.name || ''}
                                      onChange={(e) => handleUpdatePlan(pIdx, 'name', e.target.value)}
                                      className="w-full text-xs p-1.5 border rounded bg-slate-50 font-bold"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Price (£)</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={plan.price || 0}
                                      onChange={(e) => handleUpdatePlan(pIdx, 'price', parseFloat(e.target.value) || 0)}
                                      className="w-full text-xs p-1.5 border rounded bg-slate-50 font-mono"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Subtitle / Tagline</label>
                                  <input
                                    type="text"
                                    value={plan.subtitle || ''}
                                    onChange={(e) => handleUpdatePlan(pIdx, 'subtitle', e.target.value)}
                                    className="w-full text-xs p-1.5 border rounded bg-slate-50"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Savings Badge Text</label>
                                  <input
                                    type="text"
                                    value={plan.saveAmountText || ''}
                                    onChange={(e) => handleUpdatePlan(pIdx, 'saveAmountText', e.target.value)}
                                    className="w-full text-xs p-1.5 border rounded bg-slate-50"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Plan Image</label>
                                  <ImageUploadInput
                                    value={plan.imageUrl || ''}
                                    onChange={(url) => handleUpdatePlan(pIdx, 'imageUrl', url)}
                                    placeholder="Upload custom plan image..."
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Button Label</label>
                                    <input
                                      type="text"
                                      value={plan.buttonText || ''}
                                      onChange={(e) => handleUpdatePlan(pIdx, 'buttonText', e.target.value)}
                                      className="w-full text-xs p-1.5 border rounded bg-slate-50"
                                      placeholder="SELECT PLAN"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Link Target URL</label>
                                    <input
                                      type="text"
                                      value={plan.buttonLink || ''}
                                      onChange={(e) => handleUpdatePlan(pIdx, 'buttonLink', e.target.value)}
                                      className="w-full text-xs p-1.5 border rounded bg-slate-50 font-mono text-[10px]"
                                      placeholder={`/pages/subscribe/${plan.slug}`}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                  <input
                                    type="checkbox"
                                    id={`popular-${pIdx}`}
                                    checked={!!plan.isPopular}
                                    onChange={(e) => handleUpdatePlan(pIdx, 'isPopular', e.target.checked)}
                                    className="accent-indigo-600 rounded cursor-pointer"
                                  />
                                  <label htmlFor={`popular-${pIdx}`} className="text-[10px] font-bold text-slate-700 cursor-pointer">
                                    Mark as "Best Seller" Highlight
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* BRAND LIST & BRANDS WE OFFER MANAGER */}
                    {(currentlyEditingSection.type === 'Brand list' || currentlyEditingSection.type === 'Brands we offer') && (() => {
                      const brandItems = currentlyEditingSection.settings.brandItems || [];

                      const handleUpdateBrand = (idx: number, field: string, val: string) => {
                        const updated = brandItems.map((b, i) => i === idx ? { ...b, [field]: val } : b);
                        handleUpdateSectionSettings('brandItems', updated);
                      };

                      const handleAddBrand = () => {
                        const updated = [
                          ...brandItems,
                          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: `Brand ${brandItems.length + 1}` }
                        ];
                        handleUpdateSectionSettings('brandItems', updated);
                      };

                      const handleRemoveBrand = (idx: number) => {
                        const updated = brandItems.filter((_, i) => i !== idx);
                        handleUpdateSectionSettings('brandItems', updated);
                      };

                      const handleMoveBrand = (fromIdx: number, toIdx: number) => {
                        if (toIdx < 0 || toIdx >= brandItems.length) return;
                        const updated = [...brandItems];
                        const [moved] = updated.splice(fromIdx, 1);
                        updated.splice(toIdx, 0, moved);
                        handleUpdateSectionSettings('brandItems', updated);
                      };

                      const handleLoadPresets = () => {
                        const presets = [
                          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: '77' },
                          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: 'Clew' },
                          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: 'Cuba' },
                          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: 'Maggie' },
                          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: 'Nordic Spirit' },
                          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: 'XQS' },
                          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: 'ZYN' },
                          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: 'Pablo' },
                          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: 'Killa' },
                          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: 'Fumi' },
                          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: 'Velo' },
                          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: 'White Fox' },
                          { imageUrl: PLACEHOLDER_IMAGE, linkUrl: 'frontend-shop', title: 'Snü' }
                        ];
                        handleUpdateSectionSettings('brandItems', presets);
                      };

                      return (
                        <div className="space-y-3 bg-slate-50/90 p-3 rounded-xl border border-slate-250">
                          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                            <div>
                              <label className="block text-[10px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                <span>🏷️ Brand Logos & Uploads</span>
                                <span className="text-indigo-650 bg-indigo-50 font-mono font-bold px-1.5 py-0.5 rounded text-[9px] border border-indigo-200">
                                  {brandItems.length} items
                                </span>
                              </label>
                              <span className="text-[9px] text-slate-500 block mt-0.5">Upload logos and set link destinations for each brand card.</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {brandItems.length === 0 && (
                                <button
                                  type="button"
                                  onClick={handleLoadPresets}
                                  className="text-[9px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 px-2 py-1 rounded cursor-pointer transition-colors"
                                  title="Load default brand list"
                                >
                                  Presets
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={handleAddBrand}
                                className="text-[9px] font-black bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-md flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                              >
                                <Plus className="h-3 w-3" /> Add Brand
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                            {brandItems.length === 0 ? (
                              <div className="text-center py-6 bg-white rounded-xl border border-dashed border-slate-300 space-y-2">
                                <p className="text-[10px] text-slate-500 font-medium">No brands added to this section yet.</p>
                                <div className="flex justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={handleAddBrand}
                                    className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 cursor-pointer"
                                  >
                                    + Add Custom Brand
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleLoadPresets}
                                    className="text-[9px] font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-300 cursor-pointer"
                                  >
                                    Load Default Brands
                                  </button>
                                </div>
                              </div>
                            ) : (
                              brandItems.map((brand, bIdx) => (
                                <div key={bIdx} className="bg-white p-3 rounded-xl border border-slate-250 shadow-2xs space-y-2.5">
                                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-black text-[9px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded uppercase font-mono border border-indigo-150">
                                        #{bIdx + 1}
                                      </span>
                                      <span className="font-extrabold text-[10px] text-slate-800 truncate max-w-[130px]">
                                        {brand.title || `Brand ${bIdx + 1}`}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleMoveBrand(bIdx, bIdx - 1)}
                                        disabled={bIdx === 0}
                                        className="text-slate-400 hover:text-slate-700 disabled:opacity-20 p-1 rounded hover:bg-slate-100"
                                        title="Move Up"
                                      >
                                        <MoveUp className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMoveBrand(bIdx, bIdx + 1)}
                                        disabled={bIdx === brandItems.length - 1}
                                        className="text-slate-400 hover:text-slate-700 disabled:opacity-20 p-1 rounded hover:bg-slate-100"
                                        title="Move Down"
                                      >
                                        <MoveDown className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveBrand(bIdx)}
                                        className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer ml-1"
                                        title="Remove Brand"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Brand Image Upload */}
                                  <div>
                                    <label className="block text-[8.5px] font-extrabold text-slate-600 uppercase tracking-wide mb-1">
                                      Brand Logo Image
                                    </label>
                                    <ImageUploadInput
                                      value={brand.imageUrl || ''}
                                      onChange={(url) => handleUpdateBrand(bIdx, 'imageUrl', url)}
                                      placeholder="Upload brand logo or select image..."
                                    />
                                  </div>

                                  {/* Name and Link */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[8.5px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                                        Brand Name
                                      </label>
                                      <input
                                        type="text"
                                        value={brand.title || ''}
                                        onChange={(e) => handleUpdateBrand(bIdx, 'title', e.target.value)}
                                        className="w-full text-xs p-1.5 border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-650 font-medium"
                                        placeholder="e.g. VELO, ZYN"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[8.5px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                                        Link Target
                                      </label>
                                      <input
                                        type="text"
                                        value={brand.linkUrl || ''}
                                        onChange={(e) => handleUpdateBrand(bIdx, 'linkUrl', e.target.value)}
                                        className="w-full text-xs p-1.5 border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-650 font-mono text-[10px]"
                                        placeholder="frontend-shop"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* IMAGES GALLERY / MARQUEE IMAGES / LOGO LIST MANAGER */}
                    {['Images gallery', 'Marquee images', 'Logo list'].includes(currentlyEditingSection.type) && (() => {
                      const imagesKey = currentlyEditingSection.type === 'Logo list' ? 'logoImages' : 'galleryImages';
                      const images = (currentlyEditingSection.settings[imagesKey] as string[]) || [];

                      const handleUpdateImage = (idx: number, url: string) => {
                        const updated = images.map((img, i) => i === idx ? url : img);
                        handleUpdateSectionSettings(imagesKey, updated);
                      };

                      const handleAddImage = () => {
                        const updated = [...images, PLACEHOLDER_IMAGE];
                        handleUpdateSectionSettings(imagesKey, updated);
                      };

                      const handleRemoveImage = (idx: number) => {
                        const updated = images.filter((_, i) => i !== idx);
                        handleUpdateSectionSettings(imagesKey, updated);
                      };

                      return (
                        <div className="space-y-3 bg-slate-50/90 p-3 rounded-xl border border-slate-250">
                          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                              <span>🖼️ Gallery & Logo Images</span>
                              <span className="text-indigo-650 bg-indigo-50 font-mono font-bold px-1.5 py-0.5 rounded text-[9px] border border-indigo-200">
                                {images.length} images
                              </span>
                            </label>
                            <button
                              type="button"
                              onClick={handleAddImage}
                              className="text-[9px] font-black bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-md flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                            >
                              <Plus className="h-3 w-3" /> Add Image
                            </button>
                          </div>

                          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                            {images.map((imgUrl, iIdx) => (
                              <div key={iIdx} className="bg-white p-2.5 rounded-xl border border-slate-250 shadow-2xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-[9px] text-slate-500 font-mono">Image #{iIdx + 1}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(iIdx)}
                                    className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer"
                                    title="Remove Image"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <ImageUploadInput
                                  value={imgUrl || ''}
                                  onChange={(url) => handleUpdateImage(iIdx, url)}
                                  placeholder="Upload or choose image..."
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* SLIDESHOW MANAGER */}
                    {currentlyEditingSection.type === 'Slideshow' && (() => {
                      const slides = currentlyEditingSection.settings.slides || [];

                      const handleUpdateSlide = (idx: number, field: string, val: string) => {
                        const updated = slides.map((s, i) => i === idx ? { ...s, [field]: val } : s);
                        handleUpdateSectionSettings('slides', updated);
                      };

                      const handleAddSlide = () => {
                        const updated = [
                          ...slides,
                          { title: 'New Slide Title', description: 'Enter slide description text...', imageUrl: PLACEHOLDER_IMAGE, buttonText: 'Explore Collection', buttonLink: 'frontend-shop' }
                        ];
                        handleUpdateSectionSettings('slides', updated);
                      };

                      const handleRemoveSlide = (idx: number) => {
                        const updated = slides.filter((_, i) => i !== idx);
                        handleUpdateSectionSettings('slides', updated);
                      };

                      return (
                        <div className="space-y-3 bg-slate-50/90 p-3 rounded-xl border border-slate-250">
                          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                              <span>🎞️ Hero Slides ({slides.length})</span>
                            </label>
                            <button
                              type="button"
                              onClick={handleAddSlide}
                              className="text-[9px] font-black bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-md flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                            >
                              <Plus className="h-3 w-3" /> Add Slide
                            </button>
                          </div>

                          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                            {slides.map((slide, sIdx) => (
                              <div key={sIdx} className="bg-white p-3 rounded-xl border border-slate-250 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                  <span className="font-extrabold text-[9px] text-indigo-700 font-mono">Slide #{sIdx + 1}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSlide(sIdx)}
                                    className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer"
                                    title="Remove Slide"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <div>
                                  <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-1">Slide Image</label>
                                  <ImageUploadInput
                                    value={slide.imageUrl || ''}
                                    onChange={(url) => handleUpdateSlide(sIdx, 'imageUrl', url)}
                                    placeholder="Upload slide background image..."
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Title</label>
                                  <input
                                    type="text"
                                    value={slide.title || ''}
                                    onChange={(e) => handleUpdateSlide(sIdx, 'title', e.target.value)}
                                    className="w-full text-xs p-1.5 border rounded bg-slate-50"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Description</label>
                                  <textarea
                                    rows={2}
                                    value={slide.description || ''}
                                    onChange={(e) => handleUpdateSlide(sIdx, 'description', e.target.value)}
                                    className="w-full text-xs p-1.5 border rounded bg-slate-50"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Button Label</label>
                                    <input
                                      type="text"
                                      value={slide.buttonText || ''}
                                      onChange={(e) => handleUpdateSlide(sIdx, 'buttonText', e.target.value)}
                                      className="w-full text-xs p-1.5 border rounded bg-slate-50"
                                      placeholder="EXPLORE NOW"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[8.5px] font-bold text-slate-500 uppercase mb-0.5">Button Link Target</label>
                                    <input
                                      type="text"
                                      value={slide.buttonLink || ''}
                                      onChange={(e) => handleUpdateSlide(sIdx, 'buttonLink', e.target.value)}
                                      className="w-full text-xs p-1.5 border rounded bg-slate-50 font-mono text-[10px]"
                                      placeholder="frontend-shop"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Text & Color Customizers */}
                    <div className="space-y-3 bg-slate-50/90 p-3 rounded-xl border border-slate-200/80 pt-3">
                      <span className="block text-[10px] font-black text-slate-900 uppercase tracking-wider">🎨 Text Color & Theme Options</span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8.5px] font-extrabold text-slate-600 uppercase mb-1">Heading Color</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={currentlyEditingSection.settings.headingColor || '#1E293B'}
                              onChange={(e) => handleUpdateSectionSettings('headingColor', e.target.value)}
                              className="w-8 h-8 rounded border cursor-pointer bg-white p-0 shrink-0"
                            />
                            <input
                              type="text"
                              value={currentlyEditingSection.settings.headingColor || ''}
                              onChange={(e) => handleUpdateSectionSettings('headingColor', e.target.value)}
                              className="w-full text-[10px] p-1 border rounded bg-white font-mono uppercase"
                              placeholder="#1E293B"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[8.5px] font-extrabold text-slate-600 uppercase mb-1">Body / Subtitle Text</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={currentlyEditingSection.settings.textColor || '#475569'}
                              onChange={(e) => handleUpdateSectionSettings('textColor', e.target.value)}
                              className="w-8 h-8 rounded border cursor-pointer bg-white p-0 shrink-0"
                            />
                            <input
                              type="text"
                              value={currentlyEditingSection.settings.textColor || ''}
                              onChange={(e) => handleUpdateSectionSettings('textColor', e.target.value)}
                              className="w-full text-[10px] p-1 border rounded bg-white font-mono uppercase"
                              placeholder="#475569"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[8.5px] font-extrabold text-slate-600 uppercase mb-1">
                            {(currentlyEditingSection.type === 'Brand list' || currentlyEditingSection.type === 'Brands we offer')
                              ? 'Brand Image Overlay Heading Color'
                              : 'Card / Item Title'}
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={currentlyEditingSection.settings.overlayHeadingColor || currentlyEditingSection.settings.cardTitleColor || ((currentlyEditingSection.type === 'Brand list' || currentlyEditingSection.type === 'Brands we offer') ? '#FFFFFF' : '#0F172A')}
                              onChange={(e) => {
                                handleUpdateSectionSettings('overlayHeadingColor', e.target.value);
                                handleUpdateSectionSettings('cardTitleColor', e.target.value);
                              }}
                              className="w-8 h-8 rounded border cursor-pointer bg-white p-0 shrink-0"
                            />
                            <input
                              type="text"
                              value={currentlyEditingSection.settings.overlayHeadingColor || currentlyEditingSection.settings.cardTitleColor || ''}
                              onChange={(e) => {
                                handleUpdateSectionSettings('overlayHeadingColor', e.target.value);
                                handleUpdateSectionSettings('cardTitleColor', e.target.value);
                              }}
                              className="w-full text-[10px] p-1 border rounded bg-white font-mono uppercase"
                              placeholder={(currentlyEditingSection.type === 'Brand list' || currentlyEditingSection.type === 'Brands we offer') ? '#FFFFFF' : '#0F172A'}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[8.5px] font-extrabold text-slate-600 uppercase mb-1">Card / Item Description</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={currentlyEditingSection.settings.cardTextColor || '#64748B'}
                              onChange={(e) => handleUpdateSectionSettings('cardTextColor', e.target.value)}
                              className="w-8 h-8 rounded border cursor-pointer bg-white p-0 shrink-0"
                            />
                            <input
                              type="text"
                              value={currentlyEditingSection.settings.cardTextColor || ''}
                              onChange={(e) => handleUpdateSectionSettings('cardTextColor', e.target.value)}
                              className="w-full text-[10px] p-1 border rounded bg-white font-mono uppercase"
                              placeholder="#64748B"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[8.5px] font-extrabold text-slate-600 uppercase mb-1">Primary Button Text</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={currentlyEditingSection.settings.buttonTextColor || '#FFFFFF'}
                              onChange={(e) => handleUpdateSectionSettings('buttonTextColor', e.target.value)}
                              className="w-8 h-8 rounded border cursor-pointer bg-white p-0 shrink-0"
                            />
                            <input
                              type="text"
                              value={currentlyEditingSection.settings.buttonTextColor || ''}
                              onChange={(e) => handleUpdateSectionSettings('buttonTextColor', e.target.value)}
                              className="w-full text-[10px] p-1 border rounded bg-white font-mono uppercase"
                              placeholder="#FFFFFF"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[8.5px] font-extrabold text-slate-600 uppercase mb-1">Primary Button Bg</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={currentlyEditingSection.settings.buttonBgColor || '#4F46E5'}
                              onChange={(e) => handleUpdateSectionSettings('buttonBgColor', e.target.value)}
                              className="w-8 h-8 rounded border cursor-pointer bg-white p-0 shrink-0"
                            />
                            <input
                              type="text"
                              value={currentlyEditingSection.settings.buttonBgColor || ''}
                              onChange={(e) => handleUpdateSectionSettings('buttonBgColor', e.target.value)}
                              className="w-full text-[10px] p-1 border rounded bg-white font-mono uppercase"
                              placeholder="#4F46E5"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[8.5px] font-extrabold text-slate-600 uppercase mb-1">Badge / Accent Text</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={currentlyEditingSection.settings.badgeTextColor || '#10B981'}
                              onChange={(e) => handleUpdateSectionSettings('badgeTextColor', e.target.value)}
                              className="w-8 h-8 rounded border cursor-pointer bg-white p-0 shrink-0"
                            />
                            <input
                              type="text"
                              value={currentlyEditingSection.settings.badgeTextColor || ''}
                              onChange={(e) => handleUpdateSectionSettings('badgeTextColor', e.target.value)}
                              className="w-full text-[10px] p-1 border rounded bg-white font-mono uppercase"
                              placeholder="#10B981"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[8.5px] font-extrabold text-slate-600 uppercase mb-1">Section Background</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={currentlyEditingSection.settings.backgroundColor || '#FFFFFF'}
                              onChange={(e) => handleUpdateSectionSettings('backgroundColor', e.target.value)}
                              className="w-8 h-8 rounded border cursor-pointer bg-white p-0 shrink-0"
                            />
                            <input
                              type="text"
                              value={currentlyEditingSection.settings.backgroundColor || ''}
                              onChange={(e) => handleUpdateSectionSettings('backgroundColor', e.target.value)}
                              className="w-full text-[10px] p-1 border rounded bg-white font-mono uppercase"
                              placeholder="#FFFFFF"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Spacing adjustments */}
                    <div className="space-y-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/55">
                      <span className="block text-slate-700 font-extrabold text-[8px] uppercase tracking-wider mb-1">Spacing Controls (Padding)</span>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1 text-[8px] font-bold text-slate-500 uppercase">
                          <span>Top Spacing</span>
                          <span className="font-mono text-indigo-600">{currentlyEditingSection.settings.paddingTop !== undefined ? currentlyEditingSection.settings.paddingTop : 'Default'} px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="120"
                          step="4"
                          value={currentlyEditingSection.settings.paddingTop !== undefined ? currentlyEditingSection.settings.paddingTop : 24}
                          onChange={(e) => handleUpdateSectionSettings('paddingTop', parseInt(e.target.value, 10))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1 text-[8px] font-bold text-slate-500 uppercase">
                          <span>Bottom Spacing</span>
                          <span className="font-mono text-indigo-600">{currentlyEditingSection.settings.paddingBottom !== undefined ? currentlyEditingSection.settings.paddingBottom : 'Default'} px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="120"
                          step="4"
                          value={currentlyEditingSection.settings.paddingBottom !== undefined ? currentlyEditingSection.settings.paddingBottom : 24}
                          onChange={(e) => handleUpdateSectionSettings('paddingBottom', parseInt(e.target.value, 10))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1 text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                          <span>Horizontal Spacing (X-Padding)</span>
                          <span className="font-mono text-indigo-600">{currentlyEditingSection.settings.paddingSide !== undefined ? currentlyEditingSection.settings.paddingSide : 'Default'} px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="80"
                          step="4"
                          value={currentlyEditingSection.settings.paddingSide !== undefined ? currentlyEditingSection.settings.paddingSide : 16}
                          onChange={(e) => handleUpdateSectionSettings('paddingSide', parseInt(e.target.value, 10))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Typography sizes */}
                    <div className="space-y-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/55">
                      <span className="block text-slate-700 font-extrabold text-[8px] uppercase tracking-wider mb-1">Typography & Font Sizes</span>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1 text-[8px] font-bold text-slate-500 uppercase">
                          <span>Heading Font Size</span>
                          <span className="font-mono text-indigo-600">{currentlyEditingSection.settings.titleFontSize || 'Default'} px</span>
                        </div>
                        <input
                          type="range"
                          min="12"
                          max="64"
                          step="2"
                          value={currentlyEditingSection.settings.titleFontSize || 30}
                          onChange={(e) => handleUpdateSectionSettings('titleFontSize', parseInt(e.target.value, 10))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1 text-[8px] font-bold text-slate-500 uppercase">
                          <span>Body / Subtitle Font Size</span>
                          <span className="font-mono text-indigo-600">{currentlyEditingSection.settings.bodyFontSize || 'Default'} px</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="24"
                          step="1"
                          value={currentlyEditingSection.settings.bodyFontSize || 14}
                          onChange={(e) => handleUpdateSectionSettings('bodyFontSize', parseInt(e.target.value, 10))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>

                      {/* Text Alignment Button Group */}
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Content Alignment</label>
                        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg border border-slate-250/50">
                          {['left', 'center', 'right'].map((align) => (
                            <button
                              key={align}
                              type="button"
                              onClick={() => handleUpdateSectionSettings('alignment', align)}
                              className={`text-[9px] font-extrabold py-1 px-1.5 rounded-md transition-all cursor-pointer text-center capitalize ${
                                (currentlyEditingSection.settings.alignment || 'center') === align
                                  ? 'bg-white text-indigo-650 shadow-xs border border-slate-250/20'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              {align}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Button styling customizer */}
                    <div className="space-y-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/55">
                      <span className="block text-slate-700 font-extrabold text-[8px] uppercase tracking-wider">Button Customization</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Button BG Hex</label>
                          <input
                            type="color"
                            value={currentlyEditingSection.settings.buttonBgColor || '#D4AF37'}
                            onChange={(e) => handleUpdateSectionSettings('buttonBgColor', e.target.value)}
                            className="w-full h-7 border rounded cursor-pointer bg-slate-50 animate-none p-0"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Button Text Hex</label>
                          <input
                            type="color"
                            value={currentlyEditingSection.settings.buttonTextColor || '#000000'}
                            onChange={(e) => handleUpdateSectionSettings('buttonTextColor', e.target.value)}
                            className="w-full h-7 border rounded cursor-pointer bg-slate-50 animate-none p-0"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Corner Roundness</label>
                        <select
                          value={currentlyEditingSection.settings.buttonRoundness || 'rounded-lg'}
                          onChange={(e) => handleUpdateSectionSettings('buttonRoundness', e.target.value)}
                          className="w-full text-[9px] border p-1 rounded bg-white cursor-pointer"
                        >
                          <option value="rounded-none">Square (rounded-none)</option>
                          <option value="rounded">Soft (rounded)</option>
                          <option value="rounded-lg">Regular (rounded-lg)</option>
                          <option value="rounded-xl">Bubble (rounded-xl)</option>
                          <option value="rounded-full">Pill (rounded-full)</option>
                        </select>
                      </div>
                    </div>

                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 py-6 text-center">Click on any module section in the live preview frame to load options.</p>
                )}

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PagesTab;
