
import React from 'react';
import { Email, EmailStatus } from '../types';
import Icon from './Icon';

interface EmailListItemProps {
  email: Email;
  isSelected: boolean;
  onSelect: () => void;
  isChecked: boolean;
  onToggleSelect: (id: number) => void;
}

const EmailListItem: React.FC<EmailListItemProps> = ({ email, isSelected, onSelect, isChecked, onToggleSelect }) => {
  const isUnread = email.status === EmailStatus.UNREAD;
  const isImportant = email.status === EmailStatus.IMPORTANT;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect(email.id);
  }

  return (
    <li
      onClick={onSelect}
      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border border-transparent relative flex items-start gap-3
        ${ isSelected
            ? 'bg-blue-500/20 border-blue-400/50'
            : isChecked
            ? 'bg-blue-500/10'
            : 'hover:bg-white/5'
        }`}
    >
      <div className="flex-shrink-0 pt-1">
        <input
            type="checkbox"
            checked={isChecked}
            onClick={handleCheckboxClick}
            onChange={() => {}} // onChange is handled by onClick to use stopPropagation
            className="w-4 h-4 rounded bg-white/10 border-slate-500 text-[var(--accent-cyan)] focus:ring-0 focus:ring-offset-0 cursor-pointer"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {isUnread && <div className="w-2 h-2 mt-1.5 bg-[var(--accent-cyan)] rounded-full flex-shrink-0 animate-pulse"></div>}
                <p className={`font-semibold truncate ${isUnread ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                    {email.sender}
                </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                {isImportant && <Icon name="star" className="w-4 h-4 text-yellow-400" />}
                <span className="text-xs text-[var(--text-tertiary)]">
                    {new Date(email.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </div>
        <p className={`text-sm mt-1 truncate ${isUnread ? 'text-slate-200' : 'text-slate-400'}`}>
            {email.subject}
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1 truncate">
            {email.body}
        </p>
      </div>
    </li>
  );
};

export default EmailListItem;
