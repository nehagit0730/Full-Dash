import React from 'react';
import { Save, CheckCircle2, Layout, Mail, Cloud, Globe, Plus, Link, FileCode, MoveUp, MoveDown, Trash2 } from 'lucide-react';
import { LayoutSettings, CustomPage } from '../../types';
import ImageUploadInput from '../ImageUploadInput';

interface LayoutTabProps {
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider mb-1">Logo Text</label>
                <input
                  type="text"
                  value={localLayoutSettings.headerLogoText}
                  onChange={(e) => setLocalLayoutSettings({ ...localLayoutSettings, headerLogoText: e.target.value })}
                  className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Pouch Supply"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider mb-1">Logo Subtext</label>
                <input
                  type="text"
                  value={localLayoutSettings.headerLogoSubtext}
                  onChange={(e) => setLocalLayoutSettings({ ...localLayoutSettings, headerLogoSubtext: e.target.value })}
                  className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Premium Nicotine"
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
                  placeholder="e.g. POUCH SUPPLY"
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

          {/* 3. KLAVIYO INTEGRATION CARD */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
                  <Mail className="h-4 w-4" />
                </div>
                <span className="font-extrabold text-slate-900 uppercase tracking-wider text-xs">Klaviyo Marketing Integration</span>
              </div>
              {localLayoutSettings.klaviyoPublicKey ? (
                <span className="text-[8px] font-black uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-150 flex items-center gap-1">
                  <span className="h-1 w-1 bg-emerald-500 rounded-full animate-ping" />
                  Connected
                </span>
              ) : (
                <span className="text-[8px] font-black uppercase bg-slate-100 text-slate-400 px-2 py-0.5 rounded border border-slate-150">
                  Not Configured
                </span>
              )}
            </div>

            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
              Unlock automated ecommerce marketing flows. Connecting your Klaviyo Site ID (Public API Key) automatically tracks: 
              <span className="block mt-1 font-mono text-[9px] text-indigo-600 leading-normal">
                • Active on Site (Visitor Page View)<br />
                • Viewed Product (Catalog Detail Click)<br />
                • Added to Cart (Shopping cart logs)<br />
                • Started Checkout (Initiate checkout events)<br />
                • Placed Order (Successful conversion metrics)<br />
                • Subscribed to Newsletter (Footer sign-up capture)
              </span>
            </p>

            <div>
              <label className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider mb-1">Klaviyo Site ID / Public API Key</label>
              <input
                type="text"
                value={localLayoutSettings.klaviyoPublicKey || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = { ...localLayoutSettings, klaviyoPublicKey: val };
                  setLocalLayoutSettings(updated);
                  if (onUpdateLayoutSettings) onUpdateLayoutSettings(updated);
                }}
                className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="e.g. AB12CD"
              />
              <p className="text-[8.5px] text-slate-400 mt-1.5">
                Your 6-to-8 character public API key. Find this in your <a href="https://www.klaviyo.com/app/settings/api-keys" target="_blank" rel="noreferrer" className="text-orange-600 hover:underline font-bold">Klaviyo Account Settings</a>.
              </p>
            </div>
          </div>

