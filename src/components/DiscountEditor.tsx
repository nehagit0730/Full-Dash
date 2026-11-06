import React, { useState } from 'react';
import { Discount, Product, Collection, Customer } from '../types';
import { 
  X, Search, Plus, Calendar, Percent, ChevronDown, Check, 
  MapPin, Users, Tag, ArrowLeft, Globe, HelpCircle, AlertCircle,
  Award, Star
} from 'lucide-react';

interface DiscountEditorProps {
  discount: Discount | null;
  discountType: 'Amount off products' | 'Buy X get Y' | 'Amount off order' | 'Free shipping' | 'Loyalty Reward';
  products: Product[];
  collections: Collection[];
  customers?: Customer[];
  onSave: (savedDiscount: Discount) => void;
  onCancel: () => void;
}

export default function DiscountEditor({
  discount,
  discountType,
  products = [],
  collections = [],
  customers = [],
  onSave,
  onCancel
}: DiscountEditorProps) {
  // Local state for discount editor
  const [form, setForm] = useState<Partial<Discount>>(() => {
    if (discount) {
      return { ...discount };
    }
    
    // Default values for new discount
    const isFreeShipping = discountType === 'Free shipping';
    return {
      id: 'disc_' + Math.floor(Math.random() * 1000000),
      title: '',
      status: 'Active',
      method: 'Discount code',
      eligibility: 'All customers',
      type: discountType,
      used: 0,
      details: '',
      valueType: 'Percentage',
      valueAmount: isFreeShipping ? undefined : 10,
      appliesToType: 'Specific products',
      appliesToIds: [],
      customerBuysType: 'Minimum quantity of items',
      customerBuysValue: 1,
      customerBuysAppliesToType: 'Specific products',
      customerBuysAppliesToIds: [],
      customerGetsValue: 1,
      customerGetsAppliesToType: 'Specific products',
      customerGetsAppliesToIds: [],
      customerGetsDiscountType: 'Percentage',
      customerGetsDiscountValue: 100, // Free gets 100% discount by default
      maxUsesPerOrder: undefined,
      minRequirementsType: 'No minimum requirements',
      minRequirementsValue: 0,
      limitTotalUses: false,
      limitTotalUsesCount: 100,
      limitOnePerCustomer: false,
      combineWithProductDiscounts: false,
      combineWithOrderDiscounts: false,
      combineWithShippingDiscounts: false,
      startDate: new Date().toISOString().split('T')[0],
      startTime: '12:00 AM',
      hasEndDate: false,
      endDate: '',
      endTime: '11:59 PM',
      countriesType: 'All countries',
      selectedCountries: [],
      excludeShippingRatesOverAmount: false,
      excludeShippingRatesAmount: 0,
      allowOnSelectedChannels: false,
      tags: [],
      loyaltyRewardType: 'Percentage Off',
      loyaltyRewardValue: '15',
      loyaltyCustomerSelection: 'All customers',
      loyaltyCustomerEmails: [],
      loyaltyProductSelection: 'All products',
      loyaltyProductIds: [],
      loyaltyCollectionSelection: 'All collections',
      loyaltyCollectionIds: []
    };
  });

  // Loyalty reward specific search queries
  const [loyaltyProductSearch, setLoyaltyProductSearch] = useState('');
  const [loyaltyCollectionSearch, setLoyaltyCollectionSearch] = useState('');
  const [loyaltyCustomerSearch, setLoyaltyCustomerSearch] = useState('');

  // State for browser picker dialog
  const [pickerConfig, setPickerConfig] = useState<{
    isOpen: boolean;
    mode: 'products' | 'collections';
    targetField: 'appliesToIds' | 'customerBuysAppliesToIds' | 'customerGetsAppliesToIds';
    selectedIds: string[];
  }>({
    isOpen: false,
    mode: 'products',
    targetField: 'appliesToIds',
    selectedIds: []
  });

  const [pickerSearch, setPickerSearch] = useState('');
  const [newTagInput, setNewTagInput] = useState('');

  // Handle generating random code
  const generateRandomCode = () => {
    const prefixes = ['SAVE', 'GET', 'PROMO', 'DEAL', 'CODE', 'SPECIAL'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setForm(prev => ({ ...prev, title: `${prefix}${randomNum}` }));
  };

  // Open the modal to browse products/collections
  const openPicker = (
    mode: 'products' | 'collections',
    targetField: 'appliesToIds' | 'customerBuysAppliesToIds' | 'customerGetsAppliesToIds'
  ) => {
    setPickerConfig({
      isOpen: true,
      mode,
      targetField,
      selectedIds: (form[targetField] as string[]) || []
    });
    setPickerSearch('');
  };

  // Save selection from browse picker
  const savePickerSelection = () => {
    setForm(prev => ({
      ...prev,
      [pickerConfig.targetField]: pickerConfig.selectedIds
    }));
    setPickerConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleToggleIdInPicker = (id: string) => {
    setPickerConfig(prev => {
      const isSelected = prev.selectedIds.includes(id);
      const updated = isSelected 
        ? prev.selectedIds.filter(x => x !== id)
        : [...prev.selectedIds, id];
      return { ...prev, selectedIds: updated };
    });
  };

  // Tag helper functions
  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const currentTags = form.tags || [];
    if (!currentTags.includes(newTagInput.trim())) {
      setForm(prev => ({ ...prev, tags: [...currentTags, newTagInput.trim()] }));
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setForm(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tag) }));
  };

  // Auto-generate details summary based on form values
  const getAutoDetails = () => {
    const lines: string[] = [];

    // Method & Type Summary
    if (form.type === 'Amount off order') {
      const amtStr = form.valueType === 'Percentage' ? `${form.valueAmount}%` : `£${form.valueAmount}`;
      lines.push(`${amtStr} off entire order`);
    } else if (form.type === 'Amount off products') {
      const amtStr = form.valueType === 'Percentage' ? `${form.valueAmount}%` : `£${form.valueAmount}`;
      const targetStr = form.appliesToType === 'Specific products' ? 'products' : 'collections';
      const count = form.appliesToIds?.length || 0;
      lines.push(`${amtStr} off ${count > 0 ? `${count} selected` : 'all'} ${targetStr}`);
    } else if (form.type === 'Buy X get Y') {
      const buyQty = form.customerBuysValue || 1;
      const getQty = form.customerGetsValue || 1;
      const discountVal = form.customerGetsDiscountType === 'Free' ? 'Free' : (form.customerGetsDiscountType === 'Percentage' ? `${form.customerGetsDiscountValue}% off` : `£${form.customerGetsDiscountValue} off`);
      lines.push(`Buy ${buyQty} items, get ${getQty} items ${discountVal}`);
    } else if (form.type === 'Free shipping') {
      lines.push('Free shipping on order');
    } else if (form.type === 'Loyalty Reward') {
      const rewardType = form.loyaltyRewardType || 'Percentage Off';
      const rewardVal = form.loyaltyRewardValue || '15';
      const custSel = form.loyaltyCustomerSelection === 'Specific customers' 
        ? `${form.loyaltyCustomerEmails?.length || 0} selected customers` 
        : 'All customers';
      const prodSel = form.loyaltyProductSelection === 'Specific products' 
        ? `${form.loyaltyProductIds?.length || 0} selected products` 
        : 'All products';
      const collSel = form.loyaltyCollectionSelection === 'Specific collections' 
        ? `${form.loyaltyCollectionIds?.length || 0} selected collections` 
        : 'All collections';
      lines.push(`Loyalty Reward: ${rewardType} (${rewardVal})`);
      lines.push(`Eligible: ${custSel}`);
      lines.push(`Scope: ${prodSel}, ${collSel}`);
    }

    // Eligibility
    if (form.eligibility === 'All customers') {
      lines.push('All customers');
    } else {
      lines.push(`${form.eligibility}`);
    }

    // Country Restrictions for shipping
    if (form.type === 'Free shipping') {
      if (form.countriesType === 'All countries') {
        lines.push('For all countries');
      } else {
        const count = form.selectedCountries?.length || 0;
        lines.push(`For ${count} selected countries`);
      }
      if (form.excludeShippingRatesOverAmount) {
        lines.push(`Exclude rates over £${form.excludeShippingRatesAmount}`);
      }
    }

    // Minimum Requirements
    if (!form.minRequirementsType || form.minRequirementsType === 'No minimum requirements') {
      lines.push('No minimum purchase requirement');
    } else if (form.minRequirementsType === 'Minimum purchase amount ($)') {
      lines.push(`Minimum purchase of £${(form.minRequirementsValue || 0).toFixed(2)}`);
    } else if (form.minRequirementsType === 'Minimum quantity of items') {
      lines.push(`Minimum quantity of ${form.minRequirementsValue} items`);
    }

    // Usage limits
    if (!form.limitTotalUses && !form.limitOnePerCustomer) {
      lines.push('No usage limits');
    } else {
      if (form.limitTotalUses) {
        lines.push(`Limit of ${form.limitTotalUsesCount} total uses`);
      }
      if (form.limitOnePerCustomer) {
        lines.push('Limit to one use per customer');
      }
    }

    // Combinations
    const combList: string[] = [];
    if (form.combineWithProductDiscounts) combList.push('Product');
    if (form.combineWithOrderDiscounts) combList.push('Order');
    if (form.combineWithShippingDiscounts) combList.push('Shipping');
    if (combList.length > 0) {
      lines.push(`Combines with ${combList.join(', ')} discounts`);
    } else {
      lines.push("Can't combine with other discounts");
    }

    // Dates
    lines.push(`Active from ${form.startDate || 'today'}`);
    if (form.hasEndDate && form.endDate) {
      lines.push(`Ends ${form.endDate} at ${form.endTime || '11:59 PM'}`);
    }

    return lines;
  };

  const handleSave = () => {
    if (!form.title || !form.title.trim()) {
      alert('Please enter a discount code title / name.');
      return;
    }

    const detailsText = getAutoDetails().slice(0, 3).join(' • ');
    const finalDiscount: Discount = {
      id: form.id || 'disc_' + Math.random(),
      title: form.title.trim().toUpperCase(),
      status: (form.status as 'Active' | 'Expired') || 'Active',
      method: form.method || 'Discount code',
      eligibility: form.eligibility || 'All customers',
      type: (form.type as any) || discountType,
      used: form.used || 0,
      details: detailsText,
      ...form
    };

    onSave(finalDiscount);
  };

  const summaryBullets = getAutoDetails();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col pb-20">
      
      {/* Top Breadcrumb Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={onCancel}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="cursor-pointer hover:underline" onClick={onCancel}>Discounts</span>
              <span>/</span>
              <span className="font-semibold text-slate-800">{discount ? 'Edit discount' : 'Create discount'}</span>
            </div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 mt-0.5">
              {discount ? `Edit discount: ${discount.title}` : `Create ${discountType.toLowerCase()}`}
            </h1>
          </div>
        </div>

        {/* Top Actions panel */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-500 font-medium bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Unsaved discount
          </span>
          <button 
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-250 rounded-lg hover:bg-slate-50 transition cursor-pointer"
          >
            Discard
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="max-w-6xl w-full mx-auto px-4 md:px-6 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column Fields Panels */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. Header Code Config Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-extrabold text-slate-900">{discountType}</h2>
              <span className="text-xs text-slate-400">Method</span>
            </div>

            {/* Method Button Selector */}
            <div className="flex bg-slate-100 p-1 rounded-lg w-max">
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, method: 'Discount code' }))}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                  form.method === 'Discount code' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Discount code
              </button>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, method: 'Automatic discount' }))}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                  form.method === 'Automatic discount' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Automatic discount
              </button>
            </div>

            {/* Title / Code input field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {form.method === 'Discount code' ? 'Discount code' : 'Title'}
                </label>
                {form.method === 'Discount code' && (
                  <button 
                    type="button"
                    onClick={generateRandomCode}
                    className="text-xs text-indigo-650 font-bold hover:underline"
                  >
                    Generate random code
                  </button>
                )}
              </div>
              <input
                type="text"
                value={form.title || ''}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value.toUpperCase() }))}
                placeholder={form.method === 'Discount code' ? 'e.g. CRUSHCLUB15' : 'e.g. 15% Off Summer'}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-bold uppercase focus:ring-1 focus:ring-slate-500 focus:outline-none placeholder:normal-case"
              />
              <p className="text-[11px] text-slate-450 mt-1.5">
                {form.method === 'Discount code' 
                  ? 'Customers must enter this code at checkout.' 
                  : 'Customers will see this discount automatically applied in their cart.'}
              </p>
            </div>
          </div>

          {/* 2. Values and Target Picker Panel (Depending on discount type) */}
          {discountType === 'Amount off order' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900">Discount value</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Value type</label>
                  <select
                    value={form.valueType || 'Percentage'}
                    onChange={(e) => setForm(prev => ({ ...prev, valueType: e.target.value as any }))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-slate-500 focus:outline-none"
                  >
                    <option value="Percentage">Percentage</option>
                    <option value="Fixed amount">Fixed amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Discount value amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={form.valueAmount !== undefined ? form.valueAmount : ''}
                      onChange={(e) => setForm(prev => ({ ...prev, valueAmount: Number(e.target.value) }))}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-bold pr-8 focus:ring-1 focus:ring-slate-500 focus:outline-none"
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-500 text-xs font-bold">
                      {form.valueType === 'Percentage' ? '%' : '£'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {discountType === 'Amount off products' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900">Discount value</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Value type</label>
                  <select
                    value={form.valueType || 'Percentage'}
                    onChange={(e) => setForm(prev => ({ ...prev, valueType: e.target.value as any }))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-slate-500 focus:outline-none"
                  >
                    <option value="Percentage">Percentage</option>
                    <option value="Fixed amount">Fixed amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Discount value amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={form.valueAmount !== undefined ? form.valueAmount : ''}
                      onChange={(e) => setForm(prev => ({ ...prev, valueAmount: Number(e.target.value) }))}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-bold pr-8 focus:ring-1 focus:ring-slate-500 focus:outline-none"
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-500 text-xs font-bold">
                      {form.valueType === 'Percentage' ? '%' : '£'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Applies to selector */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Applies to</label>
                <select
                  value={form.appliesToType || 'Specific products'}
                  onChange={(e) => setForm(prev => ({ ...prev, appliesToType: e.target.value as any, appliesToIds: [] }))}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-slate-500 focus:outline-none"
                >
                  <option value="Specific products">Specific products</option>
                  <option value="Specific collections">Specific collections</option>
                </select>

                {/* Browse Products/Collections Input */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      readOnly
                      placeholder={form.appliesToType === 'Specific products' ? 'Search products' : 'Search collections'}
                      onClick={() => openPicker(form.appliesToType === 'Specific products' ? 'products' : 'collections', 'appliesToIds')}
                      className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none bg-slate-50/50 cursor-pointer"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => openPicker(form.appliesToType === 'Specific products' ? 'products' : 'collections', 'appliesToIds')}
                    className="px-4 py-2.5 border border-slate-250 bg-white text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 transition cursor-pointer shrink-0"
                  >
                    Browse
                  </button>
                </div>

                {/* Selected Products/Collections badge list */}
                {form.appliesToIds && form.appliesToIds.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {form.appliesToIds.map(id => {
                      const itemTitle = form.appliesToType === 'Specific products'
                        ? products.find(p => p.id === id)?.title || id
                        : collections.find(c => c.id === id)?.title || id;
                      return (
                        <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-100 text-slate-800 rounded-full border border-slate-200">
                          {itemTitle}
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({
                              ...prev,
                              appliesToIds: (prev.appliesToIds || []).filter(x => x !== id)
                            }))}
                            className="p-0.5 hover:bg-slate-200 rounded-full text-slate-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {discountType === 'Buy X get Y' && (
            <div className="space-y-6">
              
              {/* Customer Buys Panel */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <h2 className="text-sm font-extrabold text-slate-900">Customer buys</h2>
                
                {/* Buy conditions radios */}
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="customerBuysType"
                      checked={form.customerBuysType === 'Minimum quantity of items'}
                      onChange={() => setForm(prev => ({ ...prev, customerBuysType: 'Minimum quantity of items' }))}
                      className="text-slate-900 focus:ring-slate-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-slate-700">Minimum quantity of items</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="customerBuysType"
                      checked={form.customerBuysType === 'Minimum purchase amount'}
                      onChange={() => setForm(prev => ({ ...prev, customerBuysType: 'Minimum purchase amount' }))}
                      className="text-slate-900 focus:ring-slate-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-slate-700">Minimum purchase amount</span>
                  </label>
                </div>

                {/* Quantity and Applies to specific selector */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {form.customerBuysType === 'Minimum quantity of items' ? 'Quantity' : 'Minimum purchase amount (£)'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.customerBuysValue !== undefined ? form.customerBuysValue : ''}
                      onChange={(e) => setForm(prev => ({ ...prev, customerBuysValue: Number(e.target.value) }))}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-bold focus:ring-1 focus:ring-slate-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Any items from</label>
                    <select
                      value={form.customerBuysAppliesToType || 'Specific products'}
                      onChange={(e) => setForm(prev => ({ ...prev, customerBuysAppliesToType: e.target.value as any, customerBuysAppliesToIds: [] }))}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-slate-500 focus:outline-none"
                    >
                      <option value="Specific products">Specific products</option>
                      <option value="Specific collections">Specific collections</option>
                    </select>
                  </div>
                </div>

                {/* Browse triggers */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      readOnly
                      placeholder={form.customerBuysAppliesToType === 'Specific products' ? 'Search products' : 'Search collections'}
                      onClick={() => openPicker(form.customerBuysAppliesToType === 'Specific products' ? 'products' : 'collections', 'customerBuysAppliesToIds')}
                      className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none bg-slate-50/50 cursor-pointer"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => openPicker(form.customerBuysAppliesToType === 'Specific products' ? 'products' : 'collections', 'customerBuysAppliesToIds')}
                    className="px-4 py-2.5 border border-slate-250 bg-white text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 transition cursor-pointer shrink-0"
                  >
                    Browse
                  </button>
                </div>

                {/* Customer Buys Selected list */}
                {form.customerBuysAppliesToIds && form.customerBuysAppliesToIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {form.customerBuysAppliesToIds.map(id => {
                      const itemTitle = form.customerBuysAppliesToType === 'Specific products'
                        ? products.find(p => p.id === id)?.title || id
                        : collections.find(c => c.id === id)?.title || id;
                      return (
                        <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-100 text-slate-800 rounded-full border border-slate-200">
                          {itemTitle}
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({
                              ...prev,
                              customerBuysAppliesToIds: (prev.customerBuysAppliesToIds || []).filter(x => x !== id)
                            }))}
                            className="p-0.5 hover:bg-slate-200 rounded-full text-slate-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Customer Gets Panel */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <h2 className="text-sm font-extrabold text-slate-900">Customer gets</h2>
                <p className="text-[11px] text-slate-450">Customers must add the quantity of items specified below to their cart.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={form.customerGetsValue !== undefined ? form.customerGetsValue : ''}
                      onChange={(e) => setForm(prev => ({ ...prev, customerGetsValue: Number(e.target.value) }))}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-bold focus:ring-1 focus:ring-slate-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Any items from</label>
                    <select
                      value={form.customerGetsAppliesToType || 'Specific products'}
                      onChange={(e) => setForm(prev => ({ ...prev, customerGetsAppliesToType: e.target.value as any, customerGetsAppliesToIds: [] }))}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-slate-500 focus:outline-none"
                    >
                      <option value="Specific products">Specific products</option>
                      <option value="Specific collections">Specific collections</option>
                    </select>
                  </div>
                </div>

                {/* Gets Picker Browse */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      readOnly
                      placeholder={form.customerGetsAppliesToType === 'Specific products' ? 'Search products' : 'Search collections'}
                      onClick={() => openPicker(form.customerGetsAppliesToType === 'Specific products' ? 'products' : 'collections', 'customerGetsAppliesToIds')}
                      className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none bg-slate-50/50 cursor-pointer"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => openPicker(form.customerGetsAppliesToType === 'Specific products' ? 'products' : 'collections', 'customerGetsAppliesToIds')}
                    className="px-4 py-2.5 border border-slate-250 bg-white text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 transition cursor-pointer shrink-0"
                  >
                    Browse
                  </button>
                </div>

                {/* Customer Gets Selected list */}
                {form.customerGetsAppliesToIds && form.customerGetsAppliesToIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {form.customerGetsAppliesToIds.map(id => {
                      const itemTitle = form.customerGetsAppliesToType === 'Specific products'
                        ? products.find(p => p.id === id)?.title || id
                        : collections.find(c => c.id === id)?.title || id;
                      return (
                        <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-100 text-slate-800 rounded-full border border-slate-200">
                          {itemTitle}
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({
                              ...prev,
                              customerGetsAppliesToIds: (prev.customerGetsAppliesToIds || []).filter(x => x !== id)
                            }))}
                            className="p-0.5 hover:bg-slate-200 rounded-full text-slate-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Discounted Value Section */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <label className="block text-xs font-bold text-slate-800">At a discounted value</label>
                  
                  <div className="space-y-2.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="customerGetsDiscountType"
                        checked={form.customerGetsDiscountType === 'Percentage'}
                        onChange={() => setForm(prev => ({ ...prev, customerGetsDiscountType: 'Percentage', customerGetsDiscountValue: 100 }))}
                        className="text-slate-900 focus:ring-slate-500 h-4 w-4"
                      />
                      <span className="text-xs font-bold text-slate-700">Percentage</span>
                    </label>

                    {form.customerGetsDiscountType === 'Percentage' && (
                      <div className="pl-6 max-w-xs relative">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={form.customerGetsDiscountValue !== undefined ? form.customerGetsDiscountValue : ''}
                          onChange={(e) => setForm(prev => ({ ...prev, customerGetsDiscountValue: Number(e.target.value) }))}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-slate-500 focus:outline-none pr-8"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">%</span>
                      </div>
                    )}

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="customerGetsDiscountType"
                        checked={form.customerGetsDiscountType === 'Amount off each'}
                        onChange={() => setForm(prev => ({ ...prev, customerGetsDiscountType: 'Amount off each', customerGetsDiscountValue: 5 }))}
                        className="text-slate-900 focus:ring-slate-500 h-4 w-4"
                      />
                      <span className="text-xs font-bold text-slate-700">Amount off each</span>
                    </label>

                    {form.customerGetsDiscountType === 'Amount off each' && (
                      <div className="pl-6 max-w-xs relative">
                        <input
                          type="number"
                          min="1"
                          value={form.customerGetsDiscountValue !== undefined ? form.customerGetsDiscountValue : ''}
                          onChange={(e) => setForm(prev => ({ ...prev, customerGetsDiscountValue: Number(e.target.value) }))}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-slate-500 focus:outline-none pr-8"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">£</span>
                      </div>
                    )}

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="customerGetsDiscountType"
                        checked={form.customerGetsDiscountType === 'Free'}
                        onChange={() => setForm(prev => ({ ...prev, customerGetsDiscountType: 'Free', customerGetsDiscountValue: 100 }))}
                        className="text-slate-900 focus:ring-slate-500 h-4 w-4"
                      />
                      <span className="text-xs font-bold text-slate-700">Free</span>
                    </label>
                  </div>
                </div>

                {/* Set max uses limit */}
                <div className="pt-3 border-t border-slate-100">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!form.maxUsesPerOrder}
                      onChange={(e) => setForm(prev => ({ ...prev, maxUsesPerOrder: e.target.checked ? 1 : undefined }))}
                      className="text-slate-900 focus:ring-slate-500 rounded-sm h-4 w-4 mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Set a maximum number of uses per order</span>
                      {!!form.maxUsesPerOrder && (
                        <input
                          type="number"
                          min="1"
                          value={form.maxUsesPerOrder}
                          onChange={(e) => setForm(prev => ({ ...prev, maxUsesPerOrder: Number(e.target.value) }))}
                          className="mt-2 max-w-[120px] border border-slate-200 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-slate-500 focus:outline-none"
                        />
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {discountType === 'Free shipping' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900">Countries</h2>
              
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="countriesType"
                    checked={form.countriesType === 'All countries'}
                    onChange={() => setForm(prev => ({ ...prev, countriesType: 'All countries' }))}
                    className="text-slate-900 focus:ring-slate-500 h-4 w-4"
                  />
                  <span className="text-xs font-bold text-slate-700">All countries</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="countriesType"
                    checked={form.countriesType === 'Selected countries'}
                    onChange={() => setForm(prev => ({ ...prev, countriesType: 'Selected countries' }))}
                    className="text-slate-900 focus:ring-slate-500 h-4 w-4"
                  />
                  <span className="text-xs font-bold text-slate-700">Selected countries</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 mb-2.5">Shipping rates</h3>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.excludeShippingRatesOverAmount || false}
                    onChange={(e) => setForm(prev => ({ ...prev, excludeShippingRatesOverAmount: e.target.checked }))}
                    className="text-slate-900 focus:ring-slate-500 rounded-sm h-4 w-4 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Exclude shipping rates over a certain amount</span>
                    {form.excludeShippingRatesOverAmount && (
                      <div className="mt-2 max-w-xs relative">
                        <input
                          type="number"
                          min="0"
                          value={form.excludeShippingRatesAmount !== undefined ? form.excludeShippingRatesAmount : ''}
                          onChange={(e) => setForm(prev => ({ ...prev, excludeShippingRatesAmount: Number(e.target.value) }))}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-slate-500 focus:outline-none pr-8"
                        />
                        <span className="absolute right-3 top-2 text-xs text-slate-500 font-bold">£</span>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          )}

          {discountType === 'Loyalty Reward' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
                  Loyalty Reward Configuration
                </h2>
                <span className="text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  VIP Club Reward
                </span>
              </div>

              {/* 1. Select Discount Type inside Loyalty Reward */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">1. Select Loyalty Reward Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: 'B1G1', label: 'Buy 1 Get 1 (B1G1)', desc: 'Free can on next purchase', icon: Tag },
                    { value: 'Percentage Off', label: 'Percentage Off (%)', desc: 'Direct discount on products/order', icon: Percent },
                    { value: 'Reward Points', label: 'Reward Points (★)', desc: 'Award points to customer wallet', icon: Star }
                  ].map((rewardItem) => {
                    const isSelected = (form.loyaltyRewardType || 'Percentage Off') === rewardItem.value;
                    const IconComp = rewardItem.icon;
                    return (
                      <button
                        type="button"
                        key={rewardItem.value}
                        onClick={() => {
                          setForm(prev => ({ 
                            ...prev, 
                            loyaltyRewardType: rewardItem.value as any,
                            loyaltyRewardValue: rewardItem.value === 'Percentage Off' ? '15' : (rewardItem.value === 'Reward Points' ? '100' : 'Free Can')
                          }));
                        }}
                        className={`p-3 text-left border rounded-xl transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                          isSelected 
                            ? 'bg-amber-50/40 border-amber-300 ring-2 ring-amber-100' 
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`p-1.5 rounded-lg ${isSelected ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                            <IconComp className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-[11px] font-black text-slate-900">{rewardItem.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">{rewardItem.desc}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Reward Value Input */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Reward Value Description / Amount</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.loyaltyRewardValue || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, loyaltyRewardValue: e.target.value }))}
                      placeholder={
                        form.loyaltyRewardType === 'Percentage Off' 
                          ? 'e.g. 15 (stands for 15% discount)' 
                          : form.loyaltyRewardType === 'Reward Points' 
                            ? 'e.g. 200 (stands for 200 loyalty star points)' 
                            : 'e.g. Buy 1 Get 1 Free Can'
                      }
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-bold focus:ring-1 focus:ring-slate-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {form.loyaltyRewardType}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Select Customers */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <label className="block text-xs font-bold text-slate-700">2. Customer Scope</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="loyaltyCustomerSelection"
                      checked={(form.loyaltyCustomerSelection || 'All customers') === 'All customers'}
                      onChange={() => setForm(prev => ({ ...prev, loyaltyCustomerSelection: 'All customers', loyaltyCustomerEmails: [] }))}
                      className="text-slate-900 focus:ring-slate-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-slate-700">All Customers</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="loyaltyCustomerSelection"
                      checked={form.loyaltyCustomerSelection === 'Specific customers'}
                      onChange={() => setForm(prev => ({ ...prev, loyaltyCustomerSelection: 'Specific customers', loyaltyCustomerEmails: [] }))}
                      className="text-slate-900 focus:ring-slate-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-slate-700">Specific Customers Selection</span>
                  </label>
                </div>

                {form.loyaltyCustomerSelection === 'Specific customers' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search customers by name or email..."
                        value={loyaltyCustomerSearch}
                        onChange={(e) => setLoyaltyCustomerSearch(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 pl-9 text-xs focus:ring-1 focus:ring-slate-500 focus:outline-none bg-white"
                      />
                    </div>

                    <div className="max-h-44 overflow-y-auto border border-slate-200/60 rounded-lg divide-y divide-slate-100 bg-white">
                      {(customers || []).length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">No customers found in database</div>
                      ) : (
                        (customers || [])
                          .filter(c => c.name.toLowerCase().includes(loyaltyCustomerSearch.toLowerCase()) || c.email.toLowerCase().includes(loyaltyCustomerSearch.toLowerCase()))
                          .map(c => {
                            const emails = form.loyaltyCustomerEmails || [];
                            const isSelected = emails.includes(c.email);
                            return (
                              <label key={c.id} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 cursor-pointer text-xs font-medium">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    const updated = isSelected 
                                      ? emails.filter(e => e !== c.email)
                                      : [...emails, c.email];
                                    setForm(prev => ({ ...prev, loyaltyCustomerEmails: updated }));
                                  }}
                                  className="text-slate-900 focus:ring-slate-500 rounded-sm h-4.5 w-4.5"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-slate-950 truncate">{c.name}</p>
                                  <p className="text-[10px] text-slate-500 truncate">{c.email}</p>
                                </div>
                                <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded text-slate-600 shrink-0">
                                  {c.ordersCount || 0} orders
                                </span>
                              </label>
                            );
                          })
                      )}
                    </div>
                    <p className="text-[10px] text-slate-450 font-medium">
                      Selected: <strong className="text-slate-900 font-extrabold">{form.loyaltyCustomerEmails?.length || 0}</strong> customer(s)
                    </p>
                  </div>
                )}
              </div>

              {/* 3. Select Products */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <label className="block text-xs font-bold text-slate-700">3. Product Eligibility</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="loyaltyProductSelection"
                      checked={(form.loyaltyProductSelection || 'All products') === 'All products'}
                      onChange={() => setForm(prev => ({ ...prev, loyaltyProductSelection: 'All products', loyaltyProductIds: [] }))}
                      className="text-slate-900 focus:ring-slate-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-slate-700">All Products</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="loyaltyProductSelection"
                      checked={form.loyaltyProductSelection === 'Specific products'}
                      onChange={() => setForm(prev => ({ ...prev, loyaltyProductSelection: 'Specific products', loyaltyProductIds: [] }))}
                      className="text-slate-900 focus:ring-slate-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-slate-700">Specific Products Selection</span>
                  </label>
                </div>

                {form.loyaltyProductSelection === 'Specific products' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search products by name..."
                        value={loyaltyProductSearch}
                        onChange={(e) => setLoyaltyProductSearch(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 pl-9 text-xs focus:ring-1 focus:ring-slate-500 focus:outline-none bg-white"
                      />
                    </div>

                    <div className="max-h-44 overflow-y-auto border border-slate-200/60 rounded-lg divide-y divide-slate-100 bg-white">
                      {(products || []).length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">No products found in database</div>
                      ) : (
                        (products || [])
                          .filter(p => p.title.toLowerCase().includes(loyaltyProductSearch.toLowerCase()))
                          .map(p => {
                            const ids = form.loyaltyProductIds || [];
                            const isSelected = ids.includes(p.id);
                            return (
                              <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 cursor-pointer text-xs font-medium">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    const updated = isSelected 
                                      ? ids.filter(id => id !== p.id)
                                      : [...ids, p.id];
                                    setForm(prev => ({ ...prev, loyaltyProductIds: updated }));
                                  }}
                                  className="text-slate-900 focus:ring-slate-500 rounded-sm h-4.5 w-4.5"
                                />
                                {p.image && (
                                  <img src={p.image} alt="" className="w-8 h-8 rounded border object-cover bg-slate-50 shrink-0" referrerPolicy="no-referrer" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-slate-950 truncate">{p.title}</p>
                                  <p className="text-[10px] text-slate-500">Inventory: {p.inventory || 0} in stock</p>
                                </div>
                                <span className="text-xs font-black text-slate-900 shrink-0">
                                  £{p.price?.toFixed(2)}
                                </span>
                              </label>
                            );
                          })
                      )}
                    </div>
                    <p className="text-[10px] text-slate-450 font-medium">
                      Selected: <strong className="text-slate-900 font-extrabold">{form.loyaltyProductIds?.length || 0}</strong> product(s)
                    </p>
                  </div>
                )}
              </div>

              {/* 4. Select Collections */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <label className="block text-xs font-bold text-slate-700">4. Collection Scope</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="loyaltyCollectionSelection"
                      checked={(form.loyaltyCollectionSelection || 'All collections') === 'All collections'}
                      onChange={() => setForm(prev => ({ ...prev, loyaltyCollectionSelection: 'All collections', loyaltyCollectionIds: [] }))}
                      className="text-slate-900 focus:ring-slate-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-slate-700">All Collections</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="loyaltyCollectionSelection"
                      checked={form.loyaltyCollectionSelection === 'Specific collections'}
                      onChange={() => setForm(prev => ({ ...prev, loyaltyCollectionSelection: 'Specific collections', loyaltyCollectionIds: [] }))}
                      className="text-slate-900 focus:ring-slate-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-slate-700">Specific Collections Selection</span>
                  </label>
                </div>

                {form.loyaltyCollectionSelection === 'Specific collections' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search collections by name..."
                        value={loyaltyCollectionSearch}
                        onChange={(e) => setLoyaltyCollectionSearch(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 pl-9 text-xs focus:ring-1 focus:ring-slate-500 focus:outline-none bg-white"
                      />
                    </div>

                    <div className="max-h-44 overflow-y-auto border border-slate-200/60 rounded-lg divide-y divide-slate-100 bg-white">
                      {(collections || []).length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">No collections found in database</div>
                      ) : (
                        (collections || [])
                          .filter(col => col.title.toLowerCase().includes(loyaltyCollectionSearch.toLowerCase()))
                          .map(col => {
                            const ids = form.loyaltyCollectionIds || [];
                            const isSelected = ids.includes(col.id);
                            return (
                              <label key={col.id} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 cursor-pointer text-xs font-medium">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    const updated = isSelected 
                                      ? ids.filter(id => id !== col.id)
                                      : [...ids, col.id];
                                    setForm(prev => ({ ...prev, loyaltyCollectionIds: updated }));
                                  }}
                                  className="text-slate-900 focus:ring-slate-500 rounded-sm h-4.5 w-4.5"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-slate-950 truncate">{col.title}</p>
                                  <p className="text-[10px] text-slate-500">{col.productIds?.length || 0} products</p>
                                </div>
                              </label>
                            );
                          })
                      )}
                    </div>
                    <p className="text-[10px] text-slate-450 font-medium">
                      Selected: <strong className="text-slate-900 font-extrabold">{form.loyaltyCollectionIds?.length || 0}</strong> collection(s)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900">Eligibility</h2>
            
            <div className="space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="eligibility"
                  checked={form.eligibility === 'All customers'}
                  onChange={() => setForm(prev => ({ ...prev, eligibility: 'All customers' }))}
                  className="text-slate-900 focus:ring-slate-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-700">All customers</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="eligibility"
                  checked={form.eligibility === 'Specific customer segments'}
                  onChange={() => setForm(prev => ({ ...prev, eligibility: 'Specific customer segments' }))}
                  className="text-slate-900 focus:ring-slate-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-700">Specific customer segments</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="eligibility"
                  checked={form.eligibility === 'Specific customers'}
                  onChange={() => setForm(prev => ({ ...prev, eligibility: 'Specific customers' }))}
                  className="text-slate-900 focus:ring-slate-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-700">Specific customers</span>
              </label>
            </div>
          </div>

          {/* 4. Minimum purchase requirements panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900">Minimum purchase requirements</h2>
            
            <div className="space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="minRequirementsType"
                  checked={form.minRequirementsType === 'No minimum requirements'}
                  onChange={() => setForm(prev => ({ ...prev, minRequirementsType: 'No minimum requirements', minRequirementsValue: 0 }))}
                  className="text-slate-900 focus:ring-slate-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-700">No minimum requirements</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="minRequirementsType"
                  checked={form.minRequirementsType === 'Minimum purchase amount ($)'}
                  onChange={() => setForm(prev => ({ ...prev, minRequirementsType: 'Minimum purchase amount ($)', minRequirementsValue: 10 }))}
                  className="text-slate-900 focus:ring-slate-500 h-4 w-4 mt-0.5"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-700 block">Minimum purchase amount (£)</span>
                  {form.minRequirementsType === 'Minimum purchase amount ($)' && (
                    <div className="mt-2 max-w-xs relative">
                      <input
                        type="number"
                        min="0"
                        value={form.minRequirementsValue !== undefined ? form.minRequirementsValue : ''}
                        onChange={(e) => setForm(prev => ({ ...prev, minRequirementsValue: Number(e.target.value) }))}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-slate-500 focus:outline-none pr-8"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-500 font-bold">£</span>
                    </div>
                  )}
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="minRequirementsType"
                  checked={form.minRequirementsType === 'Minimum quantity of items'}
                  onChange={() => setForm(prev => ({ ...prev, minRequirementsType: 'Minimum quantity of items', minRequirementsValue: 1 }))}
                  className="text-slate-900 focus:ring-slate-500 h-4 w-4 mt-0.5"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-700 block">Minimum quantity of items</span>
                  {form.minRequirementsType === 'Minimum quantity of items' && (
                    <div className="mt-2 max-w-xs">
                      <input
                        type="number"
                        min="1"
                        value={form.minRequirementsValue !== undefined ? form.minRequirementsValue : ''}
                        onChange={(e) => setForm(prev => ({ ...prev, minRequirementsValue: Number(e.target.value) }))}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-slate-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* 5. Maximum usage limits panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900">Maximum discount uses</h2>
            
            <div className="space-y-4">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.limitTotalUses || false}
                  onChange={(e) => setForm(prev => ({ ...prev, limitTotalUses: e.target.checked }))}
                  className="text-slate-900 focus:ring-slate-500 rounded-sm h-4 w-4 mt-0.5"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-700 block">Limit number of times this discount can be used in total</span>
                  {form.limitTotalUses && (
                    <div className="mt-2 max-w-xs">
                      <input
                        type="number"
                        min="1"
                        value={form.limitTotalUsesCount !== undefined ? form.limitTotalUsesCount : ''}
                        onChange={(e) => setForm(prev => ({ ...prev, limitTotalUsesCount: Number(e.target.value) }))}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-slate-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.limitOnePerCustomer || false}
                  onChange={(e) => setForm(prev => ({ ...prev, limitOnePerCustomer: e.target.checked }))}
                  className="text-slate-900 focus:ring-slate-500 rounded-sm h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-700">Limit to one use per customer</span>
              </label>
            </div>
          </div>

          {/* 6. Combinations panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900">Combinations</h2>
            <p className="text-[11px] text-slate-450">Select which discount classes this discount can combine with.</p>

            <div className="space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.combineWithProductDiscounts || false}
                  onChange={(e) => setForm(prev => ({ ...prev, combineWithProductDiscounts: e.target.checked }))}
                  className="text-slate-900 focus:ring-slate-500 rounded-sm h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-700">Product discounts</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.combineWithOrderDiscounts || false}
                  onChange={(e) => setForm(prev => ({ ...prev, combineWithOrderDiscounts: e.target.checked }))}
                  className="text-slate-900 focus:ring-slate-500 rounded-sm h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-700">Order discounts</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.combineWithShippingDiscounts || false}
                  onChange={(e) => setForm(prev => ({ ...prev, combineWithShippingDiscounts: e.target.checked }))}
                  className="text-slate-900 focus:ring-slate-500 rounded-sm h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-700">Shipping discounts</span>
              </label>
            </div>
          </div>

          {/* 7. Active dates panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900">Active dates</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Start date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={form.startDate || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 pl-9 text-xs font-bold focus:ring-1 focus:ring-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Start time (EDT)</label>
                <input
                  type="text"
                  value={form.startTime || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, startTime: e.target.value }))}
                  placeholder="e.g. 12:00 AM"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-bold focus:ring-1 focus:ring-slate-500 focus:outline-none"
                />
              </div>
            </div>

            {/* End Date option */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasEndDate || false}
                  onChange={(e) => setForm(prev => ({ ...prev, hasEndDate: e.target.checked }))}
                  className="text-slate-900 focus:ring-slate-500 rounded-sm h-4 w-4 mt-0.5"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-700 block">Set end date</span>
                  
                  {form.hasEndDate && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">End date</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="date"
                            value={form.endDate || ''}
                            onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                            className="w-full border border-slate-200 rounded-lg p-2.5 pl-9 text-xs font-bold focus:ring-1 focus:ring-slate-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">End time (EDT)</label>
                        <input
                          type="text"
                          value={form.endTime || ''}
                          onChange={(e) => setForm(prev => ({ ...prev, endTime: e.target.value }))}
                          placeholder="e.g. 11:59 PM"
                          className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-bold focus:ring-1 focus:ring-slate-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* Right Column Summary Panels */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Summary Details Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 sticky top-24">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Summary</h3>
              <p className="text-sm font-extrabold text-slate-900 mt-1">
                {form.title ? form.title : 'No discount code yet'}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 font-bold text-[10px] rounded-md uppercase tracking-wider">
                Code
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest text-[10px]">Type</h4>
                <p className="text-xs font-semibold text-slate-600 mt-0.5 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-slate-400" />
                  {discountType}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest text-[10px] mb-1.5">Details</h4>
                <ul className="space-y-1.5">
                  {summaryBullets.map((bullet, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="text-slate-300 select-none mt-0.5">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sales channel access card in right summary column */}
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest text-[10px] mb-2">Sales channel access</h4>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allowOnSelectedChannels || false}
                  onChange={(e) => setForm(prev => ({ ...prev, allowOnSelectedChannels: e.target.checked }))}
                  className="text-slate-900 focus:ring-slate-500 rounded-sm h-4 w-4"
                />
                <span className="text-xs text-slate-600">Allow discount to be featured on selected channels</span>
              </label>
            </div>

            {/* Tags card inside right summary column */}
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest text-[10px] mb-2">Tags</h4>
              
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Add tags"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-2.5 bg-slate-100 border border-slate-250 hover:bg-slate-200 font-bold text-xs rounded-lg transition"
                >
                  Add
                </button>
              </div>

              {form.tags && form.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="p-0.5 hover:bg-indigo-100 rounded text-indigo-400 hover:text-indigo-600"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions inside Right column summary */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer"
              >
                Save
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* --- BROWSING PICKER DIALOG POPUP MODAL (HIGH FIDELITY) --- */}
      {pickerConfig.isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-150 flex justify-between items-center bg-slate-50">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Select {pickerConfig.mode === 'products' ? 'Products' : 'Collections'}
              </h3>
              <button 
                type="button"
                onClick={() => setPickerConfig(prev => ({ ...prev, isOpen: false }))}
                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search filter input */}
            <div className="p-3 border-b border-slate-100 relative">
              <Search className="absolute left-6 top-5.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={`Filter ${pickerConfig.mode}...`}
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                className="w-full border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-slate-500 focus:outline-none bg-slate-50/50"
              />
            </div>

            {/* List entries with checklist */}
            <div className="overflow-y-auto p-2 divide-y divide-slate-100 flex-1 min-h-[250px]">
              {pickerConfig.mode === 'products' ? (
                products
                  .filter(p => p.title.toLowerCase().includes(pickerSearch.toLowerCase()))
                  .map(p => {
                    const isChecked = pickerConfig.selectedIds.includes(p.id);
                    return (
                      <label 
                        key={p.id} 
                        className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleIdInPicker(p.id)}
                          className="h-4 w-4 text-slate-900 focus:ring-slate-500 rounded border-slate-300"
                        />
                        {p.image && (
                          <img 
                            src={p.image} 
                            alt={p.title} 
                            referrerPolicy="no-referrer"
                            className="h-9 w-9 object-cover rounded border bg-slate-100 shrink-0" 
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 truncate">{p.title}</p>
                          <p className="text-slate-500 font-medium">£{p.price.toFixed(2)}</p>
                        </div>
                      </label>
                    );
                  })
              ) : (
                collections
                  .filter(c => c.title.toLowerCase().includes(pickerSearch.toLowerCase()))
                  .map(c => {
                    const isChecked = pickerConfig.selectedIds.includes(c.id);
                    return (
                      <label 
                        key={c.id} 
                        className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleIdInPicker(c.id)}
                          className="h-4 w-4 text-slate-900 focus:ring-slate-500 rounded border-slate-300"
                        />
                        {c.image && (
                          <img 
                            src={c.image} 
                            alt={c.title} 
                            referrerPolicy="no-referrer"
                            className="h-9 w-9 object-cover rounded border bg-slate-100 shrink-0" 
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 truncate">{c.title}</p>
                          <p className="text-slate-500 font-medium">{c.productIds?.length || 0} products included</p>
                        </div>
                      </label>
                    );
                  })
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-slate-150 bg-slate-50 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setPickerConfig(prev => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-250 rounded-lg hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={savePickerSelection}
                className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
