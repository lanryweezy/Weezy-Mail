import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Email, EmailStatus, AIAction, ChatMessage, MessageAuthor, MailboxView, EmailCategory, AISearchCriteria, Theme, Account, AgentConfig, CalendarEvent, ActionLogEntry, TriageAction, TriageRule } from './types';
import MailboxPanel from './components/MailboxPanel';
import EmailDetail from './components/EmailDetail';
import ChatAssistant from './components/ChatAssistant';
import ComposeModal from './components/ComposeModal';
import SettingsPage from './components/SettingsPage';
import Resizer from './components/Resizer';
import CalendarView from './components/CalendarView';
import RuleSuggestionToast from './components/RuleSuggestionToast';
import Icon from './components/Icon';
import { processEmailCommand, generateQuickReplies, processSearchQuery, generateSuggestedActions, generateSummary, detectTasksInEmail } from './services/geminiService';
import { detectRuleFromLog } from './services/triageService';

const NeedsAuthView: React.FC<{onSetView: (view: MailboxView) => void}> = ({ onSetView }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Icon name="lock" className="w-16 h-16 text-[var(--text-tertiary)] mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Connect Your Account</h2>
        <p className="text-[var(--text-secondary)] mb-6 max-w-sm">
            To start using your hyper-intelligent mailbox, please connect your Google account. Your emails will be fetched securely and will not be stored on our servers.
        </p>
        <button
            onClick={() => onSetView('SETTINGS')}
            className="px-6 py-3 bg-[var(--accent-cyan)] text-black font-bold rounded-lg hover:bg-cyan-300 transition-all shadow-lg shadow-cyan-500/20"
        >
            Go to Settings
        </button>
    </div>
);


