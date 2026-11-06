import React, { useState, useEffect } from 'react';
import { Product, Collection, ProductVariant, VariantDetail } from '../types';
import { 
  ArrowLeft, Search, Plus, X, Image as ImageIcon, Save, Check, Globe, HelpCircle, 
  Sparkles, SlidersHorizontal, Trash2, ArrowUpDown, GripVertical, ChevronDown, 
  CheckSquare, Square, Eye, Copy, HardDrive, Info, AlertCircle, Play, Sparkle
} from 'lucide-react';
import ImageUploadInput from './ImageUploadInput';
import { cleanMediaUrl } from '../utils/mediaUtils';

interface ProductEditorProps {
  product: Product | null; // null if creating a new one
  allCollections: Collection[];
  onSave: (updatedProduct: Product, selectedCollectionIds: string[]) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}

export default function ProductEditor({
  product,
  allCollections,
  onSave,
  onCancel,
  onDelete
}: ProductEditorProps) {
  // Product state fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [compareAtPrice, setCompareAtPrice] = useState(0);
  const [inventory, setInventory] = useState(0);
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [vendor, setVendor] = useState('');
  const [status, setStatus] = useState<'Active' | 'Draft' | 'Archived' | 'Unlisted'>('Active');
  const [weight, setWeight] = useState(0);
  const [weightUnit, setWeightUnit] = useState<'g' | 'kg' | 'oz' | 'lb'>('g');
  const [isPhysicalProduct, setIsPhysicalProduct] = useState(true);
  const [inventoryTracked, setInventoryTracked] = useState(true);
  const [flavour, setFlavour] = useState('Mint');

  // Tags & Collections State
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [selectedColIds, setSelectedColIds] = useState<string[]>([]);
  const [showColDropdown, setShowColDropdown] = useState(false);

  // Multiple media upload states
  const [mediaList, setMediaList] = useState<string[]>([]);
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [showMediaInputPanel, setShowMediaInputPanel] = useState(false);

  // Shopify style Variants Option fields state
  const [variantsList, setVariantsList] = useState<ProductVariant[]>([]);
  const [concreteVariantsList, setConcreteVariantsList] = useState<VariantDetail[]>([]);

  // SEO fields state
  const [showSeoFields, setShowSeoFields] = useState(false);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [seoPreviewMode, setSeoPreviewMode] = useState<'Google' | 'Social'>('Google');

  // Interactive UI Feedbacks
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);

  // Preset vendors/categories for smart search options
  const defaultVendors = ['77', 'clew', 'cuba', 'maggie', 'nordic spirit', 'xqs', 'zyn', 'pablo', 'killa', 'fumi', 'velo', 'white fox', 'snu'];
  const defaultCategories = ['Clothing', 'Jwellery', 'Nicotine Pouches', 'Protein', 'Food'];

  // Helper to generate combination names from option dimensions
  const generateCombinations = (options: ProductVariant[]): string[] => {
    if (!options || options.length === 0) return [];
    const validOptions = options.filter(o => o.name.trim() !== '' && o.values && o.values.length > 0);
    if (validOptions.length === 0) return [];

    const combine = (index: number, current: string[]): string[][] => {
      if (index === validOptions.length) return [current];
      const results: string[][] = [];
      const option = validOptions[index];
      for (const value of option.values) {
        results.push(...combine(index + 1, [...current, value]));
      }
      return results;
    };

    const combos = combine(0, []);
    return combos.map(c => c.join(' / '));
  };

  // Initialize values on load or change
  useEffect(() => {
    if (product) {
      setTitle(product.title || '');
      setDescription(product.description || '');
      setPrice(product.price || 0);
      setCompareAtPrice(product.compareAtPrice || 0);
      setInventory(product.inventory || 0);
      setSku(product.sku || '');
      setBarcode(product.barcode || '');
      setCategory(product.category || 'Nicotine Pouches');
      setVendor(product.vendor || '77');
      setStatus(product.status || 'Active');
      setWeight(product.weight || 0);
      setWeightUnit((product.weightUnit as 'g' | 'kg' | 'oz' | 'lb') || 'g');
      setTags(product.tags || []);
      setMediaList(product.media || (product.image ? [product.image] : []));
      setVariantsList(product.variants || []);
      setConcreteVariantsList(product.concreteVariants || []);
      setCustomSlug(product.slug || product.id || '');
      setFlavour(product.flavour || 'Mint');
      setSeoTitle(product.seoTitle || product.title || '');
      setSeoDescription(product.seoDescription || product.description.slice(0, 155) || '');

      // Locate collection memberships on creation mapping
      const currentMemberships = allCollections
         .filter(c => c.productIds && c.productIds.includes(product.id))
         .map(c => c.id);
      setSelectedColIds(currentMemberships);
    } else {
      // Clear all fields for clean creation draft
      setTitle('');
      setDescription('');
      setPrice(0.00);
      setCompareAtPrice(0.00);
      setInventory(0);
      setSku(`PCH-${100000 + Math.floor(Math.random() * 900000)}`);
      setBarcode('');
      setCategory('Nicotine Pouches');
      setVendor('77');
      setStatus('Active');
      setWeight(24);
      setWeightUnit('g');
      setTags(['fruit', 'extra-strong']);
      setMediaList([]);
      setVariantsList([]);
      setConcreteVariantsList([]);
      setCustomSlug('');
      setFlavour('Mint');
      setSeoTitle('');
      setSeoDescription('');
      setSelectedColIds(['all']);
    }
  }, [product, allCollections]);

  // Sync physical variants state when option combinations change
  useEffect(() => {
    const combos = generateCombinations(variantsList);
    if (combos.length === 0) {
      setConcreteVariantsList(prev => prev.length === 0 ? prev : []);
      return;
    }

    setConcreteVariantsList(prev => {
      // Check if combos match prev exactly to avoid unnecessary state changes and potential race conditions
      const prevNames = prev.map(v => v.name);
      const isIdentical = combos.length === prevNames.length && combos.every((c, i) => c === prevNames[i]);
      if (isIdentical) {
        return prev;
      }

      const existingMap = new Map(prev.map(v => [v.name, v]));
      const productMap = new Map((product?.concreteVariants || []).map(v => [v.name, v]));

      const updated = combos.map(comboName => {
        const existing = existingMap.get(comboName) || productMap.get(comboName);
        if (existing) {
          return existing;
        } else {
          const baseSku = sku || 'PABLO';
          const cleanCombo = comboName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const generatedId = `${baseSku}-${cleanCombo}`.toUpperCase();

          return {
            id: generatedId,
            name: comboName,
            price: price || 0,
            inventory: 0,
            description: '',
            images: [],
            flavour: flavour || 'Mint'
          };
        }
      });
      return updated;
    });
  }, [variantsList]);

  // Sync parent inventory level with the sum of all physical variant stock levels
  useEffect(() => {
    if (concreteVariantsList.length > 0) {
      const sum = concreteVariantsList.reduce((acc, curr) => acc + (curr.inventory || 0), 0);
      setInventory(sum);
    }
  }, [concreteVariantsList]);

  const handleUpdateConcreteVariant = (index: number, updatedFields: Partial<VariantDetail>) => {
    setConcreteVariantsList(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updatedFields };
      return copy;
    });
  };

  // Format Helper for SEO handles slug
  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  };

  const notify = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!product) {
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
      setSeoDescription(val.replace(/<[^>]*>/g, '').slice(0, 155));
    }
  };

  const applyFormatting = (style: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'paragraph' | 'code' | 'link' | 'image' | 'video' | 'space') => {
    const textarea = document.getElementById('prod-edit-desc') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let replacement = '';
    
    switch (style) {
      case 'bold':
        replacement = `<strong>${selectedText || 'bold text'}</strong>`;
        break;
      case 'italic':
        replacement = `<em>${selectedText || 'italic text'}</em>`;
        break;
      case 'underline':
        replacement = `<u>${selectedText || 'underlined text'}</u>`;
        break;
      case 'strikethrough':
        replacement = `<s>${selectedText || 'strikethrough text'}</s>`;
        break;
      case 'paragraph':
        replacement = `<p>${selectedText || 'Paragraph content'}</p>`;
        break;
      case 'code':
        replacement = `<code>${selectedText || 'const x = code;'}</code>`;
        break;
      case 'space':
        replacement = selectedText ? `&nbsp;${selectedText}&nbsp;` : '&nbsp;';
        break;
      case 'link': {
        const url = prompt('Enter the redirect URL:', 'https://');
        if (url === null) return;
        const linkText = selectedText || prompt('Enter the link text:', 'click here') || 'Web Link';
        replacement = `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-indigo-650 hover:underline font-bold">${linkText}</a>`;
        break;
      }
      case 'image': {
        const url = prompt('Enter the Image URL:', '');
        if (!url) return;
        const alt = prompt('Enter alt text for image:', 'Merchandise detail') || 'Product image';
        replacement = `<div class="my-4 flex justify-center"><img src="${url}" alt="${alt}" class="rounded-xl border border-slate-150 max-h-72 object-contain" style="max-height: 288px;" /></div>`;
        break;
      }
      case 'video': {
        const url = prompt('Enter YouTube Embed URL or Video URL:', 'https://www.youtube.com/embed/');
        if (!url) return;
        replacement = `<div class="aspect-video w-full max-w-lg mx-auto bg-slate-900 rounded-xl overflow-hidden shadow-md my-4 border border-slate-205 leading-none"><iframe src="${url}" class="w-full h-full" frameborder="0" allowfullscreen></iframe></div>`;
        break;
      }
      default:
        return;
    }

    const newText = text.substring(0, start) + replacement + text.substring(end);
    setDescription(newText);
    
    // Auto sync SEO preview
    if (!seoDescription || seoDescription === description.replace(/<[^>]*>/g, '').slice(0, 155)) {
      setSeoDescription(newText.replace(/<[^>]*>/g, '').slice(0, 155));
    }

    // Return focus and restore selection
    setTimeout(() => {
      textarea.focus();
      const newSelectionStart = start + replacement.length;
      textarea.setSelectionRange(newSelectionStart, newSelectionStart);
    }, 50);
  };

  // Add Tags
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(newTagInput.trim().toLowerCase())) {
        setTags([...tags, newTagInput.trim().toLowerCase()]);
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Manage Collections membership IDs
  const handleToggleCollection = (colId: string) => {
    if (selectedColIds.includes(colId)) {
      setSelectedColIds(selectedColIds.filter(id => id !== colId));
    } else {
      setSelectedColIds([...selectedColIds, colId]);
    }
  };

  // Multiple Media list triggers
  const handleAddMediaUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMediaUrl.trim()) {
      setMediaList([...mediaList, newMediaUrl.trim()]);
      setNewMediaUrl('');
      setShowMediaInputPanel(false);
      notify('New merchandise visual asset attached to image buffer.');
    }
  };

  const handleRemoveMediaItem = (index: number) => {
    const updated = [...mediaList];
    updated.splice(index, 1);
    setMediaList(updated);
    notify('Product media thumbnail removed.');
  };

  // Variants management: options adding, updating values, removing
  const handleAddVariantOption = () => {
    const newOpt: ProductVariant = {
      id: `opt-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      name: '',
      values: []
    };
    setVariantsList([...variantsList, newOpt]);
    notify('New optional classification dimension initialized.');
  };

  const handleUpdateVariantOptionName = (vId: string, name: string) => {
    setVariantsList(variantsList.map(v => v.id === vId ? { ...v, name } : v));
  };

  const handleRemoveVariantOption = (vId: string) => {
    setVariantsList(variantsList.filter(v => v.id !== vId));
    notify('Dimension options category removed.');
  };

  // Add tag/option value inside individual variants
  const [newOptionValTemp, setNewOptionValTemp] = useState<{ [key: string]: string }>({});

  const handleAddOptionValue = (vId: string) => {
    const textVal = newOptionValTemp[vId] || '';
    if (!textVal.trim()) return;

    setVariantsList(variantsList.map(v => {
      if (v.id === vId) {
        if (!v.values.includes(textVal.trim())) {
          return { ...v, values: [...v.values, textVal.trim()] };
        }
      }
      return v;
    }));

    setNewOptionValTemp({
      ...newOptionValTemp,
      [vId]: ''
    });
  };

  const handleRemoveOptionValue = (vId: string, valueToRemove: string) => {
    setVariantsList(variantsList.map(v => {
      if (v.id === vId) {
        return { ...v, values: v.values.filter(x => x !== valueToRemove) };
      }
      return v;
    }));
  };

  const hasUnsavedChanges = () => {
    if (product) {
      const initColIds = allCollections
         .filter(c => c.productIds && c.productIds.includes(product.id))
         .map(c => c.id);
      
      const collectionsChanged = JSON.stringify([...selectedColIds].sort()) !== JSON.stringify([...initColIds].sort());
      const tagsChanged = JSON.stringify([...tags].sort()) !== JSON.stringify([...(product.tags || [])].sort());
      const mediaChanged = JSON.stringify(mediaList) !== JSON.stringify(product.media || (product.image ? [product.image] : []));
      const variantsChanged = JSON.stringify(variantsList) !== JSON.stringify(product.variants || []);
      const concreteChanged = JSON.stringify(concreteVariantsList) !== JSON.stringify(product.concreteVariants || []);

      return (
        title !== (product.title || '') ||
        description !== (product.description || '') ||
        price !== (product.price || 0) ||
        compareAtPrice !== (product.compareAtPrice || 0) ||
        inventory !== (product.inventory || 0) ||
        sku !== (product.sku || '') ||
        barcode !== (product.barcode || '') ||
        category !== (product.category || 'Nicotine Pouches') ||
        vendor !== (product.vendor || '77') ||
        status !== (product.status || 'Active') ||
        weight !== (product.weight || 0) ||
        weightUnit !== (product.weightUnit || 'g') ||
        collectionsChanged ||
        tagsChanged ||
        mediaChanged ||
        variantsChanged ||
        concreteChanged
      );
    } else {
      return (
        title !== '' ||
        description !== '' ||
        price !== 0 ||
        compareAtPrice !== 0 ||
        inventory !== 0 ||
        sku !== '' ||
        barcode !== '' ||
        selectedColIds.length > 1 ||
        tags.length > 0 ||
        mediaList.length > 1
      );
    }
  };

  const handleBackOrDiscard = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedConfirm(true);
    } else {
      onCancel();
    }
  };

  // Final Form saving triggers
  const executeFormSubmit = () => {
    if (!title.trim()) {
      alert('A product must contain at least a brief descriptive title name.');
      return;
    }

    const finalSlug = customSlug.trim() ? slugify(customSlug) : slugify(title);
    const finalParentImage = mediaList[0] || '';

    const calculatedInventory = concreteVariantsList.length > 0
      ? concreteVariantsList.reduce((sum, v) => sum + (v.inventory || 0), 0)
      : (inventoryTracked ? Math.max(0, inventory) : 9999);

    const cleanProduct: Product = {
      id: product?.id || finalSlug || `product-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      price: Math.max(0, price),
      compareAtPrice: Math.max(0, compareAtPrice),
      inventory: calculatedInventory,
      sku: sku.trim(),
      barcode: barcode.trim() || undefined,
      category: category.trim(),
      vendor: vendor.trim(),
      status: status,
      image: finalParentImage,
      weight: Math.max(0, weight),
      weightUnit: weightUnit,
      tags: tags,
      media: mediaList,
      variants: variantsList.filter(v => v.name.trim() !== ''), // keep only valid options with a name
      concreteVariants: concreteVariantsList,
      slug: finalSlug,
      seoTitle: seoTitle.trim() || title.trim(),
      seoDescription: seoDescription.trim() || description.trim().slice(0, 155),
      createdAt: product?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      flavour: flavour,
      strength: (title.match(/(\d+(?:\.\d+)?)\s*mg/i) ? title.match(/(\d+(?:\.\d+)?)\s*mg/i)![1] + 'mg' : '') || product?.strength || ''
    };

    onSave(cleanProduct, selectedColIds);
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-20 select-none">
      
      {/* Toast notifications row */}
      {toastMessage && (
        <div id="toast-prod-info" className="fixed bottom-6 right-6 z-[120] bg-slate-900 text-white rounded-xl shadow-2xl p-4 flex items-center gap-3 animate-slideIn">
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-black">✓</div>
          <span className="text-xs font-extrabold uppercase tracking-wide font-mono text-slate-100">{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb bread / controls row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1.5">
          <button
            onClick={handleBackOrDiscard}
            className="group inline-flex items-center gap-1.5 text-[10px] font-black text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-mono text-xs">📦 / products /</span>
            <h1 className="text-lg md:text-xl font-black text-slate-950 tracking-tight lowercase">
              {title || 'untitled-canister'}
            </h1>
            
            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
              status === 'Active' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                : status === 'Draft' 
                  ? 'bg-amber-50 text-amber-700 border-amber-150'
                  : 'bg-slate-50 text-slate-500 border-slate-205'
            }`}>
              {status}
            </span>
          </div>
        </div>

        {/* Save / discard buttons row */}
        <div className="flex items-center gap-2">
          {onDelete && product && (
            <button
              onClick={() => {
                setShowDeleteConfirm(true);
              }}
              className="py-2.5 px-3.5 border border-red-200/80 bg-red-50 text-red-650 hover:bg-rose-100 hover:text-red-750 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              title="Delete Product Permanently"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Product</span>
            </button>
          )}

          {product && (
            <a
              href={`/products/${product.slug || product.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3.5 border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-150 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              title="View Product in Storefront"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>View Product</span>
            </a>
          )}

          <button
            onClick={handleBackOrDiscard}
            className="py-2.5 px-4.5 border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
          >
            Discard
          </button>

          <button
            onClick={executeFormSubmit}
            className="py-2.5 px-5.5 bg-[#008060] hover:bg-[#006e52] text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Save className="h-4 w-4" />
            <span>Save Product</span>
          </button>
        </div>
      </div>

      {/* Main Dual-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Main specifications input */}
        <div className="lg:col-span-2 space-y-6 text-left">
          
          {/* Card 1: Title and Description fields block */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
            <div>
              <label htmlFor="prod-edit-title" className="block text-slate-705 font-extrabold text-[10.5px] uppercase tracking-widest mb-1.5">
                Product Title (Label)
              </label>
              <input
                id="prod-edit-title"
                type="text"
                placeholder="e.g. CUBA Double Fresh Mint 20mg"
                required
                value={title}
                onChange={handleTitleChange}
                className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-slate-250 bg-white focus:outline-none focus:ring-2 focus:ring-[#008060]/20 focus:border-[#008060] transition-all"
              />
            </div>

            <div>
              <label htmlFor="prod-edit-desc" className="block text-slate-705 font-extrabold text-[10.5px] uppercase tracking-widest mb-1.5">
                Product Description
              </label>
              
              {/* Fully Working Shopify-style Rich-Text Toolbar connected with formatting states */}
              <div className="border border-slate-250 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#008060]/20 focus-within:border-[#008060] transition-all bg-white mb-3">
                <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap gap-1 px-3.5 select-none text-slate-500 items-center">
                  <button 
                    type="button" 
                    onClick={() => applyFormatting('paragraph')}
                    className="text-[10px] hover:bg-slate-200 px-2 py-1 rounded font-black cursor-pointer font-sans" 
                    title="Formatting paragraph block"
                  >
                    Paragraph ▾
                  </button>
                  <div className="h-4 w-[1px] bg-slate-300 mx-1" />
                  <button 
                    type="button" 
                    onClick={() => applyFormatting('bold')}
                    className="font-extrabold hover:bg-slate-200 px-2 py-0.5 rounded text-xs cursor-pointer text-slate-700" 
                    title="Bold text"
                  >
                    B
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applyFormatting('italic')}
                    className="italic hover:bg-slate-200 px-2 py-0.5 rounded text-xs cursor-pointer font-serif text-slate-705" 
                    title="Italic text"
                  >
                    I
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applyFormatting('underline')}
                    className="underline hover:bg-slate-200 px-2 py-0.5 rounded text-xs cursor-pointer text-slate-705" 
                    title="Underline text"
                  >
                    U
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applyFormatting('strikethrough')}
                    className="line-through hover:bg-slate-200 px-2 py-0.5 rounded text-xs cursor-pointer text-slate-705" 
                    title="Strikethrough"
                  >
                    S
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applyFormatting('space')}
                    className="hover:bg-slate-200 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer text-slate-700" 
                    title="Insert inline spacing / HTML spacer"
                  >
                    Space ⤾
                  </button>
                  <div className="h-4 w-[1px] bg-slate-300 mx-1" />
                  <button 
                    type="button" 
                    onClick={() => applyFormatting('code')}
                    className="hover:bg-slate-200 px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer text-slate-700" 
                    title="Insert Code element (&lt;code&gt;)"
                  >
                    &lt;/&gt; Code
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applyFormatting('link')}
                    className="hover:bg-slate-200 px-2 py-0.5 rounded text-xs cursor-pointer text-slate-700 flex items-center gap-0.5" 
                    title="Insert Redirect URL Link"
                  >
                    <span>🔗</span> <span className="text-[10px] font-bold">Link</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applyFormatting('image')}
                    className="hover:bg-slate-200 px-2 py-0.5 rounded text-xs cursor-pointer text-slate-700 flex items-center gap-0.5" 
                    title="Insert Image Graphic"
                  >
                    <span>🖼️</span> <span className="text-[10px] font-bold">Image</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applyFormatting('video')}
                    className="hover:bg-slate-200 px-2 py-0.5 rounded text-xs cursor-pointer text-slate-700 flex items-center gap-0.5" 
                    title="Insert YouTube Embed block"
                  >
                    <span>🎥</span> <span className="text-[10px] font-bold">Video</span>
                  </button>
                </div>
                <textarea
                  id="prod-edit-desc"
                  placeholder="Insert premium copy highlights. Formulate sensory properties, strength levels, pouch size, and flavor releases..."
                  value={description}
                  onChange={handleDescriptionChange}
                  className="w-full text-xs font-semibold px-4 py-3 bg-white focus:outline-none h-44 resize-y leading-relaxed text-slate-750"
                />
              </div>

              {/* Dynamic live HTML preview canvas under Description box */}
              <div className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                  Live Description Document Rendering:
                </span>
                {description.trim() ? (
                  <div 
                    className="text-xs text-slate-650 font-semibold leading-relaxed space-y-2 prose prose-stone max-w-none break-words"
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                ) : (
                  <p className="text-[10px] text-slate-400 italic font-medium">Description block is currently empty. Utilize the formatting tools above to design rich layouts.</p>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Interactive Shopify-style Multiple Media Upload Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-805 text-xs uppercase tracking-wide">
                  Merchandise Media Cans
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Primary image acts as storefront cover grid visual.</p>
              </div>
              
              <button
                type="button"
                onClick={() => setShowMediaInputPanel(!showMediaInputPanel)}
                className="text-[#008060] hover:text-[#006e52] font-black text-[10px] uppercase tracking-wider hover:underline"
              >
                {showMediaInputPanel ? 'Hide URL field' : 'Add media URL'}
              </button>
            </div>

            {/* Media Upload input panel */}
            {showMediaInputPanel && (
              <form onSubmit={handleAddMediaUrlSubmit} className="bg-slate-50 border border-slate-200 p-4.5 rounded-xl space-y-3 animate-fadeIn">
                <label className="block text-[9.5px] font-black text-slate-550 uppercase tracking-widest">Merchandise Bag URL Link</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder=""
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    className="flex-1 text-xs font-semibold px-3 py-2 border rounded-xl bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-slate-900 text-white font-extrabold text-[10px] uppercase tracking-widest px-4.5 rounded-xl cursor-pointer"
                  >
                    Insert
                  </button>
                </div>
              </form>
            )}

            {/* Grid display showcasing thumbnails */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5 pt-1">
              
              {/* Media mapping files */}
              {mediaList.map((url, index) => (
                <div 
                  key={index}
                  className={`group relative aspect-square border rounded-xl overflow-hidden bg-slate-50/50 p-1 flex items-center justify-center transition-all ${
                    index === 0 ? 'border-emerald-600 ring-2 ring-emerald-500/10' : 'border-slate-200 hover:border-slate-350'
                  }`}
                >
                  <img src={cleanMediaUrl(url)} className="h-full w-full object-cover rounded-lg" alt="" referrerPolicy="no-referrer" />
                  
                  {/* Absolute tags index label */}
                  <span className={`absolute top-1.5 left-1.5 text-[8px] font-black uppercase tracking-widest px-1.5 rounded ${
                    index === 0 ? 'bg-emerald-600 text-white' : 'bg-slate-800/80 text-white'
                  }`}>
                    {index === 0 ? 'Main Cover' : `${index + 1}`}
                  </span>

                  {/* Hover trash action */}
                  <button
                    type="button"
                    onClick={() => handleRemoveMediaItem(index)}
                    className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-150 rounded-xl cursor-pointer"
                    title="Remove media file link representation"
                  >
                    <Trash2 className="h-4.5 w-4.5 text-rose-450 hover:scale-110 transition-transform" />
                  </button>
                </div>
              ))}

              {/* Add blank media placeholder item */}
              <div className="aspect-square border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-600 transition-colors flex flex-col items-center justify-center p-3 text-center space-y-1 bg-slate-50/20 cursor-pointer group">
                <ImageUploadInput
                  label="Embed Asset"
                  value=""
                  onChange={(res) => {
                    if (res) {
                      setMediaList([...mediaList, res]);
                      notify('Alternative cover visual compiled.');
                    }
                  }}
                  placeholder="Embed Image"
                />
              </div>

            </div>
          </div>

          {/* Card 3: Price structures */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            <h3 className="font-extrabold text-slate-805 text-xs uppercase tracking-wide">Pricing metrics</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-550 font-bold uppercase tracking-wider text-[9px] mb-1.5">Price (Retail GBP)</label>
                <div className="relative rounded-xl overflow-hidden border border-slate-250 focus-within:ring-2 focus-within:ring-[#008060]/20 focus-within:border-[#008060] transition-all">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-450 font-bold font-mono text-xs">£</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="4.99"
                    value={price || ''}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono font-bold pl-8 pr-4 py-2.5 bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-550 font-bold uppercase tracking-wider text-[9px] mb-1.5">Compare-at Price (original MSRP)</label>
                <div className="relative rounded-xl overflow-hidden border border-slate-250 focus-within:ring-2 focus-within:ring-[#008060]/20 focus-within:border-[#008060] transition-all">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-450 font-bold font-mono text-xs">£</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="6.50"
                    value={compareAtPrice || ''}
                    onChange={(e) => setCompareAtPrice(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono font-bold pl-8 pr-4 py-2.5 bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Inventory tracking parameters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
            <div className="flex justify-between items-center pb-1">
              <h3 className="font-extrabold text-slate-805 text-xs uppercase tracking-wide">Inventory metrics</h3>
              
              {/* Optional toggler for tracking stocks */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={inventoryTracked}
                  onChange={(e) => setInventoryTracked(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500/20 h-4 w-4"
                />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Track Inventory stock count</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-550 font-bold uppercase tracking-wider text-[9px] mb-1.5">SKU No (Stock Keeping Unit)</label>
                <input
                  type="text"
                  placeholder="e.g. OLV10102007"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-4 py-2.5 rounded-xl border border-slate-250 bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-550 font-bold uppercase tracking-wider text-[9px] mb-1.5">Barcode (GTIN/EAN)</label>
                <input
                  type="text"
                  placeholder="385602431102"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-4 py-2.5 rounded-xl border border-slate-250 bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-550 font-bold uppercase tracking-wider text-[9px] mb-1.5">
                  Available Quantity cans {concreteVariantsList.length > 0 && <span className="text-emerald-600 font-extrabold normal-case font-sans">(Sum of variants)</span>}
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={!inventoryTracked || concreteVariantsList.length > 0}
                  placeholder="250"
                  value={inventoryTracked ? inventory : ''}
                  onChange={(e) => setInventory(parseInt(e.target.value) || 0)}
                  className="w-full text-xs font-mono font-bold px-4 py-2.5 rounded-xl border border-slate-250 bg-white disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card 5: Shipping variables */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex justify-between items-center pb-1">
              <h3 className="font-extrabold text-slate-805 text-xs uppercase tracking-wide">Shipping particulars</h3>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={isPhysicalProduct}
                  onChange={(e) => setIsPhysicalProduct(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500/25 h-4 w-4"
                />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Physical Shipped Container</span>
              </label>
            </div>

            {isPhysicalProduct && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
                <div>
                  <label className="block text-slate-550 font-bold uppercase tracking-wider text-[9px] mb-1.5">Product Weight</label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-250 focus-within:ring-2 focus-within:ring-[#008060]/20 focus-within:border-[#008060] transition-all">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="24"
                      value={weight || ''}
                      onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs font-mono font-bold px-4 py-2.5 bg-white focus:outline-none border-r border-slate-250"
                    />
                    <select
                      value={weightUnit}
                      onChange={(e: any) => setWeightUnit(e.target.value)}
                      className="bg-slate-50 px-3 py-2 text-xs font-bold font-mono focus:outline-none cursor-pointer"
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="lb">lb</option>
                      <option value="oz">oz</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-550 font-bold uppercase tracking-wider text-[9px] mb-1.5">Country of origin</label>
                  <select
                    className="w-full text-xs font-bold px-4 py-2.5 border border-slate-250 bg-white rounded-xl focus:outline-none cursor-pointer appearance-none"
                    defaultValue="GB"
                  >
                    <option value="GB">United Kingdom (UK)</option>
                    <option value="SE">Sweden (Europe)</option>
                    <option value="HR">Croatia (Olival HQ)</option>
                    <option value="DK">Denmark</option>
                    <option value="DE">Germany</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Card 6: INTERACTIVE SHOPIFY VARIANTS CONSTRUCTOR */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-xs sm:text-[13px] uppercase tracking-wide flex items-center gap-1">
                  <span>Custom Variants Options Catalog</span>
                  <span className="text-[10px] lowercase text-[#008060] bg-[#008060]/5 border border-[#008060]/15 font-black px-2 py-0.5 rounded-full font-mono">
                    {variantsList.length} Option Dimension(s)
                  </span>
                </h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">Define variable properties such as canister bulk sizing, nicotine mg strengths, or specific flavor profiles.</p>
              </div>

              <button
                type="button"
                onClick={handleAddVariantOption}
                className="bg-slate-100 hover:bg-slate-200 text-slate-705 border border-slate-300 px-3 py-1.5 font-bold text-[10px] uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Option</span>
              </button>
            </div>

            {/* List Option sections */}
            {variantsList.length > 0 ? (
              <div className="space-y-4 pt-1">
                {variantsList.map((variant, index) => {
                  const checkNameMissing = !variant.name.trim();
                  return (
                    <div 
                      key={variant.id} 
                      className={`p-4 rounded-xl border text-left space-y-3.5 bg-slate-50/40 relative ${
                        checkNameMissing ? 'border-amber-400/80 bg-red-50/20' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-slate-400">
                        <GripVertical className="h-4 w-4 shrink-0 cursor-grab active:cursor-grabbing" />
                        <span className="text-[9.5px] font-bold font-mono tracking-widest uppercase text-slate-400">Option {index + 1}.</span>
                        
                        {/* Remove entire variant category button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantOption(variant.id)}
                          className="absolute top-4 right-4 p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-red-650 cursor-pointer transition-colors"
                          title="Remove option category"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Option Name Section */}
                      <div className="max-w-md">
                        <label className="block text-[#475569] font-bold uppercase tracking-wider text-[9px] mb-1.5">
                          Option Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Size, Color, Taste, Nicotine Strength"
                          value={variant.name}
                          onChange={(e) => handleUpdateVariantOptionName(variant.id, e.target.value)}
                          className={`w-full text-xs font-semibold px-3 py-2 rounded-lg border bg-white focus:outline-none focus:ring-1 transition-all ${
                            checkNameMissing 
                              ? 'border-amber-400 focus:ring-amber-300 ring-2 ring-amber-400/10' 
                              : 'border-slate-300 focus:ring-emerald-500'
                          }`}
                        />
                        {checkNameMissing && (
                          <div className="flex items-center gap-1 text-[9px] font-extrabold text-amber-700 uppercase tracking-wider mt-1 px-0.5">
                            <AlertCircle className="h-3 w-3 stroke-[2.5px]" />
                            <span>⚠ Option name is empty or required.</span>
                          </div>
                        )}
                      </div>

                      {/* Option Values Tags lists Section */}
                      <div>
                        <label className="block text-[#475569] font-bold uppercase tracking-wider text-[9px] mb-1.5">
                          Option Values
                        </label>
                        
                        {/* Current values capsules */}
                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                          {variant.values.map(val => (
                            <span 
                              key={val}
                              className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-white border border-slate-205 text-slate-750 px-2.5 py-1 rounded-md shadow-3xs uppercase tracking-tight"
                            >
                              <span>{val}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveOptionValue(variant.id, val)}
                                className="hover:text-red-650 p-0.5 rounded cursor-pointer font-sans"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* Interactive addition layout */}
                        <div className="flex items-center gap-2 max-w-sm">
                          <input
                            type="text"
                            placeholder="Add value (e.g. Medium, Strong)"
                            value={newOptionValTemp[variant.id] || ''}
                            onChange={(e) => setNewOptionValTemp({
                              ...newOptionValTemp,
                              [variant.id]: e.target.value
                            })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddOptionValue(variant.id);
                              }
                            }}
                            className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white placeholder-slate-400 focus:outline-none flex-1 font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddOptionValue(variant.id)}
                            className="bg-slate-900 hover:bg-[#008060] text-white font-extrabold text-[9.5px] uppercase tracking-widest px-3 py-1.5.5 rounded-lg cursor-pointer transition-colors"
                          >
                            Done
                          </button>
                        </div>
                        <p className="text-[8px] text-slate-400 font-mono mt-1 px-0.5 uppercase tracking-wider">Press Enter or click Done to create multiple tags sequentially.</p>
                      </div>

                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={handleAddVariantOption}
                  className="w-full py-3.5 border-2 border-dashed border-slate-205 hover:border-emerald-600 rounded-xl hover:bg-slate-50/40 text-center font-bold text-xs text-slate-500 hover:text-emerald-700 transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Add Another Variant Option dimension
                </button>
              </div>
            ) : (
              <div className="py-7 border border-dashed border-slate-250 rounded-xl bg-slate-50/50 text-center space-y-1 p-4">
                <Info className="h-5 w-5 mx-auto text-slate-400 mb-1" />
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-wider">This canister has zero discrete configurations</p>
                <p className="text-[9px] text-slate-450 leading-relaxed max-w-sm mx-auto">Products are saved with single standard pricing and weights by default. Add variants to allow dropdown menus on customer screens.</p>
              </div>
            )}
          </div>

          {/* Card 6.5: CONCRETE PHYSICAL VARIANTS DETAILS */}
          {variantsList.length > 0 && concreteVariantsList.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs text-left">
              <div>
                <h3 className="font-extrabold text-slate-900 text-xs sm:text-[13px] uppercase tracking-wide flex items-center gap-1.5">
                  <SlidersHorizontal className="h-4 w-4 text-emerald-650" />
                  <span>Physical Variants Configurations</span>
                  <span className="text-[10px] lowercase text-[#008060] bg-[#008060]/5 border border-[#008060]/15 font-black px-2 py-0.5 rounded-full font-mono">
                    {concreteVariantsList.length} Variant(s)
                  </span>
                </h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">Customize individual settings for each physical combination. Set custom prices, stock levels, descriptions, unique Product IDs, and upload different images.</p>
              </div>

              <div className="space-y-6">
                {concreteVariantsList.map((variant, vIdx) => (
                  <div key={variant.name} className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-slate-50/40 space-y-4">
                    {/* Variant Header / Combination & Product ID */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="font-extrabold text-slate-800 text-[11px] tracking-tight bg-slate-100 px-3 py-1 rounded-lg uppercase font-mono">
                        Combination: <span className="text-emerald-700">{variant.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 shrink-0">Product ID / SKU:</label>
                        <input
                          type="text"
                          value={variant.id}
                          onChange={(e) => handleUpdateConcreteVariant(vIdx, { id: e.target.value })}
                          className="text-xs font-bold px-3 py-1 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44"
                          placeholder="Unique Product ID"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                      {/* Left Side: Image upload area for the variant */}
                      <div className="md:col-span-5 space-y-2">
                        <span className="block text-slate-550 font-bold uppercase tracking-wider text-[9px]">Variant Image</span>
                        <ImageUploadInput
                          label=""
                          value={variant.images?.[0] || ''}
                          onChange={(imgUrl) => handleUpdateConcreteVariant(vIdx, { images: imgUrl ? [imgUrl] : [] })}
                          placeholder="Variant Image URL..."
                          hideUrlInput={true}
                        />
                      </div>

                      {/* Right Side: Inputs for price, stock, and description */}
                      <div className="md:col-span-7 space-y-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                          <div>
                            <label className="block text-slate-550 font-bold uppercase tracking-wider text-[9px] mb-1.5">Price (£ GBP)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={variant.price}
                              onChange={(e) => handleUpdateConcreteVariant(vIdx, { price: Math.max(0, parseFloat(e.target.value) || 0) })}
                              className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-550 font-bold uppercase tracking-wider text-[9px] mb-1.5">Stock Quantity</label>
                            <input
                              type="number"
                              value={variant.inventory}
                              onChange={(e) => handleUpdateConcreteVariant(vIdx, { inventory: Math.max(0, parseInt(e.target.value) || 0) })}
                              className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-550 font-bold uppercase tracking-wider text-[9px] mb-1.5">Flavour</label>
                            <select
                              value={variant.flavour || 'Mint'}
                              onChange={(e) => handleUpdateConcreteVariant(vIdx, { flavour: e.target.value })}
                              className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                            >
                              <option value="Mint">Mint</option>
                              <option value="Berry">Berry</option>
                              <option value="Citrus">Citrus</option>
                              <option value="Fruit">Fruit</option>
                              <option value="Cola">Cola</option>
                              <option value="Coffee">Coffee</option>
                              <option value="Sweet">Sweet</option>
                              <option value="Tea">Tea</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-550 font-bold uppercase tracking-wider text-[9px] mb-1.5">Separate Description</label>
                          <textarea
                            rows={2}
                            value={variant.description}
                            onChange={(e) => handleUpdateConcreteVariant(vIdx, { description: e.target.value })}
                            placeholder="Enter description specific to this flavor/combination..."
                            className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card 7: Search Engine Snippet Preview for Cans */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-slate-850 text-xs uppercase tracking-wide flex items-center gap-1">
                  <Globe className="h-4 w-4 text-slate-500" />
                  <span>Search engine listing preview</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Search result snippet preview as displayed in public search indexes.</p>
              </div>
              
              <button
                type="button"
                onClick={() => setShowSeoFields(!showSeoFields)}
                className="text-[#008060] hover:text-[#006e52] font-black text-[10px] uppercase tracking-wider hover:underline"
              >
                {showSeoFields ? 'Collapse Layout' : 'Modify Web SEO'}
              </button>
            </div>

            {/* Google Snippet display */}
            <div className="bg-slate-50 border border-slate-205 p-4 rounded-xl space-y-1 text-left font-serif leading-none select-none max-w-xl">
              <span className="text-neutral-400 font-sans text-[10px] block truncate font-medium">https://pouchsupply.co.uk/products/{customSlug || slugify(title || 'untitled')}</span>
              <span className="text-[#1a0dab] font-sans text-xs sm:text-sm block hover:underline cursor-pointer font-extrabold leading-tight">
                {seoTitle || title || 'Untitled Nicotine Pouch Can'}
              </span>
              <p className="text-[#3c4043] font-sans text-[11px] leading-relaxed pt-1 select-all h-[40px] line-clamp-2">
                {seoDescription || description || 'Discover the freshest European nicotine pouch canisters available. Ultra-fast UK shipping and wholesale options.'}
              </p>
              <span className="text-emerald-700 font-sans text-[10px] block pt-1 font-bold">🛒 Prices start from £{price ? price.toFixed(2) : '4.99'} GBP</span>
            </div>

            {showSeoFields && (
              <div className="pt-4 border-t border-slate-100 space-y-4 text-xs animate-fadeIn">
                <div>
                  <label htmlFor="p-seo-title" className="block text-slate-650 font-black uppercase tracking-wider text-[9px] mb-1">Page Title</label>
                  <input
                    id="p-seo-title"
                    type="text"
                    maxLength={70}
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Enter short searchable heading..."
                    className="w-full text-xs font-semibold px-3 py-2 border rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="p-seo-desc" className="block text-slate-650 font-black uppercase tracking-wider text-[9px] mb-1">Meta Description snippet</label>
                  <textarea
                    id="p-seo-desc"
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    maxLength={160}
                    placeholder="Enter short metadata descriptor..."
                    className="w-full text-xs font-semibold px-3 py-2 border rounded-lg h-16 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="p-seo-slug" className="block text-slate-650 font-black uppercase tracking-wider text-[9px] mb-1">URL Handle (Slug key)</label>
                  <div className="flex items-center rounded-lg overflow-hidden border bg-slate-50">
                    <span className="bg-slate-100 px-3 py-1.5 text-slate-450 border-r text-[9px] font-mono">/products/</span>
                    <input
                      id="p-seo-slug"
                      type="text"
                      value={customSlug}
                      onChange={(e) => setCustomSlug(slugify(e.target.value))}
                      className="w-full px-3 py-1 bg-white text-xs font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Organizational publishing details sidebar */}
        <div className="space-y-6 text-left">
          
          {/* Sidebar block 1: Dynamic Status dropdown card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-805 text-[10.5px] uppercase tracking-widest pb-1 border-b border-indigo-50/50">Product Status</h3>
            
            <div className="relative">
              <select 
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full text-xs font-extrabold pl-3 pr-8 py-2.5 border border-slate-350 bg-white rounded-xl focus:outline-none cursor-pointer appearance-none"
              >
                <option value="Active">🟢 Active (Visible on storefront)</option>
                <option value="Draft">🟡 Draft (Hidden / Under construction)</option>
                <option value="Archived">🔴 Archived (Out of production)</option>
                <option value="Unlisted">⚪ Unlisted (Requires direct link)</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-500">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Sidebar block 2: Publishing channels list */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
            <h3 className="font-extrabold text-slate-850 text-[10.5px] uppercase tracking-widest pb-1 border-b border-indigo-55/70">Publishing Channels</h3>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-1 bg-emerald-50/40 border border-emerald-100 rounded-lg px-2.5 py-1.5">
                <span className="font-bold text-slate-700">Online storefront portal</span>
                <span className="text-[8.5px] font-black text-emerald-700 bg-emerald-100 border border-emerald-250 px-2 rounded font-mono">LIVE</span>
              </div>
            </div>
          </div>

          {/* Sidebar block 3: COMPREHENSIVE PRODUCT ORGANIZATION SECTION */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4.5">
            <h3 className="font-extrabold text-slate-805 text-[10.5px] uppercase tracking-widest pb-1 border-b border-indigo-50/50">Product organization</h3>
            
            {/* Vendor Type option field */}
            <div className="space-y-1.5">
              <label className="block text-[#475569] font-bold uppercase tracking-wider text-[9px]">
                Vendor
              </label>
              <div className="relative">
                <select
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full text-xs font-bold pl-3.5 pr-8 py-2.5 border border-slate-350 bg-white rounded-xl focus:outline-none cursor-pointer appearance-none uppercase tracking-wider"
                >
                  {defaultVendors.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-500">
                  <ChevronDown className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="text-[8px] text-slate-400 font-medium">Categorization matching catalog sorting filters on collection sidebars.</p>
            </div>

            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="block text-[#475569] font-bold uppercase tracking-wider text-[9px]">
                Type
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs font-bold pl-3.5 pr-8 py-2.5 border border-slate-350 bg-white rounded-xl focus:outline-none cursor-pointer appearance-none"
                >
                  {defaultCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>

            {/* Flavour selection */}
            <div className="space-y-1.5">
              <label className="block text-[#475569] font-bold uppercase tracking-wider text-[9px]">
                Flavour
              </label>
              <div className="relative">
                <select
                  value={flavour}
                  onChange={(e) => setFlavour(e.target.value)}
                  className="w-full text-xs font-bold pl-3.5 pr-8 py-2.5 border border-slate-350 bg-white rounded-xl focus:outline-none cursor-pointer appearance-none"
                >
                  <option value="Mint">Mint</option>
                  <option value="Berry">Berry</option>
                  <option value="Citrus">Citrus</option>
                  <option value="Fruit">Fruit</option>
                  <option value="Cola">Cola</option>
                  <option value="Coffee">Coffee</option>
                  <option value="Sweet">Sweet</option>
                  <option value="Tea">Tea</option>
                  <option value="Other">Other</option>
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="text-[8px] text-slate-400 font-medium">Select primary flavour to match catalog filters.</p>
            </div>

            {/* Collection Select check list */}
            <div className="space-y-2">
              <label className="block text-[#475569] font-bold uppercase tracking-wider text-[9px]">
                Linked Collections membership
              </label>
              
              <div className="border border-slate-205 rounded-xl max-h-40 overflow-y-auto p-2.5 space-y-1 bg-slate-50/30">
                {allCollections.map(col => {
                  const isChecked = selectedColIds.includes(col.id);
                  return (
                    <label 
                      key={col.id} 
                      className={`flex items-center gap-2.5 p-1.5 rounded-lg text-xs font-semibold cursor-pointer select-none transition-colors ${
                        isChecked ? 'bg-indigo-50/40 text-slate-750 font-bold' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleCollection(col.id)}
                        className="rounded text-emerald-600 focus:ring-emerald-500/25 h-3.5 w-3.5"
                      />
                      <span className="uppercase tracking-tight text-[10.5px] truncate">{col.title || `${col.id}`}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-[8px] text-slate-400 leading-normal">Checking collections matches dynamic lists and publishes bags to physical sections.</p>
            </div>

            {/* Tags section input and capsules and lists */}
            <div className="space-y-2">
              <label className="block text-[#475569] font-bold uppercase tracking-wider text-[9px]">
                Product Tags
              </label>
              
              <div className="flex flex-wrap gap-1.5 mb-1 bg-white p-1 border-b border-transparent">
                {tags.map(tag => (
                  <span 
                    key={tag}
                    className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded text-[9.5px] uppercase font-black tracking-widest rounded-full"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer text-xs font-black"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>

              <input
                type="text"
                placeholder="Type tag & press Enter..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full text-xs font-semibold px-3 py-1.5 border border-slate-250 bg-white rounded-lg focus:outline-none"
              />
              <p className="text-[8px] text-slate-400 font-mono tracking-wider uppercase">Press 'Enter' to split tag values.</p>
            </div>

          </div>

        </div>

      </div>

      {/* FOOTER CONFIRMATION ROW */}
      <div className="pt-6 border-t border-slate-200 flex justify-end items-center gap-3">
        <button
          onClick={handleBackOrDiscard}
          className="py-2.5 px-5 border border-slate-255 bg-white hover:bg-slate-55 text-slate-650 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
        >
          Discard
        </button>

        <button
          onClick={executeFormSubmit}
          className="py-2.5 px-6 bg-[#1c2d50] hover:bg-[#152340] text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
        >
          <Save className="h-4 w-4" />
          <span>Save Product</span>
        </button>
      </div>

      {/* CUSTOM CONFIRMATION DIALOG MODAL (Iframe safe) */}
      {showDeleteConfirm && product && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-[10000]">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full shadow-2xl space-y-4 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Delete Product</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-slate-650 font-semibold leading-relaxed">
              Are you sure you want to remove the product <strong className="text-slate-900">"{title || 'this item'}"</strong> from your catalog repository forever?
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
                  if (onDelete) onDelete(product.id);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-md shadow-rose-200 transition-all cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNSAVED CHANGES WARNING MODAL (Iframe safe) */}
      {showUnsavedConfirm && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-[10000]">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Unsaved Changes</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">You have modified this product catalog entry.</p>
              </div>
            </div>
            <p className="text-xs text-slate-650 font-semibold leading-relaxed">
              You have unsaved changes on this product page. Leaving or backing out now will cause all your recent modifications to be discarded permanently.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowUnsavedConfirm(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                onClick={() => {
                  setShowUnsavedConfirm(false);
                  onCancel();
                }}
                className="px-4 py-2 bg-amber-650 hover:bg-amber-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-md shadow-amber-200 transition-all cursor-pointer"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
