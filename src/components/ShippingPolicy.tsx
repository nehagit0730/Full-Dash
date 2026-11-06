import React, { useState } from 'react';
import { Truck, Clock, ShieldCheck, Mail, MapPin, AlertCircle, HelpCircle, Package, ArrowRight, Clipboard, ChevronRight } from 'lucide-react';

interface ShippingPolicyProps {
  onNavigate: (tab: string) => void;
}

export default function ShippingPolicy({ onNavigate }: ShippingPolicyProps) {
  const [activeTab, setActiveTab] = useState<number>(1);

  const shippingSteps = [
    {
      id: 1,
      title: '1. Overview',
      icon: Truck,
      content: (
        <div className="space-y-4">
          <p className="text-slate-650 leading-relaxed text-sm sm:text-base font-medium">
            At <strong className="text-slate-900 font-extrabold">Pouch Supply</strong>, we are committed to delivering your orders quickly, safely, and reliably. This Shipping Policy outlines how we process, ship, and deliver your premium canisters.
          </p>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-indigo-850">
            <Clipboard className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold leading-relaxed">
              We focus on discrete, highly insulated packaging that keeps your compounding nicotine canisters in clinical room temperatures during freight.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: '2. Order Processing',
      icon: Clock,
      content: (
        <div className="space-y-3">
          <p className="text-slate-650 leading-relaxed text-sm">
            Our distribution depots operate with precise schedule constraints to ensure prompt dispatches:
          </p>
          <div className="space-y-2.5">
            {[
              { label: 'Processing Window', text: 'All orders are processed within 1–2 business days (excluding weekends and regional holidays).' },
              { label: 'Security Handshake', text: 'Orders are only processed after successful payment authentication and age verification checks are cleared.' },
              { label: 'Automatic Tracking Notification', text: 'Once your order is handed over to the courier, you will receive a confirmation email with real-time tracking details.' }
            ].map((step, idx) => (
              <div key={idx} className="flex gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl items-start">
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-mono">{idx + 1}</span>
                <p className="text-xs text-slate-600 leading-normal font-medium">
                  <strong className="text-slate-900 font-bold block">{step.label}</strong> {step.text}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 italic pt-2">
            * Please note: During periods of extremely high demand or holiday constraints, processing times may be slightly extended.
          </p>
        </div>
      )
    },
    {
      id: 3,
      title: '3. Shipping Methods & Times',
      icon: Package,
      content: (
        <div className="space-y-4">
          <p className="text-slate-650 leading-relaxed text-sm">
            We provide multiple shipping tiers tailored to your logistical requirements:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-slate-150 rounded-2xl p-4 bg-white space-y-2 hover:border-indigo-150 transition-colors shadow-xs">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#4F46E5] bg-indigo-50/70 border border-indigo-100 px-2 py-0.5 rounded-md inline-block">ECO NOMINAL</span>
              <h4 className="text-base font-black text-slate-800 leading-none">Standard Shipping</h4>
              <p className="text-2xl font-black text-slate-900 leading-none">3–7 <span className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Business Days</span></p>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">Eco-friendly dispatch via national mail networks. Safe, reliable, and cost-efficient.</p>
            </div>

            <div className="border border-indigo-200 rounded-2xl p-4 bg-gradient-to-tr from-indigo-500/5 to-indigo-650/5 border-dashed space-y-2 hover:border-indigo-400 transition-colors shadow-xs">
              <span className="text-[10px] uppercase font-black tracking-widest text-white bg-indigo-600 px-2 py-0.5 rounded-md inline-block">ROYAL MAIL TRACKED</span>
              <h4 className="text-base font-black text-slate-800 leading-none">Royal Mail Tracked 24 / 48</h4>
              <p className="text-2xl font-black text-slate-900 leading-none">1–3 <span className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Business Days</span></p>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">Official Royal Mail Tracked service with end-to-end tracking and SMS/Email delivery updates.</p>
            </div>
          </div>
          <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 flex gap-2.5 text-amber-900">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] font-semibold leading-relaxed text-amber-800">
              Note: Delivery times are estimations and may occasionally vary due to courier routing delays, extreme atmospheric weather conditions, or customs/local regulatory restrictions.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: '4. Shipping Charges',
      icon: Clipboard,
      content: (
        <div className="space-y-3">
          <p className="text-slate-655 text-xs sm:text-sm leading-relaxed">
            Shipping charges are computed dynamically at the checkout stage, considering the physical properties of your cargo and precise geographic location:
          </p>
          <ul className="space-y-2 text-xs text-slate-600 font-semibold pl-1">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-indigo-505 rounded-full" />
              <span>Your exact delivery destination address</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-indigo-505 rounded-full" />
              <span>The selected shipping carrier tier (Royal Mail Tracked 24/48)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-indigo-505 rounded-full" />
              <span>Bulk canister weight or volumetric constraints</span>
            </li>
          </ul>
          <p className="text-xs text-slate-550 leading-relaxed font-semibold bg-slate-50 p-3 rounded-lg border border-dashed">
            All applicable shipping costs, including taxes and special handling surcharges of active canister boxes, are clearly disclosed in the order manifest before you commit payment.
          </p>
        </div>
      )
    },
    {
      id: 5,
      title: '5. Delivery Address Duty',
      icon: MapPin,
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 leading-relaxed text-sm">
            Customers hold the primary responsibility to supply accurate, current, and complete delivery coordinates:
          </p>
          <div className="border border-slate-150 rounded-2xl p-4 bg-[#FAF9F5] space-y-2 text-xs font-semibold text-slate-650">
            <p className="text-slate-800 font-extrabold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <span className="h-1.5 w-1.5 bg-rose-500 rounded-full inline-block" />
              Exclusion of Liability Parameters
            </p>
            <p className="leading-relaxed">We cannot accept liability or provide cash refunds for delays caused by incorrect street addresses, invalid postal indices, or failed handovers resulting from incomplete delivery details.</p>
            <p className="leading-relaxed text-indigo-650 pt-1 border-t">If an order package is returned to our dispatch terminal due to incomplete/incorrect addresses, additional postage fees will be assessed to trigger a re-delivery.</p>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: '6. Age Verification on Delivery',
      icon: ShieldCheck,
      content: (
        <div className="space-y-4">
          <div className="bg-rose-50 border border-rose-200/60 p-4.5 rounded-2xl flex gap-3 text-rose-850">
            <ShieldCheck className="h-6 w-6 text-rose-650 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="block font-black text-xs uppercase tracking-wider text-rose-900">Mandatory Adult Handover</span>
              <p className="text-xs font-semibold leading-relaxed text-rose-800">
                Because our functional white pouches contain chemical nicotine compounds, valid adult age proof is mandatory upon package reception.
              </p>
            </div>
          </div>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
            Our couriers are legally instructed to request standard government-issued photo ID (driving license or passport) validating that the recipient is <strong className="text-slate-900">18 years or older</strong>. Packaging will not under any scenario be released to minors. Failed verification returns are subject to restocking fees.
          </p>
        </div>
      )
    },
    {
      id: 7,
      title: '7. Uncollected Packages',
      icon: AlertCircle,
      content: (
        <div className="space-y-3">
          <p className="text-slate-650 text-xs sm:text-sm leading-relaxed">
            In the event that the courier is unable to deliver your package, they will issue instructions to arrange a re-delivery or flag a local collection point.
          </p>
          <p className="text-slate-600 text-xs leading-relaxed font-medium bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] p-3 rounded-lg">
            If the package goes uncollected within the courier’s standard storage timeline (typically 10-14 days) and is returned to our central warehouse, original shipping costs and return shipment fees will be deducted from your final refund order balance.
          </p>
        </div>
      )
    },
    {
      id: 8,
      title: '8. Shipment Tracking',
      icon: Package,
      content: (
        <div className="space-y-3">
          <p className="text-slate-650 text-xs sm:text-sm leading-relaxed">
            We operate fully traceable logistics. The moment your box of canisters leaves our high-security dispatch bay, we broadcast a priority email with your personal courier tracking link.
          </p>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            * Please allow up to 24 hours from dispatch for the courier's electronic system to synchronize and update scanning checkpoints.
          </p>
        </div>
      )
    },
    {
      id: 9,
      title: '9. Lost or Delayed Shipments',
      icon: HelpCircle,
      content: (
        <div className="space-y-3">
          <p className="text-slate-655 text-xs sm:text-sm leading-relaxed">
            In cases where your shipment is severely gridlocked or tracking exhibits no progress:
          </p>
          <div className="p-4 bg-slate-50 border rounded-2xl border-dashed space-y-2.5">
            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400 inline-block" />
              Contact us immediately with your unique order number
            </p>
            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400 inline-block" />
              We will raise a transit investigation file with the courier team
            </p>
            <p className="text-xs font-semibold text-slate-705">
              Although we are legally exempt from delays triggered by independent third-party carriers, we pride ourselves on exceptional support and will exhaust all pathways to retrieve or replace lost canisters.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 10,
      title: '10. International Transit',
      icon: MapPin,
      content: (
        <div className="space-y-3">
          <p className="text-slate-650 text-xs sm:text-sm leading-relaxed">
            We service shipments to selected overseas jurisdictions subject to regional nicotine import regulations:
          </p>
          <ul className="space-y-2 text-[11px] text-slate-550 pl-2 list-disc font-medium">
            <li>Overseas transit times vary significantly depending on flight routes and processing structures.</li>
            <li>Import customs duties, regional excise taxes, and local declaration fees are the absolute responsibility of the client.</li>
            <li>We recommend evaluating your native border rules before committing to high-tier imports.</li>
          </ul>
        </div>
      )
    },
    {
      id: 11,
      title: '11. Support Contact Desk',
      icon: Mail,
      content: (
        <div className="p-5 bg-indigo-950 text-white rounded-2xl space-y-4">
          <div>
            <span className="block text-[10px] font-black uppercase text-indigo-300 tracking-widest mb-1">Direct Courier Inquiries</span>
            <h4 className="text-lg font-black text-white leading-none">Pouch Supply Dispatch Helpdesk</h4>
          </div>

          <p className="text-indigo-200 text-xs leading-relaxed font-medium">
            Our dispatch managers maintain direct communications with DPD, DHL and regional carrier depots to fast-track package issues.
          </p>
          
          <div className="text-xs font-bold text-indigo-300">
            Email: <a href="mailto:support@pouchsupply.com" className="underline hover:text-white font-mono">support@pouchsupply.com</a>
          </div>

          <div className="pt-2 border-t border-indigo-900 flex gap-2">
            <button
              onClick={() => onNavigate('contact')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2.5 rounded-xl transition cursor-pointer uppercase tracking-wider"
            >
              Raise Dispatch Ticket
            </button>
            <button
              onClick={() => onNavigate('frontend-shop')}
              className="bg-white/10 hover:bg-white/15 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              Shop Pouches
            </button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-10 font-sans text-slate-800 animate-fade-in animate-duration-300">
      
      {/* Decorative top micro layout row */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600" />

      {/* Header Area */}
      <div className="bg-slate-900 text-white py-8 px-4 border-b border-slate-800 relative overflow-hidden">
        {/* Background ambient accents */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-12 bottom-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-4 relative z-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/25 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-400">
            <Truck className="h-3 w-3 text-emerald-400 animate-bounce" />
            <span>Fast, Discreet, & Secure Handover</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white leading-tight">
            Shipping & Dispatch Policy
          </h1>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-slate-400 text-xs sm:text-sm font-medium pt-1">
            <span className="flex items-center gap-1.5 justify-center">
              <Clock className="h-4 w-4 text-slate-500" />
              Effective Date: <strong className="text-white">June 20, 2026</strong>
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="flex items-center gap-1.5 justify-center">
              <Package className="h-4 w-4 text-slate-500" />
              Logistics Standard: <strong className="text-white">Aero-Insured</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Sticky Anchor Navigation for desktop */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 space-y-4 hidden lg:block">
            <div className="p-4 border border-slate-150 rounded-2xl bg-[#FAF9F5] space-y-3 shadow-xs">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-450 block border-b pb-2">Shipping Outline</span>
              
              <div className="space-y-1">
                {shippingSteps.map((sec) => {
                  const IconComponent = sec.icon;
                  const isActive = activeTab === sec.id;
                  return (
                    <a
                      key={sec.id}
                      href={`#shipping-section-${sec.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab(sec.id);
                        const el = document.getElementById(`shipping-section-${sec.id}`);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                      className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-extrabold uppercase transition-all duration-300 ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm translate-x-1'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <IconComponent className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{sec.title}</span>
                    </a>
                  );
                })}
              </div>

              <div className="pt-2 border-t text-center">
                <button
                  onClick={() => onNavigate('frontend-shop')}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-wider py-2.5 rounded-xl cursor-pointer transition shadow-xs flex items-center justify-center gap-1.5"
                >
                  Return to Canisters <ArrowRight className="h-3 w-3 animate-pulse" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Detailed Sections Panel */}
          <div className="col-span-1 lg:col-span-8 space-y-8">
            
            {/* Quick Summary card box */}
            <div className="border border-emerald-150 rounded-[22px] bg-emerald-500/5 p-5 sm:p-6 space-y-3 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100/60 py-0.5 px-2.5 rounded-full inline-block">EXECUTIVE GUARANTEE</span>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Fast, Discreet, & Reliable delivery</h3>
              <p className="text-slate-655 text-xs sm:text-sm font-medium leading-relaxed">
                All Pouch Supply orders are compiled in plain, unbranded double-walled cardboard packaging to guarantee absolute delivery discretion. No commercial logos, warnings, or brand marks are marked on outer layers, ensuring your privacy remains protected during absolute transit.
              </p>
            </div>

            {/* Individual detailed shipping policies */}
            <div className="space-y-6">
              {shippingSteps.map((sec) => {
                const IconComponent = sec.icon;
                const isActive = activeTab === sec.id;
                return (
                  <section
                    key={sec.id}
                    id={`shipping-section-${sec.id}`}
                    onMouseEnter={() => setActiveTab(sec.id)}
                    className={`border rounded-2xl md:rounded-[24px] bg-white p-5 sm:p-6 md:p-8 space-y-4 transition-all duration-300 ${
                      isActive 
                        ? 'border-emerald-200 outline-none ring-1 ring-emerald-200/50 shadow-md' 
                        : 'border-slate-150 hover:border-slate-205 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <span className={`p-2 rounded-xl border shrink-0 transition-colors ${
                        isActive 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-650' 
                          : 'bg-slate-50 border-slate-100 text-slate-450'
                      }`}>
                        <IconComponent className="h-5 w-5" />
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-slate-800 uppercase tracking-tight font-sans">
                        {sec.title}
                      </h3>
                    </div>

                    <div className="pt-1">
                      {sec.content}
                    </div>
                  </section>
                );
              })}
            </div>

            {/* Bottom Support Call to Action Box */}
            <div className="bg-[#FAF9F5] border border-slate-205 rounded-[22px] p-6 text-center space-y-4">
              <div className="max-w-md mx-auto space-y-1">
                <span className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Awaiting a package currently?</span>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  We render dynamic tracking synchronization. If a package seems stuck, do not hesitate to alert our dispatch agents.
                </p>
              </div>
              <button
                onClick={() => onNavigate('contact')}
                className="bg-emerald-650 hover:bg-emerald-750 text-white font-black text-xs uppercase px-6 py-3 rounded-xl transition cursor-pointer shadow-sm tracking-wider"
              >
                Track Delayed Package
              </button>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
