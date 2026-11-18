import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FONT_OPTIONS } from '../../../utils/sectionFonts';

/** Shared, Shopify-editor-style form controls for the page builder panels. */

export function Group({
  title,
  defaultOpen = true,
  children
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-[13px] font-semibold text-slate-900 hover:bg-slate-50"
      >
        {title}
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div className="px-4 pb-4 space-y-4">{children}</div>}
    </div>
  );
}

export function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[96px_1fr] items-center gap-3">
      <div>
        <span className="block text-[12px] text-slate-700 leading-tight">{label}</span>
        {hint && <span className="block text-[10px] text-slate-400 leading-tight mt-0.5">{hint}</span>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="block text-[12px] text-slate-700">{label}</span>
      {children}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange
}: {
  value: T | undefined;
  options: { value: T; label: React.ReactNode; title?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          onClick={() => onChange(o.value)}
          className={`flex-1 min-w-0 truncate rounded-md px-2 py-1.5 text-[12px] transition ${
            value === o.value ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Select({
  value,
  onChange,
  children
}: {
  value: string | number | undefined;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer"
    >
      {children}
    </select>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  multiline
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const cls =
    'w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';
  return multiline ? (
    <textarea rows={4} value={value || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} className={`${cls} font-mono`} />
  ) : (
    <input type="text" value={value || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} className={cls} />
  );
}

export function Range({
  value,
  min,
  max,
  step = 1,
  unit = 'px',
  placeholder,
  onChange,
  onReset
}: {
  value: number | undefined;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  /** Shown in the box while the setting is unset (the theme default). */
  placeholder: number;
  onChange: (v: number) => void;
  onReset?: () => void;
}) {
  const isSet = value !== undefined && value !== null && !Number.isNaN(value);
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={isSet ? value : placeholder}
        onChange={e => onChange(Number(e.target.value))}
        className={`flex-1 min-w-0 accent-slate-900 cursor-pointer ${isSet ? '' : 'opacity-50'}`}
      />
      <div className="flex items-center rounded-md border border-slate-300 bg-white pl-1.5 pr-1 w-[68px] shrink-0">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={isSet ? value : ''}
          placeholder={String(placeholder)}
          onChange={e => (e.target.value === '' ? onReset?.() : onChange(Number(e.target.value)))}
          className="w-full py-1 text-[12px] text-slate-800 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-[10px] text-slate-400">{unit}</span>
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="text-[12px] text-slate-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition shrink-0 ${checked ? 'bg-slate-900' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
    </label>
  );
}

export function ColorField({
  value,
  fallback,
  onChange,
  onClear
}: {
  value: string | undefined;
  fallback: string;
  onChange: (v: string) => void;
  onClear?: () => void;
}) {
  const shown = value || fallback;
  return (
    <div className="flex items-center gap-2">
      <label className="relative h-8 w-8 shrink-0 rounded-lg border border-slate-300 overflow-hidden cursor-pointer" style={{ background: shown }}>
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(shown) ? shown : '#000000'}
          onChange={e => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </label>
      <input
        type="text"
        value={value || ''}
        placeholder={fallback}
        onChange={e => onChange(e.target.value)}
        className="flex-1 min-w-0 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[12px] font-mono uppercase text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      />
      {value && onClear && (
        <button type="button" onClick={onClear} className="text-[11px] text-slate-500 hover:text-slate-900 underline shrink-0">
          Reset
        </button>
      )}
    </div>
  );
}

const FONT_GROUPS = ['Sans serif', 'Serif', 'Display', 'Handwriting', 'System'] as const;

export function FontSelect({
  value,
  onChange,
  inheritLabel = 'Theme default'
}: {
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  inheritLabel?: string;
}) {
  return (
    <Select value={value || ''} onChange={v => onChange(v || undefined)}>
      <option value="">{inheritLabel}</option>
      {FONT_GROUPS.map(g => (
        <optgroup key={g} label={g}>
          {FONT_OPTIONS.filter(f => f.category === g).map(f => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </optgroup>
      ))}
    </Select>
  );
}
