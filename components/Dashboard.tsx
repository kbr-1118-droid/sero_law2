
import React, { useState } from 'react';
import { AppState, ViewState, TaskMeta, TaskAI } from '../types';
import { TaskCard } from './TaskCard';
import { Zap, Archive, RotateCcw, Megaphone, LayoutList, Briefcase } from 'lucide-react';

interface DashboardProps {
  appState: AppState;
  viewState: ViewState;
  onComplete: (id: string) => void;
  onUndo: (id: string) => void;
  onUpdate: (id: string, updates: { taskName?: string, status?: TaskAI['status'] }, metaUpdates: TaskMeta) => void;
  model?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ appState, viewState, onComplete, onUndo, onUpdate, model }) => {
  const [showDone, setShowDone] = useState(false);
  const doneTasks = appState.tasks.filter(t => appState.doneIds.includes(t.id)).sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));

  return (
    <div className="h-full flex flex-col bg-slate-100 font-sans">
       
       <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
           <div className="flex h-full gap-4 min-w-[1024px]">
               
               {/* Zone 1: The Doer (오늘의 실행) */}
               <div className="flex-1 flex flex-col min-w-[340px] bg-white rounded-2xl border border-slate-200 shadow-sm flex-shrink-0">
                   <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
                       <div>
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                                <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" /> 
                                The Doer (실행)
                            </h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">망설이지 말고 바로 처리하세요.</p>
                       </div>
                       <span className="bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full text-xs font-bold">{viewState.doer.length}</span>
                   </div>
                   <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50 scrollbar-thin">
                       {viewState.doer.map(({score, isStale, task}) => (
                           <TaskCard 
                                key={task.id} 
                                task={task} 
                                meta={appState.meta[task.id]} 
                                score={score} 
                                isStale={isStale}
                                allTasks={appState.tasks}
                                onComplete={onComplete} 
                                onUpdate={onUpdate} 
                                model={model}
                            />
                       ))}
                       {viewState.doer.length === 0 && (
                           <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm">
                               <span>🎉 할 일을 모두 마쳤습니다!</span>
                           </div>
                       )}
                   </div>
               </div>

               {/* Zone 2: The Manager (관리/독촉) */}
               <div className="flex-1 flex flex-col min-w-[340px] bg-white rounded-2xl border border-slate-200 shadow-sm flex-shrink-0">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
                       <div>
                           <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                               <Megaphone className="w-5 h-5 text-blue-500" /> 
                               The Manager (관리)
                           </h3>
                           <p className="text-[11px] text-slate-400 mt-0.5">외부 독촉 및 내부 의사결정이 필요합니다.</p>
                       </div>
                       <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs font-bold">{viewState.manager.length}</span>
                   </div>
                   <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50 scrollbar-thin">
                       {viewState.manager.map(({score, isStale, task}) => (
                           <TaskCard 
                                key={task.id} 
                                task={task} 
                                meta={appState.meta[task.id]} 
                                score={score} 
                                isStale={isStale}
                                allTasks={appState.tasks}
                                onComplete={onComplete} 
                                onUpdate={onUpdate}
                                model={model}
                            />
                       ))}
                       {viewState.manager.length === 0 && <div className="text-center py-10 text-xs text-slate-400">대기중인 건이 없습니다.</div>}
                   </div>
               </div>

               {/* Zone 3: The Planner (창고/완료) */}
               <div className="flex-1 flex flex-col min-w-[340px] bg-white rounded-2xl border border-slate-200 shadow-sm flex-shrink-0">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
                       <div>
                           <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                               <Briefcase className="w-5 h-5 text-slate-400" /> 
                               The Planner (보관)
                           </h3>
                           <p className="text-[11px] text-slate-400 mt-0.5">선행 작업 대기 및 보류 항목입니다.</p>
                       </div>
                       <div className="flex gap-2">
                            <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-bold">{viewState.planner.length}</span>
                       </div>
                   </div>
                   <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50 scrollbar-thin">
                       {viewState.planner.map(({score, isStale, task}) => (
                           <TaskCard 
                                key={task.id} 
                                task={task} 
                                meta={appState.meta[task.id]} 
                                score={score} 
                                isStale={isStale}
                                allTasks={appState.tasks}
                                compact
                                onComplete={onComplete} 
                                onUpdate={onUpdate}
                                model={model}
                            />
                       ))}

                       <div className="mt-6 pt-4 border-t border-slate-200">
                           <button onClick={() => setShowDone(!showDone)} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 mb-3">
                                <Archive className="w-3.5 h-3.5" /> 완료된 업무 ({doneTasks.length})
                                {showDone ? '접기' : '펼치기'}
                           </button>
                           
                           {showDone && (
                               <div className="space-y-2 opacity-70">
                                   {doneTasks.map(t => (
                                       <div key={t.id} className="bg-white p-2.5 rounded border border-slate-200 flex items-center justify-between">
                                           <span className="text-xs text-slate-500 line-through decoration-slate-300 truncate max-w-[200px]">{t.taskName}</span>
                                           <button onClick={() => onUndo(t.id)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-500" title="되돌리기">
                                               <RotateCcw className="w-3.5 h-3.5" />
                                           </button>
                                       </div>
                                   ))}
                               </div>
                           )}
                       </div>
                   </div>
               </div>

           </div>
       </div>
    </div>
  );
};
