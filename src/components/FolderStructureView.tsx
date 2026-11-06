import React, { useState, useEffect } from 'react';
import { 
  Folder, FileText, Copy, Check, RefreshCw, Download, 
  Search, Shield, Code, ChevronRight, ChevronDown, Layers
} from 'lucide-react';

interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  size?: number;
}

export function FolderStructureView() {
  const [treeData, setTreeData] = useState<FileTreeNode[]>([]);
  const [asciiText, setAsciiText] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('website');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'ascii' | 'interactive'>('ascii');
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({
    'src': true,
    'backend': true
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchFolderStructure = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/folder-structure');
      const data = await res.json();

      if (res.ok && data.success) {
        setTreeData(data.tree || []);
        setAsciiText(data.asciiText || '');
        setProjectName(data.projectName || 'website');
      } else {
        setErrorMsg(data.error || 'Failed to generate folder structure.');
      }
    } catch (err: any) {
      console.error('[FolderStructureView] Fetch error:', err);
      setErrorMsg(err.message || 'Error connecting to folder structure endpoint.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFolderStructure();
  }, []);

  const handleCopy = () => {
    if (!asciiText) return;
    navigator.clipboard.writeText(asciiText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleDownload = () => {
    if (!asciiText) return;
    const blob = new Blob([asciiText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName}-folder-structure.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleExpand = (path: string) => {
    setExpandedPaths(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const renderTreeNode = (node: FileTreeNode, depth: number = 0) => {
    const isExpanded = !!expandedPaths[node.path];
    const isMatch = filterQuery 
      ? node.name.toLowerCase().includes(filterQuery.toLowerCase()) || node.path.toLowerCase().includes(filterQuery.toLowerCase())
      : true;

    if (node.type === 'directory') {
      const children = node.children || [];
      return (
        <div key={node.path} className="select-none">
          <div 
            onClick={() => toggleExpand(node.path)}
            className={`flex items-center gap-2 py-1 px-2 hover:bg-slate-800/60 rounded cursor-pointer transition text-xs font-mono ${
              isMatch ? 'text-amber-300 font-bold' : 'text-slate-400'
            }`}
            style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            )}
            <Folder className="h-4 w-4 text-amber-400 fill-amber-400/20 shrink-0" />
            <span>{node.name}/</span>
          </div>
          {isExpanded && children.length > 0 && (
            <div>
              {children.map(child => renderTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    if (!isMatch && filterQuery) return null;

    const sizeKb = `${((node.size || 0) / 1024).toFixed(1)} KB`;

    return (
      <div 
        key={node.path}
        className="flex items-center justify-between py-1 px-2 hover:bg-slate-800/40 rounded text-xs font-mono text-slate-300"
        style={{ paddingLeft: `${depth * 1.25 + 1.75}rem` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
          <span className="truncate">{node.name}</span>
        </div>
        {sizeKb && (
          <span className="text-[10px] text-slate-500 font-mono ml-4 shrink-0">
            {sizeKb}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 font-sans text-slate-800 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 rounded-full text-xs font-extrabold uppercase tracking-widest backdrop-blur-xs">
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              <span>Project Blueprint &amp; Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
              Website Folder Structure Generator
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Generate, preview, and copy the full directory tree structure of this website codebase with a single click.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={fetchFolderStructure}
              disabled={isLoading}
              className="py-3 px-5 bg-[#1c2d50] hover:bg-[#152340] disabled:bg-slate-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-2 shadow-md disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Scanning Directory...' : 'Generate Folder Structure'}</span>
            </button>

            <button
              onClick={handleCopy}
              disabled={!asciiText || isLoading}
              className={`py-3 px-5 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-2 shadow-md ${
                isCopied 
                  ? 'bg-[#1c2d50] text-white ring-2 ring-amber-400' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50'
              }`}
            >
              {isCopied ? (
                <>
                  <Check className="h-4 w-4 text-amber-300" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-amber-400" />
                  <span>Copy Structure</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              disabled={!asciiText || isLoading}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition cursor-pointer disabled:opacity-50"
              title="Download structure as text file"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 text-xs font-bold">
          {errorMsg}
        </div>
      )}

      {/* Main Content Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Controls Toolbar */}
        <div className="bg-slate-900 border-b border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          
          {/* View Mode Toggle */}
          <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1 w-full sm:w-auto">
            <button
              onClick={() => setActiveView('ascii')}
              className={`flex-1 sm:flex-initial py-1.5 px-4 rounded-lg font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                activeView === 'ascii' 
                  ? 'bg-[#1c2d50] text-white shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="h-3.5 w-3.5" />
              <span>ASCII Text Format</span>
            </button>
            <button
              onClick={() => setActiveView('interactive')}
              className={`flex-1 sm:flex-initial py-1.5 px-4 rounded-lg font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                activeView === 'interactive' 
                  ? 'bg-[#1c2d50] text-white shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Folder className="h-3.5 w-3.5" />
              <span>Interactive Explorer</span>
            </button>
          </div>

          {/* Search Filter */}
          {activeView === 'interactive' && (
            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Filter files or folders..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#1c2d50] font-mono"
              />
            </div>
          )}

          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
            <span>Root: <strong className="text-slate-200">{projectName}/</strong></span>
          </div>
        </div>

        {/* View Display Area */}
        <div className="p-6 overflow-x-auto min-h-[420px] max-h-[650px] scrollbar-thin scrollbar-thumb-slate-800">
          {isLoading ? (
            <div className="py-24 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-[#1c2d50] animate-spin mx-auto" />
              <p className="text-xs font-mono text-slate-400">Scanning filesystem directory tree...</p>
            </div>
          ) : activeView === 'ascii' ? (
            <pre className="font-mono text-xs text-slate-200 leading-relaxed selection:bg-[#1c2d50] selection:text-white whitespace-pre">
              {asciiText || '// Click "Generate Folder Structure" above to scan project directory.'}
            </pre>
          ) : (
            <div className="space-y-1">
              {treeData.length === 0 ? (
                <p className="text-xs font-mono text-slate-500 italic">No files found.</p>
              ) : (
                treeData.map(node => renderTreeNode(node))
              )}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="bg-slate-900/80 border-t border-slate-800 p-3 px-6 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Excludes build artifacts (<code className="text-indigo-300 font-mono">node_modules</code>, <code className="text-indigo-300 font-mono">dist</code>, <code className="text-indigo-300 font-mono">.git</code>)
          </span>
          <div className="flex items-center gap-2 text-slate-500">
            <Shield className="h-3.5 w-3.5 text-indigo-400" />
            <span>Production Ready Codebase Blueprint</span>
          </div>
        </div>

      </div>
    </div>
  );
}
