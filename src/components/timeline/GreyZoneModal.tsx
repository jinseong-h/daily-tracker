import { useStore } from '../../store/useStore';
import type { TimelineBlock } from '../../utils/timeline';
import { BatteryCharging, BatteryWarning, AlertCircle } from 'lucide-react';

export function GreyZoneModal({ block, onClose }: { block: TimelineBlock, onClose: () => void }) {
  const { addGreyZoneActivity, removeActivity } = useStore();

  const isEdit = block.type === 'activity';
  const isNormalActivity = isEdit && block.activity?.tag !== '휴식' && block.activity?.tag !== '낭비';

  const handleSelect = (isProductive: boolean) => {
    addGreyZoneActivity(
      block.start.toISOString(),
      block.end.toISOString(),
      isProductive,
      isEdit && block.activity ? block.activity.id : undefined
    );
    onClose();
  };

  const handleDelete = () => {
    if (isEdit && block.activity) {
      removeActivity(block.activity.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-darkText/20 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">
        
        {isNormalActivity ? (
          <>
            <div className="p-8 pb-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-4">
                <AlertCircle size={24} />
              </div>
              <h2 className="text-xl font-bold text-darkText mb-2 tracking-tight">작업 기록 취소</h2>
              <p className="text-sm text-neutral-500 leading-relaxed">
                <span className="font-bold text-darkText">[{block.activity?.tag}]</span> 작업을 타임라인에서 영구적으로 삭제하시겠습니까? (이 작업은 되돌릴 수 없습니다)
              </p>
            </div>
            <div className="flex w-full bg-neutral-50/50">
              <button 
                onClick={handleDelete}
                className="flex-1 p-4 text-sm text-red-500 font-bold hover:bg-red-50 transition-colors border-r border-neutral-100"
              >
                기록 삭제
              </button>
              <button 
                onClick={onClose}
                className="flex-1 p-4 text-sm text-neutral-400 font-semibold hover:bg-neutral-100 hover:text-darkText transition-colors"
              >
                닫기
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="p-8 text-center pb-4">
              <h2 className="text-xl font-bold text-darkText mb-2 tracking-tight">
                {isEdit ? '누락 시간 기록 수정' : '누락 시간 기록'}
              </h2>
              <p className="text-sm text-neutral-500 leading-relaxed">
                측정되지 않은 약 <span className="font-bold text-primary">{Math.round(block.durationMs / 60000)}분</span>을 어떻게 보내셨나요?
              </p>
            </div>
            
            <div className="flex flex-col px-6 pb-6 pt-2 gap-3">
              <button 
                onClick={() => handleSelect(true)}
                className="group relative w-full p-4 rounded-2xl bg-white border border-neutral-200 text-darkText font-bold hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 overflow-hidden"
              >
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <BatteryCharging className="text-primary" size={20} />
                <span className="relative z-10">유의미한 휴식 / 재충전</span>
              </button>
              
              <button 
                onClick={() => handleSelect(false)}
                className="group relative w-full p-4 rounded-2xl bg-white border border-neutral-200 text-darkText font-bold hover:border-red-400/50 hover:shadow-lg hover:shadow-red-500/10 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 overflow-hidden"
              >
                <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <BatteryWarning className="text-red-500" size={20} />
                <span className="relative z-10">단순 낭비 / 딴짓</span>
              </button>
            </div>

            <div className="flex w-full bg-neutral-50/50">
              {isEdit && (
                <button 
                  onClick={handleDelete}
                  className="flex-1 p-4 text-sm text-red-500 font-semibold hover:bg-red-50 transition-colors border-r border-neutral-100"
                >
                  기록 삭제 (초기화)
                </button>
              )}
              <button 
                onClick={onClose}
                className="flex-1 p-4 text-sm text-neutral-400 font-semibold hover:bg-neutral-100 hover:text-darkText transition-colors"
              >
                {isEdit ? '취소' : '건너뛰기'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
