import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

const PRESET_TAGS = [
  'Branding', 'Design', 'Web', 'Mobile', 'Video', 'Photo',
  'Social Media', 'SEO', 'Ads', 'F&B', 'Tech', 'Fashion',
  'Edukasi', 'Kesehatan', 'Real Estate', 'Startup',
];

export default function TagInput({ value, onChange, placeholder }) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const tags = value ? value.split(',').map((t) => t.trim()).filter(Boolean) : [];

  const addTag = (tag) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) return;

    const newTags = [...tags, trimmed].join(', ');
    onChange(newTags);
    setInput('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove) => {
    const newTags = tags.filter((t) => t !== tagToRemove).join(', ');
    onChange(newTags);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleFocus = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 200);
    }
    setShowSuggestions(true);
  };

  const filteredSuggestions = PRESET_TAGS.filter(
    (tag) => !tags.includes(tag) && tag.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex flex-wrap gap-1.5 p-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent min-h-[42px] cursor-text" onClick={() => inputRef.current?.focus()}>
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="hover:text-purple-900"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
          onFocus={handleFocus}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-[100px] outline-none text-sm"
          placeholder={tags.length === 0 ? (placeholder || 'Tambah tag...') : ''}
        />
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className={`absolute z-50 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          {filteredSuggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); addTag(tag); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 hover:text-purple-700"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
