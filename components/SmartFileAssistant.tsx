import React, { useState } from 'react';
import { SmartAttachment, AttachmentAction } from '../types';
import Icon from './Icon';

interface SmartFileAssistantProps {
    attachments: SmartAttachment[];
    onConvertFile: (attachmentId: string, format: string) => void;
    onExtractText: (attachmentId: string) => void;
    onSummarizeAndSend: (attachmentId: string, recipient: string) => void;
    onCreateTask: (attachmentId: string) => void;
}

const SmartFileAssistant: React.FC<SmartFileAssistantProps> = ({
    attachments,
    onConvertFile,
    onExtractText,
    onSummarizeAndSend,
    onCreateTask
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'PDF': return '📄';
            case 'DOCX': return '📝';
            case 'XLSX': return '📊';
            case 'IMG': return '🖼️';
            default: return '📎';
        }
    };

    const getActionIcon = (action: AttachmentAction) => {
        switch (action) {
            case 'convert_to_excel': return 'table';
            case 'summarize_and_send': return 'send';
            case 'extract_text': return 'type';
            case 'categorize': return 'tag';
            case 'create_task': return 'check-square';
            case 'schedule_followup': return 'calendar';
            default: return 'more-horizontal';
        }
    };

    const getActionLabel = (action: AttachmentAction) => {
        switch (action) {
            case 'convert_to_excel': return 'Convert to Excel';
            case 'summarize_and_send': return 'Summarize & Send';
            case 'extract_text': return 'Extract Text';
            case 'categorize': return 'Categorize';
            case 'create_task': return 'Create Task';
            case 'schedule_followup': return 'Schedule Follow-up';
            default: return 'Action';
        }
    };

    const executeAction = (attachment: SmartAttachment, action: AttachmentAction) => {
        switch (action) {
            case 'convert_to_excel':
                onConvertFile(attachment.id, 'xlsx');
                break;
            case 'extract_text':
                onExtractText(attachment.id);
                break;
            case 'summarize_and_send':
                // For demo, using a placeholder recipient
                onSummarizeAndSend(attachment.id, 'recipient@example.com');
                break;
            case 'create_task':
                onCreateTask(attachment.id);
                break;
            default:
                console.log(`Executing ${action} for ${attachment.name}`);
        }
    };

    const smartAttachments = attachments.filter(att => att.suggestedActions.length > 0);

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 w-full max-w-md">
            <div 
                className="flex items-center justify-between cursor-pointer mb-3"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <Icon name="paperclip" className="w-5 h-5 text-green-400" />
                    <h3 className="text-white font-semibold">Smart File Assistant</h3>
                </div>
                <div className="flex items-center gap-2">
                    {smartAttachments.length > 0 && (
                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                            {smartAttachments.length}
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
                    <div className="border-b border-gray-700 pb-3 mb-3">
                        <div className="text-sm text-gray-400 mb-3">Attachment Intelligence</div>
                        
                        {smartAttachments.length === 0 ? (
                            <div className="text-gray-500 text-sm text-center py-4">
                                No smart actions available
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {smartAttachments.map((attachment) => (
                                    <div key={attachment.id} className="bg-gray-900 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-lg">{getFileIcon(attachment.type)}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm text-white truncate">
                                                    {attachment.name}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {attachment.type} • {(attachment.size / 1024).toFixed(1)}KB
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            {attachment.suggestedActions.map((action, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => executeAction(attachment, action)}
                                                    className="w-full flex items-center gap-2 text-left text-sm p-2 rounded hover:bg-gray-700 transition-colors"
                                                >
                                                    <Icon 
                                                        name={getActionIcon(action)} 
                                                        className="w-4 h-4 text-blue-400" 
                                                    />
                                                    <span className="text-gray-300">
                                                        {getActionLabel(action)}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>

                                        {attachment.conversionOptions.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-gray-700">
                                                <div className="text-xs text-gray-400 mb-1">
                                                    Quick Convert:
                                                </div>
                                                <div className="flex gap-1 flex-wrap">
                                                    {attachment.conversionOptions.map((format) => (
                                                        <button
                                                            key={format}
                                                            onClick={() => onConvertFile(attachment.id, format)}
                                                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                                                        >
                                                            .{format}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <Icon name="refresh-cw" className="w-4 h-4 text-blue-400" />
                            <span className="text-white">Auto-convert based on recipient prefs</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Icon name="eye" className="w-4 h-4 text-green-400" />
                            <span className="text-white">Preview before sending</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default SmartFileAssistant;