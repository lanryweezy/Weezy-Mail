import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { Theme, AgentConfig, Account, AgentPersonality } from '../types';


import { TriageRule } from '../types';

interface SettingsPageProps {
  theme: Theme;
  onSetTheme: (theme: Theme) => void;
  accounts: Account[];
  onSetAccounts: (accounts: Account[]) => void;
  agentConfig: AgentConfig;
  onSetAgentConfig: (config: AgentConfig) => void;
  activeRules: TriageRule[];
  onDeleteRule: (ruleId: string) => void;
}

type SettingsTab = 'Accounts' | 'Appearance' | 'Personality' | 'Automation Rules';
type AccountProvider = 'Gmail' | 'Outlook' | 'Yahoo' | 'IMAP/SMTP';
type AddAccountStep = 'selection' | 'form' | 'success';
type SecurityType = 'SSL/TLS' | 'STARTTLS' | 'None';

// Reusable form components for consistency
const FormInput = (props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
    <div className={props.className}>
        <label className="text-xs font-medium text-[var(--text-tertiary)]" htmlFor={props.id}>{props.label}</label>
        <input {...props} id={props.id} className="w-full bg-black/20 rounded-md px-3 py-2 mt-1 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] border border-transparent transition-shadow"/>
    </div>
);

const FormSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, children: React.ReactNode }) => (
     <div className={props.className}>
        <label className="text-xs font-medium text-[var(--text-tertiary)]" htmlFor={props.id}>{props.label}</label>
        <select {...props} id={props.id} className="w-full bg-black/20 rounded-md px-3 py-2 mt-1 text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] border border-transparent transition-shadow appearance-none"
             style={{
                background: 'var(--bg-panel) url(\'data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a8b2d1%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-13%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2013l128%20128c3.6%203.6%207.8%205.4%2013%205.4s9.4-1.8%2013-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-13%200-4.9-1.8-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E\') no-repeat right 1rem center',
                backgroundSize: '0.65rem',
            }}
        >
          {props.children}
        </select>
    </div>
);


