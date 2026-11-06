import React from 'react';
import { getPlanImage, getPlanSlug } from '../utils/planImages';

interface SubscriptionIconProps {
  planName: string;
  imageUrl?: string;
  className?: string;
}

export default function SubscriptionIcon({ planName, imageUrl, className = '' }: SubscriptionIconProps) {
  const planSlug = getPlanSlug(planName);
  const planImg = getPlanImage(planName, imageUrl);

  const planBadgeText = planSlug === 'lite' 
    ? 'LITE • 6 PACK' 
    : planSlug === 'core' 
    ? 'CORE • 8 PACK' 
    : planSlug === 'ultimate' 
    ? 'ULTIMATE • 12+' 
    : 'PRO • 10 PACK';

  const badgeBg = planSlug === 'lite'
    ? 'bg-emerald-600 text-white'
    : planSlug === 'core'
    ? 'bg-sky-600 text-white'
    : planSlug === 'ultimate'
    ? 'bg-pink-600 text-white'
    : 'bg-amber-500 text-slate-950';

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs shrink-0 flex items-center justify-center group ${className || 'w-16 h-16'}`}>
      <img 
        src={planImg} 
        alt={planName || 'Subscription Plan'} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        referrerPolicy="no-referrer"
      />
      <div className={`absolute bottom-0 inset-x-0 text-[7.5px] font-black tracking-tight text-center py-0.5 uppercase shadow-xs ${badgeBg}`}>
        {planBadgeText}
      </div>
    </div>
  );
}

