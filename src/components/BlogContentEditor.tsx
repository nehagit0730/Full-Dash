import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Link, Image as ImageIcon, Video, Code, Sparkles, ChevronDown, 
  MoreHorizontal, X, Table, Sparkle
} from 'lucide-react';
import ImageUploadInput from './ImageUploadInput';

interface BlogContentEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function BlogContentEditor({ 
  value, 
  onChange, 
  placeholder = "Write article details..." 
}: BlogContentEditorProps) {
  const [isCodeView, setIsCodeView] = useState(false);
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showAlignDropdown, setShowAlignDropdown] = useState(false);
  const [showAiDropdown, setShowAiDropdown] = useState(false);
  const [activeBlockFormat, setActiveBlockFormat] = useState('p');

  // Interactive inline styling active states
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  const [isUnderlineActive, setIsUnderlineActive] = useState(false);
  const [isAlignLeftActive, setIsAlignLeftActive] = useState(false);
  const [isAlignCenterActive, setIsAlignCenterActive] = useState(false);
  const [isAlignRightActive, setIsAlignRightActive] = useState(false);
  
  const blockFormatLabels: Record<string, string> = {
    p: 'Paragraph',
    h1: 'Heading 1',
    h2: 'Heading 2',
    h3: 'Heading 3'
  };

  // Custom dialog overlays
  const [activeModal, setActiveModal] = useState<'link' | 'image' | 'video' | 'table' | null>(null);
  
  // Dialog form states
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowHeadingDropdown(false);
        setShowColorDropdown(false);
        setShowAlignDropdown(false);
        setShowAiDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sync value to rich text contentEditable ONLY if it's different
  useEffect(() => {
    if (!isCodeView && editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '<p><br></p>';
      }
    }
  }, [value, isCodeView]);

  // Set default paragraph separator to standard paragraphs on load
  useEffect(() => {
    if (!isCodeView && editorRef.current) {
      try {
        document.execCommand('defaultParagraphSeparator', false, 'p');
      } catch (e) {
        console.warn('defaultParagraphSeparator not supported', e);
      }
    }
  }, [isCodeView]);

  // Dynamic selector for active heading or paragraph based on cursor / selection
  const updateActiveBlockFormat = useCallback(() => {
    if (isCodeView) return;
    
    if (typeof document !== 'undefined') {
      try {
        setIsBoldActive(document.queryCommandState('bold'));
        setIsItalicActive(document.queryCommandState('italic'));
        setIsUnderlineActive(document.queryCommandState('underline'));
        setIsAlignLeftActive(document.queryCommandState('justifyLeft'));
        setIsAlignCenterActive(document.queryCommandState('justifyCenter'));
        setIsAlignRightActive(document.queryCommandState('justifyRight'));
      } catch (e) {}
    }

    if (typeof window !== 'undefined') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        let node: Node | null = selection.getRangeAt(0).startContainer;
        
        // Ensure the selection context is inside our active editor component
        if (editorRef.current && editorRef.current.contains(node)) {
          while (node && node !== editorRef.current) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const tagName = (node as Element).tagName.toLowerCase();
              if (['h1', 'h2', 'h3', 'p', 'div'].includes(tagName)) {
                if (tagName === 'div') {
                  setActiveBlockFormat('p');
                } else {
                  setActiveBlockFormat(tagName);
                }
                return;
              }
            }
            node = node.parentNode;
          }
        }
      }
    }
    setActiveBlockFormat('p');
  }, [isCodeView]);

  // Setup standard selectionchange listener on focused document
  useEffect(() => {
    if (isCodeView) return;

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const node = selection.getRangeAt(0).startContainer;
        if (editorRef.current && editorRef.current.contains(node)) {
          updateActiveBlockFormat();
        }
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [isCodeView, updateActiveBlockFormat]);

  // Handle rich text input changes
  const handleVisualInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      // If it's just an empty line browser representation, treat as empty
      if (html === '<p><br></p>' || html === '<br>' || html === '<div><br></div>') {
        onChange('');
      } else {
        onChange(html);
      }
    }
  };

  // Helper to execute commands in visual mode
  const executeCommand = (command: string, arg: string = '') => {
    if (isCodeView) {
      // In code mode, apply helper tags
      if (command === 'bold') insertCodeTag('<strong>', '</strong>');
      if (command === 'italic') insertCodeTag('<em>', '</em>');
      if (command === 'underline') insertCodeTag('<span style="text-decoration: underline;">', '</span>');
      if (command === 'justifyLeft') insertCodeTag('<div style="text-align: left;">', '</div>');
      if (command === 'justifyCenter') insertCodeTag('<div style="text-align: center;">', '</div>');
      if (command === 'justifyRight') insertCodeTag('<div style="text-align: right;">', '</div>');
      return;
    }

    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, arg);
      handleVisualInput();
    }
  };

  // Helper to insert code tags at current cursor in raw Textarea
  const insertCodeTag = (before: string, after: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const replacement = before + selectedText + after;
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    onChange(newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  // Sync scrolling of lines numbers column and textarea
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Format Heading selection
  const handleSelectHeading = (tag: string) => {
    setShowHeadingDropdown(false);
    setActiveBlockFormat(tag);
    if (isCodeView) {
      insertCodeTag(`<${tag}>`, `</${tag}>`);
    } else {
      if (editorRef.current) {
        editorRef.current.focus();
        
        // Let's try converting the current block element directly
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          let node: Node | null = selection.getRangeAt(0).startContainer;
          let blockNode: HTMLElement | null = null;
          
          if (editorRef.current.contains(node)) {
            while (node && node !== editorRef.current) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = (node as Element).tagName.toLowerCase();
                if (['h1', 'h2', 'h3', 'p', 'div'].includes(tagName)) {
                  blockNode = node as HTMLElement;
                  break;
                }
              }
              node = node.parentNode;
            }
          }
          
          if (blockNode && blockNode.tagName.toLowerCase() !== tag) {
            // Create a new element with the target tag and copy content + child nodes
            const newElement = document.createElement(tag);
            newElement.innerHTML = blockNode.innerHTML;
            
            // Preserve alignment classes if they exist
            if (blockNode.className) {
              newElement.className = blockNode.className;
            }
            if (blockNode.style.textAlign) {
              newElement.style.textAlign = blockNode.style.textAlign;
            }
            if (blockNode.style.color) {
              newElement.style.color = blockNode.style.color;
            }
            
            blockNode.parentNode?.replaceChild(newElement, blockNode);
            
            // Restore selection / cursor inside the new element
            const range = document.createRange();
            range.selectNodeContents(newElement);
            range.collapse(false); // Move to end of node
            selection.removeAllRanges();
            selection.addRange(range);
            
            handleVisualInput();
            setTimeout(updateActiveBlockFormat, 50);
            return;
          }
        }
        
        // Fallback to standard execCommand formatBlock
        try {
          document.execCommand('formatBlock', false, tag);
        } catch (e) {
          try {
            document.execCommand('formatBlock', false, `<${tag}>`);
          } catch (err) {
            console.error('formatBlock error', err);
          }
        }
        handleVisualInput();
        setTimeout(updateActiveBlockFormat, 50);
      }
    }
  };

  // Format Color selection
  const handleSelectColor = (color: string) => {
    setShowColorDropdown(false);
    if (isCodeView) {
      insertCodeTag(`<span style="color: ${color};">`, '</span>');
    } else {
      executeCommand('foreColor', color);
    }
  };

  // Insert custom components/elements
  const handleInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    const url = linkUrl.trim() || '#';
    const text = linkText.trim() || url;
    setActiveModal(null);
    setLinkUrl('');
    setLinkText('');

    if (isCodeView) {
      insertCodeTag(`<a href="${url}" target="_blank" class="text-indigo-650 underline font-medium hover:text-indigo-800 transition">${text}</a>`, '');
    } else {
      if (editorRef.current) {
        editorRef.current.focus();
        // Set up the selection range or insert HTML directly
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const linkNode = document.createElement('a');
          linkNode.href = url;
          linkNode.target = '_blank';
          linkNode.className = 'text-indigo-650 underline font-medium hover:text-indigo-800 transition';
          linkNode.innerText = text;
          range.deleteContents();
          range.insertNode(linkNode);
        } else {
          document.execCommand('insertHTML', false, `<a href="${url}" target="_blank" class="text-indigo-650 underline font-medium hover:text-indigo-800 transition">${text}</a>`);
        }
        handleVisualInput();
      }
    }
  };

  const handleInsertImage = (e: React.FormEvent) => {
    e.preventDefault();
    const url = imageUrl.trim();
    if (!url) return;
    setActiveModal(null);
    setImageUrl('');

    const html = `<img src="${url}" alt="Blog Image" class="w-full h-auto object-cover rounded-xl my-4 border border-slate-150 shadow-xs" referrerPolicy="no-referrer" />`;
    if (isCodeView) {
      insertCodeTag(html, '');
    } else {
      executeCommand('insertHTML', html);
    }
  };

  const handleInsertVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const url = videoUrl.trim();
    if (!url) return;
    setActiveModal(null);
    setVideoUrl('');

    // Transform youtube standard link into embed link if needed
    let finalUrl = url;
    if (url.includes('youtube.com/watch?v=')) {
      const vid = url.split('v=')[1]?.split('&')[0];
      if (vid) finalUrl = `https://www.youtube.com/embed/${vid}`;
    } else if (url.includes('youtu.be/')) {
      const vid = url.split('youtu.be/')[1]?.split('?')[0];
      if (vid) finalUrl = `https://www.youtube.com/embed/${vid}`;
    }

    const html = `<div class="relative w-full aspect-video rounded-xl overflow-hidden my-4 border border-slate-200"><iframe src="${finalUrl}" class="absolute inset-0 w-full h-full" frameborder="0" allowfullscreen></iframe></div>`;
    if (isCodeView) {
      insertCodeTag(html, '');
    } else {
      executeCommand('insertHTML', html);
    }
  };

  const handleInsertTable = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveModal(null);
    
    let tableHtml = '<table class="w-full border-collapse border border-slate-200 my-4 text-xs text-left">\n';
    tableHtml += '  <thead>\n    <tr class="bg-slate-50 border-b border-slate-200">\n';
    for (let c = 0; c < tableCols; c++) {
      tableHtml += `      <th class="border border-slate-200 p-2.5 font-bold text-slate-700">Column ${c + 1}</th>\n`;
    }
    tableHtml += '    </tr>\n  </thead>\n  <tbody>\n';
    for (let r = 0; r < tableRows; r++) {
      tableHtml += '    <tr class="border-b border-slate-100">\n';
      for (let c = 0; c < tableCols; c++) {
        tableHtml += '      <td class="border border-slate-200 p-2.5 text-slate-600">Cell data</td>\n';
      }
      tableHtml += '    </tr>\n';
    }
    tableHtml += '  </tbody>\n</table>';

    if (isCodeView) {
      insertCodeTag(tableHtml, '');
    } else {
      executeCommand('insertHTML', tableHtml);
    }
  };

  const handleAiWrite = (templateType: string) => {
    setShowAiDropdown(false);
    let generatedHtml = '';
    
    if (templateType === 'intro') {
      generatedHtml = `<p>Welcome to our definitive guide! In the fast-evolving world of premium compounding standards, choosing the correct ingredients and understanding raw chemistry properties is essential for crafting superior, eye-safe, and highly satisfying solutions. Today, we break down the leading hacks that store owners and consumers can utilize immediately.</p>`;
    } else if (templateType === 'hacks') {
      generatedHtml = `<h3>Top 3 Hacks For Canister Storage</h3>
<p>To preserve fresh moisture, taste consistency, and organic strength, proper storage environment parameters are key:</p>
<ul class="list-disc pl-5 my-2 space-y-1">
  <li><strong>Hack 1: Maintain tight temperature seals</strong> - Storing canisters away from direct sunlight at steady room temperatures blocks crystallization.</li>
  <li><strong>Hack 2: Use low-humidity buffer packets</strong> - Incorporating food-safe humidity sheets guards the structural moisture.</li>
  <li><strong>Hack 3: Rotational stocking</strong> - Implement first-in, first-out stock systems so users enjoy the peak chemical integrity.</li>
</ul>`;
    } else if (templateType === 'science') {
      generatedHtml = `<h3>The Science Behind Modern Formulation</h3>
<p>Analytical laboratory studies demonstrate that food-grade compounds react dynamically to atmosphere conditions. When molecules encounter humidity, they form covalent buffers. Formulators can offset this degradation through pure organic additives, securing a longer shelf-life and pristine product quality.</p>`;
    } else if (templateType === 'conclusion') {
      generatedHtml = `<p><strong>Summary:</strong> By implementing these premium compound and storage standards, you secure ultimate product consistency. Subscribe to our monthly journal to keep your laboratory compounds, buying guidelines, and warehouse science fully optimized.</p>`;
    }

    if (isCodeView) {
      insertCodeTag(generatedHtml, '');
    } else {
      executeCommand('insertHTML', generatedHtml);
    }
  };

  // Split lines for Code View numbers list
  const codeLines = (value || '').split('\n');

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mt-1.5 flex flex-col bg-white relative">
      {/* TOOLBAR */}
      <div className="flex items-center gap-1 sm:gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200 flex-wrap select-none">
        
        {/* AI Sparkles */}
        <div className="relative">
          <button 
            type="button" 
            onClick={() => setShowAiDropdown(!showAiDropdown)}
            className={`p-1.5 rounded transition text-slate-500 hover:bg-slate-150 flex items-center gap-1 cursor-pointer ${showAiDropdown ? 'bg-indigo-50 text-indigo-700' : ''}`} 
            title="Smart AI Copywriter"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <ChevronDown className="h-2.5 w-2.5 text-slate-400" />
          </button>
          {showAiDropdown && (
            <div className="absolute left-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-40 text-left text-[11px] space-y-1">
              <div className="px-2 py-1 font-bold text-slate-450 uppercase tracking-widest text-[8px] border-b border-slate-100">
                AI COPYWRITER TEMPLATES
              </div>
              <button
                type="button"
                onClick={() => handleAiWrite('intro')}
                className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-lg font-semibold text-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkle className="h-3 w-3 text-indigo-500" /> Write Engaging Intro
              </button>
              <button
                type="button"
                onClick={() => handleAiWrite('hacks')}
                className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-lg font-semibold text-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkle className="h-3 w-3 text-amber-500" /> Write Tips & Hacks List
              </button>
              <button
                type="button"
                onClick={() => handleAiWrite('science')}
                className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-lg font-semibold text-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkle className="h-3 w-3 text-emerald-500" /> Science & Compounds Review
              </button>
              <button
                type="button"
                onClick={() => handleAiWrite('conclusion')}
                className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-lg font-semibold text-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkle className="h-3 w-3 text-sky-500" /> Write Conclusion Summary
              </button>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-slate-200" />

        {/* Headings Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowHeadingDropdown(!showHeadingDropdown)}
            onMouseDown={(e) => e.preventDefault()}
            className="text-[10.5px] font-bold text-slate-650 px-2 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer flex items-center gap-1"
          >
            <span>{blockFormatLabels[activeBlockFormat] || 'Paragraph'}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
          
          {showHeadingDropdown && (
            <div className="absolute left-0 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-40 text-left text-[11px] space-y-0.5">
              <button
                type="button"
                onClick={() => handleSelectHeading('p')}
                onMouseDown={(e) => e.preventDefault()}
                className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-slate-700 font-medium transition cursor-pointer"
              >
                Paragraph
              </button>
              <button
                type="button"
                onClick={() => handleSelectHeading('h1')}
                onMouseDown={(e) => e.preventDefault()}
                className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-lg font-black text-slate-900 text-sm transition cursor-pointer"
              >
                Heading 1
              </button>
              <button
                type="button"
                onClick={() => handleSelectHeading('h2')}
                onMouseDown={(e) => e.preventDefault()}
                className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-lg font-extrabold text-slate-800 transition cursor-pointer"
              >
                Heading 2
              </button>
              <button
                type="button"
                onClick={() => handleSelectHeading('h3')}
                onMouseDown={(e) => e.preventDefault()}
                className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-lg font-bold text-slate-700 transition cursor-pointer"
              >
                Heading 3
              </button>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-slate-200" />

        {/* Font Formats: B, I, U */}
        <button 
          type="button" 
          onClick={() => executeCommand('bold')}
          onMouseDown={(e) => e.preventDefault()}
          className={`p-1.5 rounded transition min-w-[24px] cursor-pointer ${isBoldActive ? 'bg-indigo-50 text-indigo-700 font-black' : 'hover:bg-slate-150 text-slate-750'}`} 
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-3.5 w-3.5 mx-auto" />
        </button>

        <button 
          type="button" 
          onClick={() => executeCommand('italic')}
          onMouseDown={(e) => e.preventDefault()}
          className={`p-1.5 rounded transition min-w-[24px] cursor-pointer ${isItalicActive ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-150 text-slate-750'}`} 
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-3.5 w-3.5 mx-auto" />
        </button>

        <button 
          type="button" 
          onClick={() => executeCommand('underline')}
          onMouseDown={(e) => e.preventDefault()}
          className={`p-1.5 rounded transition min-w-[24px] cursor-pointer ${isUnderlineActive ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-150 text-slate-750'}`} 
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-3.5 w-3.5 mx-auto" />
        </button>

        {/* Font Color Picker Dropdown */}
        <div className="relative">
          <button 
            type="button" 
            onClick={() => setShowColorDropdown(!showColorDropdown)}
            onMouseDown={(e) => e.preventDefault()}
            className="p-1.5 hover:bg-slate-150 rounded text-slate-750 text-[11px] transition flex items-center gap-0.5 cursor-pointer" 
            title="Font Color"
          >
            <span className="font-bold border-b-2 border-indigo-650 leading-none">A</span>
            <ChevronDown className="h-2.5 w-2.5 text-slate-400" />
          </button>
          
          {showColorDropdown && (
            <div className="absolute left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-40 flex gap-1.5">
              {[
                { color: '#0f172a', label: 'Default' },
                { color: '#b91c1c', label: 'Crimson' },
                { color: '#1d4ed8', label: 'Sapphire' },
                { color: '#15803d', label: 'Emerald' },
                { color: '#b45309', label: 'Amber' }
              ].map((item) => (
                <button
                  key={item.color}
                  type="button"
                  onClick={() => handleSelectColor(item.color)}
                  onMouseDown={(e) => e.preventDefault()}
                  className="w-5 h-5 rounded-full border border-slate-300 shadow-xs cursor-pointer hover:scale-110 transition"
                  style={{ backgroundColor: item.color }}
                  title={item.label}
                />
              ))}
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-slate-200" />

        {/* Alignment Dropdown */}
        <div className="relative">
          <button 
            type="button" 
            onClick={() => setShowAlignDropdown(!showAlignDropdown)}
            onMouseDown={(e) => e.preventDefault()}
            className={`p-1.5 rounded transition cursor-pointer flex items-center ${isAlignLeftActive || isAlignCenterActive || isAlignRightActive ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-150 text-slate-500'}`} 
            title="Align Text"
          >
            {isAlignCenterActive ? (
              <AlignCenter className="h-3.5 w-3.5" />
            ) : isAlignRightActive ? (
              <AlignRight className="h-3.5 w-3.5" />
            ) : (
              <AlignLeft className="h-3.5 w-3.5" />
            )}
            <ChevronDown className="h-2.5 w-2.5 text-slate-400 ml-0.5" />
          </button>
          
          {showAlignDropdown && (
            <div className="absolute left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-40 text-left text-[11px] space-y-0.5">
              <button
                type="button"
                onClick={() => { setShowAlignDropdown(false); executeCommand('justifyLeft'); }}
                onMouseDown={(e) => e.preventDefault()}
                className={`w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-slate-700 font-medium transition flex items-center gap-1.5 cursor-pointer ${isAlignLeftActive ? 'bg-indigo-50/50 text-indigo-700' : ''}`}
              >
                <AlignLeft className="h-3 w-3" /> Align Left
              </button>
              <button
                type="button"
                onClick={() => { setShowAlignDropdown(false); executeCommand('justifyCenter'); }}
                onMouseDown={(e) => e.preventDefault()}
                className={`w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-slate-700 font-medium transition flex items-center gap-1.5 cursor-pointer ${isAlignCenterActive ? 'bg-indigo-50/50 text-indigo-700' : ''}`}
              >
                <AlignCenter className="h-3 w-3" /> Align Center
              </button>
              <button
                type="button"
                onClick={() => { setShowAlignDropdown(false); executeCommand('justifyRight'); }}
                onMouseDown={(e) => e.preventDefault()}
                className={`w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-slate-700 font-medium transition flex items-center gap-1.5 cursor-pointer ${isAlignRightActive ? 'bg-indigo-50/50 text-indigo-700' : ''}`}
              >
                <AlignRight className="h-3 w-3" /> Align Right
              </button>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-slate-200" />

        {/* Link, Image, Video, Table */}
        <button 
          type="button" 
          onClick={() => setActiveModal('link')}
          className="p-1.5 hover:bg-slate-150 rounded transition text-slate-500 cursor-pointer" 
          title="Insert Link"
        >
          <Link className="h-3.5 w-3.5 text-slate-650" />
        </button>

        <button 
          type="button" 
          onClick={() => setActiveModal('image')}
          className="p-1.5 hover:bg-slate-150 rounded transition text-slate-500 cursor-pointer" 
          title="Insert Image"
        >
          <ImageIcon className="h-3.5 w-3.5 text-slate-650" />
        </button>

        <button 
          type="button" 
          onClick={() => setActiveModal('video')}
          className="p-1.5 hover:bg-slate-150 rounded transition text-slate-500 cursor-pointer" 
          title="Insert Video"
        >
          <Video className="h-3.5 w-3.5 text-slate-650" />
        </button>

        <button 
          type="button" 
          onClick={() => setActiveModal('table')}
          className="p-1.5 hover:bg-slate-150 rounded transition text-slate-500 cursor-pointer" 
          title="Insert Table grid"
        >
          <Table className="h-3.5 w-3.5 text-slate-650" />
        </button>

        <div className="h-4 w-px bg-slate-200" />

        <button 
          type="button" 
          className="p-1.5 hover:bg-slate-150 rounded transition text-slate-500 cursor-pointer" 
          title="More options"
        >
          <MoreHorizontal className="h-3.5 w-3.5 text-slate-600" />
        </button>

        {/* Code/Rich View Toggle Button */}
        <button 
          type="button" 
          onClick={() => setIsCodeView(!isCodeView)}
          className={`p-1.5 rounded transition ml-auto cursor-pointer ${isCodeView ? 'bg-slate-250 text-slate-900 border border-slate-350 shadow-inner' : 'text-slate-550 hover:bg-slate-150'}`} 
          title="Raw Code Output View"
        >
          <Code className="h-3.5 w-3.5" />
        </button>

      </div>

      {/* COMPONENT DIALOG POPUPS */}
      {activeModal && (
        <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl border border-slate-150 p-4 shadow-xl w-full max-w-sm text-left">
            <div className="flex justify-between items-center mb-3">
              <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700">
                {activeModal === 'link' && 'Insert Link Object'}
                {activeModal === 'image' && 'Insert Web Image Asset'}
                {activeModal === 'video' && 'Embed Streaming Video'}
                {activeModal === 'table' && 'Insert Complex Data Table'}
              </span>
              <button 
                type="button" 
                onClick={() => setActiveModal(null)} 
                className="text-slate-400 hover:text-slate-600 transition p-1 rounded-full cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Link Form */}
            {activeModal === 'link' && (
              <form onSubmit={handleInsertLink} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-widest text-[8px] mb-1">Destination URL</label>
                  <input 
                    type="url" 
                    required 
                    placeholder="https://example.com/collection" 
                    value={linkUrl} 
                    onChange={e => setLinkUrl(e.target.value)}
                    className="w-full border border-slate-200 p-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-widest text-[8px] mb-1">Display Text</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Shop Best Sellers" 
                    value={linkText} 
                    onChange={e => setLinkText(e.target.value)}
                    className="w-full border border-slate-200 p-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white font-bold py-2 rounded-lg text-[10.5px] cursor-pointer mt-1">
                  Insert Link Node
                </button>
              </form>
            )}

            {/* Image Form */}
            {activeModal === 'image' && (
              <form onSubmit={handleInsertImage} className="space-y-3 text-xs">
                <ImageUploadInput
                  label="Select or Upload Image"
                  value={imageUrl}
                  onChange={(url) => setImageUrl(url)}
                  placeholder="https://... or select from File Manager"
                />
                <button type="submit" disabled={!imageUrl} className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-[10.5px] cursor-pointer mt-1">
                  Embed Image Item
                </button>
              </form>
            )}

            {/* Video Form */}
            {activeModal === 'video' && (
              <form onSubmit={handleInsertVideo} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-widest text-[8px] mb-1">YouTube URL or Embed Source</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. https://www.youtube.com/watch?v=..." 
                    value={videoUrl} 
                    onChange={e => setVideoUrl(e.target.value)}
                    className="w-full border border-slate-200 p-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white font-bold py-2 rounded-lg text-[10.5px] cursor-pointer mt-1">
                  Embed Video Player
                </button>
              </form>
            )}

            {/* Table Form */}
            {activeModal === 'table' && (
              <form onSubmit={handleInsertTable} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-500 uppercase tracking-widest text-[8px] mb-1">Total Rows</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="12" 
                      required 
                      value={tableRows} 
                      onChange={e => setTableRows(parseInt(e.target.value) || 3)}
                      className="w-full border border-slate-200 p-2 rounded-lg text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-500 uppercase tracking-widest text-[8px] mb-1">Total Columns</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="8" 
                      required 
                      value={tableCols} 
                      onChange={e => setTableCols(parseInt(e.target.value) || 3)}
                      className="w-full border border-slate-200 p-2 rounded-lg text-xs focus:outline-none"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white font-bold py-2 rounded-lg text-[10.5px] cursor-pointer mt-1">
                  Generate Table Elements
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DUAL MODE EDITING AREA */}
      {!isCodeView ? (
        /* VISUAL RICH-TEXT EDITOR SCREEN (WORKING LIKE ss1 IMAGE) */
        <div 
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning={true}
          onInput={() => {
            handleVisualInput();
            updateActiveBlockFormat();
          }}
          onMouseUp={updateActiveBlockFormat}
          onKeyUp={updateActiveBlockFormat}
          onFocus={updateActiveBlockFormat}
          className="w-full min-h-[250px] p-4 text-xs font-sans leading-relaxed text-slate-800 bg-white focus:outline-none focus:ring-0 [&_h1]:text-[48px] [&_h1]:font-extrabold [&_h1]:text-slate-900 [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:leading-tight [&_h2]:text-[35px] [&_h2]:font-bold [&_h2]:text-slate-800 [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h2]:leading-tight [&_h3]:text-[30px] [&_h3]:font-semibold [&_h3]:text-slate-700 [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:leading-tight [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-indigo-650 [&_a]:underline hover:prose-slate overflow-y-auto max-h-[500px]"
          data-placeholder={placeholder}
          style={{ outline: 'none' }}
        />
      ) : (
        /* CODE SOURCE WRITER SCREEN WITH LINE NUMBERS (WORKING LIKE ss2 IMAGE) */
        <div className="flex font-mono text-[11px] border-t border-slate-200 bg-white min-h-[250px] relative text-left">
          {/* Synchronized Line Numbers list */}
          <div 
            ref={lineNumbersRef}
            className="bg-slate-50 text-slate-400 text-right select-none px-3.5 py-3 border-r border-slate-200 flex flex-col overflow-hidden h-[250px] pointer-events-none text-[11px] select-none shrink-0"
            style={{ lineHeight: '18px' }}
          >
            {codeLines.map((_, i) => (
              <div key={i} className="h-[18px] font-semibold text-[10px] pr-0.5 tracking-tighter">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Raw Text Editor Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            className="flex-1 p-3 focus:outline-none font-mono text-[11px] leading-[18px] text-slate-800 bg-white h-[250px] overflow-y-auto resize-none"
            placeholder="Write HTML code directly here..."
            style={{ 
              whiteSpace: 'pre',
              lineHeight: '18px',
              fontFamily: 'JetBrains Mono, SFMono-Regular, Consolas, Monaco, monospace'
            }}
          />
        </div>
      )}
    </div>
  );
}
