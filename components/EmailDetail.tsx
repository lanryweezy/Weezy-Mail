
import React, { useState, useEffect, useRef } from 'react';
import { Email, EmailStatus, AIAction, DetectedTask, CalendarEvent } from '../types';
import Icon from './Icon';
import { generateQuickReplies } from '../services/geminiService';
import DetectedTaskPill from './DetectedTaskPill';


interface EmailDetailProps {
  email: Email | null;
  onAction: (action: AIAction, params: any) => void;
  onCompose: (initialState: any) => void;
  onSummarize: (emailId: number) => void;
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  enableSummarization: boolean;
  enableQuickReplies: boolean;
  selectedEmailIds: Set<number>;
}

const ActionButton: React.FC<{icon: any, label: string, onClick: () => void, className?: string, buttonRef?: React.Ref<HTMLButtonElement>}> = ({ icon, label, onClick, className = '', buttonRef }) => (
    <button ref={buttonRef} onClick={onClick} className={`group relative flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-[var(--accent-cyan)]/20 transition-all duration-200 text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] active:scale-90 ${className}`}>
        <Icon name={icon} className="w-5 h-5 transition-transform group-hover:scale-110" />
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {label}
        </span>
    </button>
);

const BulkActionBar: React.FC<{count: number; onAction: (action: AIAction, params: any) => void;}> = ({ count, onAction }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-[var(--text-tertiary)] p-4 animate-slow-fade-in">
             <div className="flex items-center gap-4">
                <p className="text-lg font-semibold text-[var(--text-primary)]">{count} selected</p>
                <div className="h-8 w-px bg-[var(--border-glow)]"></div>
                <div className="flex items-center gap-2">
                    <ActionButton icon="archive" label="Archive" onClick={() => onAction(AIAction.ARCHIVE_EMAIL, {})} />
                    <ActionButton icon="trash" label="Delete" onClick={() => onAction(AIAction.DELETE_EMAIL, {})} />
                    <ActionButton icon="star" label="Star" onClick={() => onAction(AIAction.MARK_AS_IMPORTANT, {})} />
                    <ActionButton icon="inbox" label="Mark as Unread" onClick={() => onAction(AIAction.MARK_AS_UNREAD, {})} />
                </div>
            </div>
        </div>
    );
}


