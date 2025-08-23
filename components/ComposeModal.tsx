import React, { useState, useEffect } from 'react';
import Icon from './Icon';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: { draftId?: number, recipient: string; subject: string; body: string; attachments: string[] }) => void;
  initialState?: { draftId?: number; recipient?: string; subject?:string; body?: string; attachments?: string[] };
}

const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, onSend, initialState = {} }) => {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setRecipient(initialState.recipient || '');
      setSubject(initialState.subject || '');
      setBody(initialState.body || '');
      setAttachments(initialState.attachments || []);
    }
  }, [isOpen, initialState]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (recipient && subject) {
      onSend({ draftId: initialState.draftId, recipient, subject, body, attachments });
      onClose();
    }
  };

  const handleAddAttachment = () => {
    setAttachments(prev => [...prev, `document_${Date.now()}.pdf`]);
  }

  const handleRemoveAttachment = (fileName: string) => {
    setAttachments(prev => prev.filter(f => f !== fileName));
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-slow-fade-in" onClick={onClose}>
      <div 
        className="bg-[var(--bg-panel-solid)] border border-[var(--border-glow)] rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-glow)] flex-shrink-0">
          <h2 className="text-xl font-bold text-white">{initialState.draftId ? "Edit Draft" : "New Message"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none transition-colors">&times;</button>
        </div>
        <div className="p-4 flex flex-col gap-4 flex-grow overflow-y-auto futuristic-scrollbar">
          <input
            type="email"
            placeholder="To"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full bg-black/20 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] border border-transparent transition-shadow"
          />
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-black/20 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] border border-transparent transition-shadow"
          />
          <textarea
            placeholder="Message body..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full h-full flex-grow bg-black/20 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] border border-transparent transition-shadow resize-none"
            rows={10}
          />
           {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border-glow)]">
                {attachments.map(att => (
                    <div key={att} className="bg-white/10 rounded-full flex items-center gap-2 pl-3 pr-2 py-1 text-sm">
                        <Icon name="paper-clip" className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300">{att}</span>
                        <button onClick={() => handleRemoveAttachment(att)} className="text-slate-400 hover:text-white">&times;</button>
                    </div>
                ))}
            </div>
           )}
        </div>
        <div className="flex items-center justify-between p-4 border-t border-[var(--border-glow)] flex-shrink-0">
          <button onClick={handleAddAttachment} className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors">
            <Icon name="paper-clip" className="w-5 h-5"/>
          </button>
          <button
            onClick={handleSend}
            disabled={!recipient || !subject}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-2 px-6 rounded-lg hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 transform hover:-translate-y-0.5 disabled:from-slate-600 disabled:to-slate-700 disabled:shadow-none disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Icon name="paper-airplane" className="w-5 h-5" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComposeModal;
