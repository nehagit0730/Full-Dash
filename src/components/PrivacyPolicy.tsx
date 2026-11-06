import React, { useState } from 'react';
import { Shield, BookOpen, Clock, Mail, Lock, UserCheck, Eye, RefreshCw, AlertCircle, FileText, CheckCircle2, ArrowRight } from 'lucide-react';

interface PrivacyPolicyProps {
  onNavigate: (tab: string) => void;
}

export default function PrivacyPolicy({ onNavigate }: PrivacyPolicyProps) {
  const [activeSection, setActiveSection] = useState<number>(1);

  const sections = [
    {
      id: 1,
      title: '1. Introduction',
      icon: BookOpen,
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
            At <strong className="text-slate-900 font-extrabold">Pouch Supply</strong>, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you visit or make a purchase from our website.
          </p>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-indigo-850">
            <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold leading-relaxed">
              By using our website, you agree to the practices described in this policy. We ensure that our data handling methods correspond to national and European privacy compliance requirements.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: '2. Information We Collect',
      icon: Eye,
      content: (
        <div className="space-y-5">
          <p className="text-slate-600 leading-relaxed text-sm">
            When you use our website, we may collect several categories of information to improve your browsing experience and fulfill transactional parameters:
          </p>
          
          <div className="space-y-4">
            <div className="border border-slate-150 rounded-xl p-4 bg-[#FAF9F6]">
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider mb-2 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 bg-[#4F46E5] rounded-full inline-block"></span>
                Personal Information
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-605 font-medium pl-3 list-disc">
                <li>Full name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Billing and shipping address</li>
                <li>Payment details (processed securely via third-party providers)</li>
              </ul>
            </div>

            <div className="border border-slate-150 rounded-xl p-4 bg-[#FAF9F6]">
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider mb-2 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 bg-[#4F46E5] rounded-full inline-block"></span>
                Order Information
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-605 font-medium pl-3 list-disc">
                <li>Products purchased</li>
                <li>Order history</li>
                <li>Transaction details</li>
              </ul>
            </div>

            <div className="border border-slate-150 rounded-xl p-4 bg-[#FAF9F6]">
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider mb-2 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 bg-[#4F46E5] rounded-full inline-block"></span>
                Technical Information
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-605 font-medium pl-3 list-disc">
                <li>IP address</li>
                <li>Browser type and device information</li>
                <li>Pages visited and time spent on the website</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: '3. How We Use Your Information',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 leading-relaxed text-sm">
            We employ industry-standard logical pipelines to processes your dataset for the following explicit use-cases:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { t: 'Fulfill Orders', d: 'Process, package, and deliver your canisters safely.' },
              { t: 'Support', d: 'Provide state-of-the-art responses to customer issues.' },
              { t: 'Confirmations', d: 'Send transactional receipts and automatic shipping trackers.' },
              { t: 'Optimization', d: 'Regularly diagnostics of user-experience and storefront layout.' },
              { t: 'Anti-Fraud', d: 'Maintain continuous network monitor filters for transactions.' },
              { t: 'Legal Integrity', d: 'Retain specific logs required by corporate taxation rules.' }
            ].map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border rounded-xl hover:border-indigo-150 transition-colors">
                <span className="block text-xs font-black uppercase text-indigo-650 mb-0.5">{item.t}</span>
                <span className="block text-[11px] text-slate-500 font-medium leading-relaxed">{item.d}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 italic pt-2">
            * We may also use your email address to send promotional offers, but only if you have opted in. You can unsubscribe at any time.
          </p>
        </div>
      )
    },
    {
      id: 4,
      title: '4. Age Restriction',
      icon: UserCheck,
      content: (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200/60 p-4.5 rounded-2xl flex gap-3 text-amber-850">
            <AlertCircle className="h-5 w-5 text-amber-650 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="block font-black text-xs uppercase tracking-wider text-amber-900">Adult Verification Mandate</span>
              <p className="text-xs font-semibold leading-relaxed text-amber-800">
                Our website is intended only for individuals aged 18 years or older. Nicotine delivery white canisters represent restricted adult materials.
              </p>
            </div>
          </div>
          <p className="text-slate-605 text-xs sm:text-sm leading-relaxed font-medium">
            We do not knowingly collect personal data from minors. If we become aware that data has been collected from someone under 18, we will take immediate proactive steps to purge and delete it from our servers.
          </p>
        </div>
      )
    },
    {
      id: 5,
      title: '5. Sharing Your Information',
      icon: Shield,
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 leading-relaxed text-sm">
            We hold a simple, ethical business standard: <strong className="text-slate-900 font-extrabold">We do not sell, rent, or trade your personal information.</strong>
          </p>
          <p className="text-slate-600 leading-relaxed text-sm">
            However, we may share specific datasets with trusted processing partners for essential operations:
          </p>
          <div className="space-y-2">
            {[
              { party: 'Payment Gateway Providers', details: 'Stripe & relevant encrypted modules processing secure token checkouts.' },
              { party: 'Shipping & Delivery Couriers', details: 'Regional priority couriers to dispatch white canisters.' },
              { party: 'Analytics Platforms', details: 'Privacy-first analytics suites evaluating system traffic indicators.' }
            ].map((p, idx) => (
              <div key={idx} className="flex gap-3 p-3 bg-[#FAF9F5] border border-slate-150 rounded-xl items-start">
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-mono">{idx + 1}</span>
                <div>
                  <span className="block text-xs font-bold text-slate-800 uppercase tracking-tight">{p.party}</span>
                  <span className="block text-[11px] text-slate-500 font-medium leading-normal">{p.details}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 font-medium italic mt-1 bg-slate-50 p-2.5 rounded-lg border border-dashed">
            Note: These third parties are only given access to the specific details necessary to execute their explicit commercial duties and are contractually forbidden from utilizing it otherwise.
          </p>
        </div>
      )
    },
    {
      id: 6,
      title: '6. Cookies & Tracking',
      icon: RefreshCw,
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
            We utilize secure cookie tokens to improve front-end usability, optimize rendering times, and log custom storefront configurations:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {[
              { type: 'Essential Prefs', desc: 'Saves your cart canisters and user token state over session duration.' },
              { type: 'Technical Logs', desc: 'Caches custom page builders sections and rendering frames.' },
              { type: 'Behavior Analytics', desc: 'Measures page routing flows to discard low performance layouts.' }
            ].map((c, idx) => (
              <div key={idx} className="p-3.5 bg-[#FAF9F6] border rounded-xl space-y-1">
                <span className="block text-[10px] font-black uppercase text-indigo-600 tracking-wider">{c.type}</span>
                <span className="block text-[11px] text-slate-500 font-medium leading-relaxed">{c.desc}</span>
              </div>
            ))}
          </div>
          <p className="text-slate-605 text-xs sm:text-sm leading-relaxed font-semibold">
            You maintain full authority over this. You can control, prune, or completely disable cookies through your browser configurations. However, specific aspects of our store checkout workflow may not execute correctly without them.
          </p>
        </div>
      )
    },
    {
      id: 7,
      title: '7. Data Security',
      icon: Lock,
      content: (
        <div className="space-y-4">
          <div className="bg-indigo-950 text-white rounded-2xl p-5 sm:p-6 space-y-4 relative overflow-hidden shadow-lg">
            <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-5 pointer-events-none">
              <Lock className="h-64 w-64 text-white" />
            </div>
            
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-indigo-900 border border-indigo-800 rounded-xl text-indigo-400">
                <Lock className="h-5 w-5" />
              </span>
              <div>
                <span className="block text-xs font-black uppercase tracking-widest text-[#818CF8]">Security Architecture</span>
                <h3 className="text-sm font-extrabold uppercase tracking-tight">Active Encryption Safeguards</h3>
              </div>
            </div>

            <p className="text-indigo-200 text-xs leading-relaxed font-semibold">
              We take rigorous system precautions to protect your personal databases using high-tier security protocols (AES-256 bit TLS socket interfaces) during transit and static encryption while at rest.
            </p>

            <div className="text-[10px] text-indigo-305 border-t border-indigo-900 pt-3 md:flex md:justify-between font-mono font-medium">
              <span>CIPHER MODE: SSL_TLS_ECDHE_RSA</span>
              <span className="mt-1 md:mt-0 block">STATUS: HARDENED DATA SHIELD</span>
            </div>
          </div>
          <p className="text-slate-500 text-xs italic leading-relaxed">
            * While we implement standard commercial defenses, remember no digital systems are 100% impenetrable. We advise creating robust passwords and keeping your credentials confidential.
          </p>
        </div>
      )
    },
    {
      id: 8,
      title: '8. Data Retention',
      icon: Clock,
      content: (
        <div className="space-y-4">
          <p className="text-slate-650 text-sm leading-relaxed">
            We retain your datasets only for the minimum duration required to service your commercial interaction. Specially:
          </p>
          <ul className="space-y-2 text-xs text-slate-600 font-medium">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-indigo-505 rounded-full" />
              <span><strong className="text-slate-800">Order Fulfilment:</strong> Retained to finalize logistical delivery transit and support issues.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-indigo-505 rounded-full" />
              <span><strong className="text-slate-800">Tax Laws compliance:</strong> Secure archiving of ledger receipts as mandated by local Revenue codes.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-indigo-505 rounded-full" />
              <span><strong className="text-slate-800">Dispute mitigation:</strong> Specific audit parameters mapping tracking keys.</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 9,
      title: '9. Your Rights',
      icon: Shield,
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 leading-relaxed text-sm">
            Depending on your regional jurisdiction, you possess explicit statutory controls and protections over your personal data:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
            {[
              { r: 'Right of Access', d: 'Request a digital transcript containing all data fields we hold about you.' },
              { r: 'Right to Rectification', d: 'Modify, expand, or correct inaccurate delivery or profile logs.' },
              { r: 'Right to Erasure (To Be Forgotten)', d: 'Request a permanent purge of all optional personal directories.' },
              { r: 'Right to object', d: 'Immediately revoke consent for newsletter and promotional dispatches.' }
            ].map((right, idx) => (
              <div key={idx} className="p-3 border rounded-xl hover:bg-slate-50 transition-colors">
                <span className="block text-xs font-black text-[#0F172A] mb-0.5">{right.r}</span>
                <span className="block text-[11px] text-slate-500 font-medium leading-relaxed">{right.d}</span>
              </div>
            ))}
          </div>
          <p className="text-xs font-semibold text-indigo-700 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 inline-block">
            To invoke any of these security rights, please launch a transmission directly to support@pouchsupply.com.
          </p>
        </div>
      )
    },
    {
      id: 10,
      title: '10. Third-Party Links',
      icon: ArrowRight,
      content: (
        <div className="space-y-3">
          <p className="text-slate-650 text-xs sm:text-sm leading-relaxed">
            Our app features hyperlinks mapping external resources (e.g. tracking courier pages, partner manufacturers, educational health briefs).
          </p>
          <p className="text-slate-600 text-xs leading-normal">
            We hold zero authority or command over external domain structures. Once you depart Pouch Supply, our Privacy Policy is no longer active. We recommend always checking their local disclosures before committing personal detail fields.
          </p>
        </div>
      )
    },
    {
      id: 11,
      title: '11. Changes to This Policy',
      icon: RefreshCw,
      content: (
        <div className="space-y-3">
          <p className="text-slate-650 text-xs sm:text-sm leading-relaxed">
            We reserve the right to periodically calibrate this documentation according to changed compliance guidelines or browser cookie policies.
          </p>
          <p className="text-slate-600 text-xs leading-normal">
            Any alterations will immediately overwrite previous versions upon uploading here, indicating the updated Effective Date in the primary metadata row.
          </p>
        </div>
      )
    },
    {
      id: 12,
      title: '12. Contact us',
      icon: Mail,
      content: (
        <div className="p-5 bg-[#FAF9F5] border border-slate-150 rounded-2xl space-y-4">
          <div>
            <span className="block text-[10px] font-black uppercase text-indigo-600 tracking-wider mb-1">Direct Communications Access</span>
            <h4 className="text-base font-black text-slate-900 leading-none">Pouch Supply Compliance Desk</h4>
          </div>
          
          <div className="space-y-2 text-slate-650 text-xs font-medium">
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-400" />
              <span>Email: <a href="mailto:support@pouchsupply.com" className="text-indigo-650 hover:underline font-bold">support@pouchsupply.com</a></span>
            </p>
          </div>

          <div className="pt-2 border-t border-slate-150 flex gap-2">
            <button
              onClick={() => onNavigate('contact')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2 rounded-xl transition cursor-pointer uppercase tracking-wider"
            >
              Contact Page
            </button>
            <button
              onClick={() => onNavigate('frontend-shop')}
              className="bg-white hover:bg-slate-50 border border-slate-205 text-slate-700 font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
            >
              Browse Shop
            </button>
          </div>
        </div>
      )
    }
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-10 font-sans text-slate-800 animate-fade-in">
      
      {/* Decorative top micro layout row */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-indigo-650 to-teal-500" />

      {/* Header Area */}
      <div className="bg-slate-900 text-white py-8 px-4 border-b border-slate-800 relative overflow-hidden">
        {/* Background ambient accents */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-12 bottom-0 w-64 h-64 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-4 relative z-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/25 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-[#818CF8]">
            <Shield className="h-3 w-3 text-indigo-400" />
            <span>GDPR & ISO Compliant Pipeline</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white leading-tight">
            Privacy Policy & Data Shield
          </h1>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-slate-400 text-xs sm:text-sm font-medium pt-1">
            <span className="flex items-center gap-1.5 justify-center">
              <Clock className="h-4 w-4 text-slate-500" />
              Effective Date: <strong className="text-white">June 21, 2026</strong>
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="flex items-center gap-1.5 justify-center">
              <FileText className="h-4 w-4 text-slate-500" />
              Document Version: <strong className="text-white">v2.10_UK</strong>
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <button 
              onClick={handlePrint}
              className="text-[#818CF8] hover:text-[#A5B4FC] font-semibold flex items-center gap-1 hover:underline cursor-pointer leading-none"
            >
              Print Policy
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Sticky Anchor Navigation for desktop */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 space-y-4 hidden lg:block">
            <div className="p-4 border border-slate-150 rounded-2xl bg-[#FAF9F5] space-y-3 shadow-xs">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-450 block border-b pb-2">Policy Navigation Outline</span>
              
              <div className="space-y-1">
                {sections.map((sec) => {
                  const IconComponent = sec.icon;
                  const isActive = activeSection === sec.id;
                  return (
                    <a
                      key={sec.id}
                      href={`#policy-section-${sec.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveSection(sec.id);
                        const el = document.getElementById(`policy-section-${sec.id}`);
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
            <div className="border border-indigo-150 rounded-[22px] bg-indigo-50/20 p-5 sm:p-6 space-y-3 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-100/60 py-0.5 px-2.5 rounded-full inline-block">EXECUTIVE SUMMARY</span>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Our Absolute Commitment</h3>
              <p className="text-slate-655 text-xs sm:text-sm font-medium leading-relaxed">
                We design and host Pouch Supply directory to offer curated access to laboratory-certified can white pouch series. Under absolutely no scenarios do we sell your registration profiles, physical addresses, or order details to promotional networks. Data is utilized exclusively to complete payment gateways, packet couriers, and to protect user safety verification boundaries.
              </p>
            </div>

            {/* Individual detailed policy cards */}
            <div className="space-y-6">
              {sections.map((sec) => {
                const IconComponent = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <section
                    key={sec.id}
                    id={`policy-section-${sec.id}`}
                    onMouseEnter={() => setActiveSection(sec.id)}
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
                <span className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Need further privacy queries clarified?</span>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  We maintain full transparent audit disprovers. Reach out directly to our dedicated Compliance & Data Shield agent desks.
                </p>
              </div>
              <button
                onClick={() => onNavigate('contact')}
                className="bg-indigo-650 hover:bg-indigo-750 text-white font-black text-xs uppercase px-6 py-3 rounded-xl transition cursor-pointer shadow-sm tracking-wider"
              >
                Connect With Compliance Desk
              </button>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
