
import React from 'react';
import { Email, EmailStatus, AIAction } from '../types';
import Icon from './Icon';

interface EmailListItemProps {
  email: Email;
  isSelected: boolean;
  onSelect: () => void;
  isChecked: boolean;
  onToggleSelect: (id: number) => void;
  onAction: (action: AIAction, params: any) => void;
}

const QuickActionButton: React.FC<{icon: any, label: string, onClick: (e: React.MouseEvent) => void}> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="group relative flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-[var(--text-secondary)] hover:text-white">
        <Icon name={icon} className="w-4 h-4" />
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {label}
        </span>
    </button>
);


const EmailListItem: React.FC<EmailListItemProps> = ({ email, isSelected, onSelect, isChecked, onToggleSelect, onAction }) => {
  const isUnread = email.status === EmailStatus.UNREAD;
  const isImportant = email.status === EmailStatus.IMPORTANT;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect(email.id);
  }

  // Improved styling for a more futuristic look
  const itemClasses = `
    p-4 rounded-lg cursor-pointer transition-all duration-300 ease-in-out
    border border-transparent relative flex items-start gap-4
    group
    ${
      isSelected
        ? 'bg-[var(--accent-cyan)]/10 border-[var(--accent-cyan)]/50 shadow-lg shadow-[var(--accent-cyan)]/10'
        : isChecked
        ? 'bg-blue-500/10'
        : 'hover:bg-white/5 hover:border-[var(--border-glow)]'
    }
  `;

  return (
    <li onClick={onSelect} className={itemClasses}>
      <div className="flex-shrink-0 pt-1">
        <input
          type="checkbox"
          checked={isChecked}
          onClick={handleCheckboxClick}
          onChange={() => {}}
          className="w-4 h-4 rounded bg-white/10 border-slate-500 text-[var(--accent-cyan)] focus:ring-0 focus:ring-offset-0 cursor-pointer"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {isUnread && (
              <div className="w-2.5 h-2.5 mt-1 bg-[var(--accent-cyan)] rounded-full flex-shrink-0 animate-pulse shadow-[0_0_8px_var(--accent-cyan)]"></div>
            )}
            <p
              className={`font-semibold truncate ${
                isUnread ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
              }`}
            >
              {email.sender}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 pl-2">
            {email.attachments && email.attachments.length > 0 && (
              <Icon name="attachment" className="w-4 h-4 text-[var(--text-tertiary)]" />
            )}
            {isImportant && <Icon name="star" className="w-4 h-4 text-yellow-400" />}
            <span className="text-xs text-[var(--text-tertiary)]">
              {new Date(email.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
        <p
          className={`text-sm mt-1 truncate ${
            isUnread ? 'text-slate-200 font-medium' : 'text-slate-400'
          }`}
        >
          {email.subject}
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1.5 truncate group-hover:text-slate-400 transition-colors">
          {email.body}
        </p>
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <QuickActionButton icon="archive" label="Archive" onClick={(e) => { e.stopPropagation(); onAction(AIAction.ARCHIVE_EMAIL, { emailId: email.id }); }} />
        <QuickActionButton icon="trash" label="Delete" onClick={(e) => { e.stopPropagation(); onAction(AIAction.DELETE_EMAIL, { emailId: email.id }); }} />
        <QuickActionButton icon="inbox" label="Mark as Unread" onClick={(e) => { e.stopPropagation(); onAction(AIAction.MARK_AS_UNREAD, { emailId: email.id }); }} />
      </div>
    </li>
  );
};

export default EmailListItem;
