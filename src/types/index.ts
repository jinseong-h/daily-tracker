export interface Activity {
  id: string;
  category: string;
  tag: string;
  start_time: string; // ISO 8601 string
  end_time: string | null; // ISO 8601 string, null if running
  is_running: boolean;
  color: string; // Tailwind color class or hex, for UI
}

export interface Journal {
  id: string;
  date: string; // YYYY-MM-DD format
  emotion_color: string; // HEX code for heatmap
  short_memo: string;
}

export interface Goal {
  id: string;
  target_tag: string;
  target_value: number; // hours or count
  frequency: 'weekly' | 'monthly'; // '주간' | '월간'
  type: 'hours' | 'count'; // '시간' | '횟수'
}

export interface CategoryConfig {
  name: string;
  color: string;
}

export interface TagConfig {
  name: string;
  category: string;
  daily_target?: number; // 일일 목표 시간 (hours)
}