const SettingsPage: React.FC<SettingsPageProps> = ({ theme, onSetTheme, accounts, onSetAccounts, agentConfig, onSetAgentConfig, activeRules, onDeleteRule }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('Accounts');
  
  // --- Add Account State ---
  const [addAccountStep, setAddAccountStep] = useState<AddAccountStep>('selection');
  const [selectedProvider, setSelectedProvider] = useState<AccountProvider | null>(null);
  
  // Generic form state
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');

  // IMAP/SMTP specific form state
  const [formUsername, setFormUsername] = useState('');
  const [imapServer, setImapServer] = useState('');
  const [imapPort, setImapPort] = useState('993');
  const [imapSecurity, setImapSecurity] = useState<SecurityType>('SSL/TLS');
  const [smtpServer, setSmtpServer] = useState('');
  const [smtpPort, setSmtpPort] = useState('465');
  const [smtpSecurity, setSmtpSecurity] = useState<SecurityType>('SSL/TLS');

  // Auto-populate IMAP/SMTP fields from email
  useEffect(() => {
    if (selectedProvider === 'IMAP/SMTP' && formEmail.includes('@')) {
        const domain = formEmail.split('@')[1];
        if(domain) {
            setFormUsername(formEmail);
            setImapServer(`imap.${domain}`);
            setSmtpServer(`smtp.${domain}`);
        }
    }
  }, [formEmail, selectedProvider]);

  const resetFormState = () => {
    setAddAccountStep('selection');
    setSelectedProvider(null);
    setFormEmail('');
    setFormPassword('');
    setFormUsername('');
    setImapServer('');
    setImapPort('993');
    setImapSecurity('SSL/TLS');
    setSmtpServer('');
    setSmtpPort('465');
    setSmtpSecurity('SSL/TLS');
  }

  const handleAddAccount = (provider: AccountProvider) => {
    if (provider === 'Gmail') {
      // Redirect to the backend for Google OAuth
      window.location.href = '/api/auth/google';
    } else {
      setSelectedProvider(provider);
      if (provider !== 'IMAP/SMTP') {
          setFormEmail(`your.name@${provider.split('/')[0].toLowerCase()}.com`);
      }
      setAddAccountStep('form');
    }
  };

  const handleConnectAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail) {
        alert("Email address is required.");
        return;
    }
    if (accounts.find(acc => acc.email === formEmail)) {
        alert("Account already exists!");
        return;
    }
    setAddAccountStep('success');
    // Simulate adding account
    setTimeout(() => {
        onSetAccounts([...accounts, { email: formEmail, provider: selectedProvider! }])
        resetFormState();
    }, 1500);
  }

  const handleRemoveAccount = (emailToRemove: string) => {
    onSetAccounts(accounts.filter(acc => acc.email !== emailToRemove));
  };
  
  const handlePersonalityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSetAgentConfig({ ...agentConfig, personality: e.target.value as AgentPersonality });
  };
  
  const handleFeatureToggle = (feature: keyof Omit<AgentConfig, 'personality'>) => {
    onSetAgentConfig({ ...agentConfig, [feature]: !agentConfig[feature] });
  };


  const renderAccountSelection = () => (
    <div className="grid grid-cols-2 gap-4 mt-4">
        <button onClick={() => handleAddAccount('Gmail')} className="flex items-center gap-3 p-4 bg-white/5 rounded-lg hover:bg-white/10 border border-transparent hover:border-white/20 transition-all text-[var(--text-primary)]">
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/4e/Gmail_Icon.png" alt="Gmail" className="w-6 h-6"/>
            <span>Gmail</span>
        </button>
        <button onClick={() => handleAddAccount('Outlook')} className="flex items-center gap-3 p-4 bg-white/5 rounded-lg hover:bg-white/10 border border-transparent hover:border-white/20 transition-all text-[var(--text-primary)]">
            <img src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg" alt="Outlook" className="w-6 h-6"/>
            <span>Outlook</span>
        </button>
        <button onClick={() => handleAddAccount('Yahoo')} className="flex items-center gap-3 p-4 bg-white/5 rounded-lg hover:bg-white/10 border border-transparent hover:border-white/20 transition-all text-[var(--text-primary)]">
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Yahoo%21_icon.png" alt="Yahoo" className="w-6 h-6"/>
            <span>Yahoo Mail</span>
        </button>
        <button onClick={() => handleAddAccount('IMAP/SMTP')} className="flex items-center gap-3 p-4 bg-white/5 rounded-lg hover:bg-white/10 border border-transparent hover:border-white/20 transition-all text-[var(--text-primary)]">
            <Icon name="inbox" className="w-6 h-6" />
            <span>IMAP/SMTP</span>
        </button>
    </div>
  );
  
  const renderGenericConnectionForm = () => (
    <div className="mt-4 animate-slow-fade-in">
        <h4 className="font-semibold text-lg mb-4 text-[var(--text-primary)]">Connect {selectedProvider}</h4>
        <p className="text-sm text-[var(--text-tertiary)] mb-4">This is a simulation. No data will be sent.</p>
        <form className="flex flex-col gap-4" onSubmit={handleConnectAccount}>
            <FormInput label="Email Address" type="email" placeholder="Email Address" value={formEmail} onChange={e => setFormEmail(e.target.value)} required/>
            <FormInput label="Password" type="password" placeholder="Password" value={formPassword} onChange={e => setFormPassword(e.target.value)} required/>
            <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={resetFormState} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-[var(--text-primary)]">Back</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors font-semibold text-white">Connect</button>
            </div>
        </form>
    </div>
  );
  
  const renderImapConnectionForm = () => (
     <div className="mt-4 animate-slow-fade-in">
        <h4 className="font-semibold text-lg text-[var(--text-primary)]">Connect IMAP/SMTP Account</h4>
        <p className="text-sm text-[var(--text-tertiary)] mb-4">Enter your account details below. This is a simulation.</p>
        <form className="flex flex-col gap-4" onSubmit={handleConnectAccount}>
            <FormInput label="Email Address" type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} required/>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput label="Username" type="text" value={formUsername} onChange={e => setFormUsername(e.target.value)} required/>
              <FormInput label="Password" type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} required/>
            </div>

            <div className="mt-4">
                <h5 className="font-semibold text-md text-[var(--text-secondary)]">Incoming Mail Server (IMAP)</h5>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-2 items-end">
                    <FormInput label="IMAP Server" type="text" value={imapServer} onChange={e => setImapServer(e.target.value)} required className="md:col-span-3"/>
                    <FormInput label="Port" type="number" value={imapPort} onChange={e => setImapPort(e.target.value)} required className="md:col-span-1"/>
                    <FormSelect label="Security" value={imapSecurity} onChange={e => setImapSecurity(e.target.value as SecurityType)} className="md:col-span-1">
                        <option>SSL/TLS</option>
                        <option>STARTTLS</option>
                        <option>None</option>
                    </FormSelect>
                </div>
            </div>

             <div className="mt-2">
                <h5 className="font-semibold text-md text-[var(--text-secondary)]">Outgoing Mail Server (SMTP)</h5>
                 <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-2 items-end">
                    <FormInput label="SMTP Server" type="text" value={smtpServer} onChange={e => setSmtpServer(e.target.value)} required className="md:col-span-3"/>
                    <FormInput label="Port" type="number" value={smtpPort} onChange={e => setSmtpPort(e.target.value)} required className="md:col-span-1"/>
                    <FormSelect label="Security" value={smtpSecurity} onChange={e => setSmtpSecurity(e.target.value as SecurityType)} className="md:col-span-1">
                        <option>SSL/TLS</option>
                        <option>STARTTLS</option>
                        <option>None</option>
                    </FormSelect>
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={resetFormState} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-[var(--text-primary)]">Back</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors font-semibold text-white">Connect</button>
            </div>
        </form>
    </div>
  );

  const renderSuccessView = () => (
    <div className="mt-4 text-center animate-slow-fade-in flex flex-col items-center justify-center h-48">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h4 className="font-semibold text-lg text-[var(--text-primary)]">Account connected!</h4>
        <p className="text-sm text-[var(--text-tertiary)]">Redirecting...</p>
    </div>
  );

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
      
      { addAccountStep === 'selection' && renderAccountSelection() }
      { addAccountStep === 'form' && selectedProvider === 'IMAP/SMTP' && renderImapConnectionForm() }
      { addAccountStep === 'form' && selectedProvider !== 'IMAP/SMTP' && renderGenericConnectionForm() }
      { addAccountStep === 'success' && renderSuccessView() }
    </div>
  );
  
  const renderAppearanceTab = () => (
     <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Appearance</h3>
        <p className="text-sm text-[var(--text-tertiary)] mb-4">Customize the look and feel of your mailbox.</p>
        <div className="space-y-4">
            <div>
                <label className="font-medium text-[var(--text-secondary)]">Theme</label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={() => onSetTheme('dark')} className={`p-3 border-2 rounded-lg text-left transition-colors ${theme === 'dark' ? 'border-[var(--accent-cyan)] bg-white/10' : 'bg-white/5 border-transparent hover:border-white/20'}`}>
                        <p className="font-semibold text-[var(--text-primary)]">Dark Fusion</p>
                        <p className="text-xs text-[var(--text-tertiary)]">The default high-contrast theme.</p>
                    </button>
                     <button onClick={() => onSetTheme('light')} className={`p-3 border-2 rounded-lg text-left transition-colors ${theme === 'light' ? 'border-[var(--accent-primary)] bg-black/5' : 'bg-white/5 border-transparent hover:border-black/20'}`}>
                        <p className="font-semibold text-[var(--text-primary)]">Light Mode</p>
                        <p className="text-xs text-[var(--text-tertiary)]">Classic and clean.</p>
                    </button>
                </div>
            </div>
        </div>
    </div>
  );

  const renderPersonalityTab = () => (
    <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Agent Personality</h3>
        <p className="text-sm text-[var(--text-tertiary)] mb-4">Configure your AI agent's conversational style.</p>
         <div className="space-y-4">
            <div>
                <label htmlFor="agent-personality" className="font-medium text-[var(--text-secondary)]">Agent Personality</label>
                <select 
                    id="agent-personality" 
                    value={agentConfig.personality} 
                    onChange={handlePersonalityChange} 
                    className="mt-2 w-full bg-black/20 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] border border-transparent transition-shadow appearance-none"
                    style={{
                        background: 'var(--bg-panel) url(\'data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a8b2d1%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-13%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2013l128%20128c3.6%203.6%207.8%205.4%2013%205.4s9.4-1.8%2013-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-13%200-4.9-1.8-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E\') no-repeat right 1rem center',
                        backgroundSize: '0.65rem',
                        color: 'var(--text-primary)',
                    }}
                >
                    <option>Professional</option>
                    <option>Casual & Friendly</option>
                    <option>Witty & Sarcastic</option>
                </select>
            </div>
             <div>
                <label className="font-medium text-[var(--text-secondary)]">Proactive Features</label>
                <div className="mt-2 space-y-2 text-[var(--text-primary)]">
                    <label className="flex items-center gap-3 p-2 cursor-pointer">
                        <input type="checkbox" checked={agentConfig.enableQuickReplies} onChange={() => handleFeatureToggle('enableQuickReplies')} className="w-4 h-4 accent-[var(--accent-cyan)] bg-transparent"/>
                        <span>Enable AI Quick Replies</span>
                    </label>
                    <label className="flex items-center gap-3 p-2 cursor-pointer">
                        <input type="checkbox" checked={agentConfig.enableSummarization} onChange={() => handleFeatureToggle('enableSummarization')} className="w-4 h-4 accent-[var(--accent-cyan)] bg-transparent"/>
                        <span>Enable On-Demand Summarization</span>
                    </label>
                </div>
            </div>
        </div>
    </div>
  );
  
  const renderRulesTab = () => (
    <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Automation Rules</h3>
        <p className="text-sm text-[var(--text-tertiary)] mb-4">Manage the rules your AI agent uses to automatically triage emails.</p>
        <div className="space-y-3">
            {activeRules.length > 0 ? (
                activeRules.map(rule => (
                    <div key={rule.id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                        <div>
                            <p className="font-medium text-[var(--text-primary)]">
                                Automatically <span className="font-bold text-[var(--accent-cyan)]">{rule.action.toLowerCase()}</span> emails from <span className="font-bold text-[var(--accent-cyan)]">{rule.sender}</span>
                            </p>
                        </div>
                        <button onClick={() => onDeleteRule(rule.id)} className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors">
                            Delete
                        </button>
                    </div>
                ))
            ) : (
                <div className="text-center p-8 bg-white/5 rounded-lg">
                    <p className="text-[var(--text-secondary)]">You have no active automation rules.</p>
                </div>
            )}
        </div>
    </div>
  );

  const TabButton: React.FC<{label: SettingsTab}> = ({label}) => (
      <button onClick={() => setActiveTab(label)} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors w-full text-left ${activeTab === label ? 'bg-white/10 text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'}`}>
          {label}
      </button>
  );

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col animate-slow-fade-in">
        <div className="flex-shrink-0 pb-4 border-b border-[var(--border-glow)]">
            <h1 className="text-2xl font-bold text-white tracking-wider flex items-center gap-3">
                <Icon name="settings" className="w-6 h-6 text-[var(--accent-cyan)]" />
                <span>Settings</span>
            </h1>
        </div>
        <div className="flex-grow flex min-h-0 mt-4">
            <div className="w-48 p-4 border-r border-[var(--border-glow)] flex-shrink-0">
                <nav className="flex flex-col gap-2">
                    <TabButton label="Accounts" />
                    <TabButton label="Appearance" />
                    <TabButton label="Personality" />
                    <TabButton label="Automation Rules" />
                </nav>
            </div>
            <div className="p-6 flex-grow overflow-y-auto futuristic-scrollbar">
                {activeTab === 'Accounts' && renderAccountsTab()}
                {activeTab === 'Appearance' && renderAppearanceTab()}
                {activeTab === 'Personality' && renderPersonalityTab()}
                {activeTab === 'Automation Rules' && renderRulesTab()}
            </div>
        </div>
    </div>
  );
};

export default SettingsPage;