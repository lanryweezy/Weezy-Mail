import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { Theme, AgentConfig, Account, AgentPersonality } from '../types';

declare global {
    interface Window {
        electron: {
            startGoogleAuth: () => void;
            onGoogleAuthCode: (callback: (event: any, code: string) => void) => () => void;
        }
    }
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  onSetTheme: (theme: Theme) => void;
  accounts: Account[];
  onSetAccounts: (accounts: Account[]) => void;
  agentConfig: AgentConfig;
  onSetAgentConfig: (config: AgentConfig) => void;
}

type SettingsTab = 'Accounts' | 'Appearance' | 'Agent';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, theme, onSetTheme, accounts, onSetAccounts, agentConfig, onSetAgentConfig }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('Accounts');
  const isElectron = !!window.electron;

  useEffect(() => {
    if (!isOpen) return;

    if (isElectron) {
      const removeListener = window.electron.onGoogleAuthCode(async (event, code) => {
        console.log('Received auth code from main process:', code);
        try {
          const response = await fetch('/api/auth/google/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          });
          if (response.ok) {
            alert('Successfully authenticated! The app will now reload.');
            window.location.reload();
          } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to finalize authentication');
          }
        } catch (error: any) {
            console.error('Error finalizing auth:', error);
            alert(`Error: ${error.message}`);
        }
      });
      return () => removeListener();
    }
  }, [isOpen, isElectron]);

  if (!isOpen) return null;

  const handleAddAccount = () => {
    if (isElectron) {
        window.electron.startGoogleAuth();
    } else {
        // This should be a redirect to the backend auth route
        // For simplicity, we'll just log for now as we focus on desktop
        console.log("Web auth flow not implemented in this version.");
    }
  };

  const handleRemoveAccount = (emailToRemove: string) => {
    onSetAccounts(accounts.filter(acc => acc.email !== emailToRemove));
  };
  
  const handlePersonalityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSetAgentConfig({ ...agentConfig, personality: e.target.value as AgentPersonality });
  };
  
  const handleFeatureToggle = (feature: keyof Omit<AgentConfig, 'personality'>) => {
    onSetAgentConfig({ ...agentConfig, [feature]: !agentConfig[feature] });
  };

  const renderAccountsTab = () => (
    <div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Connected Accounts</h3>
      <p className="text-sm text-[var(--text-tertiary)] mb-4">Manage the email accounts linked to the application.</p>
      <div className="space-y-3 mb-6">
        {accounts.map(acc => (
          <div key={acc.email} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white">{acc.email.charAt(0).toUpperCase()}</div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">{acc.email}</p>
                <p className="text-xs text-[var(--text-secondary)]">{acc.provider}</p>
              </div>
            </div>
            <button onClick={() => handleRemoveAccount(acc.email)} className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={acc.provider === 'Default'}>Remove</button>
          </div>
        ))}
      </div>
      <button onClick={handleAddAccount} className="w-full p-3 bg-blue-600 hover:bg-blue-500 transition-colors rounded-lg font-semibold">
        Add Google Account
      </button>
    </div>
  );
  
  const renderAppearanceTab = () => (
     <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Appearance</h3>
        <p className="text-sm text-[var(--text-tertiary)] mb-4">Customize the look and feel of your mailbox.</p>
        {/* ... appearance settings ... */}
    </div>
  );

  const renderAgentTab = () => (
    <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Email Agent</h3>
        <p className="text-sm text-[var(--text-tertiary)] mb-4">Configure your AI agent's behavior.</p>
        {/* ... agent settings ... */}
    </div>
  );
  
  const TabButton: React.FC<{label: SettingsTab}> = ({label}) => (
      <button onClick={() => setActiveTab(label)} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors w-full text-left ${activeTab === label ? 'bg-white/10 text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'}`}>
          {label}
      </button>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-slow-fade-in" onClick={onClose}>
      <div className="bg-[var(--bg-panel-solid)] border border-[var(--border-glow)] rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-glow)] flex-shrink-0">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none transition-colors">&times;</button>
        </div>
        <div className="flex-grow flex min-h-0">
            <div className="w-48 p-4 border-r border-[var(--border-glow)] flex-shrink-0">
                <nav className="flex flex-col gap-2">
                    <TabButton label="Accounts" />
                    <TabButton label="Appearance" />
                    <TabButton label="Agent" />
                </nav>
            </div>
            <div className="p-6 flex-grow overflow-y-auto futuristic-scrollbar">
                {activeTab === 'Accounts' && renderAccountsTab()}
                {activeTab === 'Appearance' && renderAppearanceTab()}
                {activeTab === 'Agent' && renderAgentTab()}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;