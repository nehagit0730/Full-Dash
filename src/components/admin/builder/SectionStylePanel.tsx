import React from 'react';
import { AlignCenter, AlignLeft, AlignRight, Monitor, Smartphone } from 'lucide-react';
import { PageSection } from '../../../types';
import ImageUploadInput from '../../ImageUploadInput';
import { ColorField, FontSelect, Group, Range, Row, Segmented, Select, TextInput, Toggle } from './controls';

export interface ColorScheme {
  id: string;
  name: string;
  backgroundColor: string;
  headingColor: string;
  textColor: string;
  buttonBgColor: string;
  buttonTextColor: string;
}

export const COLOR_SCHEMES: ColorScheme[] = [
  { id: 'light', name: 'Light', backgroundColor: '#FFFFFF', headingColor: '#111827', textColor: '#4B5563', buttonBgColor: '#111827', buttonTextColor: '#FFFFFF' },
  { id: 'cream', name: 'Cream', backgroundColor: '#F7F3EC', headingColor: '#2B2118', textColor: '#6B5E52', buttonBgColor: '#2B2118', buttonTextColor: '#F7F3EC' },
  { id: 'soft', name: 'Soft grey', backgroundColor: '#F3F4F6', headingColor: '#111827', textColor: '#4B5563', buttonBgColor: '#111827', buttonTextColor: '#FFFFFF' },
  { id: 'dark', name: 'Dark', backgroundColor: '#111111', headingColor: '#FFFFFF', textColor: '#D1D5DB', buttonBgColor: '#FFFFFF', buttonTextColor: '#111111' },
  { id: 'navy', name: 'Navy', backgroundColor: '#1E2A44', headingColor: '#FFFFFF', textColor: '#CBD5E1', buttonBgColor: '#E8BE74', buttonTextColor: '#1E2A44' },
  { id: 'accent', name: 'Gold', backgroundColor: '#E8BE74', headingColor: '#1A1C1D', textColor: '#3B3326', buttonBgColor: '#1A1C1D', buttonTextColor: '#FFFFFF' }
];

const same = (a?: string, b?: string) => (a || '').toLowerCase() === (b || '').toLowerCase();

interface Props {
  section: PageSection;
  /** Applies several settings in one update (undefined resets a setting). */
  onPatch: (patch: Record<string, any>) => void;
}

/**
 * The style settings every section shares: layout, colours, typography,
 * buttons, visibility and advanced. Rendered by PageRenderer's shared style
 * layer, so the builder preview and the live store use identical rules.
 */
