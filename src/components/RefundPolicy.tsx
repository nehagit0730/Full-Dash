import React, { useState } from 'react';
import { RefreshCw, Clipboard, CheckCircle2, AlertTriangle, ShieldCheck, Mail, ShieldAlert, ArrowRight, Ban, FileText, Clock } from 'lucide-react';

interface RefundPolicyProps {
  onNavigate: (tab: string) => void;
}

export default function RefundPolicy({ onNavigate }: RefundPolicyProps) {
  const [activeTab, setActiveTab] = useState<number>(1);

  const policySections = [
    {
      id: 1,
      title: '1. Overview',
      icon: RefreshCw,
      content: (
        <div className="space-y-4">
          <p className="text-slate-650 leading-relaxed text-sm sm:text-base font-medium">
            At <strong className="text-slate-900 font-extrabold">Pouch Supply</strong>, we aim to provide premium, laboratory-certified products and a professional shopping experience. Due to the regulated nature of our products, specific conditions apply strictly to returns and refunds.
          </p>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-indigo-850">
            <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold leading-relaxed">
              By completing and checking out an order on our website, you consciously agree to all terms and conditions set forth under this Refund Policy.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: '2. Returns Eligibility',
      icon: ShieldCheck,
      content: (
        <div className="space-y-4">
          <p className="text-slate-650 leading-relaxed text-sm">
            Because nicotine chemical pouches are consumable personal goods, we maintain high sanitation standards and accept returns only under the following explicit conditions:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { type: 'Wrong Canisters Received', details: 'The logistics courier dispatched items mismatched with your purchased receipt.' },
              { type: 'Damage or defect upon arrival', details: 'The hermetic canister seal was broken, or packaging arrived crushed.' },
              { type: 'Logistical Missing Items', details: 'Items are missing from your sealed carton packet delivery.' }
            ].map((p, idx) => (
              <div key={idx} className="p-4 border rounded-xl bg-[#FAF9F6] space-y-1 hover:border-indigo-150 transition-colors">
                <span className="block text-[10px] font-black uppercase text-indigo-600 tracking-wider">CRITERIA {idx + 1}</span>
                <span className="block text-xs font-bold text-[#0F172A]">{p.type}</span>
                <span className="block text-[11px] text-slate-500 font-medium leading-relaxed">{p.details}</span>
              </div>
            ))}
          </div>

          <div className="border border-slate-150 rounded-xl p-4 space-y-2 bg-slate-50 text-xs font-bold text-slate-650">
            <span className="block text-[10px] uppercase font-black tracking-widest text-[#1E293B] border-b pb-1">Essential Compliance Thresholds</span>
            <ul className="space-y-1 list-disc pl-4 text-[11px] text-slate-500 font-semibold font-sans">
              <li>The canister must be strictly unused, unopened, and maintain original manufacturer hermetic shrink-wraps.</li>
              <li>The original shipping delivery packaging boxes must remain fully intact.</li>
              <li>You must raise a formal support email within <strong className="text-slate-800 font-extrabold">48 hours of postal courier delivery</strong>. We cannot accept claims beyond this chronological window.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: '3. Non-Returnable Items',
      icon: Ban,
      content: (
        <div className="space-y-3">
          <div className="bg-rose-50 border border-rose-200/60 p-4.5 rounded-2xl flex gap-3 text-rose-850">
            <ShieldAlert className="h-5 w-5 text-rose-650 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="block font-black text-xs uppercase tracking-wider text-rose-900">Zero-Tolerance Hygiene Exceptions</span>
              <p className="text-xs font-semibold leading-relaxed text-rose-800">
                To guarantee safety and absolute sterility for our entire consumer network, we strictly refuse returns, replacements, or refunds for the following elements:
              </p>
            </div>
          </div>
          <div className="space-y-1.5 pl-1.5">
            {[
              { t: 'Opened or Used Canisters', d: 'Any item where the tamper seals have been cut or manipulated.' },
              { t: 'Post-Checkout Change of Mind', d: 'Once the transaction is validated and canisters transit, orders are locked.' },
              { t: 'Customer Ordering Faults', d: 'Mispurchasing incorrect strengths, flavor sheets, or brand formulations.' },
              { t: 'Uncertified Safe returns', d: 'Packages shipped back to warehouses without our explicit consent tickets.' }
            ].map((exc, idx) => (
              <div key={idx} className="flex gap-2.5 items-start text-xs font-semibold">
                <span className="text-rose-500 mt-0.5 font-bold">•</span>
                <p className="text-slate-600">
                  <strong className="text-slate-900 font-extrabold">{exc.t}:</strong> {exc.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: '4. Refund Process',
      icon: Clipboard,
      content: (
        <div className="space-y-3">
          <p className="text-slate-650 text-xs sm:text-sm leading-relaxed">
            Upon receipt and certification audit of your returned canisters at our testing bays, we process credits in accordance with standard bank timelines:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div className="p-4 bg-slate-50 border rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600 block">Bank Gateway processing</span>
              <span className="text-base font-black text-slate-900 leading-none block">5–10 Business Days</span>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Credits are immediately wire-refunded back to the original funding card. Speed relies entirely on your banking merchant guidelines.</p>
            </div>
            
            <div className="p-4 bg-slate-50 border rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#4F46E5] block">Internal Alternative Schemes</span>
              <span className="text-base font-black text-slate-900 leading-none block">Express Credit / Exchange</span>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">At your request, we can issue an instant digital Store Credit or dispatch a factory compound replacement parcel directly.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: '5. Damaged or Mismatched Orders',
      icon: AlertTriangle,
      content: (
        <div className="space-y-3">
          <p className="text-slate-605 text-xs sm:text-sm leading-relaxed font-semibold">
            In the rare event of a factory packaging defect or shipping destruction, initiate a claim with our managers using the checklist below:
          </p>
          <div className="p-4 bg-[#FAF9F5] rounded-xl space-y-3 border border-slate-150">
            <div className="flex gap-2.5 items-start">
              <span className="p-1 rounded-lg bg-indigo-100 text-indigo-700 text-[10px] font-black h-5 w-5 flex items-center justify-center font-mono">1</span>
              <div>
                <span className="block text-xs font-bold text-slate-800 uppercase tracking-tight">Your Original Order ID</span>
                <span className="block text-[11px] text-slate-500 font-medium font-sans">For tracking order transaction logs.</span>
              </div>
            </div>
            <div className="flex gap-2.5 items-start">
              <span className="p-1 rounded-lg bg-indigo-100 text-indigo-700 text-[10px] font-black h-5 w-5 flex items-center justify-center font-mono">2</span>
              <div>
                <span className="block text-xs font-bold text-slate-800 uppercase tracking-tight">High-Definition Photographic Proof</span>
                <span className="block text-[11px] text-slate-500 font-medium font-sans">Clear images capturing the damaged hermetic seals, outer parcel markings, and compounding canisters.</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-450 italic">
            * Our compliance managers will review submission packets as a priority to secure rapid approvals.
          </p>
        </div>
      )
    },
    {
      id: 6,
      title: '6. Order Cancellations',
      icon: Clock,
      content: (
        <div className="space-y-3">
          <p className="text-slate-650 text-xs sm:text-sm leading-relaxed">
            Our logistics center operates on near real-time pipelines to achieve immediate freight deadlines. Order cancellation parameters are restricted:
          </p>
          <div className="bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] p-4 rounded-xl text-xs font-semibold space-y-1.5 leading-relaxed">
            <p className="font-extrabold uppercase text-[10px] tracking-wider text-amber-900">Immediate Lock Sequence</p>
            <p>Orders can only be cancelled or updated if they have not yet entered processing or transit.</p>
            <p>Once a package receives a system shipping courier label, the cargo cannot be intercepted or cancelled. In these conditions, customers must receive the package securely and explore returns compatibility afterward.</p>
          </div>
        </div>
      )
    },
    {
      id: 7,
      title: '7. Shipping Cost Policies',
      icon: FileText,
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-650 leading-relaxed font-semibold">
          <p>
            Excepting scenarios where we acknowledge terminal shipping errors on behalf of our logistics crew:
          </p>
          <ul className="space-y-1.5 pl-4 list-disc text-xs text-slate-550 font-medium font-sans">
            <li>Primary and priority shipping costs paid to delivery courier services are entirely non-refundable.</li>
            <li>The consumer holds responsibility for financing return shipping courier charges back to our depot.</li>
            <li>We strongly advise utilizing a tracked standard postal mail service for return transits, as our desk cannot issue approvals for return letters lost in standard shipping lanes.</li>
          </ul>
        </div>
      )
    },
    {
      id: 8,
      title: '8. Refused or Uncollected Parcels',
      icon: ShieldAlert,
      content: (
        <div className="space-y-3">
          <p className="text-slate-650 text-xs sm:text-sm leading-relaxed">
            If you choose to reject parcel transit upon door delivery or fail to collect packages deposited at local regional lockers:
          </p>
          <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100 text-xs font-semibold text-rose-900 leading-relaxed space-y-1">
            <span className="block font-black text-[10px] tracking-wider uppercase text-rose-900">Restocking Deductions Applied</span>
            <p className="text-rose-800">Upon system return check-in of a rejected box, original shipping fees and the specific round-trip courier processing tariffs charged to Pouch Supply will be calculated and subtracted from your final order refund balance.</p>
          </div>
        </div>
      )
    },
    {
      id: 9,
      title: '9. Contact Support Desk',
      icon: Mail,
      content: (
        <div className="p-5 bg-gradient-to-tr from-slate-900 to-indigo-950 text-white rounded-2xl space-y-4">
          <div>
            <span className="block text-[10px] font-black uppercase text-indigo-300 tracking-widest mb-1">Direct Claims Inbound</span>
            <h4 className="text-lg font-black text-white leading-none">Pouch Supply Audits Desk</h4>
          </div>

          <p className="text-indigo-200 text-xs leading-relaxed font-semibold">
            Our dispatch audit crew handles product resolution logs with complete transparency. For rapid processing, specify your email order receipt ID.
          </p>
          
          <div className="text-xs font-mono text-indigo-300 font-bold">
            Email: <a href="mailto:support@pouchsupply.com" className="underline hover:text-white">support@pouchsupply.com</a>
          </div>

          <div className="pt-2 border-t border-indigo-900 flex gap-2">
            <button
              onClick={() => onNavigate('contact')}
              className="bg-indigo-605 hover:bg-indigo-705 text-white font-black text-xs px-4 py-2.5 rounded-xl transition cursor-pointer uppercase tracking-wider"
            >
              Contact Support
            </button>
            <button
              onClick={() => onNavigate('frontend-shop')}
              className="bg-white/10 hover:bg-white/15 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
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
      <div className="h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-650" />

      {/* Header Area */}
      <div className="bg-slate-900 text-white py-8 px-4 border-b border-slate-800 relative overflow-hidden">
        {/* Background ambient accents */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-pink-505/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-12 bottom-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-4 relative z-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 bg-pink-500/20 border border-pink-400/25 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-pink-400">
            <RefreshCw className="h-3 w-3 text-pink-400" />
            <span>Guaranteed Product Quality Audit</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white leading-tight">
            Exchange & Refund Policy
          </h1>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-slate-400 text-xs sm:text-sm font-medium pt-1">
            <span className="flex items-center gap-1.5 justify-center">
              <Clock className="h-4 w-4 text-slate-500" />
              Effective Date: <strong className="text-white">June 20, 2026</strong>
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="flex items-center gap-1.5 justify-center">
              <ShieldCheck className="h-4 w-4 text-slate-500" />
              Restocking Safeguard: <strong className="text-white">Secure Auditing</strong>
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
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-450 block border-b pb-2">Refund Sections</span>
              
              <div className="space-y-1">
                {policySections.map((sec) => {
                  const IconComponent = sec.icon;
                  const isActive = activeTab === sec.id;
                  return (
                    <a
                      key={sec.id}
                      href={`#refund-section-${sec.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab(sec.id);
                        const el = document.getElementById(`refund-section-${sec.id}`);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                      className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-extrabold uppercase transition-all duration-300 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm translate-x-1'
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
                  Return to Canisters <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Detailed Sections Panel */}
          <div className="col-span-1 lg:col-span-8 space-y-8">
            
            {/* Quick Summary card box */}
            <div className="border border-pink-150 rounded-[22px] bg-pink-500/5 p-5 sm:p-6 space-y-3 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-widest text-pink-700 bg-pink-100/60 py-0.5 px-2.5 rounded-full inline-block">HYGIENE SECURITY OUTLINE</span>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Highly Regulated Consumables</h3>
              <p className="text-slate-655 text-xs sm:text-sm font-medium leading-relaxed">
                Nicotine compounds represent highly sterile laboratory formulations. Consequently, once a tamper-resistant outer seal is cracked, opened, or altered by a customer, sanitization integrity is terminated, and we are legally forbidden from introducing the compound back to active inventory lists. We enforce these criteria precisely to protect our entire client community.
              </p>
            </div>

            {/* Individual detailed refund policy cards */}
            <div className="space-y-6">
              {policySections.map((sec) => {
                const IconComponent = sec.icon;
                const isActive = activeTab === sec.id;
                return (
                  <section
                    key={sec.id}
                    id={`refund-section-${sec.id}`}
                    onMouseEnter={() => setActiveTab(sec.id)}
                    className={`border rounded-2xl md:rounded-[24px] bg-white p-5 sm:p-6 md:p-8 space-y-4 transition-all duration-300 ${
                      isActive 
                        ? 'border-pink-200 outline-none ring-1 ring-pink-200/50 shadow-md' 
                        : 'border-slate-150 hover:border-slate-205 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <span className={`p-2 rounded-xl border shrink-0 transition-colors ${
                        isActive 
                          ? 'bg-rose-50 border-rose-100 text-rose-650' 
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
                <span className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Mismatched or Missing Order?</span>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  We maintain swift response records. If your packet arrived with incorrect canister varieties, reach out with photos immediately.
                </p>
              </div>
              <button
                onClick={() => onNavigate('contact')}
                className="bg-indigo-650 hover:bg-indigo-750 text-white font-black text-xs uppercase px-6 py-3 rounded-xl transition cursor-pointer shadow-sm tracking-wider font-semibold"
              >
                Launch Audit Request
              </button>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
