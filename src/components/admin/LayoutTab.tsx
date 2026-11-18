import React from 'react';
import { Save, CheckCircle2, Layout, Mail, Cloud, Globe, Plus, Link, FileCode, MoveUp, MoveDown, Trash2 } from 'lucide-react';
import { LayoutSettings, CustomPage } from '../../types';
import ImageUploadInput from '../ImageUploadInput';

interface LayoutTabProps {
  /** Navigates to another dashboard section. */
  onOpenTab?: (tab: string) => void;
  localLayoutSettings: LayoutSettings;
  setLocalLayoutSettings: (settings: LayoutSettings) => void;
  onUpdateLayoutSettings?: (settings: LayoutSettings) => void;
  layoutSavedToast: boolean;
  setLayoutSavedToast: (val: boolean) => void;
  parseCloudinaryInput: (input: string, currentKey?: string, currentSecret?: string) => { cName: string; aKey: string; aSecret: string };
  handleTestCloudinary: () => void;
  testingCloudinary: boolean;
  cloudinaryTestResult: { success: boolean; message: string } | null;
  isAddingMenuItem: boolean;
  setIsAddingMenuItem: (val: boolean) => void;
  newMenuItemLabel: string;
  setNewMenuItemLabel: (val: string) => void;
  newMenuItemType: 'tab' | 'external';
  setNewMenuItemType: (val: 'tab' | 'external') => void;
  newMenuItemTarget: string;
  setNewMenuItemTarget: (val: string) => void;
  newMenuItemUrl: string;
  setNewMenuItemUrl: (val: string) => void;
  addMenuItem: () => void;
  editMenuItemLabel: (id: string, label: string) => void;
  editMenuItemUrl: (id: string, url: string) => void;
  editMenuItemTarget: (id: string, target: string) => void;
  moveMenuItem: (index: number, direction: 'up' | 'down') => void;
  removeMenuItem: (id: string) => void;
  localPages: CustomPage[];
}