export default function SectionStylePanel({ section, onPatch }: Props) {
  const s: any = section.settings || {};
  const set = (key: string) => (v: any) => onPatch({ [key]: v });
  const unset = (key: string) => () => onPatch({ [key]: undefined });
  const activeScheme = COLOR_SCHEMES.find(c => same(c.backgroundColor, s.backgroundColor) && same(c.headingColor, s.headingColor));

  const alignOptions = [
    { value: 'left', label: <AlignLeft className="h-3.5 w-3.5 mx-auto" />, title: 'Left' },
    { value: 'center', label: <AlignCenter className="h-3.5 w-3.5 mx-auto" />, title: 'Center' },
    { value: 'right', label: <AlignRight className="h-3.5 w-3.5 mx-auto" />, title: 'Right' }
  ] as const;

  return (
    <>
      <Group title="Layout">
        <Row label="Width">
          <Segmented
            value={s.fullWidth ? 'full' : s.contentWidth || 'wide'}
            options={[
              { value: 'narrow', label: 'S', title: 'Narrow (760px)' },
              { value: 'medium', label: 'M', title: 'Medium (1040px)' },
              { value: 'wide', label: 'L', title: 'Wide (1280px)' },
              { value: 'full', label: 'Full', title: 'Full browser width' }
            ]}
            onChange={v => onPatch(v === 'full' ? { fullWidth: true } : { fullWidth: false, contentWidth: v })}
          />
        </Row>
        <Row label="Alignment">
          <Segmented value={s.alignment || undefined} options={alignOptions as any} onChange={set('alignment')} />
        </Row>
        <Row label="Mobile alignment">
          <Segmented value={s.mobileAlignment || undefined} options={alignOptions as any} onChange={set('mobileAlignment')} />
        </Row>
        <div className="pt-1 space-y-3">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <Monitor className="h-3.5 w-3.5" /> Desktop padding
          </span>
          <Row label="Top">
            <Range value={s.paddingTop} min={0} max={160} step={4} placeholder={20} onChange={set('paddingTop')} onReset={unset('paddingTop')} />
          </Row>
          <Row label="Bottom">
            <Range value={s.paddingBottom} min={0} max={160} step={4} placeholder={20} onChange={set('paddingBottom')} onReset={unset('paddingBottom')} />
          </Row>
          <Row label="Sides">
            <Range value={s.paddingSide} min={0} max={120} step={4} placeholder={0} onChange={set('paddingSide')} onReset={unset('paddingSide')} />
          </Row>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 pt-1">
            <Smartphone className="h-3.5 w-3.5" /> Mobile padding
          </span>
          <Row label="Top">
            <Range value={s.paddingTopMobile} min={0} max={120} step={4} placeholder={s.paddingTop ?? 12} onChange={set('paddingTopMobile')} onReset={unset('paddingTopMobile')} />
          </Row>
          <Row label="Bottom">
            <Range value={s.paddingBottomMobile} min={0} max={120} step={4} placeholder={s.paddingBottom ?? 12} onChange={set('paddingBottomMobile')} onReset={unset('paddingBottomMobile')} />
          </Row>
        </div>
        <Row label="Corner radius">
          <Range value={s.sectionRadius} min={0} max={48} step={2} placeholder={0} onChange={set('sectionRadius')} onReset={unset('sectionRadius')} />
        </Row>
      </Group>

      <Group title="Colors">
        <div>
          <span className="block text-[12px] text-slate-700 mb-2">Color scheme</span>
          <div className="grid grid-cols-3 gap-2">
            {COLOR_SCHEMES.map(c => (
              <button
                key={c.id}
                type="button"
                title={c.name}
                onClick={() =>
                  onPatch({
                    backgroundColor: c.backgroundColor,
                    headingColor: c.headingColor,
                    textColor: c.textColor,
                    buttonBgColor: c.buttonBgColor,
                    buttonTextColor: c.buttonTextColor
                  })
                }
                className={`rounded-lg border p-2 text-left transition ${
                  activeScheme?.id === c.id ? 'border-blue-600 ring-2 ring-blue-600/30' : 'border-slate-300 hover:border-slate-500'
                }`}
                style={{ background: c.backgroundColor }}
              >
                <span className="block text-[15px] font-semibold leading-none" style={{ color: c.headingColor }}>Aa</span>
                <span className="mt-1.5 flex gap-1">
                  <span className="h-1.5 w-4 rounded-full" style={{ background: c.buttonBgColor }} />
                  <span className="h-1.5 w-4 rounded-full border" style={{ borderColor: c.textColor }} />
                </span>
                <span className="block mt-1.5 text-[10px] truncate" style={{ color: c.textColor }}>{c.name}</span>
              </button>
            ))}
          </div>
        </div>
        <Row label="Background">
          <ColorField value={s.backgroundColor} fallback="#FFFFFF" onChange={set('backgroundColor')} onClear={unset('backgroundColor')} />
        </Row>
        <Row label="Heading">
          <ColorField value={s.headingColor} fallback="#1E293B" onChange={set('headingColor')} onClear={unset('headingColor')} />
        </Row>
        <Row label="Text">
          <ColorField value={s.textColor} fallback="#475569" onChange={set('textColor')} onClear={unset('textColor')} />
        </Row>
        <Row label="Subheading">
          <ColorField value={s.subheadingColor} fallback="#64748B" onChange={set('subheadingColor')} onClear={unset('subheadingColor')} />
        </Row>
        <Row label="Card title">
          <ColorField value={s.cardTitleColor} fallback="#0F172A" onChange={set('cardTitleColor')} onClear={unset('cardTitleColor')} />
        </Row>
        <Row label="Card text">
          <ColorField value={s.cardTextColor} fallback="#64748B" onChange={set('cardTextColor')} onClear={unset('cardTextColor')} />
        </Row>
        <Row label="Card background">
          <ColorField value={s.cardBgColor} fallback="#FFFFFF" onChange={set('cardBgColor')} onClear={unset('cardBgColor')} />
        </Row>
        <Row label="Accent / badge">
          <ColorField value={s.badgeTextColor} fallback="#10B981" onChange={set('badgeTextColor')} onClear={unset('badgeTextColor')} />
        </Row>
        <div className="pt-1 space-y-3">
          <span className="block text-[12px] text-slate-700">Background image</span>
          <ImageUploadInput
            value={s.backgroundImageUrl || ''}
            onChange={url => onPatch({ backgroundImageUrl: url || undefined })}
            placeholder="Optional image behind the section"
          />
          {s.backgroundImageUrl && (
            <Row label="Overlay">
              <Range value={s.backgroundOverlay} min={0} max={90} step={5} unit="%" placeholder={0} onChange={set('backgroundOverlay')} onReset={unset('backgroundOverlay')} />
            </Row>
          )}
        </div>
      </Group>

      <Group title="Typography">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Headings</span>
        <Row label="Font">
          <FontSelect value={s.headingFont} onChange={set('headingFont')} inheritLabel="Page default" />
        </Row>
        <Row label="Size" hint="Desktop">
          <Range value={s.titleFontSize} min={12} max={96} step={1} placeholder={30} onChange={set('titleFontSize')} onReset={unset('titleFontSize')} />
        </Row>
        <Row label="Size" hint="Mobile">
          <Range value={s.titleFontSizeMobile} min={12} max={64} step={1} placeholder={s.titleFontSize ? Math.round(s.titleFontSize * 0.75) : 24} onChange={set('titleFontSizeMobile')} onReset={unset('titleFontSizeMobile')} />
        </Row>
        <Row label="Weight">
          <Select value={s.headingWeight || ''} onChange={v => onPatch({ headingWeight: v ? Number(v) : undefined })}>
            <option value="">Default</option>
            <option value="300">Light 300</option>
            <option value="400">Regular 400</option>
            <option value="500">Medium 500</option>
            <option value="600">Semibold 600</option>
            <option value="700">Bold 700</option>
            <option value="800">Extra bold 800</option>
            <option value="900">Black 900</option>
          </Select>
        </Row>
        <Row label="Letter case">
          <Segmented
            value={s.headingTransform || 'default'}
            options={[
              { value: 'default', label: 'Auto' },
              { value: 'none', label: 'Aa', title: 'As typed' },
              { value: 'uppercase', label: 'AA', title: 'Uppercase' },
              { value: 'capitalize', label: 'Ab', title: 'Capitalize' }
            ]}
            onChange={v => onPatch({ headingTransform: v === 'default' ? undefined : v })}
          />
        </Row>
        <Row label="Letter spacing">
          <Range value={s.headingLetterSpacing} min={-0.05} max={0.3} step={0.01} unit="em" placeholder={0} onChange={set('headingLetterSpacing')} onReset={unset('headingLetterSpacing')} />
        </Row>
        <Row label="Line height">
          <Range value={s.headingLineHeight} min={0.8} max={2} step={0.05} unit="" placeholder={1.2} onChange={set('headingLineHeight')} onReset={unset('headingLineHeight')} />
        </Row>
        <Toggle label="Italic headings" checked={!!s.headingItalic} onChange={v => onPatch({ headingItalic: v || undefined })} />

        <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 pt-2">Body text</span>
        <Row label="Font">
          <FontSelect value={s.bodyFont} onChange={set('bodyFont')} inheritLabel="Page default" />
        </Row>
        <Row label="Size">
          <Range value={s.bodyFontSize} min={10} max={28} step={1} placeholder={15} onChange={set('bodyFontSize')} onReset={unset('bodyFontSize')} />
        </Row>
        <Row label="Weight">
          <Select value={s.bodyWeight || ''} onChange={v => onPatch({ bodyWeight: v ? Number(v) : undefined })}>
            <option value="">Default</option>
            <option value="300">Light 300</option>
            <option value="400">Regular 400</option>
            <option value="500">Medium 500</option>
            <option value="600">Semibold 600</option>
          </Select>
        </Row>
        <Row label="Line height">
          <Range value={s.bodyLineHeight} min={1} max={2.4} step={0.05} unit="" placeholder={1.6} onChange={set('bodyLineHeight')} onReset={unset('bodyLineHeight')} />
        </Row>
        <Row label="Letter spacing">
          <Range value={s.bodyLetterSpacing} min={-0.02} max={0.2} step={0.01} unit="em" placeholder={0} onChange={set('bodyLetterSpacing')} onReset={unset('bodyLetterSpacing')} />
        </Row>
      </Group>

      <Group title="Buttons" defaultOpen={false}>
        <Row label="Style">
          <Segmented
            value={s.buttonStyle || 'solid'}
            options={[
              { value: 'solid', label: 'Solid' },
              { value: 'outline', label: 'Outline' },
              { value: 'link', label: 'Link' }
            ]}
            onChange={v => onPatch({ buttonStyle: v === 'solid' ? undefined : v })}
          />
        </Row>
        <Row label="Background">
          <ColorField value={s.buttonBgColor} fallback="#111827" onChange={set('buttonBgColor')} onClear={unset('buttonBgColor')} />
        </Row>
        <Row label="Label color">
          <ColorField value={s.buttonTextColor} fallback="#FFFFFF" onChange={set('buttonTextColor')} onClear={unset('buttonTextColor')} />
        </Row>
        <Row label="Corners">
          <Segmented
            value={s.buttonRoundness || 'rounded-lg'}
            options={[
              { value: 'rounded-none', label: '▢', title: 'Square' },
              { value: 'rounded', label: 'Soft' },
              { value: 'rounded-lg', label: 'Round' },
              { value: 'rounded-full', label: 'Pill' }
            ]}
            onChange={set('buttonRoundness')}
          />
        </Row>
        <Row label="Text size">
          <Range value={s.buttonFontSize} min={10} max={22} step={1} placeholder={13} onChange={set('buttonFontSize')} onReset={unset('buttonFontSize')} />
        </Row>
        <Row label="Letter case">
          <Segmented
            value={s.buttonUppercase === true ? 'upper' : s.buttonUppercase === false ? 'normal' : 'auto'}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'normal', label: 'Aa' },
              { value: 'upper', label: 'AA' }
            ]}
            onChange={v => onPatch({ buttonUppercase: v === 'auto' ? undefined : v === 'upper' })}
          />
        </Row>
      </Group>

      <Group title="Visibility & animation" defaultOpen={false}>
        <Toggle label="Hide on desktop" checked={!!s.hideOnDesktop} onChange={v => onPatch({ hideOnDesktop: v || undefined })} />
        <Toggle label="Hide on mobile" checked={!!s.hideOnMobile} onChange={v => onPatch({ hideOnMobile: v || undefined })} />
        <Row label="Animation">
          <Select value={s.animation || 'none'} onChange={v => onPatch({ animation: v === 'none' ? undefined : v })}>
            <option value="none">None</option>
            <option value="fade">Fade in</option>
            <option value="slide-up">Slide up</option>
            <option value="zoom">Zoom in</option>
          </Select>
        </Row>
      </Group>

      <Group title="Custom CSS" defaultOpen={false}>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Applies only to this section. Write rules as usual, e.g. <code className="bg-slate-100 px-1 rounded">h2 {'{'} letter-spacing: 2px; {'}'}</code>
        </p>
        <TextInput multiline value={s.customCss} onChange={v => onPatch({ customCss: v || undefined })} placeholder={'h2 { color: #b45309; }\n.section-btn { padding: 16px 40px; }'} />
      </Group>
    </>
  );
}
