import React from 'react';
import { 
  Search, Download, Upload, Plus, Trash2, FileEdit, ArrowLeft, Sparkles, Pencil, Calendar, X, Eye 
} from 'lucide-react';
import { BlogPost } from '../../types';
import BlogContentEditor from '../BlogContentEditor';
import ImageUploadInput from '../ImageUploadInput';

interface BlogsTabProps {
  showAddBlog: boolean;
  setShowAddBlog: (val: boolean) => void;
  selectedBlog: BlogPost | null;
  setSelectedBlog: (blog: BlogPost | null) => void;
  blogQuery: string;
  setBlogQuery: (val: string) => void;
  blogStatusFilter: 'All' | 'Active' | 'Draft' | 'Archived';
  setBlogStatusFilter: (val: 'All' | 'Active' | 'Draft' | 'Archived') => void;
  handleExportBlogs: () => void;
  handleImportBlogs: (e: React.ChangeEvent<HTMLInputElement>) => void;
  newBlogForm: any;
  setNewBlogForm: React.Dispatch<React.SetStateAction<any>>;
  blogTagsInput: string;
  setBlogTagsInput: (val: string) => void;
  filteredBlogs: BlogPost[];
  handleDeleteBlog: (id: string) => void;
  handleUpdateBlog: (e: React.FormEvent) => void;
  handleCreateBlog: (e: React.FormEvent) => void;
  cleanMediaUrl: (url: string) => string;
  slugify: (text: string) => string;
}

