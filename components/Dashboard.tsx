import React, { useState } from 'react';
import { AppState, ViewState } from '../types';
import { TaskCard } from './TaskCard';
import { getRemindMessage } from '../utils/scoring.ts';
import { Copy, Check, MessageCircle, Mail } from 'lucide-react';

interface DashboardProps {
  appState: AppState;
  viewState: ViewState;
  onComplete: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ appState, viewState, onComplete }) => {
  const [copied, setCopied] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const copySummary = () => {
    let lines = [];
    lines.push("【즉시 실행 TOP5】");
    viewState.immediateTop5.forEach((item, i) => {
        lines.push(`${i+1}. ${item.task.taskName} — ${item.task.nextActions[0] || ''}`);
    });
    lines.push("");
    lines.push("【병목 해소 TOP5】");
    viewState.blockerTop5.forEach((item, i) => {
        lines.push(`${i+1}. ${item.task.taskName} — ${item.task.nextActions[0] || ''}`);
    });

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const doneTasks = appState.tasks.filter(t => appState.doneIds.includes(t.id));

  return (
    <div className="h-full overflow-hidden flex flex-col">
       {/* Top Priority Lists */}
       <div className="flex-none p-6 pb-2 border-b border-slate-100 bg-white">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">우선순위 현황</h2>
              <button 
                onClick={copySummary}
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                {copied ? "복사됨!" : "요약 복사"}
              </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Immediate Actions */}
              <div className="bg-green-50/50 rounded-xl p-4 border border-green-100">
                  <h3 className="text-sm font-bold text-green-900 mb-3 flex items-center gap-2">
                      ⚡ 즉시 실행 TOP5 <span className="text-green-600 text-xs font-normal">(15-30분 컷)</span>
                  </h3>
                  <div className="space-y-2">
                      {viewState.immediateTop5.length === 0 && <p className="text-xs text-slate-400 italic">즉시 실행할 업무가 없습니다.</p>}
                      {viewState.immediateTop5.map((item, idx) => (
                          <div key={item.task.id} className="flex items-start gap-2 text-sm text-slate-800">
                              <span className="font-mono text-green-600 font-bold text-xs mt-0.5">{idx + 1}.</span>
                              <div className="min-w-0">
                                  <p className="font-medium truncate">{item.task.taskName}</p>
                                  {item.task.nextActions[0] && (
                                      <p className="text-xs text-slate-500 truncate mt-0.5">→ {item.task.nextActions[0]}</p>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Blockers */}
              <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
                  <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                      🧱 병목 해소 TOP5 <span className="text-amber-600 text-xs font-normal">(먼저 뚫어야 함)</span>
                  </h3>
                   <div className="space-y-2">
                      {viewState.blockerTop5.length === 0 && <p className="text-xs text-slate-400 italic">병목 업무가 없습니다.</p>}
                      {viewState.blockerTop5.map((item, idx) => (
                          <div key={item.task.id} className="flex items-start gap-2 text-sm text-slate-800">
                              <span className="font-mono text-amber-600 font-bold text-xs mt-0.5">{idx + 1}.</span>
                              <div className="min-w-0">
                                  <p className="font-medium truncate">{item.task.taskName}</p>
                                  <p className="text-xs text-slate-500 truncate mt-0.5">{item.task.status}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
       </div>

       {/* Main Content Area: List + Side Panel */}
       <div className="flex-1 overflow-hidden flex">
          {/* Main List */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
             <div className="max-w-3xl mx-auto space-y-4 pb-20">
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                     전체 업무 ({viewState.enriched.length})
                 </h3>
                 {viewState.enriched.map(({ score, task }) => (
                     <TaskCard 
                        key={task.id} 
                        task={task} 
                        meta={appState.meta[task.id]} 
                        score={score} 
                        onComplete={onComplete}
                     />
                 ))}
                 
                 {viewState.enriched.length === 0 && (
                     <div className="text-center py-20">
                         <p className="text-slate-400">대기 중인 업무가 없습니다. 위 탭에서 추가해주세요!</p>
                     </div>
                 )}

                 {/* Done Section */}
                 {doneTasks.length > 0 && (
                     <div className="pt-8">
                         <button 
                            onClick={() => setShowDone(!showDone)}
                            className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 hover:text-slate-600 flex items-center gap-2"
                         >
                            완료된 업무 ({doneTasks.length})
                            {showDone ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                         </button>
                         {showDone && (
                             <div className="space-y-2 opacity-60">
                                {doneTasks.map(t => (
                                    <div key={t.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-lg">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span className="text-sm text-slate-500 line-through">{t.taskName}</span>
                                    </div>
                                ))}
                             </div>
                         )}
                     </div>
                 )}
             </div>
          </div>

          {/* Right Panel: Waiting / Reminders */}
          <div className="w-80 bg-white border-l border-slate-200 overflow-y-auto p-6 hidden xl:block">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  ⏳ 외부 대기 리마인드
              </h3>
              {viewState.waiting.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">외부 대기 중인 업무가 없습니다.</p>
              ) : (
                  <div className="space-y-8">
                      {viewState.waiting.slice(0, 5).map(({ task }) => (
                          <div key={task.id} className="group">
                              <p className="text-sm font-medium text-slate-800 mb-2">{task.taskName}</p>
                              
                              <div className="space-y-3">
                                  {/* Kakao Template */}
                                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 relative">
                                      <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-yellow-800">
                                          <MessageCircle className="w-3 h-3" /> 카톡
                                      </div>
                                      <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                                          {getRemindMessage(task.taskName, "카톡")}
                                      </p>
                                      <button 
                                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => navigator.clipboard.writeText(getRemindMessage(task.taskName, "카톡"))}
                                        title="복사"
                                      >
                                          <Copy className="w-3 h-3" />
                                      </button>
                                  </div>

                                  {/* Mail Template */}
                                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 relative">
                                      <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-blue-800">
                                          <Mail className="w-3 h-3" /> 메일
                                      </div>
                                      <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                                          {getRemindMessage(task.taskName, "메일")}
                                      </p>
                                      <button 
                                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => navigator.clipboard.writeText(getRemindMessage(task.taskName, "메일"))}
                                        title="복사"
                                      >
                                          <Copy className="w-3 h-3" />
                                      </button>
                                  </div>
                              </div>
                              <div className="h-px bg-slate-100 w-full mt-6" />
                          </div>
                      ))}
                  </div>
              )}
          </div>
       </div>
    </div>
  );
};

// Helper icon imports (need to add to top if used here, duplicate imports handled by React logic usually but I'll fix imports)
import { ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';