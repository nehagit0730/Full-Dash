import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, HardDrive, Download, Upload, Plus, Trash2, Edit3, Eye, Copy, Check, 
  Film, FileText, Image as ImageIcon, ExternalLink, RefreshCw, AlertTriangle, 
  FolderOpen, Grid, List, X, Sparkles, Layers
} from 'lucide-react';
import { FileEntry } from '../../types';
import { renderMediaThumbnail, isVideoUrl, isPdfOrDocUrl } from '../ImageUploadInput';

interface FilesTabProps {
  fileQuery: string;
  setFileQuery: (val: string) => void;
  filteredFiles: FileEntry[];
  selectedFileIds: string[];
  handleExportFiles: () => void;
  handleImportFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileManagerInputRef: React.RefObject<HTMLInputElement>;
  handleDirectDeviceFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectAllFiles: (checked: boolean) => void;
  handleBulkDeleteFiles: () => void;
  handleSelectFile: (id: string, checked: boolean) => void;
  handleDeleteFile: (id: string) => void;
  onRefreshFiles?: () => void;
}

export const FilesTab: React.FC<FilesTabProps> = ({
  fileQuery,
  setFileQuery,
  filteredFiles,
  selectedFileIds,
  handleExportFiles,
  handleImportFiles,
  fileManagerInputRef,
  handleDirectDeviceFileUpload,
  handleSelectAllFiles,
  handleBulkDeleteFiles,
  handleSelectFile,
  handleDeleteFile,
  onRefreshFiles,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'image' | 'video' | 'doc'>('all');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Active Selected Media Detail Drawer
  const [activeMedia, setActiveMedia] = useState<FileEntry | null>(null);
  const [isEditingMedia, setIsEditingMedia] = useState(false);
  const [editFileName, setEditFileName] = useState('');
  const [editAltText, setEditAltText] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // References checking state
  const [checkingRefs, setCheckingRefs] = useState(false);
  const [mediaRefs, setMediaRefs] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Cloudinary environment variables validation state
  const [cloudinaryInfo, setCloudinaryInfo] = useState<{
    configured: boolean;
    hasCloudName: boolean;
    hasApiKey: boolean;
    hasApiSecret: boolean;
    cloudName?: string | null;
    message?: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/test-cloudinary')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setCloudinaryInfo(data);
          console.log('[Cloudinary Validation Check in File Explorer]', {
            CLOUDINARY_CLOUD_NAME: data.hasCloudName ? 'PRESENT' : 'MISSING',
            CLOUDINARY_API_KEY: data.hasApiKey ? 'PRESENT' : 'MISSING',
            CLOUDINARY_API_SECRET: data.hasApiSecret ? 'PRESENT' : 'MISSING',
            fullyConfigured: data.configured,
            cloudName: data.cloudName,
            message: data.message
          });
        }
      })
      .catch(err => console.error('[Cloudinary Check Error]', err));
  }, []);

  // Sync edit state when active media changes
  useEffect(() => {
    if (activeMedia) {
      setEditFileName(activeMedia.fileName || activeMedia.originalFilename || '');
      setEditAltText(activeMedia.altText || '');
      checkReferences(activeMedia.url);
    } else {
      setMediaRefs([]);
      setShowDeleteConfirm(false);
    }
  }, [activeMedia]);

  const checkReferences = async (url: string) => {
    setCheckingRefs(true);
    try {
      const res = await fetch('/api/media/check-references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      if (res.ok) {
        const data = await res.json();
        setMediaRefs(data.references || []);
      }
    } catch (err) {
      console.error('Error checking references:', err);
    } finally {
      setCheckingRefs(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveMetadata = async () => {
    if (!activeMedia) return;
    try {
      const res = await fetch(`/api/media/${activeMedia.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: editFileName,
          altText: editAltText
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveMedia(updated);
        setIsEditingMedia(false);
        if (onRefreshFiles) onRefreshFiles();
      } else {
        alert('Failed to update media details.');
      }
    } catch (err) {
      alert('Error updating media details.');
    }
  };

  const handleDeleteActiveMedia = async (force = false) => {
    if (!activeMedia) return;
    try {
      const url = `/api/media/${activeMedia.id}${force ? '?force=true' : ''}`;
      const res = await fetch(url, { method: 'DELETE' });
      if (res.status === 409) {
        const data = await res.json();
        setMediaRefs(data.references || []);
        setShowDeleteConfirm(true);
        return;
      }
      if (res.ok) {
        handleDeleteFile(activeMedia.id);
        setActiveMedia(null);
        setShowDeleteConfirm(false);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete file.');
      }
    } catch (err) {
      alert('Error deleting media file.');
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const uploadFiles = async (files: File[]) => {
    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Uploading ${file.name} (${i + 1}/${files.length})...`);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'storefront_media');

        const isVid = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|ogg|avi|mkv)$/i.test(file.name);
        const res = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          const fileObj = data.file || data;
          window.dispatchEvent(new CustomEvent('app-file-uploaded', {
            detail: {
              id: fileObj.id || data.id,
              url: fileObj.url || data.url,
              publicId: fileObj.publicId || data.publicId,
              fileName: file.name,
              mimeType: file.type || fileObj.mimeType || (isVid ? 'video/mp4' : 'image/png'),
              size: fileObj.fileSize || fileObj.size || `${(file.size / 1024).toFixed(1)} KB`,
              resourceType: fileObj.resourceType || data.resourceType || (isVid ? 'video' : 'image')
            }
          }));
        } else {
          // Fallback to base64 upload
          const reader = new FileReader();
          await new Promise<void>((resolve) => {
            reader.onload = async () => {
              if (typeof reader.result === 'string') {
                const resUp = await fetch('/api/upload', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ data: reader.result, filename: file.name })
                });
                if (resUp.ok) {
                  const dataUp = await resUp.json();
                  window.dispatchEvent(new CustomEvent('app-file-uploaded', {
                    detail: {
                      id: dataUp.id,
                      url: dataUp.url,
                      publicId: dataUp.publicId,
                      fileName: file.name,
                      mimeType: file.type || dataUp.mimeType || (isVid ? 'video/mp4' : 'image/png'),
                      size: dataUp.fileSize || `${(file.size / 1024).toFixed(1)} KB`,
                      resourceType: dataUp.resourceType || (isVid ? 'video' : 'image')
                    }
                  }));
                }
              }
              resolve();
            };
            reader.readAsDataURL(file);
          });
        }
      } catch (err) {
        console.error('Upload error:', err);
      }
    }
    setUploading(false);
    setUploadProgress(null);
    if (onRefreshFiles) onRefreshFiles();
  };

  // Filtered files by tab and search
  const displayedFiles = filteredFiles.filter((f) => {
    if (mediaTypeFilter === 'video') return isVideoUrl(f.url, f.mimeType, f.fileName, f.resourceType);
    if (mediaTypeFilter === 'image') return !isVideoUrl(f.url, f.mimeType, f.fileName, f.resourceType) && !isPdfOrDocUrl(f.url, f.mimeType, f.fileName);
    if (mediaTypeFilter === 'doc') return isPdfOrDocUrl(f.url, f.mimeType, f.fileName);
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Cloudinary Environment Variables Validation Check Banner */}
      {cloudinaryInfo && (
        <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
          cloudinaryInfo.configured
            ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-950'
            : 'bg-amber-50/80 border-amber-200/80 text-amber-950'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${cloudinaryInfo.configured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Cloudinary Environment Variables Status:</span>
                <span className={`font-extrabold px-2 py-0.5 rounded text-[10px] uppercase ${
                  cloudinaryInfo.configured ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                }`}>
                  {cloudinaryInfo.configured ? 'Active & Configured' : 'Incomplete (Using Local Disk Fallback)'}
                </span>
              </div>
              <p className="opacity-80 text-[11px] mt-0.5">
                {cloudinaryInfo.configured
                  ? 'All Cloudinary credentials present. High-resolution images automatically optimize on CDN.'
                  : 'Missing Cloudinary environment variables. File uploads safely save to local storage and database.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2 py-1 rounded font-mono text-[10px] font-bold ${
              cloudinaryInfo.hasCloudName ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              CloudName: {cloudinaryInfo.hasCloudName ? 'Present' : 'Missing'}
            </span>
            <span className={`px-2 py-1 rounded font-mono text-[10px] font-bold ${
              cloudinaryInfo.hasApiKey ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              API Key: {cloudinaryInfo.hasApiKey ? 'Present' : 'Missing'}
            </span>
            <span className={`px-2 py-1 rounded font-mono text-[10px] font-bold ${
              cloudinaryInfo.hasApiSecret ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              API Secret: {cloudinaryInfo.hasApiSecret ? 'Present' : 'Missing'}
            </span>
          </div>
        </div>
      )}

      {/* Header controls & Filter Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Filter media files..."
              value={fileQuery}
              onChange={(e) => setFileQuery(e.target.value)}
              className="w-full text-xs p-2 pb-2 pl-8 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500 bg-slate-50 font-medium"
            />
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-600">
            <button
              onClick={() => setMediaTypeFilter('all')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                mediaTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'hover:bg-slate-200/60 text-slate-500'
              }`}
            >
              All ({filteredFiles.length})
            </button>
            <button
              onClick={() => setMediaTypeFilter('image')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                mediaTypeFilter === 'image' ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' : 'hover:bg-slate-200/60 text-slate-500'
              }`}
            >
              <ImageIcon className="h-3 w-3 text-indigo-600" /> Images
            </button>
            <button
              onClick={() => setMediaTypeFilter('video')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                mediaTypeFilter === 'video' ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' : 'hover:bg-slate-200/60 text-slate-500'
              }`}
            >
              <Film className="h-3 w-3 text-indigo-600" /> Videos
            </button>
            <button
              onClick={() => setMediaTypeFilter('doc')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                mediaTypeFilter === 'doc' ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' : 'hover:bg-slate-200/60 text-slate-500'
              }`}
            >
              <FileText className="h-3 w-3 text-indigo-600" /> Docs
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handleExportFiles}
            className="bg-white hover:bg-slate-50 border border-slate-200 font-bold p-2.5 px-3 rounded-xl text-xs text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="Export media metadata backup"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" /> Export Backup
          </button>

          <label
            className="bg-white hover:bg-slate-50 border border-slate-200 font-bold p-2.5 px-3 rounded-xl text-xs text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="Import media backup"
          >
            <Upload className="h-3.5 w-3.5 text-slate-500" /> Import
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportFiles}
            />
          </label>

          <button
            onClick={() => fileManagerInputRef.current?.click()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs p-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98] transition-all"
          >
            <Plus className="h-4 w-4" /> Upload File
          </button>
          <input
            ref={fileManagerInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx,.csv,.xlsx,.zip,.txt"
            className="hidden"
            onChange={handleDirectDeviceFileUpload}
          />
        </div>
      </div>

      {/* Drag & Drop Upload Container Banner */}
      <div
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all relative flex flex-col items-center justify-center ${
          dragActive
            ? 'border-indigo-600 bg-indigo-50/60 scale-[1.005]'
            : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50'
        }`}
      >
        {uploading ? (
          <div className="flex items-center gap-3 py-2">
            <RefreshCw className="h-5 w-5 text-indigo-600 animate-spin" />
            <span className="text-xs font-bold text-indigo-700">{uploadProgress || 'Uploading to Cloudinary...'}</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4 px-2">
            <div className="flex items-center gap-3 text-left">
              <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl shrink-0">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Drag & Drop media files here to store in Cloudinary</h4>
                <p className="text-[11px] text-slate-500">Supports high-res PNG, JPG, WEBP, MP4 videos, and PDF documents. Metadata is safely stored in PostgreSQL.</p>
              </div>
            </div>
            <button
              onClick={() => fileManagerInputRef.current?.click()}
              className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 px-4 py-2 rounded-xl text-xs font-bold shadow-2xs cursor-pointer shrink-0"
            >
              Browse Files
            </button>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedFileIds.length > 0 && (
        <div className="bg-slate-900 text-white p-3 px-4 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-md animate-fadeIn">
          <div className="flex items-center gap-3">
            <input 
              type="checkbox"
              className="rounded border-slate-600 text-indigo-500 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
              checked={displayedFiles.length > 0 && displayedFiles.every(f => selectedFileIds.includes(f.id))}
              onChange={(e) => handleSelectAllFiles(e.target.checked)}
            />
            <span className="text-xs font-bold">
              {selectedFileIds.length} file{selectedFileIds.length === 1 ? '' : 's'} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDeleteFiles}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Bulk Assets
            </button>
          </div>
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' ? (
        displayedFiles.length === 0 ? (
          <div className="bg-white border rounded-2xl p-12 text-center text-slate-400 space-y-3">
            <FolderOpen className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">No media assets match current filter</p>
            <p className="text-[11px] text-slate-400">Upload new images or videos using the button above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {displayedFiles.map((file) => {
              const isChecked = selectedFileIds.includes(file.id);
              const isCloudinary = file.url.includes('res.cloudinary.com') || Boolean(file.publicId);
              return (
                <div
                  key={file.id}
                  onClick={() => setActiveMedia(file)}
                  className={`group relative bg-white border rounded-2xl overflow-hidden cursor-pointer transition-all flex flex-col hover:shadow-md ${
                    isChecked ? 'ring-2 ring-indigo-600 border-indigo-600' : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {/* Select Checkbox Overlay */}
                  <div 
                    className="absolute top-2 left-2 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleSelectFile(file.id, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 shadow-xs cursor-pointer bg-white"
                    />
                  </div>

                  {/* Cloudinary Badge */}
                  {isCloudinary && (
                    <div className="absolute top-2 right-2 z-10 bg-slate-900/80 backdrop-blur-xs text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <Sparkles className="h-2.5 w-2.5 text-amber-400" />
                      <span>Cloudinary</span>
                    </div>
                  )}

                  {/* Thumbnail */}
                  <div className="aspect-square w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    {renderMediaThumbnail(file.url, file.fileName, file.mimeType)}
                    <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="p-2 bg-white text-slate-900 rounded-full shadow-md text-xs font-bold flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> Details
                      </span>
                    </div>
                  </div>

                  {/* Metadata Info */}
                  <div className="p-3 space-y-1 bg-white">
                    <p className="text-[11px] font-bold text-slate-800 truncate" title={file.fileName}>
                      {file.fileName || 'Media File'}
                    </p>
                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-medium">
                      <span>{file.size || 'Media'}</span>
                      {file.dateAdded && <span>{file.dateAdded}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] text-slate-450 font-bold uppercase tracking-widest">
                  <th className="p-4 w-12 text-center">
                    <input 
                      type="checkbox"
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                      checked={displayedFiles.length > 0 && displayedFiles.every(f => selectedFileIds.includes(f.id))}
                      onChange={(e) => handleSelectAllFiles(e.target.checked)}
                    />
                  </th>
                  <th className="p-4">Thumbnail</th>
                  <th className="p-4">File Name</th>
                  <th className="p-4">Alt Text</th>
                  <th className="p-4">Provider</th>
                  <th className="p-4">Date Uploaded</th>
                  <th className="p-4">Size</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedFiles.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">No media assets found.</td>
                  </tr>
                ) : (
                  displayedFiles.map(file => {
                    const isCloudinary = file.url.includes('res.cloudinary.com') || Boolean(file.publicId);
                    return (
                      <tr key={file.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => setActiveMedia(file)}>
                        <td className="p-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox"
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                            checked={selectedFileIds.includes(file.id)}
                            onChange={(e) => handleSelectFile(file.id, e.target.checked)}
                          />
                        </td>
                        <td className="p-4 shrink-0">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                            {renderMediaThumbnail(file.url, file.fileName, file.mimeType, "w-full h-full")}
                          </div>
                        </td>
                        <td className="p-4 text-slate-900 font-mono font-bold leading-normal text-[11px] truncate max-w-xs">{file.fileName}</td>
                        <td className="p-4 text-slate-500 max-w-xs truncate">{file.altText || '—'}</td>
                        <td className="p-4">
                          {isCloudinary ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <Sparkles className="h-2.5 w-2.5 text-amber-500" /> Cloudinary CDN
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-400 font-semibold">Local Storage</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-400">{file.dateAdded || 'Today'}</td>
                        <td className="p-4 font-semibold text-slate-700">{file.size || 'Media'}</td>
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setActiveMedia(file)}
                            className="text-indigo-600 hover:text-indigo-800 font-extrabold cursor-pointer mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setActiveMedia(file);
                              setShowDeleteConfirm(true);
                            }}
                            className="text-rose-600 hover:text-rose-800 font-extrabold cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MEDIA DETAILS DRAWER / MODAL */}
      {activeMedia && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <HardDrive className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 truncate max-w-sm">
                    {activeMedia.fileName || 'Media Details'}
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400 truncate">ID: {activeMedia.id}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveMedia(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Preview Player / Viewer */}
              <div className="bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center min-h-[220px] max-h-[360px] relative border border-slate-800 shadow-inner">
                {isVideoUrl(activeMedia.url, activeMedia.mimeType, activeMedia.fileName) ? (
                  <video
                    src={activeMedia.url}
                    controls
                    autoPlay
                    loop
                    className="max-h-[350px] w-auto mx-auto object-contain"
                  />
                ) : isPdfOrDocUrl(activeMedia.url, activeMedia.mimeType, activeMedia.fileName) ? (
                  <div className="text-center p-8 text-white space-y-2">
                    <FileText className="h-12 w-12 text-indigo-400 mx-auto" />
                    <p className="text-xs font-bold">{activeMedia.fileName}</p>
                    <a
                      href={activeMedia.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-300 underline font-semibold"
                    >
                      Open Document in new tab <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ) : (
                  <img
                    src={activeMedia.url}
                    alt={activeMedia.altText || activeMedia.fileName || 'Media'}
                    className="max-h-[350px] w-auto mx-auto object-contain"
                  />
                )}
              </div>

              {/* Editable Metadata & Cloudinary Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Left Column: Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">File Name</label>
                    <input
                      type="text"
                      value={editFileName}
                      onChange={(e) => setEditFileName(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      placeholder="e.g. hero-banner.jpg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Alternative Alt Text</label>
                    <input
                      type="text"
                      value={editAltText}
                      onChange={(e) => setEditAltText(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      placeholder="Describe image for SEO and accessibility"
                    />
                  </div>

                  <button
                    onClick={handleSaveMetadata}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>

                {/* Right Column: Technical Cloudinary Specs & Copy Links */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3.5 text-xs">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    Cloudinary CDN Specs
                  </h4>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between border-b border-slate-200/60 pb-1">
                      <span className="text-slate-500">Public ID:</span>
                      <span className="font-mono font-bold text-slate-800">{activeMedia.publicId || 'Local Asset'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1">
                      <span className="text-slate-500">Resource Type:</span>
                      <span className="font-semibold text-slate-800 uppercase">{activeMedia.resourceType || 'image'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1">
                      <span className="text-slate-500">File Size:</span>
                      <span className="font-semibold text-slate-800">{activeMedia.size || activeMedia.fileSize || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-slate-500">Folder:</span>
                      <span className="font-mono text-slate-800">{activeMedia.folder || 'storefront_media'}</span>
                    </div>
                  </div>

                  {/* Copy Link Buttons */}
                  <div className="pt-2 space-y-1.5">
                    <button
                      onClick={() => handleCopy(activeMedia.url, 'url')}
                      className="w-full flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <span className="truncate max-w-[200px]">Copy Direct URL</span>
                      {copiedField === 'url' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Linked Store References Section */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-amber-600" /> Linked Store References
                  </h4>
                  {checkingRefs && <RefreshCw className="h-3.5 w-3.5 text-amber-600 animate-spin" />}
                </div>

                {mediaRefs.length === 0 ? (
                  <p className="text-[11px] text-amber-700">This media asset is currently not linked to any active products, collections, or pages.</p>
                ) : (
                  <ul className="text-[11px] text-amber-800 list-disc list-inside space-y-0.5 font-medium">
                    {mediaRefs.map((ref, idx) => (
                      <li key={idx}>{ref}</li>
                    ))}
                  </ul>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => handleDeleteActiveMedia(false)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Media File
              </button>

              <button
                onClick={() => setActiveMedia(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION WARNING MODAL IF REFERENCED */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100000] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-100 p-6 max-w-md w-full space-y-4 animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Media In Use Warning</h3>
                <p className="text-xs text-slate-500 mt-1">
                  This media file is currently referenced in your store:
                </p>
                <ul className="mt-2 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl list-disc list-inside space-y-1 font-semibold max-h-32 overflow-y-auto">
                  {mediaRefs.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
                <p className="text-[11px] text-slate-400 mt-2">
                  Deleting it will permanently remove it from Cloudinary CDN and Neon PostgreSQL, causing broken image links on these store pages.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteActiveMedia(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Yes, Force Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FilesTab;
