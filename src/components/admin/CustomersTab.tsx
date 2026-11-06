import React, { useState } from 'react';
import { Search, Download, Upload, Plus, Eye, User, Mail, MapPin, Package, ShoppingBag, X, Check, ArrowRight, RefreshCw, AlertTriangle, Trash2 } from 'lucide-react';
import { Order, Product } from '../../types';
import { extractSubscriptionDetails } from '../../utils/subscriptionParser';

interface CustomerItem {
  id: string;
  name: string;
  email: string;
  location: string;
  subscriptionStatus: 'Subscribed' | 'Not subscribed' | 'Unsubscribed' | 'Cancelled' | 'Subscription Cancelled';
  ordersCount: number;
  amountSpent: number;
}

interface CustomersTabProps {
  customerQuery: string;
  setCustomerQuery: (val: string) => void;
  handleExportCustomers: () => void;
  handleImportCustomers: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setShowAddCustomer: (val: boolean) => void;
  filteredCustomers: CustomerItem[];
  showAddCustomer: boolean;
  handleAddCustomerSubmit: (e: React.FormEvent) => void;
  newCustomerForm: { name: string; email: string; location: string; subscriptionStatus: 'Subscribed' | 'Not subscribed' | 'Unsubscribed' };
  setNewCustomerForm: React.Dispatch<React.SetStateAction<{ name: string; email: string; location: string; subscriptionStatus: 'Subscribed' | 'Not subscribed' | 'Unsubscribed' }>>;
  onDeleteCustomer: (customer: CustomerItem) => void;
  orders?: Order[];
  /** Live catalogue, used to show each box item under its exact product name. */
  products?: Product[];
}