export const LayoutTab: React.FC<LayoutTabProps> = ({
  onOpenTab,
  localLayoutSettings,
  setLocalLayoutSettings,
  onUpdateLayoutSettings,
  layoutSavedToast,
  setLayoutSavedToast,
  parseCloudinaryInput,
  handleTestCloudinary,
  testingCloudinary,
  cloudinaryTestResult,
  isAddingMenuItem,
  setIsAddingMenuItem,
  newMenuItemLabel,
  setNewMenuItemLabel,
  newMenuItemType,
  setNewMenuItemType,
  newMenuItemTarget,
  setNewMenuItemTarget,
  newMenuItemUrl,
  setNewMenuItemUrl,
  addMenuItem,
  editMenuItemLabel,
  editMenuItemUrl,
  editMenuItemTarget,
  moveMenuItem,
  removeMenuItem,
  localPages
}) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto text-xs text-left animate-fade-in pb-12">
      
      {/* Header controls select */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Header & Footer Global Settings</h3>
          <p className="text-slate-400 text-[10px] font-medium mt-0.5">Configure your brand logos, subtext descriptions, and the header navigation menu.</p>
        </div>
        <button
          onClick={() => {
            if (onUpdateLayoutSettings) {
              onUpdateLayoutSettings(localLayoutSettings);
              setLayoutSavedToast(true);
              setTimeout(() => setLayoutSavedToast(false), 4000);
            }
          }}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md shadow-indigo-150 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Save className="h-4 w-4" />
          <span>Save Header & Footer</span>
        </button>
      </div>

      {/* Layout saved toast alert */}
      {layoutSavedToast && (
        <div className="bg-emerald-50 border border-emerald-250 p-4 rounded-xl flex items-center gap-3 text-emerald-800 animate-fade-in select-none">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold block text-xs">Settings updated successfully!</span>
            <span className="text-[10px] font-medium text-emerald-650">Your custom headers, footers, logo graphics, and navigation structure are now live across the storefront.</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Header & Footer configuration cards */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. HEADER BRAND IDENTITY CARD */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-1.5 bg-indigo-50 text-indigo-650 rounded-lg">
                <Layout className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-slate-900 uppercase tracking-wider text-xs">Header Brand Identity</span>
            </div>

            <div>
              <label htmlFor="homepage-source" className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider mb-1">Home page</label>
              <select
                id="homepage-source"
                value={(localLayoutSettings as any).homepageSource === 'theme' ? 'theme' : 'page-builder'}
                onChange={(e) => setLocalLayoutSettings({ ...localLayoutSettings, homepageSource: e.target.value as any })}
                className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="page-builder">Page Builder home page (what you edit in Pages)</option>
                <option value="theme">Built-in theme home page (not editable in Pages)</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">The logo text below is the store name shown in the header, footer and emails.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider mb-1">Logo Text</label>
                <input
                  type="text"
                  value={localLayoutSettings.headerLogoText}
                  onChange={(e) => setLocalLayoutSettings({ ...localLayoutSettings, headerLogoText: e.target.value })}
                  className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Ecommerce Store"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider mb-1">Logo Subtext</label>
                <input
                  type="text"
                  value={localLayoutSettings.headerLogoSubtext}
                  onChange={(e) => setLocalLayoutSettings({ ...localLayoutSettings, headerLogoSubtext: e.target.value })}
                  className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Since 2020 (optional)"
                />
              </div>
            </div>

            <div>
              <ImageUploadInput
                label="Custom Header Logo Image"
                value={localLayoutSettings.headerLogoImage}
                onChange={(url) => setLocalLayoutSettings({ ...localLayoutSettings, headerLogoImage: url })}
                placeholder="Header logo URL or select from File Manager..."
              />
            </div>
          </div>

          {/* 2. FOOTER BRAND IDENTITY CARD */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-1.5 bg-indigo-50 text-indigo-650 rounded-lg">
                <Layout className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-slate-900 uppercase tracking-wider text-xs">Footer Brand Identity</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider mb-1">Footer Text Title</label>
                <input
                  type="text"
                  value={localLayoutSettings.footerLogoText}
                  onChange={(e) => setLocalLayoutSettings({ ...localLayoutSettings, footerLogoText: e.target.value })}
                  className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. ECOMMERCE STORE"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider mb-1">Footer Brand Description</label>
                <textarea
                  value={localLayoutSettings.footerLogoDescription}
                  onChange={(e) => setLocalLayoutSettings({ ...localLayoutSettings, footerLogoDescription: e.target.value })}
                  rows={3}
                  className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y leading-relaxed"
                  placeholder="Provide a footer blurb describing your brand, Sweden origin, or delivery credentials..."
                />
              </div>
            </div>

            <div>
              <ImageUploadInput
                label="Custom Footer Logo Image"
                value={localLayoutSettings.footerLogoImage}
                onChange={(url) => setLocalLayoutSettings({ ...localLayoutSettings, footerLogoImage: url })}
                placeholder="Footer logo URL or select from File Manager..."
              />
            </div>
          </div>

          {/* Credentials live in one place: Settings → API & integrations. */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-5 space-y-3">
            <span className="font-extrabold text-slate-900 uppercase tracking-wider text-xs">Media & marketing connections</span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Cloudinary (image hosting) and Klaviyo (email marketing) are configured with your other services, where their keys are stored encrypted and can be tested.
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => onOpenTab?.('integrations')} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50">
                Open API &amp; integrations
              </button>
              <button type="button" onClick={() => onOpenTab?.('email')} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50">
                Open Email &amp; marketing
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: Header Navigation Menu Builder */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* NAVIGATION MENU ITEMS LIST CARD */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-650 rounded-lg">
                  <Globe className="h-4 w-4" />
                </div>
                <span className="font-extrabold text-slate-900 uppercase tracking-wider text-xs">Header Menu</span>
              </div>
              
              {!isAddingMenuItem && (
                <button
                  onClick={() => {
                    setNewMenuItemLabel('');
                    setNewMenuItemUrl('');
                    setNewMenuItemType('tab');
                    setNewMenuItemTarget('frontend-home');
                    setIsAddingMenuItem(true);
                  }}
                  className="px-2.5 py-1 text-indigo-600 hover:text-indigo-700 font-extrabold text-[10px] uppercase tracking-wider border border-indigo-200 bg-indigo-50 hover:bg-indigo-100/75 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add link</span>
                </button>
              )}
            </div>

            {/* Add link panel */}
            {isAddingMenuItem && (
              <div className="bg-slate-50/75 border border-slate-200 rounded-xl p-3.5 space-y-3.5 select-none text-left animate-slide-in-right">
                <span className="font-extrabold text-[10px] text-indigo-750 uppercase tracking-wider block">Add Navigation Link</span>
                
                <div>
                  <label className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider mb-1">Link Title / Label</label>
                  <input
                    type="text"
                    required
                    value={newMenuItemLabel}
                    onChange={(e) => setNewMenuItemLabel(e.target.value)}
                    placeholder="e.g. New arrivals"
                    className="w-full text-xs font-semibold border border-slate-250 p-2 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider mb-1">Target Action Type</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="menuType"
                        checked={newMenuItemType === 'tab'}
                        onChange={() => setNewMenuItemType('tab')}
                        className="accent-indigo-650"
                      />
                      <span>Internal Tab</span>
                    </label>
                    <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="menuType"
                        checked={newMenuItemType === 'external'}
                        onChange={() => setNewMenuItemType('external')}
                        className="accent-indigo-650"
                      />
                      <span>External URL</span>
                    </label>
                  </div>
                </div>

                {newMenuItemType === 'tab' ? (
                  <div>
                    <label className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider mb-1">Internal Navigation Destination</label>
                    <select
                      value={newMenuItemTarget}
                      onChange={(e) => setNewMenuItemTarget(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-250 p-2 rounded-lg bg-white focus:outline-none cursor-pointer text-slate-750"
                    >
                      <optgroup label="Core Store Tabs">
                        <option value="frontend-home">Storefront Home</option>
                        <option value="frontend-shop">Shop Now grid</option>
                        <option value="frontend-brands">All Sweden Brands</option>
                        <option value="about">About us info</option>
                        <option value="blogs">Blog</option>
                      </optgroup>
                      {localPages.length > 0 && (
                        <optgroup label="Custom Builder Pages">
                          {localPages.map(page => (
                            <option key={page.id} value={`page-${page.slug}`}>
                              Page: {page.title} ({page.slug})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider mb-1">Destination URL Link</label>
                    <div className="relative">
                      <input
                        type="url"
                        required
                        value={newMenuItemUrl}
                        onChange={(e) => setNewMenuItemUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full text-xs font-semibold border border-slate-250 p-2 pl-7 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <Link className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setIsAddingMenuItem(false)}
                    className="px-3 py-1.5 text-slate-500 hover:text-slate-800 font-bold text-[10px] uppercase border border-slate-200 bg-white hover:bg-slate-50 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addMenuItem}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase rounded-lg shadow-sm transition"
                  >
                    Add Link
                  </button>
                </div>
              </div>
            )}

            {/* List of current menu items */}
            <div className="space-y-2.5">
              {localLayoutSettings.menuItems.length === 0 ? (
                <div className="text-center py-6 text-slate-450 italic border border-dashed border-slate-200 bg-slate-50/50 rounded-xl">
                  No links in navigation menu. Click "Add link" to start.
                </div>
              ) : (
                localLayoutSettings.menuItems.map((item, index) => {
                  return (
                    <div 
                      key={item.id} 
                      className="border border-slate-200 rounded-xl p-3 bg-slate-50/30 flex items-center justify-between gap-2.5 shadow-3xs"
                    >
                      <div className="flex-1 min-w-0 space-y-1 text-left">
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => editMenuItemLabel(item.id, e.target.value)}
                          className="font-extrabold text-xs text-slate-900 border-none bg-transparent hover:bg-slate-100 p-1 rounded focus:bg-white focus:ring-1 focus:ring-slate-350 w-full focus:outline-none"
                          title="Click to rename link"
                        />
                        <div className="flex items-center gap-1.5 pl-1">
                          {item.type === 'external' ? (
                            <>
                              <Link className="h-3 w-3 text-indigo-500 shrink-0" />
                              <input
                                type="text"
                                value={item.url || ''}
                                onChange={(e) => editMenuItemUrl(item.id, e.target.value)}
                                className="text-[10px] text-slate-400 truncate bg-transparent focus:bg-white p-0.5 rounded border-none w-full font-medium"
                                title="Edit URL link"
                              />
                            </>
                          ) : (
                            <>
                              <FileCode className="h-3 w-3 text-slate-400 shrink-0" />
                              <select
                                value={item.tab}
                                onChange={(e) => editMenuItemTarget(item.id, e.target.value)}
                                className="text-[10px] text-slate-400 font-semibold bg-transparent hover:bg-slate-100 p-0.5 rounded border-none cursor-pointer max-w-[150px]"
                              >
                                <option value="frontend-home">Home</option>
                                <option value="frontend-shop">Shop grid</option>
                                <option value="frontend-brands">Sweden Brands</option>
                                <option value="about">About info</option>
                                <option value="blogs">Blogs</option>
                                {localPages.map(p => (
                                  <option key={p.id} value={`page-${p.slug}`}>Page: {p.title}</option>
                                ))}
                              </select>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 select-none">
                        {/* Reordering buttons */}
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveMenuItem(index, 'up')}
                          className="p-1 border border-slate-250 bg-white rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                          title="Move up"
                        >
                          <MoveUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={index === localLayoutSettings.menuItems.length - 1}
                          onClick={() => moveMenuItem(index, 'down')}
                          className="p-1 border border-slate-250 bg-white rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                          title="Move down"
                        >
                          <MoveDown className="h-3 w-3" />
                        </button>
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => removeMenuItem(item.id)}
                          className="p-1 border border-red-200 bg-red-50 text-red-650 rounded hover:bg-red-100 cursor-pointer"
                          title="Delete link"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default LayoutTab;
