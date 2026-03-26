
import React, { useState } from 'react';
import { Search, Zap } from 'lucide-react';

interface SearchInterfaceProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const SearchInterface: React.FC<SearchInterfaceProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl group">
      <div className="relative flex items-center">
        <div className="absolute left-4 text-cyan-500 group-focus-within:text-cyan-400">
          <Search size={24} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What should I sniff out? (e.g. VPN discounts, Game trials...)"
          disabled={isLoading}
          className="w-full bg-black/40 border-2 border-cyan-900/50 rounded-2xl py-5 pl-14 pr-32 text-xl focus:outline-none focus:border-cyan-500 transition-all placeholder:text-cyan-900/60 font-medium"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-900 text-black px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Zap size={18} />
              SNIFF
            </>
          )}
        </button>
      </div>
    </form>
  );
};