export const CustomersTab: React.FC<CustomersTabProps> = ({
  customerQuery,
  setCustomerQuery,
  handleExportCustomers,
  handleImportCustomers,
  setShowAddCustomer,
  filteredCustomers,
  showAddCustomer,
  handleAddCustomerSubmit,
  newCustomerForm,
  setNewCustomerForm,
  onDeleteCustomer,
  orders = [],
  products = []
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);

  // Helper to check if an order is a subscription order
  const isSubOrder = (order: Order) => {
    if (order.isSubscription) return true;
    if (Array.isArray(order.tags) && order.tags.some(t => t.toLowerCase().includes('subscription'))) return true;
    if (Array.isArray(order.items) && order.items.some((i: any) => 
      i.isSubscription || 
      i.vendor === 'Subscription Pack' || 
      (i.productTitle && (i.productTitle.toLowerCase().includes('subscription') || i.productTitle.toLowerCase().includes('pack')))
    )) return true;
    return false;
  };

  // Helper to extract subscription metadata. The catalogue is passed in so each
  // box item is reported under its exact product title and chosen variant.
  const getSubscriptionDetails = (order: Order) => {
    return extractSubscriptionDetails(order, products as any);
  };

  // Check if customer's subscription was cancelled
  const isCustomerSubCancelled = (cust: CustomerItem) => {
    if (!cust) return false;
    if (cust.subscriptionStatus === 'Cancelled' || cust.subscriptionStatus === 'Subscription Cancelled') return true;
    const emailLower = (cust.email || '').toLowerCase();
    const nameLower = (cust.name || '').toLowerCase();
    const cOrders = orders.filter(o => 
      (o.customerEmail && o.customerEmail.toLowerCase() === emailLower) || 
      (o.customerName && o.customerName.toLowerCase() === nameLower)
    );
    const subOrders = cOrders.filter(isSubOrder);
    return subOrders.length > 0 && subOrders.every(o => o.subscriptionCancelled || (Array.isArray(o.tags) && o.tags.some((t: any) => typeof t === 'string' && t.toLowerCase().includes('subscription cancelled'))));
  };

  // Check if customer is subscribed from customer record or placed subscription orders
  const isCustomerSubscribed = (cust: CustomerItem) => {
    if (!cust) return false;
    if (isCustomerSubCancelled(cust)) return false;
    if (cust.subscriptionStatus === 'Subscribed') return true;
    const emailLower = (cust.email || '').toLowerCase();
    const nameLower = (cust.name || '').toLowerCase();
    const cOrders = orders.filter(o => 
      (o.customerEmail && o.customerEmail.toLowerCase() === emailLower) || 
      (o.customerName && o.customerName.toLowerCase() === nameLower)
    );
    return cOrders.some(o => isSubOrder(o) && !o.subscriptionCancelled && (!Array.isArray(o.tags) || !o.tags.some((t: any) => typeof t === 'string' && t.toLowerCase().includes('subscription cancelled'))));
  };

  // Get matching orders for selected customer
  const customerOrders = selectedCustomer 
    ? orders.filter(o => 
        (o.customerEmail && o.customerEmail.toLowerCase() === (selectedCustomer.email || '').toLowerCase()) || 
        (o.customerName && o.customerName.toLowerCase() === (selectedCustomer.name || '').toLowerCase())
      )
    : [];

  const isSelectedSubscribed = selectedCustomer ? isCustomerSubscribed(selectedCustomer) : false;
  const isSelectedSubCancelled = selectedCustomer ? isCustomerSubCancelled(selectedCustomer) : false;
  const selectedCustomerSubOrders = customerOrders.filter(isSubOrder);
  const latestSubOrder = selectedCustomerSubOrders[0] || null;

  return (
    <div className="space-y-6">
      
      {/* Header control toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Filter client files, names..."
            value={customerQuery}
            onChange={(e) => setCustomerQuery(e.target.value)}
            className="w-full text-xs p-2 pb-2 pl-8 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500 bg-slate-50"
          />
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCustomers}
            className="bg-white hover:bg-slate-50 border border-slate-200 font-bold p-2.5 px-3 rounded-xl text-xs text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="Export all customers to JSON backup file"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" /> Export Backup
          </button>

          <label
            className="bg-white hover:bg-slate-50 border border-slate-200 font-bold p-2.5 px-3 rounded-xl text-xs text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs cursor-pointer"
            title="Import customers from JSON backup"
          >
            <Upload className="h-3.5 w-3.5 text-slate-500" /> Import Backup
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportCustomers}
            />
          </label>

          <button
            onClick={() => setShowAddCustomer(true)}
            className="bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs p-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Register Customer Profile
          </button>
        </div>
      </div>

      {/* Customers details list */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] text-slate-450 font-bold uppercase tracking-widest">
                <th className="p-4">Customer Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Delivery Location</th>
                <th className="p-4 text-center">Subscription Status</th>
                <th className="p-4 text-center">Total Orders Count</th>
                <th className="p-4 text-right font-sans">Total Spent Amount</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">No Customers configured on store directory.</td>
                </tr>
              ) : (
                filteredCustomers.map(cust => (
                  <tr 
                    key={cust.id} 
                    onClick={() => setSelectedCustomer(cust)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-black text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                        {(cust.name || 'C').slice(0, 1).toUpperCase()}
                      </div>
                      <span>{cust.name || 'Unnamed Customer'}</span>
                    </td>
                    <td className="p-4 text-slate-500 font-medium">{cust.email || '—'}</td>
                    <td className="p-4 text-slate-700">{cust.location || 'United Kingdom'}</td>
                    <td className="p-4 text-center">
                      {isCustomerSubscribed(cust) ? (
                        <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full font-black text-[9.5px] uppercase tracking-wider bg-indigo-600 text-white shadow-2xs">
                          <RefreshCw className="w-2.5 h-2.5" /> Subscribed
                        </span>
                      ) : isCustomerSubCancelled(cust) ? (
                        <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full font-black text-[9.5px] uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                          <AlertTriangle className="w-2.5 h-2.5 text-rose-600" /> Plan Cancelled
                        </span>
                      ) : (
                        <span className="inline-block py-0.5 px-2 rounded-full font-bold text-[9px] uppercase tracking-wider bg-slate-100 text-slate-400">
                          Not Subscribed
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center font-bold text-slate-800">{cust.ordersCount || 0} orders</td>
                    <td className="p-4 text-right font-extrabold text-slate-950">£{(Number(cust.amountSpent) || 0).toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomer(cust);
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-1 px-2.5 rounded-lg text-[10.5px] inline-flex items-center gap-1 transition cursor-pointer"
                      >
                        <Eye className="h-3 w-3" /> View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden animate-scale my-8">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 sm:p-6 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg font-black text-amber-400 shrink-0">
                  {(selectedCustomer.name || 'C').slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">{selectedCustomer.name || 'Unnamed Customer'}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Mail className="h-3 w-3" /> {selectedCustomer.email || '—'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-lg cursor-pointer transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs font-sans text-slate-800">
              
              {/* Quick Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Orders</span>
                  <strong className="text-slate-900 text-sm font-black">{selectedCustomer.ordersCount || 0}</strong>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Spent</span>
                  <strong className="text-emerald-700 text-sm font-black">£{(Number(selectedCustomer.amountSpent) || 0).toFixed(2)}</strong>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Subscription</span>
                  {isSelectedSubscribed ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase py-0.5 px-2 rounded-full bg-emerald-100 text-emerald-800">
                      <RefreshCw className="w-2.5 h-2.5" /> Subscribed
                    </span>
                  ) : isSelectedSubCancelled ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase py-0.5 px-2 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                      <AlertTriangle className="w-2.5 h-2.5 text-rose-600" /> Cancelled
                    </span>
                  ) : (
                    <span className="inline-block text-[9px] font-black uppercase py-0.5 px-2 rounded-full bg-slate-200 text-slate-600">
                      Not Subscribed
                    </span>
                  )}
                </div>
                <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Location</span>
                  <strong className="text-slate-800 text-xs font-bold block truncate">{selectedCustomer.location || 'UK'}</strong>
                </div>
              </div>

              {/* CANCELLED SUBSCRIPTION DETAILS PANEL */}
              {isSelectedSubCancelled && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl space-y-2 text-left">
                  <div className="flex items-center gap-2 text-rose-800">
                    <AlertTriangle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
                    <span className="font-black text-xs uppercase tracking-wide">Subscription Plan Cancelled</span>
                    <span className="ml-auto text-[9px] bg-rose-600 text-white font-black px-2 py-0.5 rounded uppercase">Cancelled</span>
                  </div>
                  <p className="text-[11px] text-rose-700 font-medium">
                    This customer previously held a recurring subscription box plan and has since cancelled their renewals via the customer portal.
                  </p>
                </div>
              )}

              {/* ACTIVE SUBSCRIPTION DETAILS PANEL FOR SUBSCRIBED CUSTOMER */}
              {isSelectedSubscribed && (
                <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-lg border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30 text-indigo-400">
                        <RefreshCw className="w-4 h-4 animate-spin-slow" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-xs uppercase tracking-wider text-white">Active Subscription Box Profile</h4>
                          <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-md uppercase">Subscribed</span>
                        </div>
                        <p className="text-[11px] text-slate-400">Customer has an active recurring subscription delivery</p>
                      </div>
                    </div>
                  </div>

                  {latestSubOrder ? (() => {
                    const subDetails = getSubscriptionDetails(latestSubOrder);
                    return (
                      <div className="space-y-2.5 pt-1">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/80">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-300 block mb-0.5">Plan Name</span>
                            <strong className="text-white text-xs font-black">{subDetails.planName}</strong>
                          </div>
                          <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/80">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-300 block mb-0.5">Frequency</span>
                            <strong className="text-white text-xs font-black">{subDetails.frequency}</strong>
                            <span className="text-[9px] text-emerald-400 font-bold block">({subDetails.frequencyDiscount} OFF)</span>
                          </div>
                          <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/80">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-300 block mb-0.5">Payment Status</span>
                            <strong className="text-emerald-400 text-xs font-black">{subDetails.paymentStatus}</strong>
                          </div>
                          <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/80">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-300 block mb-0.5">Next Billing</span>
                            <strong className="text-amber-300 text-xs font-black">{subDetails.nextPaymentDate}</strong>
                          </div>
                        </div>

                        {/* Selected Box Products List with Variants */}
                        {subDetails.selectedProducts && subDetails.selectedProducts.length > 0 && (
                          <div className="bg-slate-800/95 border border-slate-700 rounded-xl p-3 text-left space-y-1.5 shadow-2xs">
                            <div className="text-[9.5px] font-black text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-indigo-400" />
                              Client Selected Box Products ({subDetails.selectedProducts.reduce((sum: number, p: any) => sum + (p.quantity || 1), 0)} Cans):
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                              {subDetails.selectedProducts.map((p: any, pIdx: number) => (
                                <div key={pIdx} className="flex justify-between items-center text-[10.5px] text-slate-200 bg-slate-900/90 border border-slate-700 px-2.5 py-1.5 rounded-lg">
                                  <div className="min-w-0 pr-1.5">
                                    <p className="font-extrabold text-white truncate leading-tight">{p.name}</p>
                                    {(p.variant || p.variantName) && (
                                      <p className="text-[9px] text-indigo-300 font-bold mt-0.5">
                                        Variant: <span className="text-amber-300 font-extrabold">{p.variant || p.variantName}</span>
                                      </p>
                                    )}
                                  </div>
                                  <span className="shrink-0 font-black text-amber-300 text-[10px] ml-1 bg-slate-800 border border-slate-650 px-2 py-0.5 rounded-md">
                                    × {p.quantity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })() : (
                    <p className="text-xs text-slate-300 font-medium">Customer profile marked as Subscribed.</p>
                  )}
                </div>
              )}

              {/* Order History Section */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center justify-between border-b border-slate-150 pb-2">
                  <span>Order History ({customerOrders.length})</span>
                </h4>

                {customerOrders.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-6 text-center text-slate-400">
                    <ShoppingBag className="h-6 w-6 mx-auto mb-2 text-slate-300" />
                    <p>No associated order records found for this customer email.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {customerOrders.map(ord => {
                      const isSub = isSubOrder(ord);
                      return (
                        <div 
                          key={ord.id} 
                          className={`rounded-xl p-3 border transition-colors ${
                            isSub ? 'bg-indigo-50/70 border-indigo-200 shadow-2xs' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-slate-900 text-xs">#{ord.id}</span>
                                {isSub && (
                                  <span className="inline-flex items-center gap-1 text-[8.5px] bg-indigo-600 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    <RefreshCw className="w-2.5 h-2.5" />
                                    Subscription Order ({getSubscriptionDetails(ord).planName})
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-400">{ord.date}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-0.5">
                                {ord.items ? `${ord.items.length} item(s)` : 'Order Items'} • Status: <strong className="text-slate-800">{ord.fulfillmentStatus}</strong>
                              </p>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-3">
                              <span className="font-black text-slate-900 text-xs">£{(Number(ord.total) || 0).toFixed(2)}</span>
                              <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                ord.fulfillmentStatus === 'Fulfilled' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {ord.fulfillmentStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Customer Actions */}
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => {
                    const confirmed = window.confirm(`Delete customer "${selectedCustomer.name || selectedCustomer.email}"? This cannot be undone.`);
                    if (!confirmed) return;
                    onDeleteCustomer(selectedCustomer);
                    setSelectedCustomer(null);
                  }}
                  className="mr-auto bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Customer
                </button>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer"
                >
                  Close Profile
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-sm w-full shadow-2xl animate-scale">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Register Custom Client Profile</h3>
              <button onClick={() => setShowAddCustomer(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer text-xs font-bold">Close</button>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 uppercase tracking-widest text-[9px] mb-1">Full Name</label>
                <input
                  id="cust-form-name"
                  type="text"
                  required
                  placeholder="e.g. Sandra Kaneshiro"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  className="w-full border p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 uppercase tracking-widest text-[9px] mb-1">Email Address</label>
                <input
                  id="cust-form-email"
                  type="email"
                  required
                  placeholder="e.g. sandra.k@gmail.com"
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                  className="w-full border p-2.5 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 uppercase tracking-widest text-[9px] mb-1">Delivery address country</label>
                <input
                  id="cust-form-loc"
                  type="text"
                  placeholder="e.g. Honolulu HI, United States"
                  value={newCustomerForm.location}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, location: e.target.value })}
                  className="w-full border p-2.5 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 uppercase tracking-widest text-[9px] mb-1">Subscription plan status</label>
                <select
                  id="cust-form-subs"
                  value={newCustomerForm.subscriptionStatus}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, subscriptionStatus: e.target.value as any })}
                  className="w-full border p-2.5 rounded-lg focus:outline-none"
                >
                  <option value="Subscribed">Subscribed (Active Plans)</option>
                  <option value="Not subscribed">Not subscribed</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg cursor-pointer"
              >
                Publish Client Record
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomersTab;
