import React, { useState } from 'react';
import { InboxSummary, ChatMessage, MessageAuthor } from '../types';
import Icon from './Icon';

interface InboxSummaryDashboardProps {
    summary: InboxSummary;
    userName: string;
    recentMessages: ChatMessage[];
    onSendMessage: (message: string) => void;
}

const InboxSummaryDashboard: React.FC<InboxSummaryDashboardProps> = ({
    summary,
    userName,
    recentMessages,
    onSendMessage
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [inputMessage, setInputMessage] = useState('');

    const getTimeOfDay = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const handleSendMessage = () => {
        if (inputMessage.trim()) {
            onSendMessage(inputMessage);
            setInputMessage('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const summaryItems = [
        {
            icon: '🔴',
            label: `${summary.urgentCount} Urgent emails`,
            sublabel: '(AI-prioritized)',
            color: 'text-red-400',
            value: summary.urgentCount
        },
        {
            icon: '🟡',
            label: `${summary.actionItemsCount} Action items detected`,
            sublabel: '',
            color: 'text-yellow-400',
            value: summary.actionItemsCount
        },
        {
            icon: '🟢',
            label: `${summary.unreadNewsletters} newsletters unread for 90+ days`,
            sublabel: '',
            color: 'text-green-400',
            value: summary.unreadNewsletters
        },
        {
            icon: '📁',
            label: `${summary.filesForConversion} files flagged for format conversion`,
            sublabel: '',
            color: 'text-blue-400',
            value: summary.filesForConversion
        }
    ];

    return (
        <div className="bg-gray-900 p-6 rounded-lg space-y-6">
            {/* Greeting */}
            <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-2">
                    👋 {getTimeOfDay()}, {userName}
                </h1>
                
                {/* Global Search */}
                <div className="relative max-w-md mx-auto">
                    <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="🔍 Search anything..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Inbox Summary */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Icon name="inbox" className="w-5 h-5 text-blue-400" />
                    <h2 className="text-lg font-semibold text-white">Inbox Summary</h2>
                </div>
                
                <div className="border-b border-gray-700 mb-4"></div>
                
                <div className="space-y-3">
                    {summaryItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-lg">{item.icon}</span>
                                <div>
                                    <span className={`${item.color} font-medium`}>
                                        {item.label}
                                    </span>
                                    {item.sublabel && (
                                        <span className="text-gray-400 text-sm ml-1">
                                            {item.sublabel}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {item.value > 0 && (
                                <button className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded">
                                    View
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat with Your Mailbox */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Icon name="message-circle" className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-semibold text-white">Chat with Your Mailbox</h2>
                </div>
                
                <div className="border-b border-gray-700 mb-4"></div>
                
                {/* Recent Messages */}
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                    {recentMessages.slice(-3).map((message, index) => (
                        <div key={index} className="flex gap-3">
                            <div className="flex-shrink-0">
                                {message.author === MessageAuthor.USER ? (
                                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white font-medium">
                                        {userName.charAt(0).toUpperCase()}
                                    </div>
                                ) : (
                                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                                        <Icon name="bot" className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-gray-300 mb-1">
                                    {message.author === MessageAuthor.USER ? userName : 'Mailbox'}:
                                </div>
                                <div className="text-sm text-gray-100 bg-gray-700 rounded-lg p-2">
                                    "{message.text}"
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Ask your mailbox anything..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                        <Icon name="send" className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InboxSummaryDashboard;