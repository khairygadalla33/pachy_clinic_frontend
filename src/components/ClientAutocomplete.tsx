import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import api from '../lib/api';


interface ClientOption {
  id: string;
  fullName: string;
  phone: string;
  photoUrl: string | null;
}

interface ClientAutocompleteProps {
  onSelect: (client: ClientOption) => void;
  placeholder?: string;
  className?: string;
}

export default function ClientAutocomplete({ onSelect, placeholder = 'اختر العميل', className = '' }: ClientAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClientOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClientName, setSelectedClientName] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query === selectedClientName && query.length > 0) return; // Prevent searching if just selected

    if (query.trim().length < 2) {
      if (isOpen) {
        setIsLoading(true);
        // Fetch recent/default clients
        api.get('/clients?limit=15')
          .then((res) => {
            setResults(res.data.data || res.data || []);
          })
          .catch(console.error)
          .finally(() => setIsLoading(false));
      } else {
        setResults([]);
      }
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      setIsLoading(true);
      api.get(`/clients/search?q=${encodeURIComponent(query)}`)
        .then((res) => {
          setResults(res.data);
          if (res.data.length > 0) setIsOpen(true);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, isOpen, selectedClientName]);

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          className="w-full pl-10 pr-3 h-8 py-1 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 transition-shadow"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button 
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 focus:outline-none"
        >
          <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isLoading && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-surface-800 rounded-lg shadow-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
          {results.map((client) => (
            <button
              key={client.id}
              onClick={() => {
                onSelect(client);
                setSelectedClientName(client.fullName);
                setQuery(client.fullName);
                setIsOpen(false);
              }}
              className="w-full text-right px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-700/50 flex items-center gap-3 transition-colors border-b border-surface-100 dark:border-surface-700/50 last:border-0"
            >
              <div className="flex-1">
                <div className="font-medium text-surface-900 dark:text-surface-100">{client.fullName}</div>
                <div className="text-sm text-surface-500" dir="ltr">{client.phone}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
