import { useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { Plus, X, Tag as TagIcon, Folder, CheckSquare, Settings, ArrowUp, ArrowDown, Download, Upload, Cloud, LogOut } from 'lucide-react';
import { cn } from '../../utils/cn';
import { loginWithGoogle, logout } from '../../lib/sync';

const COLORS = [
  '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', 
  '#3b82f6', '#8b5cf6', '#d946ef', '#14b8a6', '#64748b', 
  '#819A91', '#A7C1A8', '#D1D8BE'
];

export function SettingsView() {
  const { user, categories, tags, goals, targetPeriodSetting, addCategory, removeCategory, moveCategory, updateCategoryColor, updateCategoryName, addTag, removeTag, updateTag, addGoal, removeGoal, setTargetPeriodSetting, resetAllData } = useStore();
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(COLORS[0]);
  
  const [newTagName, setNewTagName] = useState('');
  const [selectedTagCategory, setSelectedTagCategory] = useState(categories[0]?.name || '');

  const [newGoalTag, setNewGoalTag] = useState('');
  const [newGoalValue, setNewGoalValue] = useState('');
  const [goalFreq, setGoalFreq] = useState<'weekly' | 'monthly'>('weekly');
  const [goalType, setGoalType] = useState<'hours' | 'count'>('hours');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    if (categories.find(c => c.name === newCategoryName.trim())) return;
    
    addCategory({ name: newCategoryName.trim(), color: newCategoryColor });
    setNewCategoryName('');
  };

  const handleAddTag = () => {
    if (!newTagName.trim() || !selectedTagCategory) return;
    if (tags.find(t => t.name === newTagName.trim() && t.category === selectedTagCategory)) return;
    
    addTag({ name: newTagName.trim(), category: selectedTagCategory });
    setNewTagName('');
  };

  const handleAddGoal = () => {
    if (!newGoalTag || !newGoalValue) return;
    const val = parseFloat(newGoalValue);
    if (isNaN(val) || val <= 0) return;

    if (goals.find(g => g.target_tag === newGoalTag && g.frequency === goalFreq)) return;

    addGoal({
      id: crypto.randomUUID(),
      target_tag: newGoalTag,
      target_value: val,
      frequency: goalFreq,
      type: goalType
    });
    setNewGoalValue('');
  };

  const handleExport = () => {
    const state = useStore.getState();
    const dataToExport = {
      activities: state.activities,
      journals: state.journals,
      goals: state.goals,
      categories: state.categories,
      tags: state.tags,
      targetPeriodSetting: state.targetPeriodSetting
    };
    const jsonStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const payload = JSON.parse(evt.target?.result as string);
        if (payload && payload.categories && Array.isArray(payload.categories)) {
           useStore.setState({
             activities: payload.activities || [],
             journals: payload.journals || [],
             goals: payload.goals || [],
             categories: payload.categories,
             tags: payload.tags || [],
             targetPeriodSetting: payload.targetPeriodSetting || 7
           });
           alert('데이터 복원이 완료되었습니다!');
        } else {
           alert('올바르지 않은 백업 파일입니다.');
        }
      } catch(err) {
        alert('백업 파일 파싱에 실패했습니다.');
      }
    };
    reader.readAsText(file);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetData = () => {
    const isConfirmed = window.confirm("경고: 모든 작업 기록, 통계, 목표, 카테고리가 완전히 삭제됩니다.\n초기화하시겠습니까?");
    if (isConfirmed) {
      resetAllData();
      alert("모든 데이터가 성공적으로 초기화되었습니다.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 py-2 pb-10 animate-in fade-in">
      
      {/* Account & Sync */}
      <section className="flat-card p-5 bg-gradient-to-br from-indigo-50/50 to-white border-indigo-100">
        <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2 mb-4">
          <Cloud size={18} className="text-indigo-500" /> 데이터 동기화 및 계정
        </h2>
        {user ? (
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white border border-indigo-100 p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt="profile" className="w-10 h-10 rounded-full shadow-sm" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold">
                  {user.displayName?.[0] || 'U'}
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-bold text-darkText">{user.displayName || '사용자'}</span>
                <span className="text-xs text-neutral-500">{user.email}</span>
              </div>
            </div>
            <div className="flex flex-col sm:items-end">
              <span className="text-[10px] text-indigo-500 font-bold mb-1 px-2 py-0.5 bg-indigo-50 rounded bg-opacity-50">클라우드 동기화 켜짐</span>
              <button 
                onClick={logout}
                className="text-xs text-neutral-400 hover:text-red-500 font-semibold px-2 py-1 transition-colors flex items-center gap-1"
              >
                <LogOut size={12} /> 로그아웃
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-neutral-600 leading-relaxed">
              Google 계정으로 로그인하시면 기기를 변경해도 데이터가 자동으로 복원되며 언제나 안전하게 백업됩니다.
            </p>
            <button 
              onClick={loginWithGoogle}
              className="bg-white border border-neutral-200 hover:border-indigo-300 hover:bg-indigo-50 text-darkText font-bold py-3 rounded-xl flex items-center justify-center gap-3 transition-all shadow-sm group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google 계정으로 동기화 켜기
            </button>
          </div>
        )}
      </section>

      {/* Global Settings */}
      <section className="flat-card p-5">
        <h2 className="text-lg font-bold text-darkText flex items-center gap-2 mb-4">
          <Settings size={18} className="text-primary" /> 기본 설정
        </h2>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-neutral-50 p-4 rounded-xl">
          <span className="text-sm font-semibold text-darkText">일 평균 목표 미달 판단 기준</span>
          <select 
            value={targetPeriodSetting || 7}
            onChange={(e) => setTargetPeriodSetting(Number(e.target.value) as 7 | 30)}
            className="bg-white border border-neutral-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-secondary transition-colors"
          >
            <option value={7}>최근 7일 평균</option>
            <option value={30}>최근 30일 평균</option>
          </select>
        </div>
      </section>

      {/* Category Settings */}
      <section className="flat-card p-5">
        <h2 className="text-lg font-bold text-darkText flex items-center gap-2 mb-4">
          <Folder size={18} className="text-primary" /> 카테고리 관리
        </h2>
        
        <div className="flex flex-col gap-3 mb-6">
          {categories.map((cat, idx) => (
            <div key={`cat-${cat.name}`} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-neutral-50 px-3 py-2 rounded-xl gap-3">
              <div className="flex items-center gap-3">
                <label 
                  className="relative w-6 h-6 rounded-full shadow-sm border-2 border-white cursor-pointer ring-1 ring-neutral-200 transition-transform hover:scale-110 overflow-hidden shrink-0" 
                  style={{ backgroundColor: cat.color }}
                  title={`${cat.name} 색상 변경`}
                >
                  <input 
                    type="color" 
                    value={cat.color} 
                    onChange={(e) => updateCategoryColor(cat.name, e.target.value)} 
                    className="opacity-0 absolute inset-0 w-10 h-10 -translate-x-2 -translate-y-2 cursor-pointer" 
                  />
                </label>
                <input 
                  type="text"
                  defaultValue={cat.name}
                  onBlur={(e) => {
                    const newName = e.target.value.trim();
                    if (newName && newName !== cat.name) {
                      updateCategoryName(cat.name, newName);
                    } else {
                      e.target.value = cat.name;
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                  }}
                  className="font-semibold text-darkText text-sm bg-transparent border-b border-transparent hover:border-neutral-200 focus:border-primary outline-none px-1 w-24"
                />
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => moveCategory(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1 text-neutral-400 hover:text-darkText disabled:opacity-30 transition-colors"
                ><ArrowUp size={16} /></button>
                <button 
                  onClick={() => moveCategory(idx, 'down')}
                  disabled={idx === categories.length - 1}
                  className="p-1 text-neutral-400 hover:text-darkText disabled:opacity-30 transition-colors"
                ><ArrowDown size={16} /></button>
                <div className="w-px h-4 bg-neutral-200 mx-1" />
                <button 
                  onClick={() => removeCategory(cat.name)}
                  className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                  aria-label="삭제"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-neutral-50 p-4 rounded-xl flex flex-col gap-3">
          <p className="text-xs font-semibold text-neutral-500">새 카테고리 추가</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input 
              type="text" 
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              placeholder="예: 운동, 독서..."
              className="flex-1 bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-darkText min-w-0"
            />
            <button 
              onClick={handleAddCategory}
              className="bg-primary text-white p-2 rounded-lg hover:bg-opacity-90 active:scale-95 transition-all shrink-0"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            {COLORS.map(color => (
              <button
                key={`col-${color}`}
                onClick={() => setNewCategoryColor(color)}
                className={cn("w-6 h-6 rounded-full border-2 transition-all shrink-0 shadow-sm", newCategoryColor === color ? "border-darkText scale-110" : "border-transparent")}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Tag Settings */}
      <section className="flat-card p-5">
        <h2 className="text-lg font-bold text-darkText flex items-center gap-2 mb-4">
          <TagIcon size={18} className="text-secondary" /> 작업(태그) 관리
        </h2>
        
        <div className="flex flex-col gap-3 mb-6">
          {tags.map(tag => (
            <div key={`tag-${tag.category}-${tag.name}`} className="flex flex-col bg-neutral-50 px-3 py-2.5 rounded-xl gap-2 transition-all hover:bg-neutral-100/50">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold text-neutral-400 bg-white px-2 py-0.5 rounded-md border border-neutral-200 shrink-0 shadow-sm">
                    {tag.category}
                  </span>
                  <span className="font-semibold text-darkText text-sm truncate">{tag.name}</span>
                </div>
                <button 
                  onClick={() => removeTag(tag.name, tag.category)}
                  className="text-neutral-400 hover:text-red-500 transition-colors p-1 shrink-0"
                  aria-label="삭제"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="flex items-center justify-between text-xs mt-1 border-t border-neutral-200/50 pt-2">
                <span className="text-neutral-500 font-medium">일 평균 목표 (그래프 기준선)</span>
                <div className="flex items-center gap-1">
                  <input 
                    type="number"
                    defaultValue={tag.daily_target || ''}
                    onBlur={(e) => {
                       const val = parseFloat(e.target.value);
                       updateTag(tag.name, tag.category, { daily_target: isNaN(val) ? undefined : val });
                    }}
                    placeholder="없음"
                    className="w-16 bg-white border border-neutral-200 px-2 py-1 rounded text-right focus:outline-none focus:border-secondary shadow-sm"
                  />
                  <span className="text-neutral-400 font-mono">h</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-neutral-50 p-4 rounded-xl flex flex-col gap-3">
          <p className="text-xs font-semibold text-neutral-500">새 작업 추가</p>
          <div className="flex flex-col gap-2">
            <select 
              value={selectedTagCategory}
              onChange={e => setSelectedTagCategory(e.target.value)}
              className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-darkText shadow-sm"
            >
              <option value="" disabled>카테고리 선택</option>
              {categories.map(c => (
                <option key={`opt-${c.name}`} value={c.name}>{c.name}</option>
              ))}
            </select>
            <div className="flex flex-col sm:flex-row gap-2">
              <input 
                type="text" 
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                placeholder="예: 스쿼트, 파이썬..."
                className="flex-1 bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-darkText min-w-0 shadow-sm"
              />
              <button 
                onClick={handleAddTag}
                className="bg-secondary text-white p-2 rounded-lg hover:bg-opacity-90 active:scale-95 transition-all shrink-0 shadow-sm"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Goal Settings */}
      <section className="flat-card p-5">
        <h2 className="text-lg font-bold text-darkText flex items-center gap-2 mb-4">
          <CheckSquare size={18} className="text-primary" /> 목표 관리
        </h2>
        
        <div className="flex flex-col gap-3 mb-6">
          {goals.map(goal => (
            <div key={goal.id} className="flex flex-col gap-1 bg-neutral-50 px-3 py-2.5 rounded-xl transition-all hover:bg-neutral-100/50">
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-darkText text-sm flex items-center gap-2">
                  <span className="text-[10px] bg-white border border-neutral-200 px-1.5 py-0.5 rounded text-neutral-500 shadow-sm">
                    {goal.frequency === 'weekly' ? '주간' : '월간'}
                  </span>
                  {goal.target_tag}
                </span>
                <button 
                  onClick={() => removeGoal(goal.id)}
                  className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                >
                  <X size={16} />
                </button>
              </div>
              <span className="text-xs text-neutral-500 font-mono ml-[44px]">
                목표: {goal.target_value}{goal.type === 'hours' ? '시간' : '회'}
              </span>
            </div>
          ))}
          {goals.length === 0 && <p className="text-xs text-neutral-400">등록된 목표가 없습니다.</p>}
        </div>

        <div className="bg-neutral-50 p-4 rounded-xl flex flex-col gap-3">
          <p className="text-xs font-semibold text-neutral-500">새 세부 목표 추가</p>
          <div className="flex flex-col gap-2">
            <select 
              value={newGoalTag}
              onChange={e => setNewGoalTag(e.target.value)}
              className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-darkText shadow-sm"
            >
              <option value="" disabled>어떤 작업을 목표로 할까요?</option>
              {tags.map(t => (
                <option key={`goal-tag-${t.name}`} value={t.name}>{t.name}</option>
              ))}
            </select>
            
            <div className="flex gap-2">
              <select 
                value={goalFreq}
                onChange={e => setGoalFreq(e.target.value as any)}
                className="w-1/2 bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-darkText shadow-sm"
              >
                <option value="weekly">이번 주</option>
                <option value="monthly">이번 달</option>
              </select>
              <select 
                value={goalType}
                onChange={e => setGoalType(e.target.value as any)}
                className="w-1/2 bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-darkText shadow-sm"
              >
                <option value="hours">시간(Hours)</option>
                <option value="count">횟수(Count)</option>
              </select>
            </div>

            <div className="flex gap-2 mt-1">
              <input 
                type="number" 
                value={newGoalValue}
                onChange={e => setNewGoalValue(e.target.value)}
                placeholder={`목표 ${goalType === 'hours' ? '시간' : '횟수'} (예: 10)`}
                className="flex-1 bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-darkText min-w-0 shadow-sm"
                min="1"
              />
              <button 
                onClick={handleAddGoal}
                className="bg-primary text-white p-2 rounded-lg hover:bg-opacity-90 active:scale-95 transition-all shrink-0 shadow-sm"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Backup Settings */}
      <section className="flat-card p-5">
        <h2 className="text-lg font-bold text-darkText flex items-center gap-2 mb-4">
          <Download size={18} className="text-primary" /> 데이터 백업 및 복원
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={handleExport} className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-darkText font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
            <Download size={18} /> 데이터 내보내기 (.json)
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-darkText font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
            <Upload size={18} /> 데이터 불러오기
            <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImport} />
          </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-red-100">
          <h3 className="text-sm font-bold text-red-500 mb-2">위험 구역</h3>
          <p className="text-xs text-neutral-500 mb-4">현재 기기에 저장된 모든 라이프 트래커 데이터를 삭제하며 텅 빈 상태로 되돌립니다. 복구할 수 없습니다.</p>
          <button 
            onClick={handleResetData}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl transition-colors border border-red-200"
          >
            모든 데이터 초기화
          </button>
        </div>
      </section>
      
    </div>
  );
}
