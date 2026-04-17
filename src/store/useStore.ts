import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Activity, Journal, Goal, CategoryConfig, TagConfig } from '../types';

import type { User } from 'firebase/auth';

interface AppState {
  user: {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  } | null;
  setUser: (user: AppState['user']) => void;
  
  activities: Activity[];
  journals: Journal[];
  goals: Goal[];
  categories: CategoryConfig[];
  tags: TagConfig[];
  
  startActivity: (tag: string, category: string, color: string) => void;
  stopActivity: () => void;
  addJournal: (journal: Omit<Journal, 'id'>) => void;
  addGreyZoneActivity: (start_time: string, end_time: string, is_productive: boolean, replace_id?: string) => void;
  removeActivity: (id: string) => void;

  addCategory: (category: CategoryConfig) => void;
  removeCategory: (name: string) => void;
  moveCategory: (index: number, direction: 'up' | 'down') => void;
  updateCategoryColor: (name: string, color: string) => void;
  updateCategoryName: (oldName: string, newName: string) => void;
  addTag: (tag: TagConfig) => void;
  removeTag: (name: string, category: string) => void;
  updateTag: (name: string, category: string, data: Partial<TagConfig>) => void;
  addGoal: (goal: Goal) => void;
  removeGoal: (id: string) => void;
  updateGoals: () => void;
  resetAllData: () => void;

  targetPeriodSetting: 7 | 30;
  setTargetPeriodSetting: (days: 7 | 30) => void;
  
  statisticsTimeRange: 'week' | 'month';
  setStatisticsTimeRange: (range: 'week' | 'month') => void;
}

const DEFAULT_CATEGORIES: CategoryConfig[] = [
  { name: '업무', color: '#819A91' },
  { name: '학습', color: '#A7C1A8' },
  { name: '여가', color: '#D1D8BE' },
  { name: '기본', color: '#8b5cf6' }
];

const DEFAULT_TAGS: TagConfig[] = [
  { name: '외주 편집', category: '업무', daily_target: 3 },
  { name: '개인 작업', category: '업무' },
  { name: '영어 공부', category: '학습' },
  { name: '수영', category: '여가' },
  { name: '독서', category: '여가' },
  { name: '취침', category: '기본', daily_target: 7 },
];

const DEFAULT_GOALS: Goal[] = [
  { id: '1', target_tag: '영어 공부', target_value: 10, frequency: 'weekly', type: 'hours' },
  { id: '2', target_tag: '수영', target_value: 5, frequency: 'weekly', type: 'count' },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      
      activities: [],
      journals: [],
      goals: DEFAULT_GOALS,
      categories: DEFAULT_CATEGORIES,
      tags: DEFAULT_TAGS,
      targetPeriodSetting: 7,
      statisticsTimeRange: 'week',

      setTargetPeriodSetting: (days) => set({ targetPeriodSetting: days }),
      setStatisticsTimeRange: (range) => set({ statisticsTimeRange: range }),

      startActivity: (tag, category, color) => {
        const { activities, stopActivity } = get();
        const runningActivity = activities.find(a => a.is_running);
        if (runningActivity) {
          stopActivity();
        }

        const newActivity: Activity = {
          id: crypto.randomUUID(),
          category,
          tag,
          start_time: new Date().toISOString(),
          end_time: null,
          is_running: true,
          color,
        };

        set((state) => ({
          activities: [...state.activities, newActivity]
        }));
      },

      stopActivity: () => {
        set((state) => {
          const now = new Date();
          let hoursAdded = 0;
          let stoppedTag = '';

          const updatedActivities = state.activities.map(activity => {
            if (activity.is_running) {
              const start = new Date(activity.start_time);
              const msDiff = now.getTime() - start.getTime();
              hoursAdded = msDiff / (1000 * 60 * 60);
              stoppedTag = activity.tag;

              return {
                ...activity,
                end_time: now.toISOString(),
                is_running: false,
              };
            }
            return activity;
          });

          return {
            activities: updatedActivities
          };
        });
      },

      addJournal: (journalData) => set((state) => {
        const existingIndex = state.journals.findIndex(j => j.date === journalData.date);
        const newJournal: Journal = { id: crypto.randomUUID(), ...journalData };

        if (existingIndex >= 0) {
          const newJournals = [...state.journals];
          newJournals[existingIndex] = newJournal;
          return { journals: newJournals };
        }
        return { journals: [...state.journals, newJournal] };
      }),

      addGreyZoneActivity: (start_time, end_time, is_productive, replace_id) => set((state) => {
        const newActivity: Activity = {
          id: replace_id || crypto.randomUUID(),
          category: is_productive ? '유의미한 휴식' : '단순 낭비 시간',
          tag: is_productive ? '휴식' : '낭비',
          start_time,
          end_time,
          is_running: false,
          color: is_productive ? '#A7C1A8' : '#e5e7eb',
        };
        const nextActivities = replace_id 
          ? state.activities.map(a => a.id === replace_id ? newActivity : a)
          : [...state.activities, newActivity];
        return { activities: nextActivities };
      }),

      removeActivity: (id) => set((state) => ({
        activities: state.activities.filter(a => a.id !== id)
      })),

      addCategory: (category) => set((state) => ({
        categories: [...state.categories, category]
      })),

      removeCategory: (name) => set((state) => ({
        categories: state.categories.filter(c => c.name !== name),
        tags: state.tags.filter(t => t.category !== name)
      })),

      moveCategory: (index, direction) => set((state) => {
        const newCats = [...state.categories];
        if (direction === 'up' && index > 0) {
          [newCats[index - 1], newCats[index]] = [newCats[index], newCats[index - 1]];
        } else if (direction === 'down' && index < newCats.length - 1) {
          [newCats[index + 1], newCats[index]] = [newCats[index], newCats[index + 1]];
        }
        return { categories: newCats };
      }),

      updateCategoryColor: (name, color) => set((state) => ({
        categories: state.categories.map(c => c.name === name ? { ...c, color } : c)
      })),

      updateCategoryName: (oldName, newName) => set((state) => {
        if (!newName || state.categories.some(c => c.name === newName)) return state;
        return {
          categories: state.categories.map(c => c.name === oldName ? { ...c, name: newName } : c),
          tags: state.tags.map(t => t.category === oldName ? { ...t, category: newName } : t),
          activities: state.activities.map(a => a.category === oldName ? { ...a, category: newName } : a)
        };
      }),

      addTag: (tag) => set((state) => ({
        tags: [...state.tags, tag]
      })),

      removeTag: (name, category) => set((state) => ({
        tags: state.tags.filter(t => !(t.name === name && t.category === category))
      })),

      updateTag: (name, category, data) => set((state) => ({
        tags: state.tags.map(t => 
          (t.name === name && t.category === category)
            ? { ...t, ...data }
            : t
        )
      })),

      addGoal: (goal) => set((state) => ({
        goals: [...state.goals, goal]
      })),

      removeGoal: (id) => set((state) => ({
        goals: state.goals.filter(g => g.id !== id)
      })),

      updateGoals: () => {},

      resetAllData: () => set((state) => ({
        activities: [],
        journals: [],
        goals: [],
        tags: [],
        categories: DEFAULT_CATEGORIES
      }))
    }),
    {
      name: 'daily-life-tracker-storage',
    }
  )
);
