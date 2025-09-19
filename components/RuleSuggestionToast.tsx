import React from 'react';
import { TriageRule } from '../types';
import Icon from './Icon';

interface RuleSuggestionToastProps {
  rule: Omit<TriageRule, 'id'>;
  onAccept: () => void;
  onDecline: () => void;
}

const RuleSuggestionToast: React.FC<RuleSuggestionToastProps> = ({ rule, onAccept, onDecline }) => {
  const actionText = rule.action.toLowerCase();

  return (
    <div className="absolute bottom-5 right-5 bg-[var(--bg-panel-solid)] border border-[var(--border-glow)] text-white p-4 rounded-lg shadow-2xl z-50 w-full max-w-sm backdrop-blur-xl animate-slow-fade-in">
        <div className="flex items-start gap-4">
            <Icon name="sparkles" className="w-6 h-6 text-[var(--accent-cyan)] flex-shrink-0 mt-1" />
            <div>
                <h3 className="font-bold">Automation Suggestion</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                    You've {actionText}d several emails from <span className="font-semibold text-white">{rule.sender}</span>.
                    Would you like me to automatically {actionText} them for you in the future?
                </p>
                <div className="mt-4 flex items-center gap-3">
                    <button
                        onClick={onAccept}
                        className="flex-1 bg-blue-600 text-white font-semibold px-4 py-2 rounded-md text-sm hover:bg-blue-500 transition-colors"
                    >
                        Yes, Automate
                    </button>
                    <button
                        onClick={onDecline}
                        className="flex-1 bg-white/10 text-white font-semibold px-4 py-2 rounded-md text-sm hover:bg-white/20 transition-colors"
                    >
                        No, Thanks
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default RuleSuggestionToast;
