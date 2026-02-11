import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle, Clock, Calendar, StickyNote, ArrowRight } from 'lucide-react';
import { TaskAI, TaskMeta } from '../types';
import { Badge } from './ui/Badge';

interface TaskCardProps {
  task: TaskAI;
  meta?: TaskMeta;
  score: number;
  onComplete: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, meta, score, onComplete }) => {
  const [expanded, setExpanded] = useState(false);

  // Determine badge variants
  const getStatusVariant = (status: string) => {
    switch(status) {
      case "바로 실행 가능": return "success";
      case "자료 부족":
      case "선행 작업 필요": return "warning";
      case "의사결정 필요": return "danger";
      default: return "secondary";
    }
  };

  return (
    <div className={`border rounded-xl bg-white transition-all duration-200 ${expanded ? 'ring-1 ring-blue-500 border-blue-500 shadow-md' : 'border-slate-200 hover:border-blue-300'}`}>
      {/* Header */}
      <div 
        className="p-4 cursor-pointer flex items-start gap-3 select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${score > 70 ? 'bg-blue-600' : 'bg-slate-500'}`}>
              {score}
            </span>
            <Badge variant={getStatusVariant(task.status)}>{task.status}</Badge>
            <span className="text-xs text-slate-500 font-medium">{task.category}</span>
            {task.isEstimated && <Badge variant="outline">추정</Badge>}
          </div>
          <h3 className="font-semibold text-slate-900 truncate leading-snug">{task.taskName}</h3>
          
          {/* Quick Meta Preview */}
          {(meta?.channel || meta?.due || meta?.estMin) && (
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              {meta.channel && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>{meta.channel}</span>}
              {meta.due && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{meta.due}</span>}
              {meta.estMin && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{meta.estMin}분</span>}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onComplete(task.id);
                }}
                className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                title="완료 처리"
            >
                <CheckCircle className="w-5 h-5" />
            </button>
             {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/30 rounded-b-xl space-y-4 pt-4 text-sm">
          {/* Metadata Full */}
          {(meta?.dependsOn || meta?.note) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-100/50 rounded-lg">
                {meta.dependsOn && (
                    <div className="flex gap-2 items-start text-xs text-slate-700">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5" />
                        <span className="font-medium">의존: {meta.dependsOn}</span>
                    </div>
                )}
                {meta.note && (
                    <div className="flex gap-2 items-start text-xs text-slate-700">
                        <StickyNote className="w-3.5 h-3.5 text-blue-500 mt-0.5" />
                        <span>{meta.note}</span>
                    </div>
                )}
            </div>
          )}

          {/* Block Reason & Next Action */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
               <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">막히는 이유</h4>
               <p className="text-slate-800 bg-white p-2.5 border border-slate-200 rounded-md shadow-sm">
                  {task.blockReason}
               </p>
            </div>
            <div>
               <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">다음 행동 (15-30분)</h4>
               <ul className="space-y-1.5">
                   {task.nextActions.map((action, idx) => (
                       <li key={idx} className="flex items-start gap-2 text-slate-800">
                           <ArrowRight className="w-3.5 h-3.5 text-blue-500 mt-1 flex-shrink-0" />
                           <span>{action}</span>
                       </li>
                   ))}
               </ul>
            </div>
          </div>

          {/* Tips */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">해결 팁</h4>
            <p className="text-slate-600 italic">💡 {task.solutionTip}</p>
          </div>

          {/* Checklists & Advanced Data */}
          {(task.requiredDataCheck.length > 0 || task.blogStructure.length > 0 || task.placeCheck.length > 0 || task.options.length > 0) && (
             <div className="border-t border-slate-200 pt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                {task.options.length > 0 && (
                    <div>
                        <h5 className="font-semibold text-slate-700 mb-2 text-xs">의사결정 선택지</h5>
                        <ul className="list-disc list-inside text-slate-600 text-xs space-y-1">
                            {task.options.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                )}
                {task.requiredDataCheck.length > 0 && (
                    <div>
                        <h5 className="font-semibold text-slate-700 mb-2 text-xs">요구자료 체크리스트</h5>
                        <ul className="list-disc list-inside text-slate-600 text-xs space-y-1">
                            {task.requiredDataCheck.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                )}
                {task.blogStructure.length > 0 && (
                    <div>
                        <h5 className="font-semibold text-slate-700 mb-2 text-xs">블로그 글 구조</h5>
                        <ul className="list-disc list-inside text-slate-600 text-xs space-y-1">
                            {task.blogStructure.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                )}
                 {task.placeCheck.length > 0 && (
                    <div>
                        <h5 className="font-semibold text-slate-700 mb-2 text-xs">플레이스 체크리스트</h5>
                        <ul className="list-disc list-inside text-slate-600 text-xs space-y-1">
                            {task.placeCheck.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                )}
             </div>
          )}
        </div>
      )}
    </div>
  );
};