          {/* 4. CLOUDINARY MEDIA CDN INTEGRATION CARD */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-650 rounded-lg">
                  <Cloud className="h-4 w-4" />
                </div>
                <span className="font-extrabold text-slate-900 uppercase tracking-wider text-xs">Cloudinary Media CDN</span>
              </div>
              {localLayoutSettings.cloudinaryCloudName ? (
                <span className="text-[8px] font-black uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-150 flex items-center gap-1">
                  <span className="h-1 w-1 bg-emerald-500 rounded-full animate-ping" />
                  CDN Active
                </span>
              ) : (
                <span className="text-[8px] font-black uppercase bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded border border-amber-150">
                  MDB Fallback
                </span>
              )}
            </div>

            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
              Connect your storefront with <strong>Cloudinary CDN</strong>. It provides <strong>lightning-fast global image & video hosting with native support for smooth video streaming and fast loading times</strong>.
              When configured, any product visuals, brand logo banners, or active section background videos you upload will be permanently hosted on Cloudinary, connected with your Neon PostgreSQL database.
            </p>

            {/* Quick Paste Connection String Box */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
              <label className="block text-indigo-700 font-extrabold text-[9.5px] uppercase tracking-wider">
                ⚡ Quick Auto-Fill: Paste CLOUDINARY_URL
              </label>
              <input
                type="text"
                placeholder="Paste e.g. CLOUDINARY_URL=cloudinary://123456:abcdef@qfoxl8ia"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.trim()) {
                    const parsed = parseCloudinaryInput(val, '', '');
                    if (parsed.cName && parsed.aKey && parsed.aSecret) {
                      const updated = {
                        ...localLayoutSettings,
                        cloudinaryCloudName: parsed.cName,
                        cloudinaryApiKey: parsed.aKey,
                        cloudinaryApiSecret: parsed.aSecret
                      };
                      setLocalLayoutSettings(updated);
                      if (onUpdateLayoutSettings) onUpdateLayoutSettings(updated);
                    }
                  }
                }}
                className="w-full text-xs font-mono border border-indigo-200 p-2 rounded-lg bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="text-[8.5px] text-slate-500">
                Pasting your connection string automatically extracts your Cloud Name (<code>qfoxl8ia</code>), API Key, and API Secret instantly.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider mb-1">Cloudinary Cloud Name</label>
                <input
                  type="text"
                  value={localLayoutSettings.cloudinaryCloudName || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const parsed = parseCloudinaryInput(val, localLayoutSettings.cloudinaryApiKey, localLayoutSettings.cloudinaryApiSecret);
                    const updated = {
                      ...localLayoutSettings,
                      cloudinaryCloudName: parsed.cName || val,
                      cloudinaryApiKey: parsed.aKey || localLayoutSettings.cloudinaryApiKey,
                      cloudinaryApiSecret: parsed.aSecret || localLayoutSettings.cloudinaryApiSecret
                    };
                    setLocalLayoutSettings(updated);
                    if (onUpdateLayoutSettings) onUpdateLayoutSettings(updated);
                  }}
                  className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  placeholder="e.g. qfoxl8ia"
                />
                <p className="text-[8.5px] text-slate-400 mt-1">
                  Your unique cloud identifier (e.g. <code>qfoxl8ia</code>).
                </p>
              </div>

              <div>
                <label className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider mb-1">Cloudinary API Key</label>
                <input
                  type="text"
                  value={localLayoutSettings.cloudinaryApiKey || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = { ...localLayoutSettings, cloudinaryApiKey: val };
                    setLocalLayoutSettings(updated);
                    if (onUpdateLayoutSettings) onUpdateLayoutSettings(updated);
                  }}
                  className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  placeholder="e.g. 123456789012345"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider mb-1">Cloudinary API Secret</label>
                <input
                  type="password"
                  value={localLayoutSettings.cloudinaryApiSecret || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = { ...localLayoutSettings, cloudinaryApiSecret: val };
                    setLocalLayoutSettings(updated);
                    if (onUpdateLayoutSettings) onUpdateLayoutSettings(updated);
                  }}
                  className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  placeholder="e.g. *********************************"
                />
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleTestCloudinary}
                disabled={testingCloudinary}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              >
                {testingCloudinary ? (
                  <>
                    <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Cloud className="h-3.5 w-3.5" />
                    Test Cloudinary Connection
                  </>
                )}
              </button>
            </div>

            {cloudinaryTestResult && (
              <div className={`p-2.5 rounded-lg text-xs font-semibold leading-relaxed border ${
                cloudinaryTestResult.success 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {cloudinaryTestResult.message}
              </div>
            )}

            <p className="text-[8.5px] text-slate-400 mt-1.5 leading-normal">
              Credentials are saved securely. You can also specify them as environment variables (<code>CLOUDINARY_CLOUD_NAME</code>, etc.). Register for free at <a href="https://cloudinary.com/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-bold">cloudinary.com</a>.
            </p>
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
                    placeholder="e.g. Swedish Pouches"
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
                        <option value="frontend-subscribe">Subscribe Builder</option>
                        <option value="frontend-shop">Shop Now grid</option>
                        <option value="frontend-brands">All Sweden Brands</option>
                        <option value="about">About us info</option>
                        <option value="blogs">Pouch Journal / Blogs</option>
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
                                <option value="frontend-subscribe">Subscribe</option>
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
