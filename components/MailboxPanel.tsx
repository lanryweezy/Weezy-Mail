
import React, { useRef, useEffect } from 'react';
import { Email, MailboxView, EmailCategory, AISearchCriteria, EmailStatus } from '../types';
import EmailListItem from './EmailListItem';
import Icon from './Icon';
import SearchBar from './SearchBar';

// --- Sub-components copied from old Sidebar and EmailList ---

const NavItem: React.FC<{
  icon: any;
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, count, isActive, onClick }) => (
  <li
    onClick={onClick}
    className={`relative flex items-center justify-between px-4 py-2.5 rounded-md cursor-pointer transition-colors duration-200 group
      ${ isActive
        ? 'text-white'
        : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-white'
    }`}
  >
    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--accent-cyan)] rounded-r-full"></div>}
    <div className="flex items-center gap-3">
      <Icon name={icon} className={`w-5 h-5 transition-colors ${isActive ? 'text-[var(--accent-cyan)]' : ''}`} />
      <span className="font-medium text-sm">{label}</span>
    </div>
    {count !== undefined && count > 0 && (
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full transition-colors ${isActive ? 'bg-cyan-400/20 text-cyan-300' : 'bg-white/10 text-[var(--text-secondary)] group-hover:bg-white/20'}`}>
        {count}
      </span>
    )}
  </li>
);

const CategoryTab: React.FC<{label: string, isActive: boolean, onClick: () => void}> = ({ label, isActive, onClick}) => (
    <button 
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-all duration-200
            ${isActive 
                ? 'text-white border-[var(--accent-cyan)]' 
                : 'text-[var(--text-secondary)] border-transparent hover:text-white hover:border-white/30'
            }`}
    >
        {label}
    </button>
);

const AiSearchPill: React.FC<{ criteria: AISearchCriteria; onClear: () => void }> = ({ criteria, onClear }) => {
    const description = Object.entries(criteria)
        .map(([key, value]) => {
            if (key === 'isUnread' && value) return 'unread';
            if (value) return `from '${value}'`;
            return '';
        })
        .filter(Boolean)
        .join(' and ');

    if (!description) return null;

    return (
        <div className="flex items-center gap-2 bg-blue-500/20 text-blue-300 text-xs px-3 py-1.5 rounded-full animate-slow-fade-in">
            <Icon name="sparkles" className="w-4 h-4" />
            <span className="font-medium">AI Search: {description}</span>
            <button onClick={onClear} className="text-blue-300 hover:text-white">
                <Icon name="close" className="w-4 h-4"/>
            </button>
        </div>
    );
};


// --- Main MailboxPanel Component ---

import { AIAction } from '../types';

interface MailboxPanelProps {
  emails: Email[]; // All emails for counts
  visibleEmails: Email[]; // Filtered emails to display
  currentView: MailboxView;
  onSetView: (view: MailboxView) => void;
  onCompose: () => void;
  onOpenSettings: () => void;
  onSelectEmail: (email: Email) => void;
  selectedEmailId?: number | null;
  highlightedEmailId?: number | null;
  onAiSearch: (query: string) => void;
  isSearching: boolean;
  aiCriteria: AISearchCriteria | null;
  searchQuery: string;
  onClearSearch: () => void;
  activeCategory: EmailCategory;
  onSetCategory: (category: EmailCategory) => void;
  selectedEmailIds: Set<number>;
  onToggleSelectId: (id: number) => void;
  onToggleSelectAll: () => void;
  onAction: (action: AIAction, params: any) => void;
}

