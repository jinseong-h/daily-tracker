import { startOfDay, endOfDay, isSameDay } from 'date-fns';
import type { Activity } from '../types';

export interface TimelineBlock {
  id: string;
  start: Date;
  end: Date;
  durationMs: number;
  type: 'activity' | 'grey-zone';
  activity?: Activity;
}

export function generateTimelineBlocks(activities: Activity[], targetDate: Date = new Date()): TimelineBlock[] {
  const dayStart = startOfDay(targetDate);
  const dayEnd = endOfDay(targetDate);
  const isToday = isSameDay(targetDate, new Date());
  const limitDate = isToday ? new Date() : dayEnd;
  
  const todaysActivities = activities.filter(a => {
    const aStart = new Date(a.start_time);
    const aEnd = a.end_time ? new Date(a.end_time) : limitDate;
    return aStart < dayEnd && aEnd > dayStart;
  });

  todaysActivities.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const blocks: TimelineBlock[] = [];
  let currentCursor = dayStart;

  todaysActivities.forEach(a => {
    const aStart = new Date(a.start_time);
    const actStart = aStart < dayStart ? dayStart : aStart;
    
    if (currentCursor < actStart) {
      blocks.push({
        id: `grey-${currentCursor.getTime()}`,
        start: currentCursor,
        end: actStart,
        durationMs: actStart.getTime() - currentCursor.getTime(),
        type: 'grey-zone'
      });
    }

    const aEnd = a.end_time ? new Date(a.end_time) : limitDate;
    const actEnd = aEnd > dayEnd ? dayEnd : aEnd;

    if (actEnd > actStart) {
      blocks.push({
        id: a.id,
        start: actStart,
        end: actEnd,
        durationMs: actEnd.getTime() - actStart.getTime(),
        type: 'activity',
        activity: a
      });
      currentCursor = actEnd;
    }
  });

  if (limitDate.getTime() - currentCursor.getTime() > 60000) {
    blocks.push({
      id: `grey-${currentCursor.getTime()}`,
      start: currentCursor,
      end: limitDate,
      durationMs: limitDate.getTime() - currentCursor.getTime(),
      type: 'grey-zone'
    });
  }

  return blocks;
}
