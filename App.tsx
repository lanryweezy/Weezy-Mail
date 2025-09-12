
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Email, EmailStatus, AIAction, ChatMessage, MessageAuthor, MailboxView, EmailCategory, AISearchCriteria, Theme, Account, AgentConfig } from './types';
import { MOCK_EMAILS, createNewMockEmail } from './constants';
import MailboxPanel from './components/MailboxPanel';
import EmailDetail from './components/EmailDetail';
import ChatAssistant from './components/ChatAssistant';
import ComposeModal from './components/ComposeModal';
import SettingsModal from './components/SettingsModal';
import Resizer from './components/Resizer';
import { processEmailCommand, generateQuickReplies, processSearchQuery, generateSuggestedActions, generateSummary } from './services/geminiService';

const App: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>(MOCK_EMAILS);
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(1);
  const [selectedEmailIds, setSelectedEmailIds] = useState<Set<number>>(new Set());
  const [currentView, setCurrentView] = useState<MailboxView>('INBOX');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [undoAction, setUndoAction] = useState<{ emailIds: number[], previousStatus: EmailStatus } | null>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    { author: MessageAuthor.AI, text: "Hello! I'm your Email Agent. How can I help you today?" }
  ]);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [composeInitialState, setComposeInitialState] = useState<{ draftId?: number; recipient?: string; subject?: string; body?: string; attachments?: string[] }>({});

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

  // Effect to generate summaries for emails that don't have one
  useEffect(() => {
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
        // To prevent retrying a failed summary, we can set it to a special value or just leave it.
        // For now, we'll just log the error and let it be retried next time.
      }
    };

    // This timeout ensures we don't process a huge batch of emails all at once on initial load
    const timeoutId = setTimeout(processNextEmail, 1000);
    return () => clearTimeout(timeoutId);

  }, [emails]);


  // --- Resizable panels state and logic ---
  const [panelWidths, setPanelWidths] = useState([25, 42, 33]);
  const isResizing = useRef<number | null>(null);
  const startPos = useRef(0);
  const initialWidths = useRef<number[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const panel1Ref = useRef<HTMLDivElement>(null);
  const panel2Ref = useRef<HTMLDivElement>(null);
  const panel3Ref = useRef<HTMLDivElement>(null);
  const MIN_PANEL_WIDTH_PX = 240;

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing.current === null || !containerRef.current) return;

    const panelRefs = [panel1Ref, panel2Ref, panel3Ref];
    const leftPanel = panelRefs[isResizing.current]?.current;
    const rightPanel = panelRefs[isResizing.current + 1]?.current;

    if (!leftPanel || !rightPanel) return;

    const delta = e.clientX - startPos.current;
    const containerWidth = containerRef.current.offsetWidth;
    if (containerWidth === 0) return;

    const deltaPercent = (delta / containerWidth) * 100;
    
    const resizerIndex = isResizing.current;
    const leftPanelIndex = resizerIndex;
    const rightPanelIndex = resizerIndex + 1;

    const widths = [...initialWidths.current];
    const combinedWidth = widths[leftPanelIndex] + widths[rightPanelIndex];
    const minWidthPercent = (MIN_PANEL_WIDTH_PX / containerWidth) * 100;

    let newLeftWidth = widths[leftPanelIndex] + deltaPercent;

    if (newLeftWidth < minWidthPercent) {
        newLeftWidth = minWidthPercent;
    }
    
    if (newLeftWidth > combinedWidth - minWidthPercent) {
        newLeftWidth = combinedWidth - minWidthPercent;
    }

    const newRightWidth = combinedWidth - newLeftWidth;
    
    leftPanel.style.flexBasis = `${newLeftWidth}%`;
    rightPanel.style.flexBasis = `${newRightWidth}%`;
  }, []);

  const handleMouseUp = useCallback(() => {
    if (isResizing.current === null) return;
    
    const panelElements = [panel1Ref.current, panel2Ref.current, panel3Ref.current];
    const newWidths = panelElements.map(el => {
        if (!el) return 0;
        return parseFloat(el.style.flexBasis);
    });

    if (newWidths.every(w => !isNaN(w) && w > 0)) {
        setPanelWidths(newWidths);
    }
    
    isResizing.current = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback((index: number, e: React.MouseEvent) => {
    isResizing.current = index;
    startPos.current = e.clientX;
    initialWidths.current = [...panelWidths];
    e.preventDefault();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [panelWidths, handleMouseMove, handleMouseUp]);


  useEffect(() => {
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);


  const showToast = (message: string, duration: number = 3000) => {
    setToastMessage(message);
    setTimeout(() => {
        setToastMessage(null);
        setUndoAction(null);
    }, duration);
  };
  
  // Real-time email simulation
  useEffect(() => {
    const newEmailInterval = setInterval(() => {
        const newEmail = createNewMockEmail();
        setEmails(prevEmails => [newEmail, ...prevEmails]);
        if(currentView === 'INBOX' && newEmail.category === activeCategory) {
          showToast(`New email from ${newEmail.sender}`, 2500);
        }
    }, 30000); // every 30 seconds

    return () => clearInterval(newEmailInterval);
  }, [currentView, activeCategory]);

  const handleUndo = () => {
    if (undoAction) {
      // For now, undo only supports status changes. This would need to be more robust for deletions.
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
    
    // Determine target IDs for bulk or single actions
    const isBulkAction = selectedEmailIds.size > 0 && !params?.emailId;
    const targetIds = isBulkAction ? Array.from(selectedEmailIds) : [params?.emailId ?? selectedEmailId];
    
    if (targetIds.length === 0 || (targetIds.length === 1 && targetIds[0] === null)) {
      // No target, do nothing. Maybe show a toast in future.
      return;
    }
    
    const singleTargetId = targetIds[0];

    // --- Show Toast Messages ---
    if (![AIAction.NO_ACTION, AIAction.SUMMARIZE_EMAILS, AIAction.FIND_EMAILS, AIAction.CHANGE_VIEW, AIAction.ANSWER_QUESTION_FROM_EMAIL].includes(action)) {
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
                 // For simplicity, undo only tracks the status of the first item in a bulk action
                setUndoAction({ emailIds: targetIds, previousStatus: originalEmail.status });
                showToast(`${targetIds.length} ${targetIds.length > 1 ? 'items' : 'item'} moved to ${newStatus.toLowerCase()}.`);
            }
            break;
          }
        case AIAction.SEND_EMAIL:
        case AIAction.CREATE_DRAFT: {
          if (params?.email_subject && params.email_body) {
              const newEmail: Email = {
                  id: Date.now(),
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
                        id: Date.now(),
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
                setCurrentView(params.target_view);
                setAiSearchCriteria(null);
                setSearchQuery('');
                setSelectedEmailId(null);
                setSelectedEmailIds(new Set());
            }
            break;
      }
      return newEmails;
    });

    if (isBulkAction) {
        setSelectedEmailId(null);
        setSelectedEmailIds(new Set());
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

  const handleAiSearch = useCallback(async (query: string) => {
    if (!query) {
      setAiSearchCriteria(null);
      setSearchQuery('');
      return;
    }
    setIsSearching(true);
    setSearchQuery(query);
    try {
        const criteria = await processSearchQuery(query);
        setAiSearchCriteria(criteria);
        setSelectedEmailIds(new Set());
    } catch (error) {
        console.error("AI Search Error:", error);
        showToast("AI search failed. Using basic search.");
        setAiSearchCriteria(null); // Fallback to basic search
    } finally {
        setIsSearching(false);
    }
  }, []);

  const handleSendEmail = (emailData: { draftId?: number, recipient: string, subject: string, body: string, attachments: string[] }) => {
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

  const handleSummarize = useCallback((emailId: number) => {
    if (isProcessing) return;
    handleUserMessage(`Please summarize the email with the ID ${emailId}.`);
    showToast("Agent is summarizing the email...");
  }, [handleUserMessage, isProcessing]);

  const visibleEmails = useMemo(() => {
    let filteredEmails: Email[];
    // 1. Filter by Main View
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
    
    // 2. Filter by Category if in Inbox
    if (currentView === 'INBOX' && !aiSearchCriteria) {
        filteredEmails = filteredEmails.filter(e => e.category === activeCategory);
    }

    // 3. Filter by AI Search Criteria
    if (aiSearchCriteria) {
        return filteredEmails.filter(e => {
            const { sender, subject, keyword, isUnread } = aiSearchCriteria;
            const lowercasedSender = sender?.toLowerCase();
            const lowercasedSubject = subject?.toLowerCase();
            const lowercasedKeyword = keyword?.toLowerCase();

            return (!lowercasedSender || e.sender.toLowerCase().includes(lowercasedSender)) &&
                   (!lowercasedSubject || e.subject.toLowerCase().includes(lowercasedSubject)) &&
                   (!lowercasedKeyword || e.body.toLowerCase().includes(lowercasedKeyword)) &&
                   (isUnread === undefined || (isUnread && e.status === EmailStatus.UNREAD));
        });
    }

    return filteredEmails.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [emails, currentView, activeCategory, aiSearchCriteria]);
  
  const handleToggleSelectId = (id: number) => {
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
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onSetTheme={setTheme}
        accounts={accounts}
        onSetAccounts={setAccounts}
        agentConfig={agentConfig}
        onSetAgentConfig={setAgentConfig}
      />

      <div ref={containerRef} className="flex-grow w-full h-full flex flex-col md:flex-row p-4 gap-4 md:gap-0">
        <div
            ref={panel1Ref}
            className="bg-[var(--bg-panel)] border border-[var(--border-glow)] rounded-2xl overflow-hidden flex flex-col backdrop-blur-xl animate-slow-fade-in md:h-auto" 
            style={{
                animationDelay: '100ms',
                flexBasis: `${panelWidths[0]}%`,
                minWidth: `${MIN_PANEL_WIDTH_PX}px`,
                flexShrink: 0,
            }}
        >
          <MailboxPanel
            emails={emails}
            visibleEmails={visibleEmails}
            currentView={currentView}
            onSetView={(view) => {
                setCurrentView(view);
                setAiSearchCriteria(null);
                setSearchQuery('');
                setSelectedEmailId(null);
                setSelectedEmailIds(new Set());
            }}
            onCompose={() => { setComposeInitialState({}); setIsComposeOpen(true); }}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onSelectEmail={handleSelectEmail}
            selectedEmailId={selectedEmailId}
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
            ref={panel2Ref}
            className="bg-[var(--bg-panel)] border border-[var(--border-glow)] rounded-2xl overflow-hidden flex flex-col backdrop-blur-xl animate-slow-fade-in md:h-auto" 
            style={{
                animationDelay: '200ms',
                flexBasis: `${panelWidths[1]}%`,
                minWidth: `${MIN_PANEL_WIDTH_PX}px`,
                flexShrink: 0,
            }}
        >
          <EmailDetail 
            email={selectedEmail}
            onAction={(action, params) => executeAction({action, parameters: params})}
            onCompose={(initialState) => { setComposeInitialState(initialState); setIsComposeOpen(true); }}
            onSummarize={handleSummarize}
            enableSummarization={agentConfig.enableSummarization}
            enableQuickReplies={agentConfig.enableQuickReplies}
            selectedEmailIds={selectedEmailIds}
          />
        </div>

        <div className="hidden md:flex group flex-shrink-0">
            <Resizer onMouseDown={(e) => handleMouseDown(1, e)} />
        </div>

        <div
            ref={panel3Ref}
            className="bg-[var(--bg-panel)] border border-[var(--border-glow)] rounded-2xl flex flex-col backdrop-blur-xl animate-slow-fade-in md:h-auto"
            style={{
                animationDelay: '300ms',
                flexBasis: `${panelWidths[2]}%`,
                minWidth: `${MIN_PANEL_WIDTH_PX}px`,
                flexShrink: 0,
            }}
        >
           <ChatAssistant 
            messages={messages}
            onSendMessage={handleUserMessage} 
            isProcessing={isProcessing}
            suggestedActions={suggestedActions}
           />
        </div>
      </div>
    </div>
  );
};

export default App;
