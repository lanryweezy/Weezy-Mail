import React, { useState } from 'react';
import { QuickAction, AgenticInsight } from '../types';
import Icon from './Icon';

interface AgenticActionsSidebarProps {
    quickActions: QuickAction[];
    insights: AgenticInsight[];
    onExecuteAction: (actionId: string) => void;
    onDismissInsight: (insightId: string) => void;
}

const AgenticActionsSidebar: React.FC<AgenticActionsSidebarProps> = ({
    quickActions,
    insights,
    onExecuteAction,
    onDismissInsight
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('all');

    const categories = ['all', 'drafting', 'scheduling', 'extraction', 'organization', 'automation'];
    
    const filteredActions = activeCategory === 'all' 
        ? quickActions 
        : quickActions.filter(action => action.category === activeCategory);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'text-red-400 border-red-500';
            case 'medium': return 'text-yellow-400 border-yellow-500';
            case 'low': return 'text-blue-400 border-blue-500';
            default: return 'text-gray-400 border-gray-500';
        }
    };

    const getInsightIcon = (type: string) => {
        switch (type) {
            case 'subscription_cleanup': return 'mail-x';
            case 'reply_suggestion': return 'message-circle';
            case 'file_conversion': return 'file-text';
            case 'schedule_conflict': return 'calendar-x';
            case 'follow_up_needed': return 'clock';
            default: return 'lightbulb';
        }
    };

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 w-full max-w-md">
            <div 
                className="flex items-center justify-between cursor-pointer mb-3"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <Icon name="zap" className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-white font-semibold">Agentic Actions</h3>
                </div>
                <div className="flex items-center gap-2">
                    {insights.length > 0 && (
                        <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full">
                            {insights.length}
                        </span>
                    )}
                    <Icon 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        className="w-4 h-4 text-gray-400" 
                    />
                </div>
            </div>

            {isExpanded && (
                <>
                    {/* AI Insights */}
                    {insights.length > 0 && (
                        <div className="mb-4">
                            <div className="text-sm text-gray-400 mb-2">AI Insights</div>
                            <div className="space-y-2">
                                {insights.slice(0, 3).map((insight) => (
                                    <div 
                                        key={insight.title} 
                                        className={`bg-gray-900 border-l-2 ${getPriorityColor(insight.priority)} p-3 rounded-r-lg`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-2 flex-1">
                                                <Icon 
                                                    name={getInsightIcon(insight.type)} 
                                                    className={`w-4 h-4 mt-0.5 ${getPriorityColor(insight.priority).split(' ')[0]}`} 
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-white">
                                                        {insight.title}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        {insight.description}
                                                    </div>
                                                    {insight.actionable && insight.suggestedAction && (
                                                        <button 
                                                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded mt-2"
                                                            onClick={() => console.log('Execute insight action:', insight.suggestedAction)}
                                                        >
                                                            {insight.suggestedAction}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => onDismissInsight(insight.title)}
                                                className="text-gray-400 hover:text-gray-300 ml-2"
                                            >
                                                <Icon name="x" className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="border-b border-gray-700 pb-3 mb-3">
                        <div className="text-sm text-gray-400 mb-2">Quick Actions</div>
                        
                        {/* Category Filter */}
                        <div className="flex gap-1 mb-3 overflow-x-auto">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setActiveCategory(category)}
                                    className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                                        activeCategory === category
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-1">
                            {filteredActions.map((action) => (
                                <button
                                    key={action.id}
                                    onClick={() => onExecuteAction(action.id)}
                                    className="w-full flex items-center gap-3 text-left p-2 rounded hover:bg-gray-700 transition-colors group"
                                >
                                    <span className="text-lg">{action.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-white group-hover:text-blue-300">
                                            {action.label}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {action.description}
                                        </div>
                                    </div>
                                    <Icon name="chevron-right" className="w-4 h-4 text-gray-400 group-hover:text-blue-400" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* System Status */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-green-400">AI Agent Active</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Icon name="brain" className="w-4 h-4 text-purple-400" />
                            <span className="text-white">Learning from your behavior</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Icon name="shield" className="w-4 h-4 text-blue-400" />
                            <span className="text-white">Privacy-first processing</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AgenticActionsSidebar;