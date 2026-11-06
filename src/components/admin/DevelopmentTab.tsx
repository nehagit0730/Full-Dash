import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Code, Terminal, Sparkles, Check, Copy, RotateCcw, Save, Search, 
  Maximize2, Minimize2, CheckCircle2, AlertTriangle, Play, FileCode, 
  Layers, Shield, Cpu, RefreshCw, Eye, Sliders, Globe, Download, 
  Upload, Trash2, Plus, Edit3, Lock, Zap, ToggleLeft, ToggleRight,
  BarChart2, Tag, Activity, HelpCircle, ExternalLink, X
} from 'lucide-react';
import { DevSettings, CustomHtmlSnippet, ThirdPartyIntegrations } from '../../types';
import { DEFAULT_DEV_SETTINGS } from '../../data/initialDevSettings';
import { applyDevSettingsToDOM } from '../../utils/devModeInjector';
import WebsiteStatusPanel from './WebsiteStatusPanel';

interface DevelopmentTabProps {
  settings?: DevSettings;
  onUpdateSettings?: (newSettings: DevSettings) => void;
}

type DevSubTab = 'status' | 'css' | 'js' | 'head' | 'body' | 'snippets' | 'integrations';

const withDefaultIntegrations = (settings: DevSettings): DevSettings => ({
  ...settings,
  integrations: { ...DEFAULT_DEV_SETTINGS.integrations, ...settings.integrations }
});

