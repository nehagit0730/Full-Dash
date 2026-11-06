import React, { useState } from 'react';
import { FileText, UserCheck, ShieldAlert, BadgeCheck, DollarSign, Eye, Truck, RefreshCw, Lock, AlertTriangle, Shield, RefreshCcw, Mail, ArrowRight, BookOpen, Clock } from 'lucide-react';

interface TermsConditionsProps {
  onNavigate: (tab: string) => void;
}

export default function TermsConditions({ onNavigate }: TermsConditionsProps) {
  const [activeTab, setActiveTab] = useState<number>(1);

  const termChapters = [
    {
      id: 1,
      title: '1. General',
      icon: BookOpen,
      content: (
        <div className="space-y-4">
          <p className="text-slate-650 leading-relaxed text-sm sm:text-base font-medium">
            Welcome to <strong className="text-slate-900 font-extrabold">Pouch Supply</strong>. By accessing, browsing, or utilizing this website, you explicitly consent to comply with and be bound by the following Terms & Conditions. These comprehensive terms govern all transactions, orders, and interactions executed through our platform.
          </p>
          <div className="bg-[#FAF9F5] border border-slate-150 p-4 rounded-xl text-xs font-semibold leading-relaxed text-slate-650">
            By issuing payments and finalizing checkouts on this store, you confirm that you have read, understood, and accepted these Terms, as well as our concurrent processing of personal information documented inside our <span onClick={() => onNavigate('privacy-policy')} className="text-indigo-600 underline cursor-pointer hover:text-indigo-800">Privacy Policy</span>.
          </div>
          <p className="text-xs text-slate-500 font-medium">
            We reserve the absolute right to renew, adjust, or completely overhaul these terms at discretionary intervals. Any updates take effect immediately upon their publication on this page.
          </p>
        </div>
      )
    },
    {
      id: 2,
      title: '2. Eligibility Mandate',
      icon: UserCheck,
      content: (
        <div className="space-y-4">
          <div className="bg-rose-50 border border-rose-200/60 p-4.5 rounded-2xl flex gap-3 text-rose-850">
            <ShieldAlert className="h-5 w-5 text-rose-650 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="block font-black text-xs uppercase tracking-wider text-rose-900">Adult Material Lock</span>
              <p className="text-xs font-semibold leading-relaxed text-rose-800 animate-pulse">
                All nicotine-bearing white pouches featured on our platform are strictly restricted to mature individuals aged 18 years or older.
              </p>
            </div>
          </div>
          
          <div className="space-y-2 text-slate-650 text-xs sm:text-sm font-medium leading-relaxed">
            <p>By browsing this store or committing purchases, you solemnly certify and declare that:</p>
            <ul className="space-y-1.5 pl-4 list-disc text-xs text-slate-550 font-sans">
              <li>You are chronologically at least 18 years of age.</li>
              <li>You are legally authorized to purchase, import, and hold nicotine products inside your native sovereign territory.</li>
            </ul>
            <p className="text-xs text-slate-500 pt-1">
              We maintain active rights to reject service, void accounts, purge transaction requests, or restrict specific IP segments instantly if we suspect age eligibility fields were falsified.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: '3. Orders & Agreement',
      icon: BadgeCheck,
      content: (
        <div className="space-y-3">
          <p className="text-slate-650 text-xs sm:text-sm leading-relaxed">
            Upon submitting checkout variables, you will automatically receive an automated order receipt email.
          </p>
          <div className="p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs font-semibold text-slate-600 leading-relaxed">
            <p className="text-slate-800 font-extrabold uppercase text-[10px] tracking-wider mb-1">Contractual Formation Threshold</p>
            This initial communication confirms reception of order variables only and is not a guarantee of transaction acceptance. A formal binding sales agreement is established strictly when the parcel passes inspection at our docks and is officially <strong className="text-slate-950">dispatched to the shipping carrier</strong>.
          </div>
          <p className="text-slate-650 text-xs leading-relaxed font-semibold">
            We retain absolute rights to refuse service, limit product volumes, or cancel transactions suspected of commercial resale, bulk redistribution, or platform misuse.
          </p>
        </div>
      )
    },
    {
      id: 4,
      title: '4. Products & Responsible Use',
      icon: AlertTriangle,
      content: (
        <div className="space-y-3">
          <p className="text-slate-650 text-xs sm:text-sm leading-relaxed">
            Each of our compounded canisters or pouch series is designed and stocked strictly for personal adult lifestyle use.
          </p>
          
          <div className="border border-amber-250 bg-amber-500/5 rounded-xl p-4 text-amber-900 text-xs leading-relaxed space-y-1.5 font-sans font-semibold">
            <p className="font-black text-[10px] tracking-wider uppercase text-amber-950">Severe Hazard Declaration</p>
            <p>Our products contain chemical nicotine compounds — which represent highly addictive and habit-forming substances. Under no circumstances should these items be processed by minors, pregnant women, or individuals displaying cardiovascular sensitivities.</p>
            <p>Users must consult manufacturer dilution parameters and display absolute personal responsibility when managing pouch dosages.</p>
          </div>

          <p className="text-xs text-slate-450 italic pt-1">
            * Pouch Supply rejects any operational or systemic liability for health effects, bodily impact, or misuse caused by improper compound placement.
          </p>
        </div>
      )
    },
    {
      id: 5,
      title: '5. Pricing & Payments',
      icon: DollarSign,
      content: (
        <div className="space-y-4">
          <p className="text-slate-650 text-xs sm:text-sm leading-relaxed">
            All prices declared on the storefront reflect direct formulation laboratory rates and include regional VAT/tax matrices where legally mandatory:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[
              { t: 'Dynamic Charge Adjustments', d: 'We reserve full rights to adjust container prices at any point to mirror international supplier costs.' },
              { t: 'Excluding Shipping Tariffs', d: 'Dispatch fees are calculated at checkout and presented clearly inside your terminal order manifest.' },
              { t: 'Clerical Price Glitches', d: 'In the event of database errors, we maintain full rights to void purchases transacted at incorrect rates.' },
              { t: 'Secured Gateways Only', d: 'All payments must be completed via our certified, tokenized SSL processing systems before packing begins.' }
            ].map((rule, idx) => (
              <div key={idx} className="p-3 bg-[#FAF9F6] border rounded-xl space-y-0.5">
                <span className="block text-xs font-bold text-slate-800 uppercase tracking-tight">{rule.t}</span>
                <span className="block text-[11px] text-slate-500 font-medium leading-relaxed">{rule.d}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: '6. Age Verification Checks',
      icon: Shield,
      content: (
        <div className="space-y-3">
          <p className="text-slate-650 text-xs sm:text-sm leading-relaxed">
            By locking in checkout options, you authorize our platform to execute compliance verification sweeps:
          </p>
          <div className="p-4 border border-dashed rounded-xl space-y-2 text-xs font-semibold text-slate-605">
            <p>1. We utilize privacy-compliant background screening suites or direct photo ID handshakes to verify that you are at least 18 years of age.</p>
            <p>2. If verification is returned with discrepancies, we will hold package dispatch, request manual ledger uploads, and cancel the transaction if compliance is not acquired within 7 days.</p>
            <p className="text-rose-650 font-bold border-t pt-1.5">Falsifying your birth index or presenting forged documents is a punishable statutory offense and may result in immediate security reports to consumer protection registries.</p>
          </div>
        </div>
      )
    },
    {
      id: 7,
      title: '7. Delivery Parameters',
      icon: Truck,
      content: (
        <div className="space-y-3">
          <p className="text-slate-650 text-xs sm:text-sm leading-relaxed">
            We operate in concert with priority courier services to dispatch your canisters securely. Please observe the following operational rules:
          </p>
          <ul className="space-y-1.5 text-xs text-slate-600 pl-4 list-disc font-medium font-sans">
            <li>Dispatch estimations represent calendar guidelines and are not contractual guarantees.</li>
            <li>We cannot assume logistical liabilities for delayed routes caused by courier company malfunctions or border clearance backlogs.</li>
            <li>Loss or delivery errors resulting from inaccurate postal entries entered at check-out remain the customer’s financial responsibility.</li>
          </ul>
        </div>
      )
    },
    {
      id: 8,
      title: '8. Consumable Returns',
      icon: RefreshCw,
      content: (
        <div className="space-y-3">
          <p className="text-slate-650 text-sm leading-relaxed">
            Due to strict sterile and hygiene regulations, returns for consumable white compound pouches are heavily restricted:
          </p>
          <p className="text-xs text-slate-500 font-semibold bg-slate-50 p-3 rounded-lg border">
            We only authorize returns or refunds if canisters arrived damaged, or if the courier misdelivered order components. All items must remain unopened next to original seals. Review our holistic <span onClick={() => onNavigate('refund-policy')} className="text-indigo-650 underline cursor-pointer hover:text-indigo-800 font-bold">Refund Policy</span> for complete instructions.
          </p>
        </div>
      )
    },
    {
      id: 9,
      title: '9. Account Protection Responsibility',
      icon: Lock,
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-650 leading-relaxed font-semibold">
          <p>
            If you create an active registration account on Pouch Supply:
          </p>
          <ul className="space-y-1 pl-4 list-disc text-xs text-slate-550 font-medium font-sans">
            <li>You accept sole responsibility for shielding your passcode, email links, and transaction tokens from third parties.</li>
            <li>You ensure that all address data, billing indicators, and phone numbers are kept current.</li>
            <li>Our support platform is exempt from any financial or data loss resulting from unauthorized logins or password leakages.</li>
          </ul>
        </div>
      )
    },
    {
      id: 10,
      title: '10. Limitation of Liability',
      icon: ShieldAlert,
      content: (
        <div className="space-y-3">
          <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 space-y-4">
            <h4 className="text-xs font-black uppercase text-[#F43F5E] tracking-widest flex items-center gap-1.5 font-mono">
              <span className="h-2 w-2 bg-[#F43F5E] rounded-full inline-block animate-ping" />
              CONSTITUTIONAL LIABILITY EXCLUSION
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-semibold font-sans">
              To the complete boundaries authorized by applicable regional laws, Pouch Supply and its dispatch agents shall not under any situation be liable for any indirect, incidental, punitive, or consecutive health damages, metabolic reactions, or losses arising from the purchase, delivery, or processing of chemical nicotine pouches. Consumables are handled at the sole risk and discretion of the adult consumer.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 11,
      title: '11. Privacy Integration',
      icon: Eye,
      content: (
        <div className="space-y-4">
          <p className="text-slate-650 text-xs sm:text-sm leading-relaxed">
            All user registration details, financial checkout data, and browsing cookies are processed strictly as outlined within our active privacy disclosures.
          </p>
          <button
            onClick={() => onNavigate('privacy-policy')}
            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
          >
            Review our active Privacy Policy <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )
    },
    {
      id: 12,
      title: '12. Continuous Terms Tuning',
      icon: RefreshCw,
      content: (
        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
          We preserve rights to calibrate or adjust any aspect of these Terms & Conditions without direct prior broadcasts. Your continuous interaction with the Pouch Supply platform following changes asserts your binding acceptance of renewed conditions.
        </p>
      )
    },
    {
      id: 13,
      title: '13. Regulatory Compliance Contact',
      icon: Mail,
      content: (
        <div className="p-5 bg-[#FAF9F5] border border-slate-155 rounded-2xl space-y-3.5">
          <div>
            <span className="block text-[10px] font-black uppercase text-indigo-600 tracking-wider mb-1">Contractual Registry Division</span>
            <h4 className="text-base font-black text-slate-900 leading-none font-sans">Pouch Supply Compliance Desk</h4>
          </div>

          <p className="text-xs text-slate-500 font-medium leading-normal">
            For structured queries mapping these Terms, commercial limitations, or statutory certifications, route communication packets to:
          </p>
          
          <div className="text-xs font-bold text-indigo-700">
            Email: <a href="mailto:support@pouchsupply.com" className="underline font-mono">support@pouchsupply.com</a>
          </div>

          <div className="pt-2 border-t border-slate-150 flex gap-2">
            <button
              onClick={() => onNavigate('contact')}
              className="bg-indigo-650 hover:bg-indigo-750 text-white font-black text-xs uppercase px-4 py-2 rounded-xl transition cursor-pointer tracking-wider"
            >
              Access Contact Desk
            </button>
            <button
              onClick={() => onNavigate('frontend-shop')}
              className="bg-white hover:bg-slate-50 border border-slate-205 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
            >
              Browse Shop
            </button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-10 font-sans text-slate-800 animate-fade-in animate-duration-300">
      
      {/* Decorative top micro layout row */}
      <div className="h-1 bg-gradient-to-r from-teal-500 via-indigo-605 to-pink-500" />

      {/* Header Area */}
      <div className="bg-slate-900 text-white py-8 px-4 border-b border-slate-800 relative overflow-hidden">
        {/* Background ambient accents */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-550/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-12 bottom-0 w-64 h-64 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-4 relative z-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 bg-slate-850 border border-white/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-indigo-400">
            <FileText className="h-3 w-3 text-indigo-400" />
            <span>Statutory Purchasing Covenant</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white leading-tight">
            Terms & Conditions Agreement
          </h1>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-slate-400 text-xs sm:text-sm font-medium pt-1">
            <span className="flex items-center gap-1.5 justify-center">
              <Clock className="h-4 w-4 text-slate-500" />
              Effective Date: <strong className="text-white">June 20, 2026</strong>
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="flex items-center gap-1.5 justify-center">
              <Lock className="h-4 w-4 text-slate-500" />
              Access Classification: <strong className="text-white">Public Standard</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Sticky Anchor Navigation for desktop */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 space-y-4 hidden lg:block">
            <div className="p-4 border border-slate-150 rounded-2xl bg-[#FAF9F5] space-y-3 shadow-xs font-sans">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-450 block border-b pb-2">Agreement Chapters</span>
              
              <div className="space-y-1">
                {termChapters.map((sec) => {
                  const IconComponent = sec.icon;
                  const isActive = activeTab === sec.id;
                  return (
                    <a
                      key={sec.id}
                      href={`#terms-section-${sec.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab(sec.id);
                        const el = document.getElementById(`terms-section-${sec.id}`);
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
                  Shop White Pouches <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Detailed Sections Panel */}
          <div className="col-span-1 lg:col-span-8 space-y-8">
            
            {/* Quick Warning box */}
            <div className="border border-red-200 rounded-[22px] bg-red-500/5 p-5 sm:p-6 space-y-3 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#E11D48] bg-rose-100 py-0.5 px-2.5 rounded-full inline-block">ADULT WARNING LABEL</span>
              <p className="text-[#9F1239] text-xs sm:text-sm font-extrabold uppercase tracking-tight leading-normal">
                "This website is intended for adults aged 18+. Nicotine is an addictive substance."
              </p>
              <p className="text-slate-655 text-xs font-medium leading-relaxed">
                By entering or processing transactional parameters, you represent and declare to Pouch Supply that you correspond to legal consuming ages within your state, city, or county borders. False declaration is a breach of agreement covenants.
              </p>
            </div>

            {/* Individual detailed terms segments */}
            <div className="space-y-6">
              {termChapters.map((sec) => {
                const IconComponent = sec.icon;
                const isActive = activeTab === sec.id;
                return (
                  <section
                    key={sec.id}
                    id={`terms-section-${sec.id}`}
                    onMouseEnter={() => setActiveTab(sec.id)}
                    className={`border rounded-2xl md:rounded-[24px] bg-white p-5 sm:p-6 md:p-8 space-y-4 transition-all duration-300 ${
                      isActive 
                        ? 'border-indigo-200 outline-none ring-1 ring-indigo-200/50 shadow-md' 
                        : 'border-slate-150 hover:border-slate-205 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <span className={`p-2 rounded-xl border shrink-0 transition-colors ${
                        isActive 
                          ? 'bg-indigo-50 border-indigo-100 text-indigo-650' 
                          : 'bg-slate-50 border-slate-100 text-slate-450'
                      }`}>
                        <IconComponent className="h-5 w-5" />
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-slate-800 uppercase tracking-tight font-sans">
                        {sec.title}
                      </h3>
                    </div>

                    <div className="pt-1 font-sans">
                      {sec.content}
                    </div>
                  </section>
                );
              })}
            </div>

            {/* Bottom Support Call to Action Box */}
            <div className="bg-[#FAF9F5] border border-slate-205 rounded-[22px] p-6 text-center space-y-4">
              <div className="max-w-md mx-auto space-y-1">
                <span className="text-lg sm:text-xl font-bold text-slate-900 leading-tight block">Required further terms clarification?</span>
                <p className="text-xs sm:text-sm text-slate-500 font-medium font-sans">
                  Our regulatory compliance desk maintains full availability to clarify operational mandates. Contact our legal auditors directly.
                </p>
              </div>
              <button
                onClick={() => onNavigate('contact')}
                className="bg-indigo-650 hover:bg-indigo-750 text-white font-black text-xs uppercase px-6 py-3 rounded-xl transition cursor-pointer shadow-sm tracking-wider"
              >
                Inquire Compliance Desk
              </button>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
