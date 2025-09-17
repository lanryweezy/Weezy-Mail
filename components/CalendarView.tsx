import React from 'react';
import { CalendarEvent } from '../types';
import Icon from './Icon';

interface CalendarViewProps {
  events: CalendarEvent[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ events }) => {
  const groupEventsByDay = (events: CalendarEvent[]) => {
    const grouped = new Map<string, CalendarEvent[]>();

    // Sort events by start time first
    const sortedEvents = [...events].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    sortedEvents.forEach(event => {
      const day = new Date(event.startTime).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!grouped.has(day)) {
        grouped.set(day, []);
      }
      grouped.get(day)!.push(event);
    });
    return grouped;
  };

  const groupedEvents = groupEventsByDay(events);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col futuristic-scrollbar overflow-y-auto animate-slow-fade-in">
        <div className="flex-shrink-0 pb-4 border-b border-[var(--border-glow)]">
            <h1 className="text-2xl font-bold text-white tracking-wider flex items-center gap-3">
                <Icon name="calendar" className="w-6 h-6 text-[var(--accent-cyan)]" />
                <span>Calendar</span>
            </h1>
        </div>

        <div className="flex-grow pt-4">
            {Array.from(groupedEvents.keys()).map(day => (
                <div key={day} className="mb-8">
                    <h2 className="text-lg font-bold text-[var(--accent-cyan)] mb-4 pb-2 border-b-2 border-[var(--border-glow)]">
                        {day}
                    </h2>
                    <div className="space-y-4">
                        {groupedEvents.get(day)!.map(event => (
                            <div key={event.id} className="flex items-center gap-4 bg-white/5 p-4 rounded-lg border-l-4 border-[var(--accent-cyan)]">
                                <div className="flex flex-col items-center justify-center w-20 text-center">
                                    <p className="text-sm font-bold text-white">{formatTime(event.startTime)}</p>
                                    <p className="text-xs text-[var(--text-tertiary)]">to</p>
                                    <p className="text-xs text-[var(--text-tertiary)]">{formatTime(event.endTime)}</p>
                                </div>
                                <div className="w-px bg-[var(--border-glow)] self-stretch"></div>
                                <div>
                                    <h3 className="font-semibold text-white">{event.title}</h3>
                                    {event.description && <p className="text-sm text-[var(--text-secondary)] mt-1">{event.description}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            {events.length === 0 && (
                 <div className="flex flex-col items-center justify-center h-full text-[var(--text-tertiary)] p-4">
                    <Icon name="calendar" className="w-24 h-24 mx-auto opacity-30" />
                    <h2 className="mt-4 text-xl font-semibold text-[var(--text-secondary)]">No events scheduled</h2>
                    <p className="mt-1 text-sm">Events detected by the AI will appear here.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default CalendarView;