const EmailDetail: React.FC<EmailDetailProps> = (props) => {
  const { email, onAction, onCompose, onSummarize, onAddEvent, enableSummarization, enableQuickReplies, selectedEmailIds } = props;
  const [isSnoozeMenuOpen, setIsSnoozeMenuOpen] = useState(false);
  const snoozeMenuRef = useRef<HTMLDivElement>(null);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [isLoadingQuickReplies, setIsLoadingQuickReplies] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (snoozeMenuRef.current && !snoozeMenuRef.current.contains(event.target as Node)) {
        setIsSnoozeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!email || email.status === EmailStatus.DRAFT || !enableQuickReplies) {
        setQuickReplies([]);
        return;
    }

    setIsLoadingQuickReplies(true);
    setQuickReplies([]);
    generateQuickReplies({ subject: email.subject, body: email.body })
        .then(replies => {
            setQuickReplies(replies);
        })
        .catch(error => {
            console.error("Failed to fetch quick replies:", error);
            setQuickReplies([]);
        })
        .finally(() => {
            setIsLoadingQuickReplies(false);
        });
  }, [email, enableQuickReplies]);

  if (selectedEmailIds.size > 0) {
    return <BulkActionBar count={selectedEmailIds.size} onAction={onAction} />
  }

  if (!email) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-tertiary)] p-4">
        <div className="text-center animate-slow-fade-in">
            <Icon name="inbox" className="w-24 h-24 mx-auto opacity-30" />
            <h2 className="mt-4 text-xl font-semibold text-[var(--text-secondary)]">Select an email to read</h2>
            <p className="mt-1 text-sm">Or use the assistant to manage your inbox.</p>
        </div>
      </div>
    );
  }

  const handleReply = (replyBody?: string, isReplyAll: boolean = false) => {
    let recipients = [email.sender_email];
    if (isReplyAll && email.recipient_email) {
      recipients = [...new Set([...recipients, email.recipient_email])];
    }

    onCompose({
      recipient: recipients.join(', '),
      subject: `Re: ${email.subject}`,
      body: `${replyBody ? replyBody + '\n\n' : '\n\n'}---- On ${new Date(email.timestamp).toLocaleString()}, ${email.sender} wrote: ----\n>${email.body.replace(/\n/g, '\n>')}`
    });
  }
  
  const handleForward = () => {
     onCompose({
      subject: `Fwd: ${email.subject}`,
      body: `\n\n---- Forwarded Message ----\nFrom: ${email.sender} <${email.sender_email}>\nDate: ${new Date(email.timestamp).toLocaleString()}\nSubject: ${email.subject}\n\n${email.body}`
    });
  }

  const getSnoozeDate = (option: 'today' | 'tomorrow' | 'weekend' | 'week') => {
    const now = new Date();
    switch (option) {
        case 'today':
            now.setHours(now.getHours() + 3);
            return now.toISOString();
        case 'tomorrow':
            const tomorrow = new Date();
            tomorrow.setDate(now.getDate() + 1);
            tomorrow.setHours(9, 0, 0, 0);
            return tomorrow.toISOString();
        case 'weekend':
            const weekend = new Date();
            const dayOfWeek = now.getDay(); // Sunday = 0, Saturday = 6
            const daysUntilSaturday = dayOfWeek === 6 ? 7 : (6 - dayOfWeek + 7) % 7;
            weekend.setDate(now.getDate() + daysUntilSaturday);
            weekend.setHours(9, 0, 0, 0);
            return weekend.toISOString();
        case 'week':
            const nextWeek = new Date();
            nextWeek.setDate(now.getDate() + 7);
            nextWeek.setHours(9, 0, 0, 0);
            return nextWeek.toISOString();
    }
  }

  const handleSnooze = (snooze_until: string) => {
    onAction(AIAction.SNOOZE_EMAIL, { emailId: email.id, snooze_until });
    setIsSnoozeMenuOpen(false);
  }

  const handleTaskAction = (task: DetectedTask) => {
    if (task.type === 'EVENT' && task.date) {
        const startTime = new Date(task.date);
        // Default to a 1-hour event if no end time is detected
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

        onAddEvent({
            title: task.description,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            description: `From email: "${email?.subject}"`
        });
    } else {
        // Handle other task types like REMINDER or DEADLINE, or show a toast
        onAction(AIAction.NO_ACTION, { toast: `Reminder for "${task.description}" set!` });
    }
  };

  const SnoozeMenuItem: React.FC<{label: string, onClick: () => void}> = ({ label, onClick }) => (
    <button onClick={onClick} className="w-full text-left px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-white/10 hover:text-white transition-colors rounded-md">
        {label}
    </button>
  );

  return (
    <div className="p-2 sm:p-5 h-full flex flex-col futuristic-scrollbar overflow-y-auto">
       <div className="flex-shrink-0 pb-3 border-b border-[var(--border-glow)]">
        <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-3">
              {email.status === EmailStatus.IMPORTANT && <Icon name="star" className="w-6 h-6 text-yellow-400 flex-shrink-0" />}
              <span>{email.subject}</span>
            </h2>
        </div>
         <div className="flex items-center gap-2 flex-wrap">
              <ActionButton icon="reply" label="Reply" onClick={() => handleReply()} />
              <ActionButton icon="reply-all" label="Reply All" onClick={() => handleReply(undefined, true)} />
              <ActionButton icon="forward" label="Forward" onClick={handleForward} />
              {enableSummarization && <ActionButton icon="document-text" label="Summarize" onClick={() => onSummarize(email.id)} />}
              {email.status !== EmailStatus.TRASH && <ActionButton icon="trash" label="Delete" onClick={() => onAction(AIAction.DELETE_EMAIL, {emailId: email.id})} />}
              {email.status !== EmailStatus.ARCHIVED && <ActionButton icon="archive" label="Archive" onClick={() => onAction(AIAction.ARCHIVE_EMAIL, {emailId: email.id})} />}
              
              {email.status !== EmailStatus.SNOOZED && (
                <div className="relative" ref={snoozeMenuRef}>
                    <ActionButton icon="clock" label="Snooze" onClick={() => setIsSnoozeMenuOpen(prev => !prev)} />
                    {isSnoozeMenuOpen && (
                        <div className="absolute bottom-full mb-2 -left-1/2 transform translate-x-1/4 w-48 bg-[var(--bg-panel-solid)] border border-[var(--border-glow)] rounded-xl shadow-2xl z-20 p-2 animate-slow-fade-in backdrop-blur-xl">
                            <SnoozeMenuItem label="Later Today" onClick={() => handleSnooze(getSnoozeDate('today'))} />
                            <SnoozeMenuItem label="Tomorrow" onClick={() => handleSnooze(getSnoozeDate('tomorrow'))} />
                            <SnoozeMenuItem label="This Weekend" onClick={() => handleSnooze(getSnoozeDate('weekend'))} />
                            <SnoozeMenuItem label="Next Week" onClick={() => handleSnooze(getSnoozeDate('week'))} />
                        </div>
                    )}
                </div>
              )}
              <ActionButton icon="star" label={email.status === EmailStatus.IMPORTANT ? "Unstar" : "Star"} onClick={() => onAction(AIAction.MARK_AS_IMPORTANT, {emailId: email.id})} className={email.status === EmailStatus.IMPORTANT ? 'text-yellow-400' : ''} />
          </div>
      </div>
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                {email.sender.charAt(0)}
            </div>
            <div>
                <p className="font-semibold text-white">{email.sender}</p>
                <p className="text-sm text-[var(--text-secondary)]">{email.sender_email}</p>
            </div>
        </div>
        <span className="text-xs sm:text-sm text-[var(--text-tertiary)] text-right flex-shrink-0 pl-2">
          {new Date(email.timestamp).toLocaleString()}
        </span>
      </div>
      <div className="flex-grow pt-4 text-[var(--text-secondary)] leading-relaxed overflow-y-auto">
        {email.detectedTasks && email.detectedTasks.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Icon name="sparkles" className="w-5 h-5 text-cyan-400" />
              Detected Actions
            </h3>
            <div className="flex flex-col gap-2">
              {email.detectedTasks.map((task, index) => (
                <DetectedTaskPill key={index} task={task} onAction={handleTaskAction} />
              ))}
            </div>
          </div>
        )}

        <p className="whitespace-pre-wrap text-sm">{email.body}</p>

        {email.attachments && email.attachments.length > 0 && (
            <div className="mt-6 pt-4 border-t border-[var(--border-glow)]">
                <h3 className="font-semibold text-white mb-3">Attachments</h3>
                <div className="flex flex-col gap-2">
                    {email.attachments.map((att, index) => (
                        <div key={index} className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-transparent hover:border-white/10 transition-colors">
                            <Icon name="paper-clip" className="w-5 h-5 text-[var(--text-tertiary)]" />
                            <span className="text-sm text-[var(--text-secondary)]">{att}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}
        
        {enableQuickReplies && isLoadingQuickReplies && (
            <div className="mt-6 pt-4 border-t border-[var(--border-glow)]">
                <div className="flex items-center gap-3 text-[var(--text-tertiary)]">
                    <Icon name="sparkles" className="w-5 h-5 text-cyan-400 animate-pulse"/>
                    <span className="text-sm">Generating quick replies...</span>
                </div>
            </div>
        )}

        {enableQuickReplies && !isLoadingQuickReplies && quickReplies.length > 0 && (
             <div className="mt-6 pt-4 border-t border-[var(--border-glow)]">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Icon name="sparkles" className="w-5 h-5 text-cyan-400" />
                    AI Quick Replies
                </h3>
                <div className="flex flex-wrap gap-2">
                    {quickReplies.map((reply, index) => (
                        <button 
                            key={index} 
                            onClick={() => handleReply(reply)}
                            className="bg-white/5 hover:bg-white/10 p-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-white transition-all duration-200 border border-transparent hover:border-[var(--accent-cyan)]/50 transform hover:-translate-y-0.5"
                        >
                           {reply}
                        </button>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default EmailDetail;
