
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import MailboxPanel from './components/MailboxPanel';
import EmailDetail from './components/EmailDetail';
import ChatAssistant from './components/ChatAssistant';
import ComposeModal from './components/ComposeModal';
import SettingsPage from './components/SettingsPage';

const App: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>(MOCK_EMAILS);
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(1);
  const [highlightedEmailId, setHighlightedEmailId] = useState<number | null>(null);
  const [selectedEmailIds, setSelectedEmailIds] = useState<Set<number>>(new Set());
  const [currentView, setCurrentView] = useState<MailboxView>('INBOX');
  const [isViewTransitioning, setIsViewTransitioning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [undoAction, setUndoAction] = useState<{ emailIds: number[], previousStatus: EmailStatus } | null>(null);
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

  }, [panelRefs]);


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

  const addEvent = (event: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
        ...event,
        id: `evt-${Date.now()}`,
    };
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
    }, 200); // Duration should match the fade-out animation
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
    
    // Determine target IDs for bulk or single actions
    const isBulkAction = selectedEmailIds.size > 0 && !params?.emailId;
    const targetIds = isBulkAction ? Array.from(selectedEmailIds) : [params?.emailId ?? selectedEmailId];
    
    if (targetIds.length === 0 || (targetIds.length === 1 && targetIds[0] === null)) {
      // No target, do nothing. Maybe show a toast in future.
      return;
    }
    
    const singleTargetId = targetIds[0];

    // --- Show Toast Messages ---
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
    } else if (action === AIAction.DELETE_EMAIL || action === AIAction.ARCHIVE_EMAIL) {
        // Log the action for triage learning
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
    // For structured search, we can create a descriptive query string for display
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

  // --- Agentic Feature Handlers ---
  const handleUnsubscribe = (subscriptionIds: string[]) => {
    setSubscriptions(prev => prev.filter(sub => !subscriptionIds.includes(sub.id)));
    setToastMessage(`Unsubscribed from ${subscriptionIds.length} newsletter(s)`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleDigestMode = (subscriptionId: string) => {
    setSubscriptions(prev => prev.map(sub => 
      sub.id === subscriptionId ? { ...sub, isActive: !sub.isActive } : sub
    ));
  };

  const handleConvertFile = (attachmentId: string, format: string) => {
    console.log(`Converting ${attachmentId} to ${format}`);
    setToastMessage(`Converting file to ${format.toUpperCase()}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExtractText = (attachmentId: string) => {
    const attachment = smartAttachments.find(a => a.id === attachmentId);
    if (attachment) {
      console.log(`Extracting text from ${attachment.name}`);
      setToastMessage(`Extracting text from ${attachment.name}`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleSummarizeAndSend = (attachmentId: string, recipient: string) => {
    const attachment = smartAttachments.find(a => a.id === attachmentId);
    if (attachment) {
      console.log(`Summarizing ${attachment.name} and sending to ${recipient}`);
      setToastMessage(`Summarizing and sending ${attachment.name}`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleCreateTask = (attachmentId: string) => {
    const attachment = smartAttachments.find(a => a.id === attachmentId);
    if (attachment) {
      console.log(`Creating task for ${attachment.name}`);
      setToastMessage(`Task created for ${attachment.name}`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleExecuteQuickAction = (actionId: string) => {
    const action = quickActions.find(a => a.id === actionId);
    if (action) {
      action.action();
      setToastMessage(`Executed: ${action.label}`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleDismissInsight = (insightId: string) => {
    setAgenticInsights(prev => prev.filter(insight => insight.title !== insightId));
  };

  const handleSendChatMessage = (message: string) => {
    const newMessage: ChatMessage = {
      author: MessageAuthor.USER,
      text: message
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        author: MessageAuthor.AI,
        text: `I'll help you with: "${message}". Let me process that for you.`
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
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
                </div>
            </>
        ) : (
        <>
        <div
            ref={panelRefs[0]}
            className="bg-[var(--bg-panel)] border border-[var(--border-glow)] rounded-2xl overflow-hidden flex flex-col backdrop-blur-xl animate-slow-fade-in md:h-auto" 
            style={{
                animationDelay: '100ms',
                flexBasis: `${panelWidths[0]}%`,
                transition: 'flex-basis 0.3s ease-in-out',
                minWidth: `${MIN_PANEL_WIDTH_PX}px`,
                flexShrink: 0,
            }}
        >
          <MailboxPanel
            emails={emails}
            visibleEmails={visibleEmails}
            currentView={currentView}
            isViewTransitioning={isViewTransitioning}
            onSetView={handleSetView}
            onCompose={() => { setComposeInitialState({}); setIsComposeOpen(true); }}
            onOpenSettings={() => setIsSettingsOpen(true)}
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
            style={{
                animationDelay: '200ms',
                flexBasis: `${panelWidths[1]}%`,
                transition: 'flex-basis 0.3s ease-in-out',
                minWidth: `${MIN_PANEL_WIDTH_PX}px`,
                flexShrink: 0,
            }}
        >
        </div>

        <div className="hidden md:flex group flex-shrink-0">
            <Resizer onMouseDown={(e) => handleMouseDown(1, e)} />
        </div>

        <div
            ref={panelRefs[2]}
            className="bg-[var(--bg-panel)] border border-[var(--border-glow)] rounded-2xl flex flex-col backdrop-blur-xl animate-slow-fade-in md:h-auto"
            style={{
                animationDelay: '300ms',
                flexBasis: `${panelWidths[2]}%`,
                transition: 'flex-basis 0.3s ease-in-out',
                minWidth: `${MIN_PANEL_WIDTH_PX}px`,
                flexShrink: 0,
            }}
        >
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default App;
