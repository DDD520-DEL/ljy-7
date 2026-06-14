import { useState, useMemo } from 'react';
import { Eye, Edit3, Bold, Italic, List, ListOrdered, Link, Code, Heading1, Heading2, Quote } from 'lucide-react';
import { cn } from '../lib/utils.js';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900 mt-5 mb-3">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mt-6 mb-4">$1</h1>');

  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/___(.*?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.*?)__/g, '<strong class="font-semibold">$1</strong>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm text-amber-700 font-mono">$1</code>');

  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono"><code>$1</code></pre>');

  html = html.replace(/^\s*[-*+]\s+(.*$)/gim, '<li class="ml-4 list-disc text-gray-700">$1</li>');
  html = html.replace(/(<li[^>]*>.*<\/li>)(?=\s*<li|$)/gs, '<ul class="my-3 space-y-1">$1</ul>');

  html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="ml-4 list-decimal text-gray-700">$1</li>');
  html = html.replace(/(<li[^>]*>.*<\/li>)(?=\s*\d+\.|$)/gs, '<ol class="my-3 space-y-1">$1</ol>');

  html = html.replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-amber-400 pl-4 my-4 text-gray-600 italic">$1</blockquote>');

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-amber-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

  html = html.replace(/^---$/gim, '<hr class="my-6 border-gray-200" />');

  html = html.replace(/\n\n/g, '</p><p class="my-3 text-gray-700">');
  html = '<p class="my-3 text-gray-700">' + html + '</p>';

  html = html.replace(/<p class="my-3 text-gray-700"><h/g, '<h');
  html = html.replace(/<\/h\d><\/p>/g, (match) => match.replace('</p>', ''));
  html = html.replace(/<p class="my-3 text-gray-700"><ul/g, '<ul');
  html = html.replace(/<\/ul><\/p>/g, '</ul>');
  html = html.replace(/<p class="my-3 text-gray-700"><ol/g, '<ol');
  html = html.replace(/<\/ol><\/p>/g, '</ol>');
  html = html.replace(/<p class="my-3 text-gray-700"><blockquote/g, '<blockquote');
  html = html.replace(/<\/blockquote><\/p>/g, '</blockquote>');
  html = html.replace(/<p class="my-3 text-gray-700"><pre/g, '<pre');
  html = html.replace(/<\/pre><\/p>/g, '</pre>');
  html = html.replace(/<p class="my-3 text-gray-700"><hr/g, '<hr');
  html = html.replace(/<hr class="my-6 border-gray-200" \/><\/p>/g, '<hr class="my-6 border-gray-200" />');

  html = html.replace(/\n/g, '<br />');

  return html;
}

export default function MarkdownEditor({ value, onChange, placeholder = '开始记录你的酿造笔记...', minHeight = '300px' }: MarkdownEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  const renderedHtml = useMemo(() => renderMarkdown(value), [value]);

  const insertMarkdown = (prefix: string, suffix: string = '', placeholderText: string = '') => {
    const textarea = document.querySelector('.markdown-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || placeholderText;
    const newText = value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);

    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selectedText.length;
      textarea.setSelectionRange(start + prefix.length, newCursorPos);
    }, 0);
  };

  const ToolbarButton = ({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
      title={label}
    >
      <Icon size={18} />
    </button>
  );

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-1">
          <ToolbarButton icon={Heading1} label="一级标题" onClick={() => insertMarkdown('# ', '', '标题')} />
          <ToolbarButton icon={Heading2} label="二级标题" onClick={() => insertMarkdown('## ', '', '标题')} />
          <div className="w-px h-5 bg-gray-300 mx-1" />
          <ToolbarButton icon={Bold} label="粗体" onClick={() => insertMarkdown('**', '**', '粗体文本')} />
          <ToolbarButton icon={Italic} label="斜体" onClick={() => insertMarkdown('*', '*', '斜体文本')} />
          <div className="w-px h-5 bg-gray-300 mx-1" />
          <ToolbarButton icon={List} label="无序列表" onClick={() => insertMarkdown('- ', '', '列表项')} />
          <ToolbarButton icon={ListOrdered} label="有序列表" onClick={() => insertMarkdown('1. ', '', '列表项')} />
          <ToolbarButton icon={Quote} label="引用" onClick={() => insertMarkdown('> ', '', '引用文本')} />
          <div className="w-px h-5 bg-gray-300 mx-1" />
          <ToolbarButton icon={Code} label="代码" onClick={() => insertMarkdown('`', '`', 'code')} />
          <ToolbarButton icon={Link} label="链接" onClick={() => insertMarkdown('[', '](url)', '链接文本')} />
        </div>
        <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-0.5">
          <button
            onClick={() => { setMode('edit'); setActiveTab('editor'); }}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1",
              mode === 'edit' ? "bg-amber-100 text-amber-700" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Edit3 size={14} />
            编辑
          </button>
          <button
            onClick={() => { setMode('split'); setActiveTab('editor'); }}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-colors",
              mode === 'split' ? "bg-amber-100 text-amber-700" : "text-gray-500 hover:text-gray-700"
            )}
          >
            分屏
          </button>
          <button
            onClick={() => { setMode('preview'); setActiveTab('preview'); }}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1",
              mode === 'preview' ? "bg-amber-100 text-amber-700" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Eye size={14} />
            预览
          </button>
        </div>
      </div>

      <div className={cn(
        "flex",
        mode === 'split' ? "flex-row" : "flex-col"
      )}>
        {(mode === 'edit' || mode === 'split') && (
          <div className={cn(
            "flex-1",
            mode === 'split' && "border-r border-gray-200"
          )}>
            <textarea
              className="markdown-textarea w-full p-4 resize-none focus:outline-none font-mono text-sm text-gray-800 bg-white"
              style={{ minHeight }}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
            />
          </div>
        )}

        {(mode === 'preview' || mode === 'split') && (
          <div
            className="markdown-preview flex-1 p-4 overflow-auto bg-gray-50 prose prose-sm max-w-none"
            style={{ minHeight }}
            dangerouslySetInnerHTML={{ __html: renderedHtml || `<p class="text-gray-400 italic">预览区域</p>` }}
          />
        )}
      </div>

      <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
        支持 Markdown 语法：标题、粗体、斜体、列表、引用、代码、链接等
      </div>
    </div>
  );
}