export default function DevelopmentTab({ settings: initialSettings, onUpdateSettings }: DevelopmentTabProps) {
  // Local state for DevSettings
  const [devSettings, setDevSettings] = useState<DevSettings>(() => {
    if (initialSettings) return withDefaultIntegrations(initialSettings);
    try {
      const saved = localStorage.getItem('ps_dev_settings');
      if (saved) return withDefaultIntegrations(JSON.parse(saved));
    } catch (e) {
      console.warn('Failed to load ps_dev_settings from localStorage:', e);
    }
    return DEFAULT_DEV_SETTINGS;
  });

  // Keep devSettings synced when initialSettings is loaded from backend database
  useEffect(() => {
    if (initialSettings) {
      setDevSettings(withDefaultIntegrations(initialSettings));
    }
  }, [initialSettings]);

  const [activeSubTab, setActiveSubTab] = useState<DevSubTab>('status');
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchBox, setShowSearchBox] = useState<boolean>(false);
  const [replaceQuery, setReplaceQuery] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showLivePreview, setShowLivePreview] = useState<boolean>(false);

  // New snippet form state
  const [showNewSnippetModal, setShowNewSnippetModal] = useState<boolean>(false);
  const [editingSnippet, setEditingSnippet] = useState<CustomHtmlSnippet | null>(null);
  const [snippetForm, setSnippetForm] = useState<{ name: string; key: string; description: string; code: string; enabled: boolean }>({
    name: '',
    key: '',
    description: '',
    code: '',
    enabled: true
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync to parent & apply to DOM when saved
  const handleSaveDevSettings = (updated: DevSettings = devSettings) => {
    try {
      localStorage.setItem('ps_dev_settings', JSON.stringify(updated));
      applyDevSettingsToDOM(updated);
      
      // Direct POST to backend database API
      fetch('/api/devsettings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).catch(e => console.error('Error persisting devsettings to API:', e));

      if (onUpdateSettings) {
        onUpdateSettings(updated);
      }
      setSavedSuccessMessage('Development settings saved and synchronized to database!');
      setTimeout(() => setSavedSuccessMessage(null), 3000);
    } catch (e) {
      console.error('Failed to save dev settings:', e);
    }
  };

  // Helper to copy code to clipboard
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Helper to format code nicely
  const handleFormatCode = (target: 'css' | 'js' | 'head' | 'body') => {
    let current = devSettings[target === 'css' ? 'customCss' : target === 'js' ? 'customJs' : target === 'head' ? 'customHeadCode' : 'customBodyCode'];
    if (!current) return;

    try {
      if (target === 'css') {
        // Simple CSS formatter
        const formatted = current
          .replace(/\s*\{\s*/g, ' {\n  ')
          .replace(/;\s*/g, ';\n  ')
          .replace(/\s*\}\s*/g, '\n}\n\n')
          .replace(/\n\s*\n\s*\n/g, '\n\n')
          .trim();
        setDevSettings(prev => ({ ...prev, customCss: formatted }));
      } else if (target === 'js') {
        // Simple JS indentation cleanup
        const lines = current.split('\n').map(l => l.trim());
        let indent = 0;
        const formatted = lines.map(line => {
          if (line.startsWith('}') || line.startsWith(']')) indent = Math.max(0, indent - 1);
          const indentedLine = '  '.repeat(indent) + line;
          if (line.endsWith('{') || line.endsWith('[')) indent++;
          return indentedLine;
        }).join('\n');
        setDevSettings(prev => ({ ...prev, customJs: formatted }));
      } else {
        // Simple HTML formatter
        const lines = current.split('\n').map(l => l.trim()).filter(Boolean);
        setDevSettings(prev => ({ ...prev, [target === 'head' ? 'customHeadCode' : 'customBodyCode']: lines.join('\n') }));
      }
      handleSaveDevSettings({ ...devSettings });
    } catch (e) {
      console.warn('Formatting warning:', e);
    }
  };

  // Syntax Validator
  const getValidationErrors = (type: 'css' | 'js' | 'head' | 'body', code: string): string[] => {
    if (!code || !code.trim()) return [];
    const errors: string[] = [];

    if (type === 'css') {
      const openBrackets = (code.match(/\{/g) || []).length;
      const closeBrackets = (code.match(/\}/g) || []).length;
      if (openBrackets !== closeBrackets) {
        errors.push(`Mismatched curly brackets: { (${openBrackets}) vs } (${closeBrackets})`);
      }
    } else if (type === 'js') {
      try {
        new Function(code);
      } catch (err: any) {
        errors.push(`Syntax error: ${err.message || 'Invalid JavaScript'}`);
      }
    } else {
      const openTags = (code.match(/<[a-zA-Z0-9]+/g) || []).length;
      const closeTags = (code.match(/<\/[a-zA-Z0-9]+/g) || []).length;
      // Allow void elements
      if (Math.abs(openTags - closeTags) > 3) {
        errors.push(`Potential unclosed HTML tags detected (Check <head>/<body> elements)`);
      }
    }
    return errors;
  };

  // Code editor lines calculator
  const renderLineNumbers = (code: string) => {
    const lineCount = Math.max(1, (code || '').split('\n').length);
    return Array.from({ length: lineCount }).map((_, i) => (
      <div key={i} className="text-slate-600 select-none text-right pr-3 font-mono text-[11px] leading-6">
        {i + 1}
      </div>
    ));
  };

  // Handle Export Configuration
  const handleExportConfig = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(devSettings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `pouch-dev-config-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handle Import Configuration
  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported && (imported.customCss !== undefined || imported.integrations !== undefined)) {
          const merged = { ...DEFAULT_DEV_SETTINGS, ...imported, updatedAt: new Date().toISOString() };
          setDevSettings(merged);
          handleSaveDevSettings(merged);
          alert('Configuration imported and applied successfully!');
        } else {
          alert('Invalid dev settings file format.');
        }
      } catch (err) {
        alert('Failed to parse JSON configuration file.');
      }
    };
    reader.readAsText(file);
  };

  // Snippet modal handlers
  const handleOpenAddSnippet = () => {
    setEditingSnippet(null);
    setSnippetForm({
      name: '',
      key: `snippet_${Date.now().toString().slice(-4)}`,
      description: '',
      code: '',
      enabled: true
    });
    setShowNewSnippetModal(true);
  };

  const handleOpenEditSnippet = (snip: CustomHtmlSnippet) => {
    setEditingSnippet(snip);
    setSnippetForm({
      name: snip.name,
      key: snip.key,
      description: snip.description || '',
      code: snip.code,
      enabled: snip.enabled
    });
    setShowNewSnippetModal(true);
  };

  const handleSaveSnippet = () => {
    if (!snippetForm.name.trim() || !snippetForm.code.trim()) {
      alert('Please enter a valid snippet name and HTML code.');
      return;
    }

    let updatedSnippets: CustomHtmlSnippet[] = [...devSettings.snippets];
    if (editingSnippet) {
      updatedSnippets = updatedSnippets.map(s => s.id === editingSnippet.id ? {
        ...s,
        name: snippetForm.name.trim(),
        key: snippetForm.key.trim() || `snip_${s.id}`,
        description: snippetForm.description.trim(),
        code: snippetForm.code,
        enabled: snippetForm.enabled
      } : s);
    } else {
      const newSnip: CustomHtmlSnippet = {
        id: `snip-${Date.now()}`,
        name: snippetForm.name.trim(),
        key: snippetForm.key.trim() || `snip_${Date.now().toString().slice(-4)}`,
        description: snippetForm.description.trim(),
        code: snippetForm.code,
        enabled: snippetForm.enabled,
        createdAt: new Date().toISOString().slice(0, 10)
      };
      updatedSnippets.unshift(newSnip);
    }

    const newDev = { ...devSettings, snippets: updatedSnippets };
    setDevSettings(newDev);
    handleSaveDevSettings(newDev);
    setShowNewSnippetModal(false);
  };

  const handleDeleteSnippet = (id: string) => {
    if (!confirm('Are you sure you want to delete this custom HTML snippet?')) return;
    const updated = devSettings.snippets.filter(s => s.id !== id);
    const newDev = { ...devSettings, snippets: updated };
    setDevSettings(newDev);
    handleSaveDevSettings(newDev);
  };

  const handleToggleSnippet = (id: string) => {
    const updated = devSettings.snippets.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s);
    const newDev = { ...devSettings, snippets: updated };
    setDevSettings(newDev);
    handleSaveDevSettings(newDev);
  };

  // Handle Search & Replace inside active code block
  const handleReplaceText = () => {
    if (!searchQuery) return;
    const key = activeSubTab === 'css' ? 'customCss' : activeSubTab === 'js' ? 'customJs' : activeSubTab === 'head' ? 'customHeadCode' : 'customBodyCode';
    const currentCode = devSettings[key as keyof DevSettings] as string;
    if (typeof currentCode === 'string') {
      const replaced = currentCode.replaceAll(searchQuery, replaceQuery);
      const updated = { ...devSettings, [key]: replaced };
      setDevSettings(updated);
      handleSaveDevSettings(updated);
    }
  };

  return (
    <div className="space-y-6 pb-20 font-sans text-slate-800">
      {/* Top Header & Status Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-md shrink-0">
            <Terminal className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Development Mode</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Injection
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Advanced developer customization tools, global script injection, custom CSS & analytics triggers.
            </p>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportConfig} 
            accept=".json" 
            className="hidden" 
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Import configuration JSON"
          >
            <Upload className="h-3.5 w-3.5 text-slate-500" />
            <span>Import</span>
          </button>

          <button
            type="button"
            onClick={handleExportConfig}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Export configuration JSON"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('Reset all Development Mode settings and custom code to default template state?')) {
                setDevSettings(DEFAULT_DEV_SETTINGS);
                handleSaveDevSettings(DEFAULT_DEV_SETTINGS);
              }
            }}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Reset to Factory Defaults"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveDevSettings(devSettings)}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition-all flex items-center gap-2 shadow-sm cursor-pointer active:scale-[0.98]"
          >
            <Save className="h-4 w-4 text-amber-400" />
            <span>Save & Apply</span>
          </button>
        </div>
      </div>

      {/* Save Success Toast Banner */}
      {savedSuccessMessage && (
        <div className="p-4 bg-emerald-500 text-white rounded-xl shadow-md flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{savedSuccessMessage}</span>
          </div>
          <button onClick={() => setSavedSuccessMessage(null)} className="opacity-80 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Sub-Tab Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-2xs flex items-center gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'status', label: 'Website Status', icon: Globe },
          { id: 'css', label: 'Custom CSS', icon: FileCode, badge: devSettings.customCssEnabled ? 'ON' : 'OFF' },
          { id: 'js', label: 'Custom JavaScript', icon: Code, badge: devSettings.customJsEnabled ? 'ON' : 'OFF' },
          { id: 'head', label: 'Custom Head Code', icon: Tag, badge: devSettings.customHeadEnabled ? 'ON' : 'OFF' },
          { id: 'body', label: 'Custom Body Code', icon: Layers, badge: devSettings.customBodyEnabled ? 'ON' : 'OFF' },
          { id: 'snippets', label: 'HTML Snippets', icon: Sparkles, count: devSettings.snippets.length },
          { id: 'integrations', label: 'Third-Party Integrations', icon: BarChart2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as DevSubTab)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-1.5 py-0.5 text-[9px] font-black rounded ${
                  tab.badge === 'ON' 
                    ? (isActive ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800')
                    : (isActive ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500')
                }`}>
                  {tab.badge}
                </span>
              )}
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded-full ${
                  isActive ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* MAIN SECTION RENDERING */}

      {/* 1. CODE EDITORS (CSS, JS, HEAD, BODY) */}
      {(['css', 'js', 'head', 'body'].includes(activeSubTab)) && (() => {
        const type = activeSubTab as 'css' | 'js' | 'head' | 'body';
        const codeKey = type === 'css' ? 'customCss' : type === 'js' ? 'customJs' : type === 'head' ? 'customHeadCode' : 'customBodyCode';
        const enabledKey = type === 'css' ? 'customCssEnabled' : type === 'js' ? 'customJsEnabled' : type === 'head' ? 'customHeadEnabled' : 'customBodyEnabled';
        const codeValue = devSettings[codeKey] as string;
        const isEnabled = devSettings[enabledKey] as boolean;
        const errors = getValidationErrors(type, codeValue);

        return (
          <div className={`space-y-4 ${isFullScreen ? 'fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto flex flex-col justify-between' : ''}`}>
            {/* Editor Toolbar */}
            <div className="bg-slate-900 text-slate-200 rounded-t-2xl p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => {
                        const updated = { ...devSettings, [enabledKey]: e.target.checked };
                        setDevSettings(updated);
                        handleSaveDevSettings(updated);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                    {isEnabled ? 'Code Active' : 'Code Disabled'}
                  </span>
                </div>

                <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                  {codeValue.split('\n').length} Lines • {codeValue.length} Chars
                </span>
              </div>

              {/* Toolbar Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSearchBox(!showSearchBox)}
                  className={`p-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    showSearchBox ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title="Search & Replace"
                >
                  <Search className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleFormatCode(type)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Auto-format Indentation"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Format</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(codeValue, type)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey === type ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                  <span>{copiedKey === type ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Clear editor contents?')) {
                      const updated = { ...devSettings, [codeKey]: '' };
                      setDevSettings(updated);
                      handleSaveDevSettings(updated);
                    }
                  }}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-900/50 hover:text-rose-300 text-slate-400 text-xs font-bold rounded-lg border border-slate-700 transition-all cursor-pointer"
                >
                  Clear
                </button>

                {type !== 'js' && (
                  <button
                    type="button"
                    onClick={() => setShowLivePreview(!showLivePreview)}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      showLivePreview ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Live Preview</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all cursor-pointer"
                  title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Mode'}
                >
                  {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Optional Search & Replace Bar */}
            {showSearchBox && (
              <div className="bg-slate-850 bg-slate-900 p-3 border-b border-slate-800 flex flex-wrap items-center gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Find text..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-slate-100 rounded px-2.5 py-1 text-xs font-mono w-48 focus:border-amber-400 outline-none"
                />
                <input
                  type="text"
                  placeholder="Replace with..."
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-slate-100 rounded px-2.5 py-1 text-xs font-mono w-48 focus:border-amber-400 outline-none"
                />
                <button
                  type="button"
                  onClick={handleReplaceText}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-3 py-1 rounded text-xs transition-all cursor-pointer"
                >
                  Replace All
                </button>
                <button
                  type="button"
                  onClick={() => setShowSearchBox(false)}
                  className="text-slate-400 hover:text-slate-200 px-2 py-1"
                >
                  Close
                </button>
              </div>
            )}

            {/* Validation Error Banner */}
            {errors.length > 0 && (
              <div className="bg-rose-950/80 border border-rose-800 p-3 text-rose-200 text-xs font-semibold flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {errors.map((err, idx) => (
                    <div key={idx}>{err}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Main IDE Editor View */}
            <div className={`grid grid-cols-1 ${showLivePreview ? 'lg:grid-cols-2' : ''} gap-4`}>
              <div className="bg-slate-950 rounded-b-2xl border border-slate-800 overflow-hidden flex font-mono text-xs relative">
                {/* Line Numbers Gutter */}
                <div className="bg-slate-900/90 py-4 px-2 border-r border-slate-800/80 shrink-0">
                  {renderLineNumbers(codeValue)}
                </div>

                {/* Textarea Code Input */}
                <textarea
                  value={codeValue}
                  onChange={(e) => {
                    const updated = { ...devSettings, [codeKey]: e.target.value };
                    setDevSettings(updated);
                    handleSaveDevSettings(updated);
                  }}
                  placeholder={`/* Enter custom ${type.toUpperCase()} code here... */`}
                  className="w-full h-96 lg:h-[480px] p-4 bg-transparent text-amber-200/90 font-mono text-xs leading-6 outline-none resize-none selection:bg-amber-400 selection:text-slate-950"
                  spellCheck={false}
                />
              </div>

              {/* Side-by-Side Live Preview Container */}
              {showLivePreview && (
                <div className="bg-white rounded-2xl border border-slate-300 p-4 overflow-y-auto max-h-[500px]">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-4">
                    <span className="text-xs font-extrabold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-indigo-600" /> Live Rendered Output
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
                      Real-time Preview
                    </span>
                  </div>

                  {type === 'css' && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-500 italic">
                        Custom CSS is applied directly to the document head.
                      </p>
                      <div className="p-4 bg-slate-900 text-white rounded-xl ps-custom-glow">
                        <span className="ps-custom-badge">Sample Element</span>
                        <p className="text-xs mt-2 text-slate-300">
                          Inspect element classes like <code className="text-amber-400">.ps-custom-glow</code> or custom scrollbars.
                        </p>
                      </div>
                    </div>
                  )}

                  {(type === 'head' || type === 'body') && (
                    <div 
                      className="p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50 text-slate-800 text-xs"
                      dangerouslySetInnerHTML={{ __html: codeValue || '<p className="text-slate-400">No HTML code provided.</p>' }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* 2. CUSTOM HTML SNIPPETS TAB */}
      {activeSubTab === 'snippets' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Custom HTML Snippets</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Store reusable HTML code snippets that can be dynamically inserted across your website.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddSnippet}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="h-4 w-4 text-amber-400" />
              <span>Create Snippet</span>
            </button>
          </div>

          {/* Snippets List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devSettings.snippets.map((snip) => (
              <div 
                key={snip.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-slate-900">{snip.name}</h3>
                        <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase ${
                          snip.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {snip.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mt-1 inline-block">
                        key: #{snip.key}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleSnippet(snip.id)}
                        className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          snip.enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                        title="Toggle Snippet Status"
                      >
                        {snip.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditSnippet(snip)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                        title="Edit Snippet"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSnippet(snip.id)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 cursor-pointer"
                        title="Delete Snippet"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {snip.description && (
                    <p className="text-xs text-slate-500 mb-3">{snip.description}</p>
                  )}

                  {/* HTML Preview Box */}
                  <div className="bg-slate-950 text-amber-200/90 font-mono text-[11px] p-3 rounded-xl max-h-28 overflow-y-auto border border-slate-800">
                    <pre className="whitespace-pre-wrap">{snip.code}</pre>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  <span>Created: {snip.createdAt || 'Recent'}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(snip.code, snip.id)}
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === snip.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedKey === snip.id ? 'Copied' : 'Copy HTML'}</span>
                  </button>
                </div>
              </div>
            ))}

            {devSettings.snippets.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <Sparkles className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-bold">No custom HTML snippets stored yet.</p>
                <button
                  onClick={handleOpenAddSnippet}
                  className="mt-3 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg"
                >
                  Create First Snippet
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. THIRD-PARTY INTEGRATIONS TAB */}
      {activeSubTab === 'status' && <WebsiteStatusPanel />}

      {activeSubTab === 'integrations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <h2 className="text-base font-extrabold text-slate-900">Third-Party Analytics & Tracking Integrations</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Configure official measurement IDs and marketing pixels. Scripts are injected dynamically into the storefront when enabled.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Google Analytics 4 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
                    GA4
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Google Analytics 4</h3>
                    <span className="text-[10px] text-slate-400">Measurement ID (e.g., G-XXXXXXXXXX)</span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={devSettings.integrations.googleAnalyticsEnabled}
                    onChange={(e) => {
                      const updated = {
                        ...devSettings,
                        integrations: { ...devSettings.integrations, googleAnalyticsEnabled: e.target.checked }
                      };
                      setDevSettings(updated);
                      handleSaveDevSettings(updated);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">GA4 Measurement ID</label>
                <input
                  type="text"
                  value={devSettings.integrations.googleAnalyticsId}
                  onChange={(e) => {
                    const updated = {
                      ...devSettings,
                      integrations: { ...devSettings.integrations, googleAnalyticsId: e.target.value }
                    };
                    setDevSettings(updated);
                    handleSaveDevSettings(updated);
                  }}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Google Tag Manager */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
                    GTM
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Google Tag Manager</h3>
                    <span className="text-[10px] text-slate-400">Container ID (e.g., GTM-XXXXXXX)</span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={devSettings.integrations.googleTagManagerEnabled}
                    onChange={(e) => {
                      const updated = {
                        ...devSettings,
                        integrations: { ...devSettings.integrations, googleTagManagerEnabled: e.target.checked }
                      };
                      setDevSettings(updated);
                      handleSaveDevSettings(updated);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">GTM Container ID</label>
                <input
                  type="text"
                  value={devSettings.integrations.googleTagManagerId}
                  onChange={(e) => {
                    const updated = {
                      ...devSettings,
                      integrations: { ...devSettings.integrations, googleTagManagerId: e.target.value }
                    };
                    setDevSettings(updated);
                    handleSaveDevSettings(updated);
                  }}
                  placeholder="GTM-XXXXXXX"
                  className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Meta / Facebook Pixel */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold">
                    META
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Meta / Facebook Pixel</h3>
                    <span className="text-[10px] text-slate-400">Pixel ID (e.g., 109283746501928)</span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={devSettings.integrations.metaPixelEnabled}
                    onChange={(e) => {
                      const updated = {
                        ...devSettings,
                        integrations: { ...devSettings.integrations, metaPixelEnabled: e.target.checked }
                      };
                      setDevSettings(updated);
                      handleSaveDevSettings(updated);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Pixel ID</label>
                <input
                  type="text"
                  value={devSettings.integrations.metaPixelId}
                  onChange={(e) => {
                    const updated = {
                      ...devSettings,
                      integrations: { ...devSettings.integrations, metaPixelId: e.target.value }
                    };
                    setDevSettings(updated);
                    handleSaveDevSettings(updated);
                  }}
                  placeholder="109283746501928"
                  className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* TikTok Pixel */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center font-bold">
                    TT
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">TikTok Pixel</h3>
                    <span className="text-[10px] text-slate-400">TikTok Events Manager Pixel ID</span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={devSettings.integrations.tikTokPixelEnabled}
                    onChange={(e) => {
                      const updated = {
                        ...devSettings,
                        integrations: { ...devSettings.integrations, tikTokPixelEnabled: e.target.checked }
                      };
                      setDevSettings(updated);
                      handleSaveDevSettings(updated);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Pixel ID</label>
                <input
                  type="text"
                  value={devSettings.integrations.tikTokPixelId}
                  onChange={(e) => {
                    const updated = {
                      ...devSettings,
                      integrations: { ...devSettings.integrations, tikTokPixelId: e.target.value }
                    };
                    setDevSettings(updated);
                    handleSaveDevSettings(updated);
                  }}
                  placeholder="CXXXXXXXXXXXXXXX"
                  className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Microsoft Clarity */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center font-bold">
                    MS
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Microsoft Clarity</h3>
                    <span className="text-[10px] text-slate-400">Project ID</span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={devSettings.integrations.microsoftClarityEnabled}
                    onChange={(e) => {
                      const updated = {
                        ...devSettings,
                        integrations: { ...devSettings.integrations, microsoftClarityEnabled: e.target.checked }
                      };
                      setDevSettings(updated);
                      handleSaveDevSettings(updated);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Project ID</label>
                <input
                  type="text"
                  value={devSettings.integrations.microsoftClarityId}
                  onChange={(e) => {
                    const updated = {
                      ...devSettings,
                      integrations: { ...devSettings.integrations, microsoftClarityId: e.target.value }
                    };
                    setDevSettings(updated);
                    handleSaveDevSettings(updated);
                  }}
                  placeholder="cl_pouch_2026"
                  className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Hotjar */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold">
                    HJ
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Hotjar Heatmaps</h3>
                    <span className="text-[10px] text-slate-400">Site ID</span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={devSettings.integrations.hotjarEnabled}
                    onChange={(e) => {
                      const updated = {
                        ...devSettings,
                        integrations: { ...devSettings.integrations, hotjarEnabled: e.target.checked }
                      };
                      setDevSettings(updated);
                      handleSaveDevSettings(updated);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Site ID</label>
                <input
                  type="text"
                  value={devSettings.integrations.hotjarSiteId}
                  onChange={(e) => {
                    const updated = {
                      ...devSettings,
                      integrations: { ...devSettings.integrations, hotjarSiteId: e.target.value }
                    };
                    setDevSettings(updated);
                    handleSaveDevSettings(updated);
                  }}
                  placeholder="5098231"
                  className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Custom Webhook Endpoint */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center font-bold">
                    HOOK
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Custom Webhook Dispatcher</h3>
                    <span className="text-[10px] text-slate-400">Order & Checkout Event Webhook</span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={devSettings.integrations.customWebhookEnabled}
                    onChange={(e) => {
                      const updated = {
                        ...devSettings,
                        integrations: { ...devSettings.integrations, customWebhookEnabled: e.target.checked }
                      };
                      setDevSettings(updated);
                      handleSaveDevSettings(updated);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Webhook Endpoint URL</label>
                <input
                  type="url"
                  value={devSettings.integrations.customWebhookUrl}
                  onChange={(e) => {
                    const updated = {
                      ...devSettings,
                      integrations: { ...devSettings.integrations, customWebhookUrl: e.target.value }
                    };
                    setDevSettings(updated);
                    handleSaveDevSettings(updated);
                  }}
                  placeholder="https://api.pouchsupply.co.uk/webhooks/orders"
                  className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. ENVIRONMENT & API SETTINGS TAB */}
      {/* CREATE / EDIT SNIPPET MODAL */}
      {showNewSnippetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingSnippet ? 'Edit HTML Snippet' : 'Create Custom HTML Snippet'}
              </h3>
              <button
                type="button"
                onClick={() => setShowNewSnippetModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Snippet Name</label>
                <input
                  type="text"
                  value={snippetForm.name}
                  onChange={(e) => setSnippetForm({ ...snippetForm, name: e.target.value })}
                  placeholder="e.g. Free Shipping Top Banner"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Snippet Identifier Key</label>
                  <input
                    type="text"
                    value={snippetForm.key}
                    onChange={(e) => setSnippetForm({ ...snippetForm, key: e.target.value })}
                    placeholder="shipping_banner"
                    className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Status</label>
                  <select
                    value={snippetForm.enabled ? 'enabled' : 'disabled'}
                    onChange={(e) => setSnippetForm({ ...snippetForm, enabled: e.target.value === 'enabled' })}
                    className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-400"
                  >
                    <option value="enabled">Active / Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Short Description</label>
                <input
                  type="text"
                  value={snippetForm.description}
                  onChange={(e) => setSnippetForm({ ...snippetForm, description: e.target.value })}
                  placeholder="Where or why this snippet is used"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">HTML Code</label>
                <textarea
                  rows={6}
                  value={snippetForm.code}
                  onChange={(e) => setSnippetForm({ ...snippetForm, code: e.target.value })}
                  placeholder="<div class='custom-banner'>...</div>"
                  className="w-full text-xs font-mono p-3 bg-slate-950 text-amber-200 rounded-xl outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNewSnippetModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSnippet}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-extrabold rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                Save Snippet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
