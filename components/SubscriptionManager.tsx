import React, { useState } from 'react';
import { Subscription } from '../types';
import Icon from './Icon';

interface SubscriptionManagerProps {
    subscriptions: Subscription[];
    onUnsubscribe: (subscriptionIds: string[]) => void;
    onToggleDigestMode: (subscriptionId: string) => void;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
    subscriptions,
    onUnsubscribe,
    onToggleDigestMode
}) => {
    const [selectedSubscriptions, setSelectedSubscriptions] = useState<Set<string>>(new Set());
    const [isExpanded, setIsExpanded] = useState(false);

    const handleSubscriptionToggle = (subscriptionId: string) => {
        const newSelected = new Set(selectedSubscriptions);
        if (newSelected.has(subscriptionId)) {
            newSelected.delete(subscriptionId);
        } else {
            newSelected.add(subscriptionId);
        }
        setSelectedSubscriptions(newSelected);
    };

    const handleBulkUnsubscribe = () => {
        if (selectedSubscriptions.size > 0) {
            onUnsubscribe(Array.from(selectedSubscriptions));
            setSelectedSubscriptions(new Set());
        }
    };

    const getEngagementColor = (readCount: number, totalCount: number) => {
        const engagement = totalCount > 0 ? readCount / totalCount : 0;
        if (engagement > 0.7) return 'text-green-400';
        if (engagement > 0.3) return 'text-yellow-400';
        return 'text-red-400';
    };

    const lowEngagementSubs = subscriptions.filter(sub => 
        sub.totalCount > 10 && (sub.readCount / sub.totalCount) < 0.1
    );

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 w-full max-w-md">
            <div 
                className="flex items-center justify-between cursor-pointer mb-3"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <Icon name="mail" className="w-5 h-5 text-blue-400" />
                    <h3 className="text-white font-semibold">Subscription Manager</h3>
                </div>
                <Icon 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    className="w-4 h-4 text-gray-400" 
                />
            </div>

            {isExpanded && (
                <>
                    <div className="border-b border-gray-700 pb-3 mb-3">
                        <div className="text-sm text-gray-400 mb-2">Newsletter Control Center</div>
                        
                        {/* Auto-cleanup suggestion */}
                        {lowEngagementSubs.length > 0 && (
                            <div className="bg-orange-900/20 border border-orange-700 rounded p-2 mb-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Icon name="alert-triangle" className="w-4 h-4 text-orange-400" />
                                    <span className="text-orange-400 text-sm font-medium">
                                        AI Cleanup Suggestion
                                    </span>
                                </div>
                                <p className="text-xs text-gray-300 mb-2">
                                    {lowEngagementSubs.length} subscriptions with &lt;10% engagement detected
                                </p>
                                <button 
                                    onClick={() => onUnsubscribe(lowEngagementSubs.map(s => s.id))}
                                    className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded"
                                >
                                    Auto-unsubscribe {lowEngagementSubs.length} newsletters
                                </button>
                            </div>
                        )}

                        <div className="space-y-2">
                            {subscriptions.slice(0, 5).map((subscription) => (
                                <div key={subscription.id} className="flex items-center justify-between py-1">
                                    <div className="flex items-center gap-2 flex-1">
                                        <input
                                            type="checkbox"
                                            checked={selectedSubscriptions.has(subscription.id)}
                                            onChange={() => handleSubscriptionToggle(subscription.id)}
                                            className="w-3 h-3 text-blue-600 rounded"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-white truncate">
                                                {subscription.source}
                                            </div>
                                            <div className={`text-xs ${getEngagementColor(subscription.readCount, subscription.totalCount)}`}>
                                                Read {subscription.readCount} of last {subscription.totalCount}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={() => onUnsubscribe([subscription.id])}
                                        className="text-xs text-red-400 hover:text-red-300 ml-2"
                                        title="Unsubscribe"
                                    >
                                        Unsubscribe
                                    </button>
                                </div>
                            ))}
                        </div>

                        {selectedSubscriptions.size > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-700">
                                <button 
                                    onClick={handleBulkUnsubscribe}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded"
                                >
                                    Unsubscribe {selectedSubscriptions.size} selected
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <Icon name="refresh-cw" className="w-4 h-4 text-blue-400" />
                            <span className="text-white">Weekly Digest Mode</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Icon name="brain" className="w-4 h-4 text-purple-400" />
                            <span className="text-white">AI Summary of Subscribed Content</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default SubscriptionManager;