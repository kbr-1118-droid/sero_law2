import React, { useState } from 'react';
import { AppState, ViewState, TaskMeta, TaskAI } from '../types';
import { TaskCard } from './TaskCard';
import { Target, Layers, PlayCircle, Lock, Archive, RotateCcw } from 'lucide-react';

interface DashboardProps {
  appState: AppState;
  viewState: ViewState;
  onComplete: (id: string) => void;
  onUndo: (id: string) => void;
  onUpdate: (id: string, updates: { taskName?: string, status?: TaskAI['status'] }, metaUpdates: TaskMeta) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ appState, viewState, onComplete, onUndo, onUpdate }) => {
  const [showDone, setShowDone] = useState(false);
  const doneTasks = appState.tasks.filter(t => appState.doneIds.includes(t.id)).sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));

  return (
    <div className="h-full flex flex-col bg-slate-50">
       
       {/* 1. Focus Section (Top Banner) */}
       <div className="flex-none bg-white border-b border-slate-200 p-6 shadow-sm z-10">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-red-500" />
              오늘의 집중 (Focus)
              <span className="text-xs font-normal text-slate-500 ml-2">가장 점수가 높은 '실행 가능' 업무입니다.</span>
          </h2>
          {viewState.focus.length === 0 ? (
             <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-6 text-center text-sm text-slate-500">
                🎉 현재 집중할 업무가 없습니다. 대기중인 업무를 처리하거나, 새로운 업무를 추가하세요.
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {viewState.focus.slice(0, 3).map(({ score, task }) => (
                     <div key={task.id} className="relative group">
                         <div className="absolute -inset-0.5 bg-gradient-to-r from-red-200 to-blue-200 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-200"></div>
                         <div className="relative">
                            <TaskCard 
                                task={task} 
                                meta={appState.meta[task.id]} 
                                score={score} 
                                onComplete={onComplete}
                                onUpdate={onUpdate}
                            />
                         </div>
                     </div>
                 ))}
             </div>
          )}
       </div>

       {/* 2. Kanban Board (Main Content) */}
       <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
           <div className="flex h-full gap-6 min-w-[1000px]">
               
               {/* Column: Backlog (대기) */}
               <div className="flex-1 flex flex-col min-w-[300px] bg-slate-100/50 rounded-xl border border-slate-200">
                   <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-white/50 rounded-t-xl backdrop-blur-sm sticky top-0">
                       <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                           <Layers className="w-4 h-4 text-slate-400" /> 대기 / 정리 필요
                       </h3>
                       <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{viewState.backlog.length}</span>
                   </div>
                   <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-300">
                       {viewState.backlog.map(({score, task}) => (
                           <TaskCard key={task.id} task={task} meta={appState.meta[task.id]} score={score} onComplete={onComplete} onUpdate={onUpdate} compact />
                       ))}
                       {viewState.backlog.length === 0 && <div className="text-center py-10 text-xs text-slate-400">비어있음</div>}
                   </div>
               </div>

               {/* Column: Blocked (내부/외부 병목) */}
               <div className="flex-1 flex flex-col min-w-[300px] bg-amber-50/50 rounded-xl border border-amber-100">
                    <div className="p-3 border-b border-amber-100 flex items-center justify-between bg-white/50 rounded-t-xl backdrop-blur-sm sticky top-0">
                       <h3 className="font-bold text-amber-900 flex items-center gap-2 text-sm">
                           <Lock className="w-4 h-4 text-amber-500" /> 병목 / 대기
                       </h3>
                       <div className="flex gap-2">
                           <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-bold" title="내부 요인">{viewState.blocked.length}</span>
                           <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold" title="외부 대기">{viewState.waiting.length}</span>
                       </div>
                   </div>
                   <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-amber-200">
                       {/* Priority to Waiting */}
                       {viewState.waiting.map(({score, task}) => (
                           <TaskCard key={task.id} task={task} meta={appState.meta[task.id]} score={score} onComplete={onComplete} onUpdate={onUpdate} compact />
                       ))}
                       {viewState.blocked.map(({score, task}) => (
                           <TaskCard key={task.id} task={task} meta={appState.meta[task.id]} score={score} onComplete={onComplete} onUpdate={onUpdate} compact />
                       ))}
                       {(viewState.waiting.length + viewState.blocked.length) === 0 && <div className="text-center py-10 text-xs text-amber-400">병목 없음</div>}
                   </div>
               </div>

               {/* Column: Done (완료) */}
               <div className="flex-1 flex flex-col min-w-[300px] bg-slate-100/50 rounded-xl border border-slate-200">
                    <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-white/50 rounded-t-xl backdrop-blur-sm sticky top-0">
                       <h3 className="font-bold text-slate-500 flex items-center gap-2 text-sm">
                           <Archive className="w-4 h-4" /> 완료
                       </h3>
                       <button onClick={() => setShowDone(!showDone)} className="text-xs text-blue-600 hover:underline">
                           {showDone ? '숨기기' : '보기'} ({doneTasks.length})
                       </button>
                   </div>
                   <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-300">
                       {showDone && doneTasks.map(t => (
                           <div key={t.id} className="bg-white p-3 rounded border border-slate-200 opacity-60 hover:opacity-100 transition-opacity flex items-center justify-between">
                               <span className="text-xs text-slate-500 line-through decoration-slate-300">{t.taskName}</span>
                               <button onClick={() => onUndo(t.id)} className="text-slate-400 hover:text-blue-500"><RotateCcw className="w-3.5 h-3.5" /></button>
                           </div>
                       ))}
                       {!showDone && doneTasks.length > 0 && (
                           <div className="text-center py-10 text-xs text-slate-400">
                               {doneTasks.length}개의 완료된 업무가 숨겨져 있습니다.
                           </div>
                       )}
                   </div>
               </div>

           </div>
       </div>
    </div>
  );
};