const MailboxPanel: React.FC<MailboxPanelProps> = (props) => {
    const {
        emails, visibleEmails, currentView, onSetView, onCompose, onOpenSettings,
        onSelectEmail, selectedEmailId, highlightedEmailId, onAiSearch, isSearching, aiCriteria,
        searchQuery, onClearSearch, activeCategory, onSetCategory,
        selectedEmailIds, onToggleSelectId, onToggleSelectAll, onAction,
    } = props;

  const primaryUnreadCount = emails.filter(e => e.status === EmailStatus.UNREAD && e.category === 'PRIMARY').length;
  const draftsCount = emails.filter(e => e.status === EmailStatus.DRAFT).length;
  const importantCount = emails.filter(e => e.status === EmailStatus.IMPORTANT).length;
  const snoozedCount = emails.filter(e => e.status === EmailStatus.SNOOZED).length;
  
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
  const numVisibleEmails = visibleEmails.length;
  const numSelected = selectedEmailIds.size;

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      if (numSelected === 0) {
        selectAllCheckboxRef.current.checked = false;
        selectAllCheckboxRef.current.indeterminate = false;
      } else if (numSelected === numVisibleEmails) {
        selectAllCheckboxRef.current.checked = true;
        selectAllCheckboxRef.current.indeterminate = false;
      } else {
        selectAllCheckboxRef.current.checked = false;
        selectAllCheckboxRef.current.indeterminate = true;
      }
    }
  }, [numSelected, numVisibleEmails]);

  return (
    <div className="p-3 flex flex-col h-full">
      {/* --- Navigation Section --- */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-4 px-2 tracking-wider">Mailbox</h1>
        <div className="px-2 mb-4">
          <button 
            onClick={onCompose}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-3 px-4 rounded-lg hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <Icon name="pencil" className="w-5 h-5" />
            <span>Compose</span>
          </button>
        </div>
        <ul className="space-y-1">
          <NavItem icon="inbox" label="Inbox" count={primaryUnreadCount} isActive={currentView === 'INBOX'} onClick={() => onSetView('INBOX')} />
          <NavItem icon="draft" label="Drafts" count={draftsCount} isActive={currentView === 'DRAFTS'} onClick={() => onSetView('DRAFTS')} />
          <NavItem icon="paper-airplane" label="Sent" isActive={currentView === 'SENT'} onClick={() => onSetView('SENT')} />
          <NavItem icon="clock" label="Snoozed" count={snoozedCount} isActive={currentView === 'SNOOZED'} onClick={() => onSetView('SNOOZED')} />
          <NavItem icon="star" label="Important" count={importantCount} isActive={currentView === 'IMPORTANT'} onClick={() => onSetView('IMPORTANT')} />
          <NavItem icon="trash" label="Trash" isActive={currentView === 'TRASH'} onClick={() => onSetView('TRASH')} />
        </ul>
      </div>
      
      {/* --- Search and Filter Section --- */}
      <div className="flex-shrink-0 pt-4 mt-2 border-t border-[var(--border-glow)]">
        <div className="p-1">
            <SearchBar 
                onSubmit={onAiSearch} 
                isSearching={isSearching} 
                initialQuery={searchQuery}
            />
        </div>
        
        <div className="h-12 px-2 border-b border-[var(--border-glow)] flex items-center justify-between">
           {currentView === 'INBOX' ? (
                <div className="flex items-center gap-2">
                    {(['PRIMARY', 'PROMOTIONS', 'UPDATES'] as EmailCategory[]).map(cat => (
                        <CategoryTab 
                            key={cat}
                            label={cat.charAt(0) + cat.slice(1).toLowerCase()}
                            isActive={activeCategory === cat && !aiCriteria}
                            onClick={() => { onClearSearch(); onSetCategory(cat); }}
                        />
                    ))}
                </div>
           ) : <div className="w-12"></div> } {/* Placeholder for alignment */}
           
           {aiCriteria && <div className="p-2"><AiSearchPill criteria={aiCriteria} onClear={onClearSearch} /></div>}
        </div>
      </div>
      
      {/* --- Email List Itself --- */}
      <div className="flex-grow overflow-y-auto futuristic-scrollbar pt-2">
        {visibleEmails.length > 0 ? (
          <>
            <div className="px-4 py-1">
                <input 
                    type="checkbox"
                    ref={selectAllCheckboxRef}
                    onChange={onToggleSelectAll}
                    title="Select all"
                    className="w-4 h-4 rounded bg-white/10 border-slate-500 text-[var(--accent-cyan)] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
            </div>
            <ul className="p-1 space-y-1">
                {visibleEmails.map(email => (
                <EmailListItem
                    key={email.id}
                    email={email}
                    isSelected={email.id === selectedEmailId}
                    isHighlighted={email.id === highlightedEmailId}
                    onSelect={() => onSelectEmail(email)}
                    isChecked={selectedEmailIds.has(email.id)}
                    onToggleSelect={onToggleSelectId}
                    onAction={onAction}
                />
                ))}
            </ul>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[var(--text-tertiary)] p-4">
            <Icon name="inbox" className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-center font-semibold text-[var(--text-secondary)]">No emails found</p>
            <p className="text-center text-sm">{aiCriteria || searchQuery ? 'Try a different search.' : 'There are no emails in this view.'}</p>
          </div>
        )}
      </div>
      
      {/* --- Settings Button --- */}
      <div className="mt-auto p-2 border-t border-[var(--border-glow)] flex-shrink-0">
         <button onClick={onOpenSettings} className="w-full flex items-center gap-3 px-2 py-1.5 rounded-md cursor-pointer text-[var(--text-secondary)] hover:bg-white/5 hover:text-white transition-colors duration-200 group">
            <Icon name="settings" className="w-5 h-5" />
            <span className="font-medium text-sm">Settings</span>
         </button>
      </div>
    </div>
  );
};

export default MailboxPanel;
