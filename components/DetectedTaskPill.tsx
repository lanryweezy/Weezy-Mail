import React from 'react';
import { DetectedTask } from '../types';
import Icon from './Icon';

interface DetectedTaskPillProps {
  task: DetectedTask;
  onAction: (task: DetectedTask) => void;
}

const ICONS: Record<string, 'clock' | 'pencil' | 'calendar'> = {
  REMINDER: 'clock',
  DEADLINE: 'pencil',
  EVENT: 'calendar',
};

const DetectedTaskPill: React.FC<DetectedTaskPillProps> = ({ task, onAction }) => {
  const iconName = ICONS[task.type] || 'pencil';

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString; // Fallback to raw string if date is invalid
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 bg-white/5 p-3 rounded-lg border border-transparent hover:border-white/10 transition-colors animate-slow-fade-in">
      <div className="flex items-center gap-3 min-w-0">
        <Icon name={iconName} className="w-5 h-5 text-[var(--accent-cyan)] flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm text-white truncate">{task.description}</p>
          <p className="text-xs text-[var(--text-secondary)]">
            {task.type} {task.date && `• ${formatDate(task.date)}`}
          </p>
        </div>
      </div>
      <button
        onClick={() => onAction(task)}
        className="text-sm font-semibold bg-white/10 text-white px-3 py-1 rounded-md hover:bg-white/20 transition-colors flex-shrink-0"
      >
        Set Reminder
      </button>
    </div>
  );
};

export default DetectedTaskPill;