const App: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthAndFetchEmails = async () => {
      try {
        const authStatusResponse = await fetch('/api/auth/status');
        const { isAuthenticated } = await authStatusResponse.json();
        setIsAuthenticated(isAuthenticated);

        if (isAuthenticated) {
            const emailsResponse = await fetch('/api/emails');
            if (!emailsResponse.ok) {
              throw new Error('Failed to fetch emails');
            }
            const fetchedEmails: Email[] = await emailsResponse.json();
            setEmails(fetchedEmails);
            if (fetchedEmails.length > 0) {
              setSelectedEmailId(fetchedEmails[0].id);
            }
        }
      } catch (error) {
        console.error("Error during startup:", error);
        showToast("Error: Could not load emails. Please check your connection or authentication.", 5000);
      }
    };

    checkAuthAndFetchEmails();
  }, []);

  const [highlightedEmailId, setHighlightedEmailId] = useState<string | null>(null);
  const [selectedEmailIds, setSelectedEmailIds] = useState<Set<string>>(new Set());
  const [currentView, setCurrentView] = useState<MailboxView>('INBOX');
  const [isViewTransitioning, setIsViewTransitioning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [undoAction, setUndoAction] = useState<{ emailIds: string[], previousStatus: EmailStatus } | null>(null);
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);
  const [suggestedRule, setSuggestedRule] = useState<Omit<TriageRule, 'id'> | null>(null);
  const [activeRules, setActiveRules] = useState<TriageRule[]>([]);
  
  const [events, setEvents] = useState<CalendarEvent[]>([
      { id: '1', title: 'Project Phoenix Kickoff', startTime: '2025-09-18T14:00:00Z', endTime: '2025-09-18T15:00:00Z' },
      { id: '2', title: 'Design Review', startTime: '2025-09-19T10:00:00Z', endTime: '2025-09-19T11:30:00Z' },
  ]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { author: MessageAuthor.AI, text: "Hello! I'm your Email Agent. How can I help you today?" }
  ]);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeInitialState, setComposeInitialState] = useState<{ draftId?: string; recipient?: string; subject?: string; body?: string; attachments?: string[] }>({});

  const [activeCategory, setActiveCategory] = useState<EmailCategory>('PRIMARY');
  const [aiSearchCriteria, setAiSearchCriteria] = useState<AISearchCriteria | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- Settings State ---
  const [theme, setTheme] = useState<Theme>('dark');
  const [accounts, setAccounts] = useState<Account[]>([{ email: 'user@agentic-mailbox.com', provider: 'Default' }]);
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
      personality: 'Professional',
      enableQuickReplies: true,
      enableSummarization: true
  });
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);

  const handleAcceptRule = () => {
    if (suggestedRule) {
      const newRule = { ...suggestedRule, id: `rule-${Date.now()}` };
      setActiveRules(prev => [...prev, newRule]);
      setSuggestedRule(null);
      showToast(`Automation rule for ${newRule.sender} created!`);
    }
  };

  const handleDeclineRule = () => {
    setSuggestedRule(null);
  };

  const deleteRule = (ruleId: string) => {
    setActiveRules(prevRules => prevRules.filter(rule => rule.id !== ruleId));
    showToast('Rule deleted.');
  };
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (selectedEmail) {
      generateSuggestedActions(selectedEmail).then(setSuggestedActions);
    } else {
      setSuggestedActions([]);
    }
  }, [selectedEmail]);

  // Effect to detect tasks in the selected email
  useEffect(() => {
    if (selectedEmail && selectedEmail.detectedTasks === undefined) {
      detectTasksInEmail(selectedEmail).then(tasks => {
        setEmails(currentEmails =>
          currentEmails.map(e => {
            if (e.id === selectedEmail.id) {
              return { ...e, detectedTasks: tasks };
            }
            return e;
          })
        );
      }).catch(error => {
          console.error(`Failed to detect tasks for email ${selectedEmail.id}:`, error);
          setEmails(currentEmails =>
            currentEmails.map(e =>
              e.id === selectedEmail.id ? { ...e, detectedTasks: [] } : e
            )
          );
      });
    }
  }, [selectedEmail]);

  // Effect to generate summaries for emails that don't have one
  useEffect(() => {
    if (!isAuthenticated) return;
    const processNextEmail = async () => {
      const emailToProcess = emails.find(e => !e.summary && e.body.length > 100);
      if (!emailToProcess) {
        return;
      }
      try {
        const summary = await generateSummary(emailToProcess);
        if (summary) {
          setEmails(currentEmails =>
            currentEmails.map(e =>
              e.id === emailToProcess.id ? { ...e, summary } : e
            )
          );
        }
      } catch (error) {
        console.error(`Failed to generate summary for email ${emailToProcess.id}:`, error);
      }
    };
    const timeoutId = setTimeout(processNextEmail, 1000);
    return () => clearTimeout(timeoutId);
  }, [emails, isAuthenticated]);

  useEffect(() => {
    if (suggestedRule) return;
    const potentialRule = detectRuleFromLog(actionLog, activeRules);
    if (potentialRule) {
        setSuggestedRule(potentialRule);
    }
  }, [actionLog, activeRules, suggestedRule]);

  useEffect(() => {
    if (activeRules.length === 0 || !isAuthenticated) return;
    const emailsToTriage = emails.filter(e => e.status === EmailStatus.UNREAD);
    if (emailsToTriage.length === 0) return;
    let changed = false;
    emailsToTriage.forEach(email => {
        const matchingRule = activeRules.find(rule => rule.sender === email.sender);
        if (matchingRule) {
            console.log(`Applying rule for ${email.sender}: ${matchingRule.action}`);
            const action = matchingRule.action === 'DELETE' ? AIAction.DELETE_EMAIL : AIAction.ARCHIVE_EMAIL;
            executeAction({ action, parameters: { emailId: email.id }});
            changed = true;
        }
    });
    if (changed) {
        showToast('Auto-triage complete!');
    }
  }, [emails, activeRules, isAuthenticated]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      switch (event.key) {
        case 'j': {
          event.preventDefault();
          const currentIdx = visibleEmails.findIndex(e => e.id === (highlightedEmailId ?? selectedEmailId));
          const nextIdx = Math.min(currentIdx + 1, visibleEmails.length - 1);
          if (nextIdx !== currentIdx) {
            setHighlightedEmailId(visibleEmails[nextIdx].id);
          }
          break;
        }
        case 'k': {
          event.preventDefault();
          const currentIdx = visibleEmails.findIndex(e => e.id === (highlightedEmailId ?? selectedEmailId));
          const nextIdx = Math.max(currentIdx - 1, 0);
           if (nextIdx !== currentIdx) {
            setHighlightedEmailId(visibleEmails[nextIdx].id);
          }
          break;
        }
        case 'o':
        case 'Enter': {
            event.preventDefault();
            const emailToSelect = visibleEmails.find(e => e.id === highlightedEmailId);
            if (emailToSelect) {
                handleSelectEmail(emailToSelect);
            }
            break;
        }
        case 'c': {
            event.preventDefault();
            setComposeInitialState({});
            setIsComposeOpen(true);
            break;
        }
        case '#': {
            if (selectedEmail) {
                event.preventDefault();
                executeAction({ action: AIAction.DELETE_EMAIL, parameters: { emailId: selectedEmail.id } });
            }
            break;
        }
        case 'e': {
            if (selectedEmail) {
                event.preventDefault();
                executeAction({ action: AIAction.ARCHIVE_EMAIL, parameters: { emailId: selectedEmail.id } });
            }
            break;
        }
        case 'r': {
            if (selectedEmail) {
                event.preventDefault();
                setComposeInitialState({
                    recipient: selectedEmail.sender_email,
                    subject: `Re: ${selectedEmail.subject}`,
                    body: `\n\n---- On ${new Date(selectedEmail.timestamp).toLocaleString()}, ${selectedEmail.sender} wrote: ----\n>${selectedEmail.body.replace(/\n/g, '\n>')}`
                });
                setIsComposeOpen(true);
            }
            break;
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [visibleEmails, highlightedEmailId, selectedEmailId]);

  const [panelWidths, setPanelWidths] = useState([25, 42, 33]);
  const isResizingRef = useRef<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const panelRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const MIN_PANEL_WIDTH_PX = 240;

  const handleMouseDown = useCallback((index: number, e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = index;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const handleMouseMove = (event: MouseEvent) => {
        if (isResizingRef.current === null || !containerRef.current) return;
        const leftPanel = panelRefs[isResizingRef.current]?.current;
        const rightPanel = panelRefs[isResizingRef.current + 1]?.current;
        if (!leftPanel || !rightPanel) return;
        const containerWidth = containerRef.current.offsetWidth;
        const leftPanelRect = leftPanel.getBoundingClientRect();
        const combinedWidth = leftPanel.offsetWidth + rightPanel.offsetWidth;
        const newLeftWidth = event.clientX - leftPanelRect.left;
        if (newLeftWidth > MIN_PANEL_WIDTH_PX && (combinedWidth - newLeftWidth) > MIN_PANEL_WIDTH_PX) {
            const newLeftPercent = (newLeftWidth / containerWidth) * 100;
            const newRightPercent = ((combinedWidth - newLeftWidth) / containerWidth) * 100;
            leftPanel.style.flexBasis = `${newLeftPercent}%`;
            rightPanel.style.flexBasis = `${newRightPercent}%`;
        }
    };
    const handleMouseUp = () => {
        isResizingRef.current = null;
        document.body.style.cursor = 'auto';
        document.body.style.userSelect = 'auto';
        const newWidths = panelRefs.map(ref => {
            if (ref.current && containerRef.current) {
                return (ref.current.offsetWidth / containerRef.current.offsetWidth) * 100;
            }
            return 0;
        });
        if (newWidths.every(w => w > 0)) {
            setPanelWidths(newWidths);
        }
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [panelRefs]);

  const showToast = (message: string, duration: number = 3000) => {
    setToastMessage(message);
    setTimeout(() => {
        setToastMessage(null);
        setUndoAction(null);
    }, duration);
  };
  
  const handleUndo = () => {
    if (undoAction) {
      setEmails(prevEmails => prevEmails.map(e => undoAction.emailIds.includes(e.id) ? { ...e, status: undoAction.previousStatus } : e));
      setToastMessage(null);
      setUndoAction(null);
    }
  };
  
  useEffect(() => {
    const interval = setInterval(() => {
        setEmails(prevEmails => {
            let changed = false;
            const updatedEmails = prevEmails.map(e => {
                if (e.status === EmailStatus.SNOOZED && e.snoozedUntil && new Date(e.snoozedUntil) <= new Date()) {
                    changed = true;
                    showToast(`Email from ${e.sender} is back in your inbox.`);
                    return { ...e, status: EmailStatus.UNREAD, snoozedUntil: undefined };
                }
                return e;
            });
            return changed ? updatedEmails : prevEmails;
        });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const selectedEmail = useMemo(() => emails.find(e => e.id === selectedEmailId) || null, [emails, selectedEmailId]);

  const addEvent = (event: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = { ...event, id: `evt-${Date.now()}` };
    setEvents(prevEvents => [...prevEvents, newEvent]);
    showToast(`Event "${newEvent.title}" added to calendar!`);
  };

  const handleSetView = (view: MailboxView) => {
    if (view === currentView) return;
    setIsViewTransitioning(true);
    setTimeout(() => {
      setCurrentView(view);
      setAiSearchCriteria(null);
      setSearchQuery('');
      setSelectedEmailId(null);
      setHighlightedEmailId(null);
      setSelectedEmailIds(new Set());
      setIsViewTransitioning(false);
    }, 200);
  };

  const handleSelectEmail = (email: Email) => {
    if (email.status === EmailStatus.DRAFT) {
        executeAction({ action: AIAction.EDIT_DRAFT, parameters: { emailId: email.id }});
        return;
    }
    setSelectedEmailId(email.id);
    if (email.status === EmailStatus.UNREAD) {
        setEmails(prevEmails =>
          prevEmails.map(e =>
            e.id === email.id ? { ...e, status: EmailStatus.READ } : e
          )
        );
    }
  };
  
  const executeAction = (actionRequest: { action: AIAction, parameters?: any }) => {
    const { action, parameters: params } = actionRequest;
    const isBulkAction = selectedEmailIds.size > 0 && !params?.emailId;
    const targetIds = isBulkAction ? Array.from(selectedEmailIds) : [params?.emailId ?? selectedEmailId];
    if (targetIds.length === 0 || (targetIds.length === 1 && targetIds[0] === null)) {
      return;
    }
    const singleTargetId = targetIds[0];
    if (params?.toast) {
        showToast(params.toast);
    } else if (![AIAction.NO_ACTION, AIAction.SUMMARIZE_EMAILS, AIAction.FIND_EMAILS, AIAction.CHANGE_VIEW, AIAction.ANSWER_QUESTION_FROM_EMAIL].includes(action)) {
        if (isBulkAction) {
            showToast(`${targetIds.length} items updated.`);
        } else {
            showToast(`Action: ${action.replace(/_/g, ' ')}`);
        }
    }
    setEmails(prevEmails => {
      let newEmails = [...prevEmails];
      switch (action) {
        case AIAction.ARCHIVE_EMAIL:
        case AIAction.DELETE_EMAIL:
        case AIAction.SNOOZE_EMAIL:
        case AIAction.MARK_AS_READ:
        case AIAction.MARK_AS_UNREAD:
        case AIAction.MARK_AS_IMPORTANT: {
            const originalEmail = prevEmails.find(e => e.id === singleTargetId);
            if (!originalEmail) break;
            const statusMap = {
                [AIAction.ARCHIVE_EMAIL]: EmailStatus.ARCHIVED,
                [AIAction.DELETE_EMAIL]: EmailStatus.TRASH,
                [AIAction.SNOOZE_EMAIL]: EmailStatus.SNOOZED,
                [AIAction.MARK_AS_READ]: EmailStatus.READ,
                [AIAction.MARK_AS_UNREAD]: EmailStatus.UNREAD,
                [AIAction.MARK_AS_IMPORTANT]: EmailStatus.IMPORTANT,
            };
            const newStatus = statusMap[action]!;
            newEmails = newEmails.map(e => targetIds.includes(e.id) ? { ...e, status: newStatus, snoozedUntil: action === AIAction.SNOOZE_EMAIL ? params.snooze_until : e.snoozedUntil } : e);
            if([AIAction.ARCHIVE_EMAIL, AIAction.DELETE_EMAIL, AIAction.SNOOZE_EMAIL].includes(action)) {
                setUndoAction({ emailIds: targetIds, previousStatus: originalEmail.status });
                showToast(`${targetIds.length} ${targetIds.length > 1 ? 'items' : 'item'} moved to ${newStatus.toLowerCase()}.`);
            }
            break;
          }
        case AIAction.SEND_EMAIL:
        case AIAction.CREATE_DRAFT: {
          if (params?.email_subject && params.email_body) {
              const newEmail: Email = {
                  id: Date.now().toString(),
                  sender: 'Me',
                  sender_email: 'user@agentic-mailbox.com',
                  recipient_email: params.recipient_email,
                  subject: params.email_subject,
                  body: params.email_body,
                  timestamp: new Date().toISOString(),
                  status: action === AIAction.SEND_EMAIL ? EmailStatus.READ : EmailStatus.DRAFT,
                  attachments: params.attachments || [],
                  category: 'PRIMARY',
              };
              newEmails = [newEmail, ...newEmails];
              if(params.draftId) {
                newEmails = newEmails.filter(e => e.id !== params.draftId);
              }
              if(action === AIAction.SEND_EMAIL) {
                setCurrentView('SENT');
                setSelectedEmailId(newEmail.id);
              } else {
                setCurrentView('DRAFTS');
                setSelectedEmailId(newEmail.id);
              }
          }
          break;
        }
        case AIAction.REPLY_TO_EMAIL:
        case AIAction.FORWARD_EMAIL: {
            if(singleTargetId && (params.reply_content || params.recipient_email)){
                const originalEmail = prevEmails.find(e => e.id === singleTargetId);
                if (originalEmail) {
                    const isReply = action === AIAction.REPLY_TO_EMAIL;
                    const newEmail: Email = {
                        id: Date.now().toString(),
                        sender: 'Me',
                        sender_email: 'user@agentic-mailbox.com',
                        recipient_email: isReply ? originalEmail.sender_email : params.recipient_email,
                        subject: `${isReply ? 'Re:' : 'Fwd:'} ${originalEmail.subject}`,
                        body: isReply 
                            ? `${params.reply_content}\n\n---- Original Message ----\nFrom: ${originalEmail.sender}\n\n${originalEmail.body}`
                            : `${params.forwarding_message || ''}\n\n---- Forwarded Message ----\nFrom: ${originalEmail.sender}\nSubject: ${originalEmail.subject}\n\n${originalEmail.body}`,
                        timestamp: new Date().toISOString(),
                        status: EmailStatus.DRAFT,
                        attachments: params.attachments || [],
                        category: 'PRIMARY',
                    };
                    newEmails = [newEmail, ...newEmails];
                    setCurrentView('DRAFTS');
                    setSelectedEmailId(newEmail.id);
                }
            }
            break;
          }
        case AIAction.OPEN_COMPOSE_MODAL:
            setComposeInitialState(params || {});
            setIsComposeOpen(true);
            break;
        case AIAction.EDIT_DRAFT: {
            if(params?.emailId) {
                const draftToEdit = prevEmails.find(e => e.id === params.emailId && e.status === EmailStatus.DRAFT);
                if (draftToEdit) {
                    setComposeInitialState({
                        draftId: draftToEdit.id,
                        recipient: draftToEdit.recipient_email,
                        subject: draftToEdit.subject,
                        body: draftToEdit.body,
                        attachments: draftToEdit.attachments,
                    });
                    setIsComposeOpen(true);
                }
            }
            break;
        }
        case AIAction.CHANGE_VIEW:
            if(params?.target_view) {
                handleSetView(params.target_view);
            }
            break;
      }
      return newEmails;
    });
    if (isBulkAction) {
        setSelectedEmailId(null);
        setSelectedEmailIds(new Set());
    } else if (action === AIAction.DELETE_EMAIL || action === AIAction.ARCHIVE_EMAIL) {
        const email = emails.find(e => e.id === singleTargetId);
        if (email) {
            const triageAction: TriageAction = action === AIAction.DELETE_EMAIL ? 'DELETE' : 'ARCHIVE';
            const logEntry: ActionLogEntry = {
                action: triageAction,
                emailId: email.id,
                sender: email.sender,
                timestamp: Date.now(),
            };
            setActionLog(prevLog => [...prevLog, logEntry]);
        }
    }
  }

  const handleUserMessage = useCallback(async (command: string) => {
    const userMessage: ChatMessage = { author: MessageAuthor.USER, text: command };
    const currentHistory = [...messages, userMessage];
    setMessages(currentHistory);
    setIsProcessing(true);
    try {
      const context = { emails, selectedEmailId, currentView };
      const actionResponse = await processEmailCommand(currentHistory, context, agentConfig.personality);
      const aiMessage: ChatMessage = { author: MessageAuthor.AI, text: actionResponse.response_message };
      setMessages(prev => [...prev, aiMessage]);
      for (const actionRequest of actionResponse.actions) {
        executeAction(actionRequest);
      }
    } catch (error) {
      console.error("Error processing AI command:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      showToast(`Error: ${errorMessage}`);
      const aiErrorMessage: ChatMessage = { author: MessageAuthor.AI, text: `I encountered an error: ${errorMessage}`};
      setMessages(prev => [...prev, aiErrorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [emails, messages, selectedEmailId, currentView, agentConfig.personality]);

  const handleAiSearch = useCallback(async (queryOrCriteria: string | AISearchCriteria) => {
    if (!queryOrCriteria) {
      setAiSearchCriteria(null);
      setSearchQuery('');
      return;
    }
    setIsSearching(true);
    const displayQuery = typeof queryOrCriteria === 'string' ? queryOrCriteria : 'Advanced Search';
    setSearchQuery(displayQuery);
    try {
        let criteria: AISearchCriteria;
        if (typeof queryOrCriteria === 'string') {
            criteria = await processSearchQuery(queryOrCriteria);
        } else {
            criteria = queryOrCriteria;
        }
        setAiSearchCriteria(criteria);
        setSelectedEmailIds(new Set());
    } catch (error) {
        console.error("AI Search Error:", error);
        showToast("AI search failed. Using basic search.");
        setAiSearchCriteria(null);
    } finally {
        setIsSearching(false);
    }
  }, []);

  const handleSendEmail = (emailData: { draftId?: string, recipient: string, subject: string, body: string, attachments: string[] }) => {
      executeAction({action: AIAction.SEND_EMAIL, parameters: { 
          draftId: emailData.draftId,
          recipient_email: emailData.recipient, 
          email_subject: emailData.subject, 
          email_body: emailData.body,
          attachments: emailData.attachments
      }});
      setIsComposeOpen(false);
      showToast("Email Sent!");
  }

  const handleSummarize = useCallback((emailId: string) => {
    if (isProcessing) return;
    handleUserMessage(`Please summarize the email with the ID ${emailId}.`);
    showToast("Agent is summarizing the email...");
  }, [handleUserMessage, isProcessing]);

  const visibleEmails = useMemo(() => {
    if (!isAuthenticated) return [];
    let filteredEmails: Email[];
    switch (currentView) {
        case 'INBOX':
            filteredEmails = emails.filter(e => e.status === EmailStatus.UNREAD || e.status === EmailStatus.READ);
            break;
        case 'SENT':
             filteredEmails = emails.filter(e => e.sender === 'Me' && e.status === EmailStatus.READ);
             break;
        case 'DRAFTS':
            filteredEmails = emails.filter(e => e.status === EmailStatus.DRAFT);
            break;
        case 'IMPORTANT':
            filteredEmails = emails.filter(e => e.status === EmailStatus.IMPORTANT);
            break;
        case 'TRASH':
            filteredEmails = emails.filter(e => e.status === EmailStatus.TRASH);
            break;
        case 'SNOOZED':
            filteredEmails = emails.filter(e => e.status === EmailStatus.SNOOZED);
            break;
        default:
            filteredEmails = [];
    }
    if (currentView === 'INBOX' && !aiSearchCriteria) {
        filteredEmails = filteredEmails.filter(e => e.category === activeCategory);
    }
    if (aiSearchCriteria) {
        return filteredEmails.filter(e => {
            const { sender, subject, keyword, isUnread, hasAttachment } = aiSearchCriteria;
            const lowercasedSender = sender?.toLowerCase();
            const lowercasedSubject = subject?.toLowerCase();
            const lowercasedKeyword = keyword?.toLowerCase();
            return (!lowercasedSender || e.sender.toLowerCase().includes(lowercasedSender)) &&
                   (!lowercasedSubject || e.subject.toLowerCase().includes(lowercasedSubject)) &&
                   (!lowercasedKeyword || e.body.toLowerCase().includes(lowercasedKeyword)) &&
                   (isUnread === undefined || (isUnread && e.status === EmailStatus.UNREAD)) &&
                   (hasAttachment === undefined || (hasAttachment && e.attachments && e.attachments.length > 0));
        });
    }
    return filteredEmails.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [emails, currentView, activeCategory, aiSearchCriteria, isAuthenticated]);
  
  const handleToggleSelectId = (id: string) => {
    setSelectedEmailIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  };

  const handleToggleSelectAll = () => {
    const allVisibleIds = new Set(visibleEmails.map(e => e.id));
    if (selectedEmailIds.size === allVisibleIds.size) {
        setSelectedEmailIds(new Set());
    } else {
        setSelectedEmailIds(allVisibleIds);
    }
  };

  return (
    <div className="h-screen w-screen text-[var(--text-primary)] font-sans overflow-hidden flex flex-col">
      {suggestedRule && (
        <RuleSuggestionToast
            rule={suggestedRule}
            onAccept={handleAcceptRule}
            onDecline={handleDeclineRule}
        />
      )}
      {toastMessage && (
        <div className="absolute top-5 right-5 bg-[var(--bg-panel-solid)] border border-[var(--border-glow)] text-white py-2 px-5 rounded-lg shadow-2xl z-50 flex items-center gap-4 backdrop-blur-xl animate-slow-fade-in">
          <span>{toastMessage}</span>
          {undoAction && (
              <button onClick={handleUndo} className="font-bold underline hover:text-[var(--accent-cyan)] transition-colors">Undo</button>
          )}
        </div>
      )}
       <ComposeModal 
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSend={handleSendEmail}
        initialState={composeInitialState}
      />

      <div ref={containerRef} className="flex-grow w-full h-full flex flex-col md:flex-row p-4 gap-4 md:gap-0">
        {currentView === 'CALENDAR' || currentView === 'SETTINGS' ? (
             <div
                className="bg-[var(--bg-panel)] border border-[var(--border-glow)] rounded-2xl overflow-hidden flex flex-col backdrop-blur-xl animate-slow-fade-in md:h-auto"
                style={{ flexBasis: '25%', minWidth: '240px' }}
            >
                <MailboxPanel
                    emails={emails}
                    visibleEmails={visibleEmails}
                    currentView={currentView}
                    isViewTransitioning={isViewTransitioning}
                    onSetView={handleSetView}
                    onCompose={() => { setComposeInitialState({}); setIsComposeOpen(true); }}
                    onOpenSettings={() => handleSetView('SETTINGS')}
                        onSelectEmail={handleSelectEmail}
                        selectedEmailId={selectedEmailId}
                        highlightedEmailId={highlightedEmailId}
                        onAiSearch={handleAiSearch}
                        isSearching={isSearching}
                        aiCriteria={aiSearchCriteria}
                        searchQuery={searchQuery}
                        onClearSearch={() => { setAiSearchCriteria(null); setSearchQuery(''); }}
                        activeCategory={activeCategory}
                        onSetCategory={setActiveCategory}
                        selectedEmailIds={selectedEmailIds}
                        onToggleSelectId={handleToggleSelectId}
                        onToggleSelectAll={handleToggleSelectAll}
                        onAction={(action, params) => executeAction({ action, parameters: params })}
                    />
                </div>
                <div className="hidden md:flex group flex-shrink-0">
                    <Resizer onMouseDown={(e) => handleMouseDown(0, e)} />
                </div>
                <div
                    className="bg-[var(--bg-panel)] border border-[var(--border-glow)] rounded-2xl overflow-hidden flex flex-col backdrop-blur-xl animate-slow-fade-in md:h-auto"
                    style={{ flexBasis: '75%' }}
                >
                    {currentView === 'CALENDAR' && <CalendarView events={events} />}
                    {currentView === 'SETTINGS' &&
                        <SettingsPage
                            theme={theme} onSetTheme={setTheme}
                            accounts={accounts} onSetAccounts={setAccounts}
                            agentConfig={agentConfig} onSetAgentConfig={setAgentConfig}
                            activeRules={activeRules} onDeleteRule={deleteRule}
                        />}
                </div>
            </>
        ) : (
        <>
        <div
            ref={panelRefs[0]}
            className="bg-[var(--bg-panel)] border border-[var(--border-glow)] rounded-2xl overflow-hidden flex flex-col backdrop-blur-xl animate-slow-fade-in md:h-auto" 
            style={{ animationDelay: '100ms', flexBasis: `${panelWidths[0]}%`, transition: 'flex-basis 0.3s ease-in-out', minWidth: `${MIN_PANEL_WIDTH_PX}px`, flexShrink: 0 }}
        >
          <MailboxPanel
            emails={emails}
            visibleEmails={visibleEmails}
            currentView={currentView}
            isViewTransitioning={isViewTransitioning}
            onSetView={handleSetView}
            onCompose={() => { setComposeInitialState({}); setIsComposeOpen(true); }}
            onOpenSettings={() => handleSetView('SETTINGS')}
            onSelectEmail={handleSelectEmail}
            selectedEmailId={selectedEmailId}
            highlightedEmailId={highlightedEmailId}
            onAiSearch={handleAiSearch}
            isSearching={isSearching}
            aiCriteria={aiSearchCriteria}
            searchQuery={searchQuery}
            onClearSearch={() => { setAiSearchCriteria(null); setSearchQuery(''); }}
            activeCategory={activeCategory}
            onSetCategory={setActiveCategory}
            selectedEmailIds={selectedEmailIds}
            onToggleSelectId={handleToggleSelectId}
            onToggleSelectAll={handleToggleSelectAll}
            onAction={(action, params) => executeAction({ action, parameters: params })}
          />
        </div>

        <div className="hidden md:flex group flex-shrink-0">
          <Resizer onMouseDown={(e) => handleMouseDown(0, e)} />
        </div>

        <div
            ref={panelRefs[1]}
            className="bg-[var(--bg-panel)] border border-[var(--border-glow)] rounded-2xl overflow-hidden flex flex-col backdrop-blur-xl animate-slow-fade-in md:h-auto" 
            style={{ animationDelay: '200ms', flexBasis: `${panelWidths[1]}%`, transition: 'flex-basis 0.3s ease-in-out', minWidth: `${MIN_PANEL_WIDTH_PX}px`, flexShrink: 0 }}
        >
          {isAuthenticated ? (
              <EmailDetail
                key={selectedEmailId}
                email={selectedEmail}
                onAction={(action, params) => executeAction({action, parameters: params})}
                onCompose={(initialState) => { setComposeInitialState(initialState); setIsComposeOpen(true); }}
                onSummarize={handleSummarize}
                onAddEvent={addEvent}
                enableSummarization={agentConfig.enableSummarization}
                enableQuickReplies={agentConfig.enableQuickReplies}
                selectedEmailIds={selectedEmailIds}
              />
          ) : (
              <NeedsAuthView onSetView={handleSetView} />
          )}
        </div>

        <div className="hidden md:flex group flex-shrink-0">
            <Resizer onMouseDown={(e) => handleMouseDown(1, e)} />
        </div>

        <div
            ref={panelRefs[2]}
            className="bg-[var(--bg-panel)] border border-[var(--border-glow)] rounded-2xl flex flex-col backdrop-blur-xl animate-slow-fade-in md:h-auto"
            style={{ animationDelay: '300ms', flexBasis: `${panelWidths[2]}%`, transition: 'flex-basis 0.3s ease-in-out', minWidth: `${MIN_PANEL_WIDTH_PX}px`, flexShrink: 0 }}
        >
           <ChatAssistant 
            messages={messages}
            onSendMessage={handleUserMessage} 
            isProcessing={isProcessing}
            suggestedActions={suggestedActions}
           />
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default App;
