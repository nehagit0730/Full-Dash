import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Upload, X, Image as ImageIcon, HardDrive, Search, Check, FolderOpen, Plus, RefreshCw, Film, FileText, FileCode, File, Video } from 'lucide-react';
import { cleanMediaUrl } from '../utils/mediaUtils';
import { FileEntry } from '../types';

export function isVideoUrl(url?: string, mimeType?: string, fileName?: string, resourceType?: string): boolean {
  if (resourceType === 'video' || resourceType === 'video/mp4') return true;
  if (mimeType && (mimeType.startsWith('video/') || mimeType.includes('mp4') || mimeType.includes('webm') || mimeType.includes('quicktime') || mimeType.includes('video'))) return true;
  if (/\/video\/upload\//i.test(url || '')) return true;
  const target = (url || '') + ' ' + (fileName || '');
  return /\.(mp4|webm|mov|m4v|ogg|avi|mkv)$/i.test(target.split('?')[0]);
}

export function isPdfOrDocUrl(url?: string, mimeType?: string, fileName?: string): boolean {
  if (mimeType && (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('csv') || mimeType.includes('zip'))) return true;
  const target = (url || '') + ' ' + (fileName || '');
  return /\.(pdf|doc|docx|csv|xlsx|zip|txt)$/i.test(target.split('?')[0]);
}

export function renderMediaThumbnail(url: string, fileName?: string, mimeType?: string, className = "w-full h-full", resourceType?: string) {
  if (!url) return null;
  const cleaned = cleanMediaUrl(url);

  if (isVideoUrl(url, mimeType, fileName, resourceType)) {
    return (
      <div className={`relative bg-slate-900 flex items-center justify-center overflow-hidden rounded ${className}`}>
        <video
          src={cleaned}
          muted
          loop
          playsInline
          autoPlay
          className="w-full h-full object-cover pointer-events-none"
        />
        <div className="absolute inset-0 bg-slate-950/20 flex items-center justify-center pointer-events-none">
          <div className="bg-indigo-600/90 text-white p-1 rounded-full shadow-xs">
            <Film className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    );
  }

  if (isPdfOrDocUrl(url, mimeType, fileName)) {
    const ext = (fileName || url).split('.').pop()?.toUpperCase() || 'FILE';
    return (
      <div className={`bg-indigo-50/80 border border-indigo-200/80 flex flex-col items-center justify-center p-1 rounded text-indigo-700 ${className}`}>
        <FileText className="h-5 w-5 text-indigo-600 mb-0.5" />
        <span className="text-[7.5px] font-black uppercase tracking-wider text-indigo-800 truncate max-w-full px-0.5">
          {ext}
        </span>
      </div>
    );
  }

  return (
    <img
      src={cleaned}
      alt={fileName || 'Media asset'}
      className={`object-cover ${className}`}
      referrerPolicy="no-referrer"
      onError={(e) => {
        const target = e.currentTarget;
        target.onerror = null;
        if (typeof url === 'string' && url.startsWith('data:')) {
          target.src = url;
        } else if (url && url.includes('/uploads/')) {
          const filename = url.split('/uploads/').pop();
          if (filename) {
            const id = filename.split('.')[0];
            target.src = `/api/images/${id}`;
          }
        }
      }}
    />
  );
}

interface ImageUploadInputProps {
  label?: string;
  value: string;
  onChange: (base64OrLink: string) => void;
  placeholder?: string;
  className?: string;
  hideUrlInput?: boolean;
  mediaType?: 'image' | 'video' | 'pdf' | 'all';
  accept?: string;
}

export default function ImageUploadInput({
  label,
  value,
  onChange,
  placeholder = 'Or enter media URL link...',
  className = '',
  hideUrlInput = false,
  mediaType = 'all',
  accept
}: ImageUploadInputProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Manager picker state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [fileManagerFiles, setFileManagerFiles] = useState<FileEntry[]>([]);
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'video' | 'image' | 'doc'>(
    mediaType === 'video' ? 'video' : mediaType === 'image' ? 'image' : mediaType === 'pdf' ? 'doc' : 'all'
  );
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isModalUploading, setIsModalUploading] = useState(false);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Listen for global file upload events to keep picker synced
  useEffect(() => {
    const handleGlobalFileUploaded = (evt: Event) => {
      const detail = (evt as CustomEvent).detail;
      if (!detail || !detail.url) return;
      setFileManagerFiles((prev) => {
        if (prev.some(f => f.url === detail.url)) return prev;
        const cleanName = detail.fileName || detail.url.split('/').pop() || 'Media Asset';
        const entry: FileEntry = {
          id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          fileName: cleanName,
          altText: cleanName.split('.')[0] || 'Media Asset',
          dateAdded: new Date().toISOString().split('T')[0],
          size: detail.size || 'Media',
          references: 'Direct Upload',
          url: detail.url,
          mimeType: detail.mimeType
        };
        return [entry, ...prev];
      });
    };

    window.addEventListener('app-file-uploaded', handleGlobalFileUploaded);
    window.addEventListener('app-image-uploaded', handleGlobalFileUploaded);
    return () => {
      window.removeEventListener('app-file-uploaded', handleGlobalFileUploaded);
      window.removeEventListener('app-image-uploaded', handleGlobalFileUploaded);
    };
  }, []);

  const fetchFiles = async () => {
    setIsLoadingFiles(true);
    let loaded: FileEntry[] = [];
    try {
      const res = await fetch('/api/media');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          loaded = data;
        }
      }
      if (loaded.length === 0) {
        const resFiles = await fetch('/api/files');
        if (resFiles.ok) {
          const dataFiles = await resFiles.json();
          if (Array.isArray(dataFiles)) {
            loaded = dataFiles;
          }
        }
      }
    } catch (_) {}

    // Combine or fallback with localStorage
    try {
      const local = localStorage.getItem('ps_files');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (loaded.length === 0) {
            loaded = parsed;
          } else {
            const existingUrls = new Set(loaded.map(f => f.url));
            for (const item of parsed) {
              if (item && item.url && !existingUrls.has(item.url)) {
                loaded.push(item);
              }
            }
          }
        }
      }
    } catch (_) {}

    setFileManagerFiles(loaded);
    setIsLoadingFiles(false);
  };

  const openPickerModal = () => {
    setIsPickerOpen(true);
    setSelectedFileUrl(value || null);
    setActiveFilterTab(mediaType === 'video' ? 'video' : mediaType === 'image' ? 'image' : mediaType === 'pdf' ? 'doc' : 'all');
    fetchFiles();
  };

  const processFile = async (file: File, isForModal = false) => {
    const isVid = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|ogg|avi|mkv)$/i.test(file.name);
    const isImg = file.type.startsWith('image/') || /\.(png|jpe?g|webp|svg|gif|avif|ico|heic|bmp)$/i.test(file.name);
    const isDoc = file.type.includes('pdf') || /\.(pdf|doc|docx|csv|xlsx|zip|txt)$/i.test(file.name);

    if (mediaType === 'video' && !isVid) {
      alert('Only video files are permitted (e.g., MP4, WebM, MOV)!');
      return;
    }
    if (mediaType === 'image' && !isImg) {
      alert('Only image files are permitted (e.g., PNG, JPG, WEBP, SVG)!');
      return;
    }
    if (mediaType === 'pdf' && !isDoc) {
      alert('Only document files are permitted (e.g., PDF, DOC)!');
      return;
    }

    if (isForModal) setIsModalUploading(true);
    else setIsUploading(true);
    setUploadStatus(`Uploading ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)}MB)...`);

    let finalUrl = '';
    let returnedEntry: FileEntry | null = null;

    // 1. Try Multipart Cloudinary Upload
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'storefront_media');

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const info = await res.json();
        if (info.url) {
          finalUrl = info.url;
          returnedEntry = info.file || null;
        }
      }
    } catch (err) {
      console.warn('[Cloudinary FormData upload failed, falling back to base64]', err);
    }

    // 2. Base64 Fallback
    if (!finalUrl) {
      await new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = async () => {
          if (typeof reader.result === 'string') {
            const rawData = reader.result;
            finalUrl = rawData;
            try {
              const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: rawData, filename: file.name })
              });
              if (res.ok) {
                const info = await res.json();
                if (info.url) finalUrl = info.url;
              }
            } catch (_) {}
          }
          resolve();
        };
        reader.onerror = () => resolve();
        reader.readAsDataURL(file);
      });
    }

    if (isForModal) setIsModalUploading(false);
    else setIsUploading(false);
    setUploadStatus(null);

    if (!finalUrl) {
      alert('Failure uploading attachment file.');
      return;
    }

    const rawBytes = file.size;
    const calculatedSize = rawBytes > 1024 * 1024 
      ? `${(rawBytes / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.round(rawBytes / 1024)} KB`;

    const newFileEntry: FileEntry = returnedEntry || {
      id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fileName: file.name,
      altText: file.name.split('.')[0] || 'Uploaded Asset',
      dateAdded: new Date().toISOString().split('T')[0],
      size: calculatedSize,
      references: 'Direct Upload',
      url: finalUrl,
      mimeType: file.type || (isVid ? 'video/mp4' : 'image/png'),
      resourceType: isVid ? 'video' : 'image'
    };

    // Dispatch custom events
    const eventDetail = {
      id: newFileEntry.id,
      url: finalUrl,
      publicId: newFileEntry.publicId,
      fileName: file.name,
      mimeType: file.type || newFileEntry.mimeType || (isVid ? 'video/mp4' : 'image/png'),
      size: newFileEntry.size || calculatedSize,
      resourceType: newFileEntry.resourceType || (isVid ? 'video' : 'image')
    };
    window.dispatchEvent(new CustomEvent('app-image-uploaded', { detail: eventDetail }));
    window.dispatchEvent(new CustomEvent('app-file-uploaded', { detail: eventDetail }));

    if (isForModal) {
      setFileManagerFiles(prev => [newFileEntry, ...prev.filter(f => f.url !== finalUrl)]);
      setSelectedFileUrl(finalUrl);
    } else {
      onChange(finalUrl);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file, false);
    }
  };

  const handleModalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file, true);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file, false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredFiles = fileManagerFiles.filter(f => {
    if (activeFilterTab === 'video' && !isVideoUrl(f.url, f.mimeType)) return false;
    if (activeFilterTab === 'image' && (isVideoUrl(f.url, f.mimeType) || isPdfOrDocUrl(f.url, f.mimeType))) return false;
    if (activeFilterTab === 'doc' && !isPdfOrDocUrl(f.url, f.mimeType)) return false;

    if (!fileSearchQuery) return true;
    const q = fileSearchQuery.toLowerCase();
    return (
      (f.fileName && f.fileName.toLowerCase().includes(q)) ||
      (f.altText && f.altText.toLowerCase().includes(q)) ||
      (f.url && f.url.toLowerCase().includes(q))
    );
  });

  const computedAccept = accept || (
    mediaType === 'video' ? 'video/mp4,video/webm,video/quicktime,video/*' :
    mediaType === 'image' ? 'image/*' :
    mediaType === 'pdf' ? 'application/pdf,.pdf' :
    'image/*,video/*,application/pdf,.mp4,.webm,.mov,.pdf,.png,.jpg,.jpeg,.webp,.svg'
  );

  return (
    <div className={`space-y-1.5 text-left font-sans ${className}`}>
      {label && (
        <label className="block text-slate-600 font-bold uppercase tracking-wider text-[9px]">
          {label}
        </label>
      )}
      
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border border-dashed rounded-xl p-3 text-center transition-all relative flex flex-col items-center justify-center min-h-[96px] cursor-pointer group ${
          dragActive 
            ? 'border-indigo-600 bg-indigo-50/45' 
            : value 
              ? 'border-slate-200 bg-slate-50/30' 
              : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400'
        } ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}
      >
        {isUploading ? (
          <div className="space-y-2 py-2 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
            <div className="text-[9.5px] font-bold text-indigo-700 animate-pulse">{uploadStatus || 'Uploading media asset...'}</div>
          </div>
        ) : value ? (
          <div className="space-y-2 w-full flex flex-col items-center relative py-1">
            <div className="relative h-20 w-20 rounded-lg border border-slate-200 overflow-hidden bg-white flex items-center justify-center shadow-xs">
              {renderMediaThumbnail(value, 'Media', undefined, 'w-full h-full')}
              <button
                type="button"
                onClick={handleClear}
                className="absolute -top-1.5 -right-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 shadow-md transition-all z-10 cursor-pointer"
                title="Remove attachment"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            
            {!hideUrlInput && (
              <p className="text-[9px] text-slate-500 font-mono truncate max-w-full text-center px-4">
                {value.startsWith('data:') ? 'Custom Uploaded Data' : value}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-1.5 py-1">
            <div className="mx-auto w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
              {mediaType === 'video' ? <Film className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            </div>
            <div className="text-[10px] font-semibold text-slate-700">
              Drag file here or <span className="text-indigo-600 font-bold group-hover:underline">browse device</span>
            </div>
            <p className="text-[8px] text-slate-400">
              {mediaType === 'video' ? 'MP4, WebM, MOV video files' : 'PNG, JPG, WEBP, SVG, MP4, PDF files'}
            </p>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept={computedAccept}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Button: Upload / Select from File Manager */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          openPickerModal();
        }}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-extrabold transition border border-indigo-200/80 shadow-2xs cursor-pointer active:scale-[0.99] relative z-20"
      >
        <FolderOpen className="h-3.5 w-3.5 text-indigo-600" />
        <span>
          {mediaType === 'video' ? 'Select Video from File Manager' : 'Select from File Manager'}
        </span>
      </button>

      {!hideUrlInput && (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            {mediaType === 'video' ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
          </div>
          <input
            type="text"
            placeholder={placeholder}
            value={value && value.startsWith('data:') ? '' : (value || '')}
            onChange={(e) => {
              const val = e.target.value;
              onChange(val);
              if (val && (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:') || val.startsWith('/'))) {
                let name = 'External Asset';
                try {
                  const u = new URL(val, window.location.origin);
                  const last = u.pathname.substring(u.pathname.lastIndexOf('/') + 1);
                  if (last && last.includes('.')) {
                    name = last;
                  }
                } catch (_) {}
                window.dispatchEvent(new CustomEvent('app-file-uploaded', {
                  detail: { url: val, fileName: name }
                }));
              }
            }}
            className="w-full text-[10px] pl-7 pr-2 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
          />
        </div>
      )}

      {/* FILE MANAGER PICKER MODAL */}
      {isPickerOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 font-sans animate-in fade-in duration-150" onClick={(e) => e.stopPropagation()}>
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 relative z-[99999999]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <HardDrive className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    Select from File Manager
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                      {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Choose an existing media file or upload a new file directly into File Manager</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="px-4 pt-3 bg-white border-b border-slate-100 flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setActiveFilterTab('all')}
                  className={`px-3 py-1.5 rounded-t-lg transition border-b-2 cursor-pointer ${
                    activeFilterTab === 'all' 
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50/60' 
                      : 'border-transparent hover:bg-slate-100 text-slate-500'
                  }`}
                >
                  All Files
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilterTab('video')}
                  className={`px-3 py-1.5 rounded-t-lg transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                    activeFilterTab === 'video' 
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50/60' 
                      : 'border-transparent hover:bg-slate-100 text-slate-500'
                  }`}
                >
                  <Film className="h-3.5 w-3.5" />
                  <span>Videos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilterTab('image')}
                  className={`px-3 py-1.5 rounded-t-lg transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                    activeFilterTab === 'image' 
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50/60' 
                      : 'border-transparent hover:bg-slate-100 text-slate-500'
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Images</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilterTab('doc')}
                  className={`px-3 py-1.5 rounded-t-lg transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                    activeFilterTab === 'doc' 
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50/60' 
                      : 'border-transparent hover:bg-slate-100 text-slate-500'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>PDFs & Docs</span>
                </button>
              </div>
            </div>

            {/* Modal Toolbar */}
            <div className="p-3.5 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search files by name or title..."
                  value={fileSearchQuery}
                  onChange={(e) => setFileSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                {fileSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setFileSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={modalFileInputRef}
                  accept={computedAccept}
                  className="hidden"
                  onChange={handleModalFileChange}
                />
                <button
                  type="button"
                  disabled={isModalUploading}
                  onClick={() => modalFileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer whitespace-nowrap disabled:opacity-50"
                >
                  {isModalUploading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  <span>Upload New Media to File Manager</span>
                </button>
              </div>
            </div>

            {/* File Grid Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 min-h-[300px]">
              {isLoadingFiles ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-3 text-slate-400">
                  <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
                  <p className="text-xs font-semibold">Loading File Manager assets...</p>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-3 text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                  <div className="p-3 bg-slate-100 text-slate-400 rounded-2xl">
                    <FolderOpen className="h-8 w-8 text-slate-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">No media files match filter</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Upload a new file above or choose another tab filter</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => modalFileInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Upload File
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                  {filteredFiles.map((f) => {
                    const isSelected = selectedFileUrl === f.url;
                    return (
                      <div
                        key={f.id || f.url}
                        onClick={() => setSelectedFileUrl(f.url)}
                        className={`group relative border rounded-xl overflow-hidden bg-white cursor-pointer transition-all flex flex-col ${
                          isSelected
                            ? 'border-indigo-600 ring-2 ring-indigo-600/30 shadow-md scale-[1.02]'
                            : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="aspect-square w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
                          {renderMediaThumbnail(f.url, f.fileName, f.mimeType)}
                          {isSelected && (
                            <div className="absolute inset-0 bg-indigo-900/30 flex items-center justify-center">
                              <div className="bg-indigo-600 text-white rounded-full p-1.5 shadow-md">
                                <Check className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* File Details */}
                        <div className="p-2 space-y-0.5 flex-1 flex flex-col justify-between">
                          <p className="text-[10px] font-bold text-slate-800 truncate" title={f.fileName}>
                            {f.fileName || 'Media Asset'}
                          </p>
                          <div className="flex items-center justify-between text-[8.5px] text-slate-400 font-medium">
                            <span>{f.size || 'Media'}</span>
                            {f.dateAdded && <span>{f.dateAdded}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-hidden">
                {selectedFileUrl ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200/60 truncate">
                    <span className="truncate max-w-[240px]">Selected: {selectedFileUrl}</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">No file selected yet</span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedFileUrl}
                  onClick={() => {
                    if (selectedFileUrl) {
                      onChange(selectedFileUrl);
                      window.dispatchEvent(new CustomEvent('app-file-uploaded', {
                        detail: { url: selectedFileUrl, fileName: 'Selected File' }
                      }));
                      setIsPickerOpen(false);
                    }
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>Select & Apply File</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
