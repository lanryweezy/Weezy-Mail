
import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { AISearchCriteria } from '../types';

interface SearchBarProps {
    onSubmit: (query: string | AISearchCriteria) => void;
    isSearching: boolean;
    initialQuery?: string;
    placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSubmit, isSearching, initialQuery = "", placeholder = "AI Search..." }) => {
    const [query, setQuery] = useState(initialQuery);
    const [showFilters, setShowFilters] = useState(false);

    // State for structured search filters
    const [sender, setSender] = useState('');
    const [subject, setSubject] = useState('');
    const [isUnread, setIsUnread] = useState(false);
    const [hasAttachment, setHasAttachment] = useState(false);
    
    useEffect(() => {
        setQuery(initialQuery);
    }, [initialQuery]);

    const handleAiSearch = () => {
        if (query.trim()) {
            onSubmit(query);
        }
    };

    const handleStructuredSearch = () => {
        const criteria: AISearchCriteria = {};
        if (sender) criteria.sender = sender;
        if (subject) criteria.subject = subject;
        if (isUnread) criteria.isUnread = true;
        if (hasAttachment) criteria.hasAttachment = true;

        // Only submit if at least one criterion is set
        if (Object.keys(criteria).length > 0) {
            onSubmit(criteria);
        }
    };

    return (
        <div className="relative w-full">
            <div className="flex items-center">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Icon name="sparkles" className="w-5 h-5 text-[var(--accent-cyan)]" />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                    placeholder={placeholder}
                    className="w-full bg-black/20 text-white placeholder-slate-400 rounded-lg pl-10 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] border border-transparent transition-shadow"
                    disabled={isSearching}
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                    {isSearching && (
                        <div className="w-5 h-5 mr-3 border-2 border-transparent border-t-cyan-400 rounded-full animate-spin"></div>
                    )}
                    <button onClick={() => setShowFilters(!showFilters)} className={`p-2 mr-1 rounded-full transition-colors ${showFilters ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'}`}>
                        <Icon name="settings" className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="mt-3 p-4 bg-black/20 rounded-lg border border-[var(--border-glow)] animate-slow-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                        <input type="text" value={sender} onChange={e => setSender(e.target.value)} placeholder="From..." className="col-span-1 bg-white/5 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]" />
                        <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject..." className="col-span-1 bg-white/5 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]" />
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={isUnread} onChange={e => setIsUnread(e.target.checked)} className="bg-white/10 border-slate-500 text-[var(--accent-cyan)] focus:ring-0" /> Unread</label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={hasAttachment} onChange={e => setHasAttachment(e.target.checked)} className="bg-white/10 border-slate-500 text-[var(--accent-cyan)] focus:ring-0" /> Has Attachment</label>
                        </div>
                        <button onClick={handleStructuredSearch} className="bg-blue-600 text-white font-semibold px-4 py-1.5 rounded-md text-sm hover:bg-blue-500 transition-colors">Apply Filters</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchBar;
