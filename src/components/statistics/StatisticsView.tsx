import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { format, subDays, startOfMonth, startOfYear, startOfWeek, endOfWeek, endOfMonth, subMonths } from 'date-fns';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceLine } from 'recharts';
import { Trophy, Lock, CheckSquare, Activity, Target, Layers, CalendarDays } from 'lucide-react';
import { cn } from '../../utils/cn';

const PIE_COLORS = ['#819A91', '#A7C1A8', '#D1D8BE', '#EEEFE0', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#10b981'];

export function StatisticsView() {
  const { activities, tags, goals, categories, targetPeriodSetting, statisticsTimeRange } = useStore();
  const [selectedTag, setSelectedTag] = useState<string>(tags[0]?.name || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.name || '');
  
  // 연동 1: 선택된 카테고리가 바뀌면, 해당 카테고리의 첫번째 태그로 selectedTag를 고정합니다.
  useEffect(() => {
    const defaultTag = tags.find(t => t.category === selectedCategory);
    if (defaultTag) {
      setSelectedTag(defaultTag.name);
    }
  }, [selectedCategory, tags]);

  const selectedTagConfig = tags.find(t => t.name === selectedTag);
  const selectedTagColor = categories.find(c => c.name === selectedTagConfig?.category)?.color || '#A7C1A8';

  const chartData = useMemo(() => {
    const ObjectDays = statisticsTimeRange === 'week' ? 7 : 30;
    const today = new Date();
    const data = [];
    
    for (let i = ObjectDays - 1; i >= 0; i--) {
      const d = subDays(today, i);
      const dStr = format(d, 'yyyy-MM-dd');
      const label = format(d, statisticsTimeRange === 'week' ? 'MM/dd' : 'dd일');
      
      const dayActivities = activities.filter(a => a.tag === selectedTag && a.start_time.startsWith(dStr));
      const totalMs = dayActivities.reduce((sum, a) => {
        const start = new Date(a.start_time).getTime();
        const end = a.end_time ? new Date(a.end_time).getTime() : new Date().getTime();
        return sum + (Math.max(0, end - start));
      }, 0);
      
      data.push({
        date: dStr,
        name: label,
        hours: Number((totalMs / 3600000).toFixed(2))
      });
    }
    return data;
  }, [activities, selectedTag, statisticsTimeRange]);

  const rawAverage = useMemo(() => {
    if (chartData.length === 0) return '0.0';
    const sum = chartData.reduce((acc, curr) => acc + curr.hours, 0);
    return (sum / chartData.length).toFixed(1);
  }, [chartData]);
  
  const isUnderperforming = useMemo(() => {
    if (!selectedTagConfig?.daily_target) return false;
    const periodDays = targetPeriodSetting || 7;
    const now = new Date();
    let totalMs = 0;
    
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = subDays(now, i);
      const dStr = format(d, 'yyyy-MM-dd');
      
      const dayActivities = activities.filter(a => a.tag === selectedTag && a.start_time.startsWith(dStr));
      totalMs += dayActivities.reduce((sum, a) => {
        const start = new Date(a.start_time).getTime();
        const end = a.end_time ? new Date(a.end_time).getTime() : now.getTime();
        return sum + (Math.max(0, end - start));
      }, 0);
    }
    const avgHours = (totalMs / 3600000) / periodDays;
    return avgHours < selectedTagConfig.daily_target;
  }, [activities, selectedTagConfig, targetPeriodSetting, selectedTag]);

  const yMaxLineChart = useMemo(() => {
    const hMax = Math.max(0, ...chartData.map(d => d.hours));
    const tMax = selectedTagConfig?.daily_target || 0;
    const mx = Math.max(hMax, tMax);
    return mx === 0 ? (!tMax ? 'dataMax + 1' : 1) : mx * 1.2;
  }, [chartData, selectedTagConfig]);

  const multiLineData = useMemo(() => {
    const ObjectDays = statisticsTimeRange === 'week' ? 7 : 30;
    const today = new Date();
    const data = [];
    
    for (let i = ObjectDays - 1; i >= 0; i--) {
      const d = subDays(today, i);
      const dStr = format(d, 'yyyy-MM-dd');
      const label = format(d, statisticsTimeRange === 'week' ? 'MM/dd' : 'dd일');
      
      const dayData: any = { date: dStr, name: label };
      
      activities
        .filter(a => a.start_time.startsWith(dStr))
        .forEach(a => {
           const ms = (a.end_time ? new Date(a.end_time).getTime() : today.getTime()) - new Date(a.start_time).getTime();
           dayData[a.tag] = (dayData[a.tag] || 0) + Math.max(0, ms);
        });

      tags.forEach(t => {
        if (dayData[t.name]) {
          dayData[t.name] = Number((dayData[t.name] / 3600000).toFixed(2));
        } else {
          dayData[t.name] = 0;
        }
      });
      data.push(dayData);
    }
    return data;
  }, [activities, statisticsTimeRange, tags]);

  const categoryLineData = useMemo(() => {
    const ObjectDays = statisticsTimeRange === 'week' ? 7 : 30;
    const today = new Date();
    const data = [];
    const categoryTags = tags.filter(t => t.category === selectedCategory);
    
    for (let i = ObjectDays - 1; i >= 0; i--) {
      const d = subDays(today, i);
      const dStr = format(d, 'yyyy-MM-dd');
      const label = format(d, statisticsTimeRange === 'week' ? 'MM/dd' : 'dd일');
      
      const dayData: any = { date: dStr, name: label };
      
      activities.filter(a => a.start_time.startsWith(dStr)).forEach(a => {
           const tagData = categoryTags.find(t => t.name === a.tag);
           if (tagData) {
              const ms = (a.end_time ? new Date(a.end_time).getTime() : today.getTime()) - new Date(a.start_time).getTime();
              dayData[a.tag] = (dayData[a.tag] || 0) + Math.max(0, ms);
           }
        });

      categoryTags.forEach(t => {
        if (dayData[t.name]) {
          dayData[t.name] = Number((dayData[t.name] / 3600000).toFixed(2));
        } else {
          dayData[t.name] = 0;
        }
      });
      data.push(dayData);
    }
    return data;
  }, [activities, statisticsTimeRange, tags, selectedCategory]);

  const barcodeDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = subDays(today, i);
      const dStr = format(d, 'yyyy-MM-dd');
      const dayActs = activities.filter(a => a.start_time.startsWith(dStr));
      
      const segments = dayActs.map(a => {
        const tColor = categories.find(c => c.name === tags.find(tag => tag.name === a.tag)?.category)?.color || '#ccc';
        const startD = new Date(a.start_time);
        const startMins = startD.getHours() * 60 + startD.getMinutes();
        const endD = a.end_time ? new Date(a.end_time) : new Date();
        const durationMins = Math.max(1, (endD.getTime() - startD.getTime()) / 60000);
        
        return {
           tag: a.tag,
           color: tColor,
           topPercent: (startMins / 1440) * 100,
           heightPercent: Math.min(100 - (startMins / 1440) * 100, (durationMins / 1440) * 100),
           startStr: format(startD, 'HH:mm'),
           endStr: format(endD, 'HH:mm')
        };
      });
      
      days.push({
         dateLabel: format(d, 'MM/dd'),
         segments
      });
    }
    return days;
  }, [activities, categories, tags]);



  const goalsWithProgress = useMemo(() => {
    const today = new Date();
    const currentGoals = goals.map(goal => {
      const startD = goal.frequency === 'weekly' ? startOfWeek(today) : startOfMonth(today);
      const endD = goal.frequency === 'weekly' ? endOfWeek(today) : endOfMonth(today);
      
      const relatedActivities = activities.filter(a => 
        a.tag === goal.target_tag && 
        new Date(a.start_time) >= startD && 
        new Date(a.start_time) <= endD
      );

      let current_value = 0;
      if (goal.type === 'count') {
        current_value = relatedActivities.length;
      } else {
        current_value = relatedActivities.reduce((sum, a) => {
          const s = new Date(a.start_time).getTime();
          const e = a.end_time ? new Date(a.end_time).getTime() : today.getTime();
          return sum + Math.max(0, e - s) / 3600000;
        }, 0);
      }

      let successCount = 0;
      let totalPeriods = 4;
      
      for (let i = 1; i <= totalPeriods; i++) {
        let pStart, pEnd;
        if (goal.frequency === 'weekly') {
          const refDate = subDays(today, i * 7);
          pStart = startOfWeek(refDate).getTime();
          pEnd = endOfWeek(refDate).getTime();
        } else {
          const refDate = subMonths(today, i);
          pStart = startOfMonth(refDate).getTime();
          pEnd = endOfMonth(refDate).getTime();
        }
        
        const periodActivities = activities.filter(a => {
           const s = new Date(a.start_time).getTime();
           return a.tag === goal.target_tag && s >= pStart && s <= pEnd;
        });
        
        let pValue = 0;
        if (goal.type === 'count') {
          pValue = periodActivities.length;
        } else {
          pValue = periodActivities.reduce((sum, a) => {
             const endT = a.end_time ? new Date(a.end_time).getTime() : new Date().getTime();
             return sum + Math.max(0, endT - new Date(a.start_time).getTime()) / 3600000;
          }, 0);
        }
        
        if (pValue >= goal.target_value) {
          successCount++;
        }
      }

      return {
        ...goal,
        current_value,
        is_completed: current_value >= goal.target_value,
        successRate: (successCount / totalPeriods) * 100
      };
    });
    return currentGoals;
  }, [activities, goals]);

  const renderTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      if (payload.length === 1) {
        return (
          <div className="bg-white px-3 py-2 border border-neutral-200 shadow-xl rounded-lg text-xs font-semibold text-darkText z-50">
            {payload[0].payload.date}: <span className="text-secondary">{payload[0].value}시간</span>
          </div>
        );
      } else {
        return (
          <div className="bg-white p-3 border border-neutral-200 shadow-xl rounded-lg text-xs font-semibold text-darkText flex flex-col gap-1 z-50 max-h-48 overflow-y-auto w-48">
            <div className="mb-1 text-neutral-500 border-b border-neutral-100 pb-1 sticky top-0 bg-white z-10">{payload[0].payload.date}</div>
            {payload.filter((p:any) => p.value > 0).sort((a:any, b:any) => b.value - a.value).map((p: any) => (
              <div key={p.dataKey} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.stroke || p.fill || p.color }} />
                  <span className="truncate">{p.dataKey}</span>
                </div>
                <span className="font-mono text-neutral-500 shrink-0">{p.value}h</span>
              </div>
            ))}
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6 py-2 pb-10 animate-in fade-in h-full">

      {/* Top Full Width: Multi-Line All Tasks and Barcode View */}
      <div className="flex flex-col gap-6 w-full">
         
         {/* Multi-Line All Tasks Chart (Moved to Top) */}
         <div className="flat-card p-5 lg:p-6 w-full">
            <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 mb-6">
              <h2 className="text-base font-bold text-darkText flex items-center gap-2">
                <Activity size={18} className="text-secondary" /> 전체 작업 교차 분석
              </h2>
            </div>
            <div className="h-64 w-full -ml-5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={multiLineData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={10} />
                  <YAxis hide domain={[0, 'dataMax + 1']} />
                  <Tooltip content={renderTooltip} isAnimationActive={false} />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} iconType="circle" />
                  {tags.filter(t => t.name !== '수면').map((t, idx) => {
                    const color = categories.find(c => c.name === t.category)?.color || PIE_COLORS[idx % PIE_COLORS.length];
                    return (
                      <Line 
                        key={`line-${t.name}`} 
                        type="monotone" 
                        dataKey={t.name} 
                        stroke={color} 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    )
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
         </div>

         {/* 30-Day Barcode View */}
         <div className="flat-card p-5 lg:p-6 w-full">
            <h2 className="text-base font-bold text-darkText flex items-center gap-2 mb-2">
              <CalendarDays size={18} className="text-primary" /> 30일 패턴 바코드 뷰
            </h2>
            <p className="text-xs text-neutral-500 mb-6">최근 30일간의 작업 흐름을 가시적으로 확인합니다. 세로선 1개가 하루(24시간)입니다.</p>
            
            <div className="flex w-full h-48 bg-white rounded-xl p-2 gap-[1px] relative border border-neutral-100 shadow-inner">
               {barcodeDays.map((day, idx) => (
                  <div key={idx} className="flex-1 h-full relative group bg-neutral-100/60 rounded-[1px] hover:bg-neutral-200/50 transition-colors">
                     {/* Tooltip for the whole day column */}
                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-primary bg-white px-2 py-1 rounded-md shadow-md whitespace-nowrap z-50 pointer-events-none border border-neutral-100">
                        {day.dateLabel}
                     </div>

                     {day.segments.map((seg, sIdx) => (
                        <div 
                           key={`seg-${idx}-${sIdx}`}
                           className="absolute left-0 right-0 w-full hover:brightness-110 hover:scale-[1.1] transition-all rounded-[1px] shadow-sm z-10 cursor-pointer"
                           style={{
                              top: `${seg.topPercent}%`,
                              height: `${seg.heightPercent}%`,
                              backgroundColor: seg.color,
                              minHeight: '2px'
                           }}
                           title={`${seg.tag} (${seg.startStr} ~ ${seg.endStr})`}
                        />
                     ))}
                  </div>
               ))}
            </div>
         </div>

      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
        
        {/* Left Column */}
        <div className="flex flex-col gap-6 lg:w-[35%] shrink-0">

          {/* Goal & Badges */}
          <div className="flat-card p-5">
            <h2 className="text-base font-bold text-darkText flex items-center gap-2 mb-4">
              <CheckSquare size={18} className="text-primary" /> 진행중인 목표 & 성공률
            </h2>
            <div className="flex flex-col gap-5">
              {goalsWithProgress.map(goal => {
                const percent = Math.min(100, (goal.current_value / goal.target_value) * 100);
                return (
                  <div key={goal.id} className="relative group">
                    <div className="flex justify-between items-end mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded leading-none">
                          {goal.frequency === 'weekly' ? '이번주' : '이번달'}
                        </span>
                        <span className="text-sm font-bold text-darkText">{goal.target_tag}</span>
                      </div>
                      <span className="text-xs font-semibold text-neutral-500">
                        {goal.type === 'hours' ? goal.current_value.toFixed(1) : goal.current_value} / {goal.target_value}{goal.type === 'hours' ? 'h' : '회'}
                      </span>
                    </div>
                    <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full transition-all duration-1000 ease-out", goal.is_completed ? "bg-amber-400" : "bg-primary")}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    {/* Success Rate Info */}
                    <div className="mt-2 flex justify-between items-center text-[10px] text-neutral-400 font-medium px-1">
                      <span>최근 4주기 성공률:</span>
                      <span className={cn("font-bold", goal.successRate >= 75 ? "text-green-500" : goal.successRate >= 50 ? "text-amber-500" : "text-red-400")}>
                        {goal.successRate}%
                      </span>
                    </div>
                  </div>
                );
              })}
              {goalsWithProgress.length === 0 && (
                <p className="text-xs text-neutral-400 text-center py-4 bg-neutral-50 rounded-xl">등록된 목표가 없습니다. 설정에서 추가해보세요.</p>
              )}
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-bold text-darkText mb-3 border-t border-neutral-100 pt-5">이번 텀 업적 뱃지</h3>
              <div className="grid grid-cols-4 gap-3">
                {goalsWithProgress.map(goal => {
                  const isDone = goal.is_completed;
                  return (
                    <div 
                      key={`badge-${goal.id}`} 
                      className={cn(
                        "aspect-square rounded-xl flex flex-col items-center justify-center gap-1.5 p-2 text-center transition-all",
                        isDone ? "bg-amber-50 border border-amber-200/50 shadow-sm" : "bg-neutral-50 opacity-60 grayscale"
                      )}
                    >
                      <div className={cn("p-2 rounded-full", isDone ? "bg-amber-100 text-amber-500" : "bg-neutral-200 text-neutral-400")}>
                        {isDone ? <Trophy size={18} /> : <Lock size={18} />}
                      </div>
                      {isDone && (
                        <span className="text-[8px] font-bold text-amber-600 truncate w-full">
                          {goal.target_tag} 달성
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6 lg:flex-1 w-full min-w-0">
          
          {/* Category Chart */}
          <div className="flat-card p-5 lg:p-6 w-full">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-3 mb-6">
              <div>
                <h2 className="text-base font-bold text-darkText flex items-center gap-2">
                  <Layers size={18} className="text-teal-500" /> 카테고리별 그룹 분석
                </h2>
                <p className="text-xs text-neutral-500 mt-1">선택한 카테고리 내의 태그 흐름을 파악합니다.</p>
              </div>
              <select 
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full md:w-48 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm font-bold text-darkText outline-none focus:border-teal-500 transition-colors"
              >
                {categories.map(c => (
                  <option key={`cat-opt-${c.name}`} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="h-52 w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={categoryLineData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={10} />
                  <YAxis hide domain={[0, 'dataMax + 1']} />
                  <Tooltip content={renderTooltip} isAnimationActive={false} />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} iconType="circle" />
                  {tags.filter(t => t.category === selectedCategory).map((t, idx) => {
                    return (
                      <Line 
                        key={`cat-line-${t.name}`} 
                        type="monotone" 
                        dataKey={t.name} 
                        stroke={categories.find(c => c.name === t.category)?.color || PIE_COLORS[0]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    )
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Individual Task Line Chart */}
          <div className="flat-card p-5 lg:p-6 w-full">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-darkText flex items-center gap-2">
                  <Target size={18} className="text-secondary" /> 개별 작업 추이 (일 평균 대비)
                </h2>
                <p className="text-xs text-neutral-500 mt-1">선택 기간 일평균 <strong className="text-primary">{rawAverage}</strong>시간</p>
              </div>
              <select 
                value={selectedTag} 
                onChange={e => setSelectedTag(e.target.value)}
                className="w-full md:w-48 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm font-bold text-darkText outline-none focus:border-secondary transition-colors"
              >
                {tags.filter(t => t.category === selectedCategory).map(t => (
                  <option key={`${t.category}-${t.name}`} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>

            {selectedTagConfig?.daily_target && isUnderperforming && (
              <div className="mb-4 bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-2 border border-red-100">
                ⚠️ 최근 {targetPeriodSetting || 7}일 평균이 일일 목표치({selectedTagConfig.daily_target}h)에 미달입니다! 분발하세요 💪
              </div>
            )}

            <div className="h-52 w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 15, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={10} />
                  <YAxis hide domain={[0, yMaxLineChart]} />
                  <Tooltip content={renderTooltip} isAnimationActive={false} />
                  
                  {selectedTagConfig?.daily_target && (
                    <ReferenceLine 
                      y={selectedTagConfig.daily_target} 
                      stroke="#f43f5e" 
                      strokeDasharray="4 4" 
                      label={{ position: 'top', value: `목표: ${selectedTagConfig.daily_target}h`, fill: '#f43f5e', fontSize: 10, fontWeight: 700 }} 
                    />
                  )}
                  
                  <Line 
                    type="monotone" 
                    dataKey="hours" 
                    stroke={selectedTagColor} 
                    strokeWidth={3} 
                    dot={{ r: 3, fill: selectedTagColor }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
}
