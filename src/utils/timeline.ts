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

export function generateTimelineBlocks(activities: Activity[], targetDate: Date = new Date(), dayStartOffset: number = 0): TimelineBlock[] {
  const customStartOfDay = new Date(startOfDay(targetDate).getTime() + dayStartOffset * 3600000);
  const customEndOfDay = new Date(customStartOfDay.getTime() + 86400000);
  const now = new Date();
  
  const isLogicalToday = now >= customStartOfDay && now < customEndOfDay;
  const limitDate = isLogicalToday ? now : customEndOfDay;
  
  const todaysActivities = activities.filter(a => {
    const aStart = new Date(a.start_time);
    const aEnd = a.end_time ? new Date(a.end_time) : limitDate;
    return aStart < customEndOfDay && aEnd > customStartOfDay;
  });

  todaysActivities.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const blocks: TimelineBlock[] = [];
  let currentCursor = customStartOfDay;

  todaysActivities.forEach(a => {
    const aStart = new Date(a.start_time);
    const actStart = aStart < customStartOfDay ? customStartOfDay : aStart;
    
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
    const actEnd = aEnd > customEndOfDay ? customEndOfDay : aEnd;

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
