
import React, { useState, useEffect } from 'react';
import Icon from './Icon';

interface SearchBarProps {
    onSubmit: (query: string) => void;
    isSearching: boolean;
    initialQuery?: string;
    placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSubmit, isSearching, initialQuery = "", placeholder = "AI Search..." }) => {
    const [query, setQuery] = useState(initialQuery);
    
    useEffect(() => {
        setQuery(initialQuery);
    }, [initialQuery]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onSubmit(query);
        }
    };

    return (
        <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Icon name="sparkles" className="w-5 h-5 text-[var(--accent-cyan)]" />
            </div>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full bg-black/20 text-white placeholder-slate-400 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] border border-transparent transition-shadow"
                disabled={isSearching}
            />
            {isSearching && (
                 <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <div className="w-5 h-5 border-2 border-transparent border-t-cyan-400 rounded-full animate-spin"></div>
                </div>
            )}
        </div>
    );
};

export default SearchBar;
