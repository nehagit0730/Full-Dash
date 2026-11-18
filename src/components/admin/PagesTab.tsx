import React, { useRef, useState } from 'react';
import {
  CustomPage, PageSection, Product, Collection, BlogPost, LayoutSettings
} from '../../types';
import { ArrowLeft, Copy, EyeOff, ExternalLink, Monitor, PanelBottom, PanelTop, Smartphone, Tablet } from 'lucide-react';
import PreviewFrame, { PreviewDevice } from './builder/PreviewFrame';
import SectionStylePanel from './builder/SectionStylePanel';
import { ColorField, Field, FontSelect, Group, Row, Segmented, TextInput } from './builder/controls';
import Header from '../Header';
import Footer from '../Footer';
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
  /** Header/footer settings, so the preview shows the store's real chrome. */
  layoutSettings?: LayoutSettings;
  /** What the live homepage renders: the builder homepage or the built-in theme. */
  homepageSource?: 'theme' | 'page-builder';
  onSetHomepageSource?: (source: 'theme' | 'page-builder') => void;
  onOpenLayoutSettings?: () => void;
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
  layoutSettings,
  homepageSource,
  onSetHomepageSource,
  onOpenLayoutSettings,
}) => {
  const [editingMetaPageId, setEditingMetaPageId] = useState<string | null>(null);

  // ── Section editor state ──────────────────────────────────────────────
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [showChrome, setShowChrome] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerHover, setPickerHover] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<'content' | 'style'>('content');
  const previewDocRef = useRef<Document | null>(null);

  const pickerItems = AVAILABLE_SECTION_TEMPLATES.filter(item => {
    const q = moduleSearchQuery.toLowerCase();
    return item.label.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q) || item.type.toLowerCase().includes(q);
  });
  const pickerPreview = pickerItems.find(i => i.type === pickerHover) || pickerItems[0];

  const exitBuilder = () => {
    if (hasUnsavedChanges && !confirm('You have unsaved changes. Leave the editor and discard them?')) return;
    if (hasUnsavedChanges) handleGlobalDiscard();
    setSelectedBuilderPageId(null);
    setSelectedBuilderSectionId(null);
    setHasUnsavedChanges(false);
  };

  /** Selects a section; from the list it also scrolls the preview to it. */
  const selectSection = (id: string, scrollPreview: boolean) => {
    setSelectedBuilderSectionId(id);
    if (scrollPreview) {
      previewDocRef.current?.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  /** Replaces the page being edited in one update (one undo-able change). */
  const commitEditingPage = (fn: (p: CustomPage) => CustomPage) => {
    if (!currentlyEditingPage) return;
    const updated = localPages.map(p => (p.id === currentlyEditingPage.id ? fn(p) : p));
    setLocalPages(updated);
    onUpdateCustomPages(updated);
    setHasUnsavedChanges(true);
  };

  const patchSection = (sectionId: string, patch: Record<string, any>) =>
    commitEditingPage(p => ({
      ...p,
      sections: p.sections.map(s => (s.id === sectionId ? { ...s, settings: { ...s.settings, ...patch } } : s))
    }));

  const toggleSectionHidden = (sectionId: string) => {
    const sec = currentlyEditingPage?.sections.find(s => s.id === sectionId);
    if (sec) patchSection(sectionId, { hidden: sec.settings?.hidden ? undefined : true });
  };

  const duplicateSection = (sectionId: string) => {
    const newId = `sec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    commitEditingPage(p => {
      const i = p.sections.findIndex(s => s.id === sectionId);
      if (i < 0) return p;
      const copy: PageSection = JSON.parse(JSON.stringify(p.sections[i]));
      copy.id = newId;
      const sections = [...p.sections];
      sections.splice(i + 1, 0, copy);
      return { ...p, sections };
    });
    setSelectedBuilderSectionId(newId);
  };

  const patchPageSettings = (patch: Record<string, any>) =>
    commitEditingPage(p => ({ ...p, settings: { ...(p.settings || {}), ...patch } }));

  const addSection = (type: string) => {
    handleAddSectionToPage(type as any);
    setShowPicker(false);
    setModuleSearchQuery('');
    setPanelTab('content');
  };

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
        // FULL-SCREEN SECTION EDITOR (Shopify theme-editor style)
        // ----------------------------------------------------
        <div className="fixed inset-0 z-[70] flex flex-col bg-[#f1f1f1] text-slate-900 font-sans">
          {/* Top bar */}
          <div className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center gap-3 px-3">
            <button
              type="button"
              onClick={exitBuilder}
              title="Exit editor"
              className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="hidden sm:block h-6 w-px bg-slate-200" />

            <div className="flex items-center gap-2 min-w-0">
              <select
                value={currentlyEditingPage?.id || ''}
                onChange={(e) => {
                  setSelectedBuilderPageId(e.target.value);
                  setSelectedBuilderSectionId(null);
                }}
                className="max-w-[220px] truncate rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                title="Switch page"
              >
                {localPages.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.isHomepage ? `🏠 ${p.title || 'Home page'}` : p.title || p.slug}
                  </option>
                ))}
              </select>
              <span
                className={`hidden md:inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  currentlyEditingPage?.visibility === 'Hidden' ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {currentlyEditingPage?.visibility === 'Hidden' ? 'Hidden' : 'Live'}
              </span>
            </div>

            <div className="flex-1" />

            <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200">
              {([
                { id: 'desktop', icon: <Monitor className="h-4 w-4" />, label: 'Desktop' },
                { id: 'tablet', icon: <Tablet className="h-4 w-4" />, label: 'Tablet' },
                { id: 'mobile', icon: <Smartphone className="h-4 w-4" />, label: 'Mobile' }
              ] as const).map(d => (
                <button
                  key={d.id}
                  type="button"
                  title={d.label}
                  onClick={() => setDevice(d.id)}
                  className={`h-8 w-9 flex items-center justify-center rounded-md transition ${
                    device === d.id ? 'bg-white shadow-sm ring-1 ring-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {d.icon}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowChrome(v => !v)}
              title={showChrome ? 'Hide header & footer in preview' : 'Show header & footer in preview'}
              className={`hidden md:flex h-9 w-9 items-center justify-center rounded-lg border ${
                showChrome ? 'border-slate-300 bg-white text-slate-700' : 'border-slate-200 bg-slate-100 text-slate-400'
              } hover:bg-slate-50`}
            >
              <PanelTop className="h-4 w-4" />
            </button>

            {currentlyEditingPage && (
              <button
                type="button"
                onClick={() => handlePreviewPage(currentlyEditingPage)}
                title="View the live page"
                className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            )}

            {hasUnsavedChanges && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Discard all unsaved changes?')) {
                    handleGlobalDiscard();
                    setSelectedBuilderSectionId(null);
                  }
                }}
                className="hidden sm:block h-9 rounded-lg border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
              >
                Discard
              </button>
            )}
            <button
              type="button"
              onClick={handleGlobalSave}
              disabled={!hasUnsavedChanges || isSaving}
              className={`h-9 rounded-lg px-4 text-[13px] font-semibold flex items-center gap-1.5 transition ${
                hasUnsavedChanges && !isSaving
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : !hasUnsavedChanges ? <Check className="h-3.5 w-3.5" /> : null}
              {isSaving ? 'Saving…' : hasUnsavedChanges ? 'Save' : 'Saved'}
            </button>
          </div>

          {/* The live homepage is not this page: say so, and offer the switch. */}
          {currentlyEditingPage?.isHomepage && homepageSource === 'theme' && (
            <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-amber-900">
              <Info className="h-4 w-4 shrink-0" />
              <span>
                Your live homepage is set to the built-in theme design, so edits here don't appear on the homepage.
              </span>
              <button
                type="button"
                onClick={() => onSetHomepageSource?.('page-builder')}
                className="font-semibold underline underline-offset-2 hover:text-amber-700"
              >
                Use this page as the homepage
              </button>
            </div>
          )}

          <div className="flex-1 min-h-0 flex relative">
            {/* Left: section tree */}
            <aside className="w-[272px] shrink-0 bg-white border-r border-slate-200 flex flex-col min-h-0">
              <div className="px-4 py-3 border-b border-slate-200">
                <h3 className="text-[14px] font-semibold truncate">{currentlyEditingPage?.title || 'Page'}</h3>
              </div>
              <div className="flex-1 overflow-y-auto py-2 text-[13px]">
                <div className="px-4 pt-2 pb-1 text-[12px] font-semibold text-slate-900">Header</div>
                <button
                  type="button"
                  onClick={() => onOpenLayoutSettings?.()}
                  className="w-full flex items-center gap-2 px-4 py-1.5 text-slate-700 hover:bg-slate-100 text-left"
                  title="Edit in Header & Footer settings"
                >
                  <PanelTop className="h-4 w-4 text-slate-500" /> Header
                </button>

                <div className="mt-3 border-t border-slate-100 px-4 pt-3 pb-1 text-[12px] font-semibold text-slate-900">Template</div>
                {(currentlyEditingPage?.sections || []).map((sec, idx) => {
                  const selected = selectedBuilderSectionId === sec.id;
                  const hidden = !!sec.settings?.hidden;
                  return (
                    <div
                      key={sec.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', idx.toString());
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const from = e.dataTransfer.getData('text/plain');
                        if (from !== '') handleMoveSectionTo(parseInt(from, 10), idx);
                      }}
                      onClick={() => selectSection(sec.id, true)}
                      className={`group mx-2 flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer select-none ${
                        selected ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <GripVertical className={`h-3.5 w-3.5 shrink-0 cursor-grab ${selected ? 'text-blue-200' : 'text-slate-300 group-hover:text-slate-400'}`} />
                      <span className={`shrink-0 [&_svg]:h-4 [&_svg]:w-4 ${selected ? '[&_svg]:text-white' : ''} ${hidden ? 'opacity-40' : ''}`}>
                        {getSectionIcon(sec.type)}
                      </span>
                      <span className={`flex-1 min-w-0 truncate ${hidden ? 'opacity-50 line-through' : ''}`}>
                        {getSectionLabel(sec.type)}
                        {sec.settings?.title && (
                          <span className={`ml-1 ${selected ? 'text-blue-100' : 'text-slate-400'}`}>– {String(sec.settings.title).slice(0, 28)}</span>
                        )}
                      </span>
                      <button
                        type="button"
                        title={hidden ? 'Show section' : 'Hide section'}
                        onClick={(e) => { e.stopPropagation(); toggleSectionHidden(sec.id); }}
                        className={`shrink-0 rounded p-0.5 ${hidden ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} ${
                          selected ? 'hover:bg-blue-500' : 'hover:bg-slate-200'
                        }`}
                      >
                        {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setShowPicker(true)}
                  className="mx-2 mt-1 flex w-[calc(100%-16px)] items-center gap-2 rounded-lg px-2 py-1.5 text-blue-700 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4" /> Add section
                </button>

                <div className="mt-3 border-t border-slate-100 px-4 pt-3 pb-1 text-[12px] font-semibold text-slate-900">Footer</div>
                <button
                  type="button"
                  onClick={() => onOpenLayoutSettings?.()}
                  className="w-full flex items-center gap-2 px-4 py-1.5 text-slate-700 hover:bg-slate-100 text-left"
                  title="Edit in Header & Footer settings"
                >
                  <PanelBottom className="h-4 w-4 text-slate-500" /> Footer
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBuilderSectionId(null)}
                className="shrink-0 flex items-center gap-2 border-t border-slate-200 px-4 py-3 text-[13px] text-slate-700 hover:bg-slate-50"
              >
                <Settings className="h-4 w-4" /> Page settings
              </button>
            </aside>

            {/* Add-section picker */}
            {showPicker && (
              <>
                <div className="absolute inset-0 z-30" onClick={() => setShowPicker(false)} />
                <div className="absolute left-[280px] top-3 bottom-3 z-40 w-[min(640px,calc(100%-296px))] flex rounded-xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden">
                  <div className="w-[260px] shrink-0 border-r border-slate-200 flex flex-col">
                    <div className="p-2.5 border-b border-slate-200">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          autoFocus
                          type="text"
                          placeholder="Search sections"
                          value={moduleSearchQuery}
                          onChange={(e) => setModuleSearchQuery(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 py-2 pl-8 pr-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-1.5">
                      {pickerItems.map(item => (
                        <button
                          key={item.type}
                          type="button"
                          onMouseEnter={() => setPickerHover(item.type)}
                          onFocus={() => setPickerHover(item.type)}
                          onClick={() => addSection(item.type)}
                          className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] ${
                            pickerHover === item.type ? 'bg-slate-100' : 'hover:bg-slate-50'
                          }`}
                        >
                          <span className="shrink-0 [&_svg]:h-4 [&_svg]:w-4">{getSectionIcon(item.type)}</span>
                          <span className="truncate">{item.label}</span>
                        </button>
                      ))}
                      {pickerItems.length === 0 && <p className="p-4 text-center text-[12px] text-slate-500">No sections match.</p>}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
                    {pickerPreview ? (
                      <>
                        <div className="h-24 w-24 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 flex items-center justify-center [&_svg]:h-10 [&_svg]:w-10">
                          {getSectionIcon(pickerPreview.type)}
                        </div>
                        <h4 className="mt-5 text-[17px] font-semibold">{pickerPreview.label}</h4>
                        <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-slate-600">{pickerPreview.desc}</p>
                        <button
                          type="button"
                          onClick={() => addSection(pickerPreview.type)}
                          className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white hover:bg-slate-800"
                        >
                          Add section
                        </button>
                      </>
                    ) : (
                      <p className="text-[13px] text-slate-500">Hover a section to see what it does.</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Center: live preview at real device width */}
            <div className="flex-1 min-w-0 p-3">
              <div className="h-full rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-black/5">
                <PreviewFrame device={device} onDocument={(doc) => { previewDocRef.current = doc; }}>
                  <div className="min-h-screen bg-[#f6f6f7] text-slate-800 flex flex-col font-sans">
                    {showChrome && (
                      <div className="pointer-events-none">
                        <Header
                          currentTab={currentlyEditingPage?.isHomepage ? 'frontend-home' : (currentlyEditingPage?.slug || '')}
                          onTabChange={() => {}}
                          loggedInCustomer={null}
                          cartItems={[]}
                          onOpenCart={() => {}}
                          onOpenCustomer={() => {}}
                          onOpenWishlist={() => {}}
                          onOpenAdmin={() => {}}
                          isAdminActive={false}
                          allProducts={products}
                          allCollections={collections}
                          layoutSettings={layoutSettings}
                        />
                      </div>
                    )}
                    <main className="flex-1">
                      {currentlyEditingPage && (currentlyEditingPage.sections || []).length > 0 ? (
                        <PageRenderer
                          page={currentlyEditingPage}
                          allProducts={products}
                          allCollections={collections}
                          allBlogs={blogs}
                          loggedInCustomer={null}
                          onAddToCart={() => {}}
                          onToggleWishlist={() => {}}
                          onNavigate={() => {}}
                          editor={{
                            selectedSectionId: selectedBuilderSectionId,
                            onSelectSection: (id) => selectSection(id, false),
                            renderSectionTools: (sec, idx) => (
                              <div className="flex items-center gap-0.5 rounded-xl bg-white p-1 shadow-lg ring-1 ring-black/10 text-slate-700">
                                <button type="button" title="Move up" disabled={idx === 0}
                                  onClick={(e) => { e.stopPropagation(); handleMoveSection(idx, 'up'); }}
                                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 disabled:opacity-30">
                                  <MoveUp className="h-4 w-4" />
                                </button>
                                <button type="button" title="Move down" disabled={idx === currentlyEditingPage.sections.length - 1}
                                  onClick={(e) => { e.stopPropagation(); handleMoveSection(idx, 'down'); }}
                                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 disabled:opacity-30">
                                  <MoveDown className="h-4 w-4" />
                                </button>
                                <button type="button" title="Duplicate"
                                  onClick={(e) => { e.stopPropagation(); duplicateSection(sec.id); }}
                                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
                                  <Copy className="h-4 w-4" />
                                </button>
                                <button type="button" title={sec.settings?.hidden ? 'Show section' : 'Hide section'}
                                  onClick={(e) => { e.stopPropagation(); toggleSectionHidden(sec.id); }}
                                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
                                  {sec.settings?.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </button>
                                <button type="button" title="Delete section"
                                  onClick={(e) => { e.stopPropagation(); handleRemoveSectionFromPage(sec.id); }}
                                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-600">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )
                          }}
                        />
                      ) : (
                        <div className="py-32 text-center font-sans">
                          <p className="text-[15px] font-semibold text-slate-700">This page has no sections yet</p>
                          <p className="mt-1 text-[13px] text-slate-500">Use “Add section” on the left to start building.</p>
                        </div>
                      )}
                    </main>
                    {showChrome && (
                      <div className="pointer-events-none">
                        <Footer layoutSettings={layoutSettings} />
                      </div>
                    )}
                  </div>
                </PreviewFrame>
              </div>
            </div>

            {/* Right: settings */}
            <aside className="w-[340px] shrink-0 bg-white border-l border-slate-200 flex flex-col min-h-0">
              {currentlyEditingSection ? (
                <>
                  <div className="h-12 shrink-0 flex items-center gap-2 px-4 border-b border-slate-200">
                    <span className="[&_svg]:h-4 [&_svg]:w-4 shrink-0">{getSectionIcon(currentlyEditingSection.type)}</span>
                    <h3 className="flex-1 truncate text-[14px] font-semibold">{getSectionLabel(currentlyEditingSection.type)}</h3>
                    <button type="button" title="Duplicate" onClick={() => duplicateSection(currentlyEditingSection.id)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
                      <Copy className="h-4 w-4" />
                    </button>
                    <button type="button" title="Close" onClick={() => setSelectedBuilderSectionId(null)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="shrink-0 px-4 pt-3">
                    <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                      {(['content', 'style'] as const).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setPanelTab(t)}
                          className={`flex-1 rounded-md py-1.5 text-[12.5px] font-medium capitalize transition ${
                            panelTab === t ? 'bg-white shadow-sm ring-1 ring-slate-200 text-slate-900' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {t === 'style' ? 'Style & fonts' : 'Content'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {panelTab === 'style' ? (
                      <div className="pt-1">
                        <SectionStylePanel section={currentlyEditingSection} onPatch={(patch) => patchSection(currentlyEditingSection.id, patch)} />
                      </div>
                    ) : (
                  <div className="p-4 space-y-4 text-xs">
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

                    {/* Section-specific options */}
                    {['Image banner', 'Text column with image', 'Images gallery', 'Blog post', 'Brand list', 'Brands we offer'].includes(currentlyEditingSection.type) && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Small label above the heading</label>
                        <input
                          type="text"
                          value={currentlyEditingSection.settings.badgeText || ''}
                          onChange={(e) => handleUpdateSectionSettings('badgeText', e.target.value)}
                          className="w-full text-xs p-2 border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-650"
                          placeholder="Leave empty for the default"
                        />
                      </div>
                    )}

                    {currentlyEditingSection.type === 'Featured collection' && (
                      <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 cursor-pointer">
                        <span className="text-[11px] font-semibold text-slate-700">Show New / Bestsellers / On sale tabs</span>
                        <input
                          type="checkbox"
                          checked={currentlyEditingSection.settings.showTabs !== false}
                          onChange={(e) => handleUpdateSectionSettings('showTabs', e.target.checked)}
                          className="h-4 w-4 accent-slate-900"
                        />
                      </label>
                    )}

                    {currentlyEditingSection.type === 'Video banner' && (
                      <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 cursor-pointer">
                        <span className="text-[11px] font-semibold text-slate-700">Show the delivery / returns bar</span>
                        <input
                          type="checkbox"
                          checked={currentlyEditingSection.settings.showFeatureBar !== false}
                          onChange={(e) => handleUpdateSectionSettings('showFeatureBar', e.target.checked)}
                          className="h-4 w-4 accent-slate-900"
                        />
                      </label>
                    )}

                    {(currentlyEditingSection.type === 'Clearance Sale' || currentlyEditingSection.type === 'Featured collection') && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Products to show</label>
                        <input
                          type="number"
                          min={1}
                          max={24}
                          value={currentlyEditingSection.settings.itemsCount || 8}
                          onChange={(e) => handleUpdateSectionSettings('itemsCount', Math.max(1, Math.min(24, parseInt(e.target.value, 10) || 8)))}
                          className="w-full text-xs p-2 border rounded-lg bg-slate-50 focus:bg-white focus:outline-none"
                        />
                        {currentlyEditingSection.type === 'Clearance Sale' && (
                          <p className="text-[10px] text-slate-400 mt-1">With no products picked below, every product whose compare-at price is above its price is shown.</p>
                        )}
                      </div>
                    )}

                    {(currentlyEditingSection.type === 'How it works' || currentlyEditingSection.type === 'Icon with text') && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          {currentlyEditingSection.type === 'How it works' ? 'Number & button color' : 'Icon color'}
                        </label>
                        <input
                          type="color"
                          value={(currentlyEditingSection.type === 'How it works' ? currentlyEditingSection.settings.accentColor : currentlyEditingSection.settings.iconColor) || '#111827'}
                          onChange={(e) => handleUpdateSectionSettings(currentlyEditingSection.type === 'How it works' ? 'accentColor' : 'iconColor', e.target.value)}
                          className="h-8 w-16 cursor-pointer rounded border bg-white p-0"
                        />
                      </div>
                    )}

                    {currentlyEditingSection.type === 'Text column with image' && (() => {
                      const cols: any[] = Array.isArray(currentlyEditingSection.settings.columnItems) ? currentlyEditingSection.settings.columnItems : [];
                      const setCols = (next: any[]) => handleUpdateSectionSettings('columnItems', next);
                      const update = (i: number, patch: Record<string, any>) => setCols(cols.map((c, j) => (j === i ? { ...c, ...patch } : c)));
                      return (
                        <div className="space-y-2.5 bg-slate-50/90 p-3 rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Columns</span>
                            <button
                              type="button"
                              onClick={() => setCols([...cols, { title: 'New column', description: '', imageUrl: '', badge: '', linkUrl: '' }])}
                              className="text-[10px] font-bold text-indigo-700 hover:underline"
                            >
                              + Add column
                            </button>
                          </div>
                          {cols.length === 0 && <p className="text-[10px] text-slate-400">No columns yet — three example columns are shown until you add your own.</p>}
                          {cols.map((c, i) => (
                            <div key={i} className="space-y-1.5 rounded-lg border border-slate-200 bg-white p-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500">Column {i + 1}</span>
                                <button type="button" onClick={() => setCols(cols.filter((_, j) => j !== i))} className="text-[10px] text-red-600 hover:underline">Remove</button>
                              </div>
                              <input type="text" value={c.title || ''} onChange={(e) => update(i, { title: e.target.value })} placeholder="Heading" className="w-full text-xs p-1.5 border rounded" />
                              <textarea rows={2} value={c.description || ''} onChange={(e) => update(i, { description: e.target.value })} placeholder="Text" className="w-full text-xs p-1.5 border rounded" />
                              <ImageUploadInput value={c.imageUrl || ''} onChange={(url) => update(i, { imageUrl: url })} placeholder="Optional image" />
                              <div className="grid grid-cols-2 gap-1.5">
                                <input type="text" value={c.badge || ''} onChange={(e) => update(i, { badge: e.target.value })} placeholder="Label (optional)" className="w-full text-xs p-1.5 border rounded" />
                                <input type="text" value={c.linkUrl || ''} onChange={(e) => update(i, { linkUrl: e.target.value })} placeholder="Link, e.g. /shop" className="w-full text-xs p-1.5 border rounded" />
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

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
                            placeholder="frontend-shop, /about, etc."
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
                            placeholder="frontend-shop, /about, etc."
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
                                    placeholder="e.g. frontend-shop or https://..."
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
                                    placeholder="frontend-shop or https://..."
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
                        // One card per collection: a real starting point, not sample brands.
                        const presets = (collections || []).slice(0, 12).map(c => ({
                          imageUrl: c.image || '',
                          linkUrl: `/collections/${c.slug || c.id}`,
                          title: c.title
                        }));
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
                                        placeholder="e.g. Brand name"
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


                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleRemoveSectionFromPage(currentlyEditingSection.id)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2 text-[12.5px] font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove section
                      </button>
                    </div>
                  </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="h-12 shrink-0 flex items-center gap-2 px-4 border-b border-slate-200">
                    <Settings className="h-4 w-4 text-slate-500" />
                    <h3 className="text-[14px] font-semibold">Page settings</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {currentlyEditingPage && (
                      <>
                        <Group title="Page">
                          <Field label="Title">
                            <TextInput value={currentlyEditingPage.title} onChange={(v) => handleUpdatePageMeta(currentlyEditingPage.id, { title: v })} />
                          </Field>
                          {!currentlyEditingPage.isHomepage && (
                            <Field label="URL handle (/pages/…)">
                              <TextInput value={currentlyEditingPage.slug} onChange={(v) => handleUpdatePageMeta(currentlyEditingPage.id, { slug: v })} placeholder="page-handle" />
                            </Field>
                          )}
                          <Row label="Visibility">
                            <Segmented
                              value={currentlyEditingPage.visibility || 'Visible'}
                              options={[{ value: 'Visible', label: 'Visible' }, { value: 'Hidden', label: 'Hidden' }]}
                              onChange={(v) => handleUpdatePageMeta(currentlyEditingPage.id, { visibility: v as 'Visible' | 'Hidden' })}
                            />
                          </Row>
                          {currentlyEditingPage.isHomepage && (
                            <Field label="Live homepage shows">
                              <Segmented
                                value={homepageSource === 'theme' ? 'theme' : 'page-builder'}
                                options={[
                                  { value: 'page-builder', label: 'This page' },
                                  { value: 'theme', label: 'Theme design' }
                                ]}
                                onChange={(v) => onSetHomepageSource?.(v as 'theme' | 'page-builder')}
                              />
                            </Field>
                          )}
                        </Group>
                        <Group title="Typography">
                          <p className="text-[11.5px] text-slate-500 leading-relaxed">Defaults for every section on this page. Each section can override them under Style &amp; fonts.</p>
                          <Row label="Heading font">
                            <FontSelect value={currentlyEditingPage.settings?.headingFont} onChange={(v) => patchPageSettings({ headingFont: v })} />
                          </Row>
                          <Row label="Body font">
                            <FontSelect value={currentlyEditingPage.settings?.bodyFont} onChange={(v) => patchPageSettings({ bodyFont: v })} />
                          </Row>
                        </Group>
                        <Group title="Colors">
                          <Row label="Page background">
                            <ColorField
                              value={currentlyEditingPage.settings?.backgroundColor}
                              fallback="#F6F6F7"
                              onChange={(v) => patchPageSettings({ backgroundColor: v })}
                              onClear={() => patchPageSettings({ backgroundColor: undefined })}
                            />
                          </Row>
                        </Group>
                      </>
                    )}
                    <p className="px-4 py-4 text-[12px] text-slate-500 leading-relaxed">
                      Select a section in the preview or in the list on the left to edit its content, layout, colors and fonts.
                    </p>
                  </div>
                </>
              )}
            </aside>
          </div>
        </div>
      )}

    </div>
  );
};

export default PagesTab;