export const BlogsTab: React.FC<BlogsTabProps> = ({
  showAddBlog,
  setShowAddBlog,
  selectedBlog,
  setSelectedBlog,
  blogQuery,
  setBlogQuery,
  blogStatusFilter,
  setBlogStatusFilter,
  handleExportBlogs,
  handleImportBlogs,
  newBlogForm,
  setNewBlogForm,
  blogTagsInput,
  setBlogTagsInput,
  filteredBlogs,
  handleDeleteBlog,
  handleUpdateBlog,
  handleCreateBlog,
  cleanMediaUrl,
  slugify
}) => {
  return (
    <div className="space-y-6">
      {!showAddBlog && !selectedBlog ? (
        <>
          {/* Header controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search blogs by title or tag..."
                  value={blogQuery}
                  onChange={(e) => setBlogQuery(e.target.value)}
                  className="w-full text-xs p-2 pb-2 pl-8 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500 bg-slate-50"
                />
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>

              <select
                value={blogStatusFilter}
                onChange={(e) => setBlogStatusFilter(e.target.value as any)}
                className="text-xs p-2 border border-slate-200 rounded-lg focus:outline-none bg-slate-50 cursor-pointer min-w-[120px]"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportBlogs}
                className="bg-white hover:bg-slate-50 border border-slate-200 font-bold p-2.5 px-3 rounded-xl text-xs text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Export all blogs to JSON backup file"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" /> Export Backup
              </button>

              <label
                className="bg-white hover:bg-slate-50 border border-slate-200 font-bold p-2.5 px-3 rounded-xl text-xs text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs cursor-pointer"
                title="Import blogs from JSON backup"
              >
                <Upload className="h-3.5 w-3.5 text-slate-500" /> Import Backup
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportBlogs}
                />
              </label>

              <button
                onClick={() => {
                  setNewBlogForm({
                    title: '', excerpt: '', content: '', image: '',
                    author: 'Admin', category: 'General', status: 'Active',
                    publishedAt: '', readTime: '5 min read', tags: []
                  });
                  setBlogTagsInput('');
                  setShowAddBlog(true);
                }}
                className="bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs p-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Create Blog Post
              </button>
            </div>
          </div>

          {/* Blogs list table */}
          <div className="bg-white border rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] text-slate-450 font-bold uppercase tracking-widest">
                    <th className="p-4">Article</th>
                    <th className="p-4">Author & Category</th>
                    <th className="p-4">Slug / Route</th>
                    <th className="p-4">Stats</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Published At</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBlogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">No blog posts found matching criteria.</td>
                    </tr>
                  ) : (
                    filteredBlogs.map(blog => (
                      <tr key={blog.id} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3 min-w-[280px]">
                            <img 
                              src={blog.image} 
                              alt={blog.title} 
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 object-cover rounded-lg border border-slate-150 shrink-0" 
                            />
                            <div>
                              <h4 className="font-bold text-slate-900 text-xs hover:text-indigo-650 transition cursor-pointer" onClick={() => {
                                setSelectedBlog(blog);
                                setBlogTagsInput(blog.tags.join(', '));
                              }}>{blog.title}</h4>
                              <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 max-w-xs">{blog.excerpt}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {blog.tags.map((t, idx) => (
                                  <span key={idx} className="bg-slate-50 text-[9px] text-slate-500 rounded px-1.5 font-medium border border-slate-150">#{t}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-800">{blog.author}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{blog.category}</div>
                        </td>
                        <td className="p-4 font-mono text-[10px] text-slate-500">
                          /blogs/{blog.slug}
                        </td>
                        <td className="p-4 text-slate-500">
                          <div className="font-semibold text-slate-700">{blog.readTime}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{blog.content ? blog.content.split(/\s+/).length : 0} words</div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-block py-0.5 px-2 rounded-full font-black text-[9px] uppercase tracking-wide border ${
                            blog.status === 'Active' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                              : blog.status === 'Draft' 
                              ? 'bg-gray-100 text-gray-700 border-gray-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-150'
                          }`}>
                            {blog.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 font-semibold text-[11px]">
                          {blog.publishedAt}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => {
                                setSelectedBlog(blog);
                                setBlogTagsInput(blog.tags.join(', '));
                              }}
                              className="p-1 px-1.5 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 transition cursor-pointer"
                              title="Edit Article"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteBlog(blog.id)}
                              className="p-1 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded-md transition cursor-pointer"
                              title="Delete Article"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* HIGH FIDELITY EDITOR SCREEN */
        (() => {
          const isEdit = !!selectedBlog;
          const titleValue = isEdit ? selectedBlog.title : (newBlogForm.title || '');
          const slugValue = isEdit ? selectedBlog.slug : (newBlogForm.slug || '');
          const contentValue = isEdit ? selectedBlog.content : (newBlogForm.content || '');
          const excerptValue = isEdit ? selectedBlog.excerpt : (newBlogForm.excerpt || '');
          const statusValue = isEdit ? selectedBlog.status : (newBlogForm.status || 'Active');
          const imageValue = isEdit ? selectedBlog.image : (newBlogForm.image || '');
          const authorValue = isEdit ? selectedBlog.author : (newBlogForm.author || 'neha bhardwaz');
          const categoryValue = isEdit ? selectedBlog.category : (newBlogForm.category || 'News');
          const tagsValue = blogTagsInput;

          const setContentValue = (val: string) => {
            if (isEdit) {
              setSelectedBlog({ ...selectedBlog!, content: val });
            } else {
              setNewBlogForm({ ...newBlogForm, content: val });
            }
          };

          const setExcerptValue = (val: string) => {
            if (isEdit) {
              setSelectedBlog({ ...selectedBlog!, excerpt: val });
            } else {
              setNewBlogForm({ ...newBlogForm, excerpt: val });
            }
          };

          const setSlugValue = (val: string) => {
            if (isEdit) {
              setSelectedBlog({ ...selectedBlog!, slug: val });
            } else {
              setNewBlogForm({ ...newBlogForm, slug: val });
            }
          };

          const setStatusValue = (val: 'Active' | 'Draft' | 'Archived') => {
            if (isEdit) {
              setSelectedBlog({ ...selectedBlog!, status: val });
            } else {
              setNewBlogForm({ ...newBlogForm, status: val });
            }
          };

          const setImageValue = (val: string) => {
            if (isEdit) {
              setSelectedBlog({ ...selectedBlog!, image: val });
            } else {
              setNewBlogForm({ ...newBlogForm, image: val });
            }
          };

          const setAuthorValue = (val: string) => {
            if (isEdit) {
              setSelectedBlog({ ...selectedBlog!, author: val });
            } else {
              setNewBlogForm({ ...newBlogForm, author: val });
            }
          };

          const setCategoryValue = (val: string) => {
            if (isEdit) {
              setSelectedBlog({ ...selectedBlog!, category: val });
            } else {
              setNewBlogForm({ ...newBlogForm, category: val });
            }
          };

          const setTagsValue = (val: string) => {
            setBlogTagsInput(val);
          };

          return (
            <div className="max-w-6xl mx-auto space-y-6 text-xs text-left bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
              {/* Top breadcrumb navigation row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <FileEdit className="h-4 w-4 text-slate-600" />
                  <span>›</span>
                  <span className="text-slate-900 font-bold text-sm">
                    {isEdit ? 'Edit blog post' : 'Add blog post'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowAddBlog(false); setSelectedBlog(null); }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white shadow-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to blog posts
                </button>
              </div>

              {/* Two-column layout */}
              <form 
                onSubmit={isEdit ? handleUpdateBlog : handleCreateBlog} 
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-5">
                  
                  {/* Title Card */}
                  <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-5 text-left">
                    <label className="block text-slate-700 font-semibold text-xs mb-1.5">Title</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        required
                        placeholder="e.g., Blog about your latest products or deals"
                        value={titleValue}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (isEdit) {
                            setSelectedBlog({
                              ...selectedBlog!,
                              title: val,
                              slug: slugify(val)
                            });
                          } else {
                            setNewBlogForm({
                              ...newBlogForm,
                              title: val,
                              slug: slugify(val)
                            });
                          }
                        }}
                        className="w-full text-xs font-semibold border border-slate-200 p-2.5 pr-10 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 text-slate-850"
                      />
                      <div className="absolute right-3 cursor-pointer text-slate-400 hover:text-indigo-650 transition" title="Auto-format title">
                        <Sparkles className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Content Card */}
                  <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-5 text-left">
                    <label className="block text-slate-700 font-semibold text-xs mb-1.5">Content</label>
                    <BlogContentEditor 
                      value={contentValue} 
                      onChange={setContentValue} 
                      placeholder="Write article details. Supports rich HTML editing, lists, headings, and custom tags."
                    />
                  </div>

                  {/* Excerpt Card */}
                  <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-5 text-left">
                    <div className="flex justify-between items-center mb-2.5">
                      <label className="block text-slate-700 font-semibold text-xs">Excerpt</label>
                      <Pencil className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" />
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Add a summary of the post to appear on your home page or blog."
                      value={excerptValue}
                      onChange={(e) => setExcerptValue(e.target.value)}
                      className="w-full border border-slate-200 p-2.5 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white leading-relaxed resize-none font-medium"
                    />
                  </div>

                  {/* Search engine listing Card */}
                  <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-5 text-left">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-slate-700 font-semibold text-xs">Search engine listing</label>
                      <Pencil className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" />
                    </div>
                    <p className="text-[10.5px] text-slate-400 leading-normal mb-3 font-medium">
                      Add a title and description to see how this blog post might appear in a search engine listing
                    </p>
                    
                    <div className="space-y-3.5 border-t border-slate-100 pt-3">
                      <div>
                        <label className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider mb-1">URL Route Handle (Slug)</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-[11px] text-slate-400 font-medium select-none">/blogs/</span>
                          <input
                            type="text"
                            required
                            placeholder="slug-route-handle"
                            value={slugValue}
                            onChange={(e) => setSlugValue(slugify(e.target.value))}
                            className="w-full text-xs font-semibold border border-slate-200 p-2 pl-14 rounded bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono text-slate-755"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Column */}
                <div className="lg:col-span-1 space-y-5">
                  
                  {/* Visibility Card */}
                  <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-4 text-left">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-slate-700 font-semibold text-xs">Visibility</label>
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <div className="space-y-2.5 pt-1">
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                        <input 
                          type="radio" 
                          name="visibility" 
                          checked={statusValue === 'Active'} 
                          onChange={() => setStatusValue('Active')} 
                          className="h-3.5 w-3.5 text-slate-900 focus:ring-slate-900 border-slate-305"
                        />
                        <span>Visible</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                        <input 
                          type="radio" 
                          name="visibility" 
                          checked={statusValue === 'Draft'} 
                          onChange={() => setStatusValue('Draft')} 
                          className="h-3.5 w-3.5 text-slate-900 focus:ring-slate-900 border-slate-305"
                        />
                        <span>Hidden</span>
                      </label>
                    </div>
                  </div>

                  {/* Image Card */}
                  <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-4 text-left">
                    <ImageUploadInput
                      label="Featured Cover Image"
                      value={imageValue}
                      onChange={(url) => setImageValue(url)}
                      placeholder="Paste image URL or select from File Manager..."
                    />
                  </div>

                  {/* Organization Card */}
                  <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-4 text-left space-y-3">
                    <label className="block text-slate-700 font-semibold text-xs pb-1.5 border-b border-slate-100">Organization</label>
                    
                    <div>
                      <label className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider mb-1">Author</label>
                      <input
                        type="text"
                        placeholder="e.g., neha bhardwaz"
                        value={authorValue}
                        onChange={(e) => setAuthorValue(e.target.value)}
                        className="w-full text-xs font-semibold border border-slate-200 p-2 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider mb-1">Blog</label>
                      <select
                        value={categoryValue}
                        onChange={(e) => setCategoryValue(e.target.value)}
                        className="w-full text-xs font-semibold border border-slate-200 p-2 rounded-lg bg-white focus:outline-none cursor-pointer text-slate-750"
                      >
                        <option value="News">News</option>
                        <option value="Chemistry & Science">Chemistry & Science</option>
                        <option value="Buying Guides">Buying Guides</option>
                        <option value="Tips & Hacks">Tips & Hacks</option>
                        <option value="Industry Trends">Industry Trends</option>
                        <option value="General">General</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider mb-1">Tags</label>
                      <input
                        type="text"
                        placeholder="e.g. Science, Organic, Pouch"
                        value={tagsValue}
                        onChange={(e) => setTagsValue(e.target.value)}
                        className="w-full text-xs font-semibold border border-slate-200 p-2 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>
                  </div>

                  {/* Theme template Card */}
                  <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-4 text-left">
                    <div className="flex justify-between items-center mb-2.5">
                      <label className="block text-slate-700 font-semibold text-xs">Theme template</label>
                      <Eye className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <select
                      className="w-full text-xs font-semibold border border-slate-200 p-2 rounded-lg bg-white focus:outline-none cursor-pointer text-slate-750"
                      defaultValue="default-post"
                    >
                      <option value="default-post">Default blog post</option>
                      <option value="custom-post">Custom layout template</option>
                    </select>
                  </div>

                </div>

                {/* Bottom right actions layout block */}
                <div className="lg:col-span-3 pt-4 border-t border-slate-200/60 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowAddBlog(false); setSelectedBlog(null); }}
                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2 px-5 rounded-lg cursor-pointer text-xs transition shadow-2xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-850 text-white font-bold py-2 px-6 rounded-lg cursor-pointer text-xs shadow-sm transition"
                  >
                    Save
                  </button>
                </div>

              </form>
            </div>
          );
        })()
      )}
    </div>
  );
};

export default BlogsTab;
