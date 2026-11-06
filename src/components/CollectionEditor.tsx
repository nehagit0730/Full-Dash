import React, { useState, useEffect } from 'react';
import { Collection, Product } from '../types';
import { 
  ArrowLeft, Search, Plus, X, Image as ImageIcon, Save, Check, Globe, LayoutTemplate, 
  HelpCircle, Sparkles, SlidersHorizontal, Trash2, ArrowUpDown, GripVertical, ChevronDown, CheckSquare, Square,
  Eye
} from 'lucide-react';
import ImageUploadInput from './ImageUploadInput';

interface CollectionEditorProps {
  collection: Collection | null; // null if creating a new one
  allProducts: Product[];
  onSave: (updatedCollection: Collection) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}

export default function CollectionEditor({
  collection,
  allProducts,
  onSave,
  onCancel,
  onDelete
}: CollectionEditorProps) {
  // Collection States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'Manual' | 'Smart'>('Manual');
  const [image, setImage] = useState('');
  const [productIds, setProductIds] = useState<string[]>([]);
  const [productConditions, setProductConditions] = useState('');

  // SEO fields state
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [showSeoFields, setShowSeoFields] = useState(false);
  const [seoPreviewMode, setSeoPreviewMode] = useState<'Google' | 'Social'>('Google');

  // Sorting and searching in-page states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('Best selling');

  // Product Picker modal state
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerActiveIds, setPickerActiveIds] = useState<string[]>([]);

  // Toast confirmation
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize states from existing collection or draft blank
  useEffect(() => {
    if (collection) {
      setTitle(collection.title || '');
      setDescription(collection.description || '');
      setType(collection.type || 'Manual');
      setImage(collection.image || '');
      setProductIds(collection.productIds || []);
      setProductConditions(collection.productConditions || '');
      setCustomSlug(collection.slug || collection.id || '');
      setSeoTitle(collection.seoTitle || collection.title || '');
      setSeoDescription(collection.seoDescription || collection.description || '');
      setOgImage(collection.ogImage || collection.image || '');
    } else {
      // Clear for new collection creation
      setTitle('');
      setDescription('');
      setType('Manual');
      setImage('');
      setProductIds([]);
      setProductConditions('');
      setCustomSlug('');
      setSeoTitle('');
      setSeoDescription('');
      setOgImage('');
    }
  }, [collection]);

  // Handle title to slug auto-fill
  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars
      .replace(/\-\-+/g, '-'); // Replace multiple - with single -
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!collection) {
      setCustomSlug(slugify(val));
    }
    if (!seoTitle || seoTitle === title) {
      setSeoTitle(val);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setDescription(val);
    if (!seoDescription || seoDescription === description) {
      setSeoDescription(val.slice(0, 155));
    }
  };

  // Open Product Picker with currently selected IDs pre-checked
  const handleOpenPicker = () => {
    setPickerActiveIds([...productIds]);
    setPickerSearch('');
    setShowProductPicker(true);
  };

  const handleConfirmPicker = () => {
    setProductIds([...pickerActiveIds]);
    setShowProductPicker(false);
    triggerToast('Collection products list updated successfully.');
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Add individual product id manually
  const handleToggleProductIdInPicker = (id: string) => {
    if (pickerActiveIds.includes(id)) {
      setPickerActiveIds(pickerActiveIds.filter(x => x !== id));
    } else {
      setPickerActiveIds([...pickerActiveIds, id]);
    }
  };

  const handleRemoveProduct = (pId: string) => {
    setProductIds(productIds.filter(id => id !== pId));
    triggerToast('Product removed from this collection.');
  };

  // Get matching product objects
  const assignedProducts = allProducts.filter(p => productIds.includes(p.id));

  // Perform search in collection products
  const filteredAssignedProducts = assignedProducts.filter(p => {
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.vendor.toLowerCase().includes(q);
  });

  // Apply sorting options mock ordering
  const getSortedProducts = () => {
    const list = [...filteredAssignedProducts];
    if (sortBy === 'Best selling') {
      return list; // default sequence
    } else if (sortBy === 'Title A-Z') {
      return list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'Title Z-A') {
      return list.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortBy === 'Price Low-High') {
      return list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'Price High-Low') {
      return list.sort((a, b) => b.price - a.price);
    }
    return list;
  };

  const sortedAndFilteredProducts = getSortedProducts();

  // Form submission handler
  const handleSaveSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      alert('Please provide a collection title.');
      return;
    }

    const finalSlug = customSlug.trim() ? slugify(customSlug) : slugify(title);

    const saved: Collection = {
      id: collection?.id || finalSlug || `collection-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      type: type,
      image: image || '',
      productIds: productIds,
      productConditions: productConditions || undefined,
      slug: finalSlug,
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
      ogImage: ogImage.trim() || undefined,
      createdAt: collection?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(saved);
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16">
      
      {/* Dynamic Toast Notice */}
      {toastMessage && (
        <div id="toast-col-info" className="fixed bottom-5 right-5 z-55 bg-slate-900 border border-slate-700 text-white rounded-xl shadow-2xl p-4.5 flex items-center gap-3 animate-bounce">
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-black">✓</div>
          <span className="text-xs font-bold font-mono uppercase tracking-wider">{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb Navigation bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1.5">
          <button
            onClick={onCancel}
            className="group inline-flex items-center gap-1.5 text-[11px] font-black text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Collections</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono text-xs">📋 / collections /</span>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight lowercase">
              {title || 'untitled-collection'}
            </h1>
          </div>
        </div>

        {/* Global Save Action Row */}
        <div className="flex items-center gap-2.5">
          {onDelete && collection && collection.id !== 'all' && (
            <button
              onClick={() => {
                setShowDeleteConfirm(true);
              }}
              className="py-2.5 px-3.5 border border-red-200/80 bg-red-50 text-red-650 hover:bg-red-100 hover:text-red-750 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              title="Delete Collection Permanently"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
           )}
 
          {collection && (
            <a
              href={`/collections/${collection.slug || collection.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3.5 border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-150 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              title="View Collection in Storefront"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>View Collection</span>
            </a>
          )}
           <button
             onClick={onCancel}
             className="py-2.5 px-4 border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
           >
            Cancel
          </button>

          <button
            onClick={() => handleSaveSubmit()}
            className="py-2.5 px-5 bg-[#1c2d50] hover:bg-[#152340] text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:shadow"
          >
            <Save className="h-4 w-4" />
            <span>Save Collection</span>
          </button>
        </div>
      </div>

      {/* Main Form Fields Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns - Standard Fields & Products Management list */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Title and description fields */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
            <div>
              <label htmlFor="col-editor-title" className="block text-slate-700 font-extrabold text-[10.5px] uppercase tracking-widest mb-1.5">
                Collection Title
              </label>
              <input
                id="col-editor-title"
                type="text"
                placeholder="e.g. paintings"
                required
                value={title}
                onChange={handleTitleChange}
                className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-slate-250 bg-white focus:outline-none focus:ring-2 focus:ring-[#008060]/20 focus:border-[#008060] transition-all"
              />
            </div>

            <div>
              <label htmlFor="col-editor-desc" className="block text-slate-700 font-extrabold text-[10.5px] uppercase tracking-widest mb-1.5">
                Description
              </label>
              
              {/* Rich-Text mock toolbar layout to perfectly resemble Shopify's administrative editor interface */}
              <div className="border border-slate-250 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#008060]/20 focus-within:border-[#008060] transition-all bg-white">
                <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap gap-1 px-3.5 select-none text-slate-500">
                  <span className="text-[10px] hover:bg-slate-200 px-1.5 py-0.5 rounded font-black cursor-pointer font-sans" title="Formatting presets">Paragraph ▾</span>
                  <div className="h-4.5 w-[1px] bg-slate-300 mx-1 align-middle self-center" />
                  <span className="font-extrabold hover:bg-slate-250 px-1.5 py-0.5 rounded text-xs cursor-pointer" title="Bold text">B</span>
                  <span className="italic hover:bg-slate-250 px-1.5 py-1 rounded text-xs cursor-pointer font-serif" title="Italic text">I</span>
                  <span className="underline hover:bg-slate-250 px-1.5 py-1 rounded text-xs cursor-pointer" title="Underline text">U</span>
                  <span className="line-through hover:bg-slate-200 px-1.5 py-1 rounded text-xs cursor-pointer font-sans" title="Strikethrough">S ▾</span>
                  <div className="h-4.5 w-[1px] bg-slate-300 mx-1 align-middle self-center" />
                  <span className="hover:bg-slate-200 px-1.5 py-0.5 rounded text-[11px] font-mono cursor-pointer" title="Insert Monospace inline code">&lt;&gt;</span>
                  <span className="hover:bg-slate-200 px-1.5 py-0.5 rounded text-xs cursor-pointer" title="Add web redirection link">🔗</span>
                  <span className="hover:bg-slate-200 px-1.5 py-0.5 rounded text-xs cursor-pointer" title="Insert media image">🖼️</span>
                  <span className="hover:bg-slate-200 px-1.5 py-0.5 rounded text-xs cursor-pointer" title="Insert YouTube video clip">🎥</span>
                  <div className="h-4.5 w-[1px] bg-slate-300 mx-1 align-middle self-center" />
                  <span className="hover:bg-slate-200 px-2 py-0.5 rounded text-xs cursor-pointer" title="Bullet Lists">☰</span>
                  <span className="hover:bg-slate-200 px-2 py-0.5 rounded text-xs cursor-pointer" title="Numbered Lists">🔢</span>
                </div>
                <textarea
                  id="col-editor-desc"
                  placeholder="Tell customers about the exquisite products inside this custom collection..."
                  value={description}
                  onChange={handleDescriptionChange}
                  className="w-full text-xs font-medium px-4 py-3.5 bg-white focus:outline-none h-36 resize-y leading-relaxed text-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Manual assigned products listing manager */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-slate-750 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span>Products List</span>
                <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-mono tracking-normal leading-none font-bold">
                  {productIds.length} Linked
                </span>
              </h2>
              
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Manual Insertion</span>
              </div>
            </div>

            {/* In-page search combined with sorting and browse action */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-3.5 w-3.5" />
                </div>
                <input
                  type="text"
                  placeholder="Search linked collection products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-250 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleOpenPicker}
                  className="bg-white hover:bg-slate-55 border border-slate-350 text-slate-705 px-4.5 py-2.5 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Browse</span>
                </button>

                <div className="relative shrink-0">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="pl-8 pr-8 py-2.5 text-xs font-bold border border-slate-350 bg-white rounded-xl focus:outline-none cursor-pointer appearance-none"
                  >
                    <option value="Best selling">Best selling</option>
                    <option value="Title A-Z">Title: A-Z</option>
                    <option value="Title Z-A">Title: Z-A</option>
                    <option value="Price Low-High">Price: Low-High</option>
                    <option value="Price High-Low">Price: High-Low</option>
                  </select>
                  <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-slate-500">
                    <ChevronDown className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </div>

            {/* Linked products table/list rows */}
            {sortedAndFilteredProducts.length > 0 ? (
              <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-450 uppercase font-bold text-[8.5px] tracking-wider border-b border-slate-150 font-mono">
                      <th className="py-2.5 px-3.5 w-12 text-center">Index</th>
                      <th className="py-2.5 px-2">Image</th>
                      <th className="py-2.5 px-3">Title Details</th>
                      <th className="py-2.5 px-3 w-32">Vendor</th>
                      <th className="py-2.5 px-3 w-24">Status</th>
                      <th className="py-2.5 px-3 w-20 text-center">Price</th>
                      <th className="py-2.5 px-3.5 w-12 text-center">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {sortedAndFilteredProducts.map((p, pIdx) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="py-3 px-3.5 text-center font-mono text-[10px] text-slate-400 font-bold">
                          {pIdx + 1}.
                        </td>
                        <td className="py-3 px-2">
                          <div className="h-10 w-10 border border-slate-150 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center p-0.5">
                            <img src={p.image} className="h-full w-full object-cover" alt="" referrerPolicy="no-referrer" />
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-extrabold text-[11.5px] text-slate-850 block group-hover:text-indigo-650 transition-colors uppercase tracking-tight">{p.title}</span>
                          <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono select-all">SKU: {p.sku || p.id}</span>
                        </td>
                        <td className="py-3 px-3 text-[11.5px] font-bold text-slate-500 uppercase">
                          {p.vendor}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block text-[8.5px] font-black uppercase tracking-widest py-0.5 px-2.5 rounded-full border ${
                            p.status === 'Active' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                              : p.status === 'Draft' 
                                ? 'bg-amber-50 text-amber-700 border-amber-150'
                                : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-xs pr-4">
                          £{p.price.toFixed(2)}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(p.id)}
                            className="p-1 px-2.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-150 cursor-pointer transition-all"
                            title="De-link product from collection"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 border border-dashed border-slate-300 rounded-2xl bg-slate-50/50 text-center space-y-3 p-6">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <LayoutTemplate className="h-5 w-5" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">No Linked Products</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">This selection carries zero active items. Use "Browse" to insert manual merchandise cans into lists.</p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenPicker}
                  className="bg-slate-900 hover:bg-indigo-650 text-white font-extrabold text-[10px] py-1.5 px-4 rounded-xl cursor-pointer uppercase tracking-widest transition-colors shadow-xs"
                >
                  Add Product Bags
                </button>
              </div>
            )}
          </div>

          {/* Card 3: SEO Configuration & Social Media previews */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-slate-850 text-xs sm:text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-emerald-600" />
                  <span>SEO & Social Rich Snippets Configuration</span>
                </h3>
                <p className="text-[10.5px] text-slate-400">Configure search result previews and dynamic social card configurations.</p>
              </div>

              {/* Dynamic Preview tab togglers */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 max-w-fit self-start sm:self-center select-none">
                <button
                  type="button"
                  onClick={() => setSeoPreviewMode('Google')}
                  className={`text-[9.5px] font-bold py-1 px-2.5 rounded transition-all cursor-pointer ${
                    seoPreviewMode === 'Google'
                      ? 'bg-white text-slate-800 shadow-3xs font-extrabold border border-slate-200/20'
                      : 'text-slate-500 hover:text-slate-850'
                  }`}
                >
                  Google Snippet
                </button>
                <button
                  type="button"
                  onClick={() => setSeoPreviewMode('Social')}
                  className={`text-[9.5px] font-bold py-1 px-2.5 rounded transition-all cursor-pointer ${
                    seoPreviewMode === 'Social'
                      ? 'bg-white text-slate-800 shadow-3xs font-extrabold border border-slate-200/20'
                      : 'text-slate-500 hover:text-slate-850'
                  }`}
                >
                  Social OG Card
                </button>
              </div>
            </div>

            {/* Display Rich Snippet Preview Card based on active tab state */}
            <div className="space-y-2">
              <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block font-mono">
                {seoPreviewMode === 'Google' ? '🌐 Live Google Desktop Preview' : '💬 Facebook & Twitter Share Preview'}
              </span>

              {seoPreviewMode === 'Google' ? (
                /* Search Engine Result Snippet simulation */
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1 text-left font-serif leading-none select-none max-w-xl">
                  <span className="text-neutral-400 font-sans text-[10.5px] block truncate font-medium">https://pouchsupply.co.uk/collections/{customSlug || slugify(title || 'untitled')}</span>
                  <span className="text-[#1a0dab] font-sans text-sm block hover:underline cursor-pointer font-extrabold leading-tight">
                    {seoTitle || title || 'Untitled Custom Pouch Collection'}
                  </span>
                  <p className="text-[#3c4043] font-sans text-[11.5px] leading-relaxed pt-1 select-all h-[40px] line-clamp-2">
                    {seoDescription || description || 'Explore our vacuum-fresh nicotine pouch lines. Choose from various strengths, formats, and premium tastes formulated in Europe.'}
                  </p>
                </div>
              ) : (
                /* Interactive social share card preview */
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-3xs bg-white text-left font-sans text-xs max-w-xl select-none leading-normal">
                  <div className="aspect-[1.91/1] w-full bg-slate-100 relative border-b border-slate-150 overflow-hidden flex items-center justify-center">
                    {(ogImage || image) ? (
                      <img src={ogImage || image} className="w-full h-full object-cover" alt="OG Cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="text-center text-slate-400 p-6 space-y-2">
                        <ImageIcon className="h-8 w-8 mx-auto text-slate-350 stroke-1" />
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-450">No Cover or OG Image Selected</p>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[8.5px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded">
                      Open Graph Image
                    </div>
                  </div>
                  <div className="p-3 bg-[#f2f3f5] space-y-1">
                    <span className="text-[9px] text-slate-450 uppercase tracking-widest block font-bold font-mono">POUCHSUPPLY.CO.UK</span>
                    <h4 className="font-extrabold text-[12px] text-slate-800 line-clamp-1 uppercase tracking-tight">
                      {seoTitle || title || 'Untitled Custom Pouch Collection'}
                    </h4>
                    <p className="text-[10.5px] text-slate-500 line-clamp-2 font-medium leading-relaxed">
                      {seoDescription || description || 'Explore our vacuum-fresh nicotine pouch lines. Choose from various strengths, formats, and premium tastes formulated in Europe.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Inputs Panel */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              
              {/* Left Column inputs */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="seo-field-title" className="block text-slate-700 font-extrabold uppercase tracking-wider text-[9.5px]">
                      Search Meta Title
                    </label>
                    <span className={`text-[8.5px] font-mono font-bold ${
                      seoTitle.length > 60 ? 'text-amber-600' : seoTitle.length >= 30 ? 'text-emerald-600' : 'text-slate-400'
                    }`}>
                      {seoTitle.length} / 75 chars
                    </span>
                  </div>
                  <input
                    id="seo-field-title"
                    type="text"
                    maxLength={75}
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="e.g. Paint Collections | Fine Art Pouch Cans"
                    className="w-full text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-250 bg-white focus:outline-none focus:ring-2 focus:ring-[#008060]/20 focus:border-[#008060] transition-all"
                  />
                  <p className="text-[9px] text-slate-400 leading-normal mt-1">Recommended title length is between 30 and 60 characters for optimal results in desktop search results.</p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="seo-field-desc" className="block text-slate-700 font-extrabold uppercase tracking-wider text-[9.5px]">
                      Search Meta Description
                    </label>
                    <span className={`text-[8.5px] font-mono font-bold ${
                      seoDescription.length > 160 ? 'text-amber-600' : seoDescription.length >= 120 ? 'text-emerald-600' : 'text-slate-400'
                    }`}>
                      {seoDescription.length} / 320 chars
                    </span>
                  </div>
                  <textarea
                    id="seo-field-desc"
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    maxLength={320}
                    placeholder="Enter meta description that summarizes the collection products..."
                    className="w-full text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-250 bg-white focus:outline-none focus:ring-2 focus:ring-[#008060]/20 focus:border-[#008060] transition-all h-24 leading-normal resize-y"
                  />
                  <p className="text-[9px] text-slate-400 leading-normal mt-1">Provide helpful search summaries. Ideal volume ranges between 120 and 160 characters to avoid snippet truncation.</p>
                </div>
              </div>

              {/* Right Column inputs */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="seo-field-slug" className="block text-slate-700 font-extrabold uppercase tracking-wider text-[9.5px] mb-1.5">
                    URL Handle (Slug)
                  </label>
                  <div className="flex items-center rounded-xl overflow-hidden bg-slate-50 border border-slate-250 focus-within:ring-2 focus-within:ring-[#008060]/20 focus-within:border-[#008060] transition-all">
                    <span className="bg-slate-100 px-3 py-2.5 text-slate-450 border-r border-slate-250 font-mono text-[9.5px]/none flex items-center h-full select-none">/collections/</span>
                    <input
                      id="seo-field-slug"
                      type="text"
                      value={customSlug}
                      onChange={(e) => setCustomSlug(slugify(e.target.value))}
                      placeholder="e.g. paintings"
                      className="w-full px-4 py-2 bg-white text-xs font-semibold font-mono focus:outline-none h-full"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal mt-1">The handle represents the URL folder hierarchy. Changing handles may require setting up redirection loops.</p>
                </div>

                {/* Open Graph Image configuration section */}
                <div className="space-y-2.5 bg-slate-50/65 p-3.5 border border-slate-205 rounded-xl">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-extrabold uppercase tracking-wider text-[9.5px]">
                      Open Graph Image (Social Link)
                    </label>
                    
                    {/* Main Image Synchronization Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (image) {
                          setOgImage(image);
                          triggerToast('Copied Main Collection image to Open Graph image.');
                        } else {
                          triggerToast('Please upload or set a collection cover image first.');
                        }
                      }}
                      className="text-[9px] bg-[#008060]/10 hover:bg-[#008060]/25 text-[#008060] border border-[#008060]/20 rounded px-2 py-0.5 font-bold transition-all cursor-pointer inline-flex items-center gap-0.5"
                    >
                      <span>⚡ Sync Collection Cover</span>
                    </button>
                  </div>

                  <ImageUploadInput
                    label="OG Branding Asset (1200x630px)"
                    value={ogImage}
                    onChange={(url) => {
                      setOgImage(url);
                      triggerToast('Open Graph Image updated successfully.');
                    }}
                    placeholder="Enter social thumbnail URL or upload image..."
                  />
                  <p className="text-[9px] text-slate-400 leading-normal">
                    This thumbnail represents the collection when shared on public feed timelines. Recommended size is 1200 x 630 pixels.
                  </p>
                </div>

              </div>

            </div>

          </div>
        </div>

        {/* Right Columns: Sidebar Publishing, Visual Banner Cover Asset & Template presets */}
        <div className="space-y-6">
          
          {/* Sidebar block 1: Publishing Sales channels */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-indigo-50/50">
              <h3 className="font-extrabold text-slate-805 text-[10.5px] uppercase tracking-widest">Publishing Channels</h3>
              <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline cursor-pointer">Manage</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm" />
                <span>Online Store Portal</span>
              </div>
            </div>
          </div>

          {/* Sidebar block 2: Image asset selection */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4.5">
            <div className="flex justify-between items-center pb-2 border-b border-indigo-50/50">
              <h3 className="font-extrabold text-slate-805 text-[10.5px] uppercase tracking-widest">Collection Image</h3>
              
              {image && (
                <div className="relative">
                  <select 
                    onChange={(e) => {
                      if (e.target.value === 'remove') {
                        setImage('');
                        triggerToast('Cover image cleared.');
                      }
                      e.target.value = ''; // Reset select
                    }}
                    className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider bg-transparent cursor-pointer focus:outline-none appearance-none pr-3"
                  >
                    <option value="">Edit ▾</option>
                    <option value="remove">Remove image</option>
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-3.5 text-center">
              <ImageUploadInput
                label="Featured Cover visual"
                value={image}
                onChange={(res) => {
                  setImage(res);
                  triggerToast('Featured image updated.');
                }}
                placeholder="Or specify cover URL link..."
              />

              <p className="text-[9.5px] leading-relaxed text-slate-400 max-w-xs mx-auto">
                Appears on collection grids and slideshow elements as head visual banner. Ensure to insert high contrast landscapes.
              </p>
            </div>
          </div>



          {/* Side box collection settings: Smart vs Manual configuration rules */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4.5">
            <h3 className="font-extrabold text-slate-805 text-[10.5px] uppercase tracking-widest pb-1 border-b border-indigo-50/50">Collection Type</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/60 text-center select-none">
                <button
                  type="button"
                  onClick={() => setType('Manual')}
                  className={`text-[9.5px] font-black py-1.5 rounded-md transition-all cursor-pointer ${
                    type === 'Manual'
                      ? 'bg-white text-indigo-650 shadow-xs border border-slate-250/20'
                      : 'text-slate-500 hover:text-slate-850'
                  }`}
                >
                  Manual
                </button>
                <button
                  type="button"
                  onClick={() => setType('Smart')}
                  className={`text-[9.5px] font-black py-1.5 rounded-md transition-all cursor-pointer ${
                    type === 'Smart'
                      ? 'bg-white text-indigo-650 shadow-xs border border-slate-250/20'
                      : 'text-slate-500 hover:text-slate-850'
                  }`}
                >
                  Smart Rules
                </button>
              </div>

              {type === 'Smart' ? (
                <div className="space-y-2 text-xs">
                  <label className="block text-[9.5px] font-bold text-slate-500 uppercase tracking-widest">Condition string matches</label>
                  <input
                    type="text"
                    placeholder="e.g. tags CONTAINS extra-strong"
                    value={productConditions}
                    onChange={(e) => setProductConditions(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                  <p className="text-[8.5px] text-slate-400">Smart rules matches catalog tags and vendor titles automatically to append active canisters.</p>
                </div>
              ) : (
                <p className="text-[9.5px] text-slate-450 leading-relaxed font-medium">Add merchandise product canisters one-by-one by clicking "Browse" items to add to manual lists.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER CONFIRMATION ROW */}
      <div className="pt-6 border-t border-slate-200 flex justify-end items-center gap-3">
        <button
          onClick={onCancel}
          className="py-2.5 px-5 border border-slate-250 bg-white hover:bg-slate-55 text-slate-650 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
        >
          Cancel
        </button>

        <button
          onClick={() => handleSaveSubmit()}
          className="py-2.5 px-6 bg-[#1c2d50] hover:bg-[#152340] text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
        >
          <Save className="h-4 w-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* REGISTRY: PRODUCT PICKER MODAL (Shopify Browse Dialogue) */}
      {showProductPicker && (
        <div id="product-picker-dialogue" className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-2xs flex items-center justify-center p-4 antialiased">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden scale-100 transition-all duration-350">
            
            {/* Modal Head */}
            <div className="p-4 px-5 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <div className="space-y-0.5">
                <h3 className="font-black text-slate-850 text-xs sm:text-xs uppercase tracking-wide">
                  Select Pouch Merchandise Cans
                </h3>
                <p className="text-[10px] text-zinc-400 font-medium">Check which canisters belongs to {title || 'this collection'}.</p>
              </div>
              <button 
                onClick={() => setShowProductPicker(false)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Filter Search input */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder="Filter by product name, tags, vendor, status..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-250 bg-white placeholder-slate-400 font-semibold focus:outline-none"
                />
              </div>
              
              <div className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 rounded-md py-1 px-2.5 font-mono font-bold leading-none shrink-0 select-none">
                {pickerActiveIds.length} Selected
              </div>
            </div>

            {/* Modal Product selection scrolling list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[45vh] bg-slate-50/50">
              {allProducts.filter(p => {
                const s = pickerSearch.toLowerCase();
                return p.title.toLowerCase().includes(s) || p.vendor.toLowerCase().includes(s) || (p.sku && p.sku.toLowerCase().includes(s)) || p.category.toLowerCase().includes(s);
              }).length > 0 ? (
                allProducts.filter(p => {
                  const s = pickerSearch.toLowerCase();
                  return p.title.toLowerCase().includes(s) || p.vendor.toLowerCase().includes(s) || (p.sku && p.sku.toLowerCase().includes(s)) || p.category.toLowerCase().includes(s);
                }).map(prod => {
                  const isChecked = pickerActiveIds.includes(prod.id);
                  return (
                    <div 
                      key={prod.id}
                      onClick={() => handleToggleProductIdInPicker(prod.id)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer select-none transition-all ${
                        isChecked 
                          ? 'bg-indigo-50/55 border-indigo-250/70 shadow-2xs' 
                          : 'bg-white border-slate-200 hover:border-slate-350 hover:shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="shrink-0">
                          {isChecked ? (
                            <div className="h-5 w-5 rounded bg-indigo-650 text-white flex items-center justify-center border border-indigo-700 shadow-xs">
                              <Check className="h-3.5 w-3.5 stroke-[3px]" />
                            </div>
                          ) : (
                            <div className="h-5 w-5 rounded border border-slate-300 hover:border-slate-400 bg-white" />
                          )}
                        </div>

                        <div className="h-10 w-10 shrink-0 border border-slate-150 rounded-lg overflow-hidden bg-slate-50 p-0.5">
                          <img src={prod.image} className="h-full w-full object-cover" alt="" referrerPolicy="no-referrer" />
                        </div>

                        <div>
                          <div className="font-extrabold text-xs text-slate-800 uppercase tracking-tight">{prod.title}</div>
                          <div className="flex items-center gap-1.5 text-[9px] text-indigo-600 font-bold uppercase tracking-wider mt-0.5">
                            <span>{prod.vendor}</span>
                            <span>•</span>
                            <span className="text-slate-400 font-mono">STOCK: {prod.inventory} cans</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-xs font-black text-slate-800">£{prod.price.toFixed(2)}</span>
                        <div className="text-[8px] text-emerald-600 font-black tracking-widest mt-1 uppercase">✓ IN CATALOG</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 border border-dashed rounded-xl bg-white text-center p-6 space-y-1.5 text-slate-400">
                  <LayoutTemplate className="h-6 w-6 mx-auto mb-1 opacity-70" />
                  <p className="font-extrabold text-xs text-slate-700 uppercase tracking-wide">No Filter Matches</p>
                  <p className="text-[10px] text-slate-400">Try modifying your filter keyword or search term to retrieve active inventory.</p>
                </div>
              )}
            </div>

            {/* Modal Foot Actions row */}
            <div className="p-4 px-5 border-t border-slate-150 bg-slate-50 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setPickerActiveIds([])}
                className="text-slate-455 hover:text-slate-800 font-bold text-[10px] uppercase tracking-wider hover:underline cursor-pointer"
              >
                Clear all checked selection
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowProductPicker(false)}
                  className="py-2.5 px-4 text-slate-650 hover:bg-slate-200 border border-slate-250 bg-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPicker}
                  className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Apply Selection
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION DIALOG MODAL (Iframe safe) */}
      {showDeleteConfirm && collection && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-[10000]">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full shadow-2xl space-y-4 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Delete Collection</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-slate-650 font-semibold leading-relaxed">
              Are you sure you want to delete the collection <strong className="text-slate-900">"{title || 'this collection'}"</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  if (onDelete) onDelete(collection.id);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-md shadow-rose-200 transition-all cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
