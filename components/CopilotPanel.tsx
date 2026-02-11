import React, { useState } from 'react';
import { Loader2, Sparkles, Send, Plus, ArrowRight, AlertCircle } from 'lucide-react';
import { analyzeTasks } from '../services/geminiService';
import { TaskAI, TaskMeta } from '../types';
import { normalizeLines } from '../utils/textUtils';
import { v4 as uuidv4 } from 'uuid';

interface CopilotPanelProps {
  model: string;
  existingTasks: TaskAI[];
  onAddTasks: (tasks: TaskAI[]) => void;
  onAddManualTask: (task: TaskAI, meta: TaskMeta) => void;
}

export const CopilotPanel: React.FC<CopilotPanelProps> = ({ model, existingTasks, onAddTasks, onAddManualTask }) => {
  const [mode, setMode] = useState<'chat' | 'manual'>('chat');
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewTasks, setPreviewTasks] = useState<TaskAI[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Manual Input States
  const [mName, setMName] = useState("");
  const [mDue, setMDue] = useState("");

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setPreviewTasks(null);
    setError(null);
    
    try {
      const lines = normalizeLines(input);
      const results = await analyzeTasks(lines, model, existingTasks);
      setPreviewTasks(results);
    } catch (e: any) {
      setError(e.message || "분석 실패");
    } finally {
      setLoading(false);
    }
  };

  const confirmTasks = () => {
    if (previewTasks) {
      onAddTasks(previewTasks);
      setPreviewTasks(null);
      setInput("");
      setError(null);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName.trim()) return;
    const newTask: TaskAI = {
        id: uuidv4(),
        originalInput: mName,
        taskName: mName,
        category: "대기/보류",
        status: "선행 작업 필요",
        blockReason: "수기 입력",
        nextActions: ["상세 계획 수립 필요"],
        solutionTip: "",
        isEstimated: true,
        basisSummary: "",
        options: [],
        criteria: [],
        requiredDataCheck: [],
        blogStructure: [],
        placeCheck: [],
        createdAt: Date.now()
    };
    const newMeta: TaskMeta = { due: mDue || undefined };
    onAddManualTask(newTask, newMeta);
    setMName("");
    setMDue("");
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 shadow-xl z-20 w-96 flex-shrink-0">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
           <Sparkles className="w-4 h-4 text-blue-600" />
           Ops Copilot
        </h2>
        <div className="flex bg-white rounded-md border border-slate-200 p-0.5">
            <button 
                onClick={() => setMode('chat')}
                className={`px-3 py-1 text-xs font-medium rounded ${mode === 'chat' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}
            >AI 분석</button>
            <button 
                onClick={() => setMode('manual')}
                className={`px-3 py-1 text-xs font-medium rounded ${mode === 'manual' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}
            >수기</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mode === 'chat' ? (
             <>
                <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 leading-relaxed border border-blue-100">
                    👋 안녕하세요! 마케팅 PM Copilot입니다.<br/>
                    오늘 해야 할 업무나 고민되는 내용을 툭 던져주세요.<br/>
                    <span className="opacity-70 text-[10px] block mt-1">예: "홈페이지 시안 검토해야 하는데 업체에서 메일이 안 와."</span>
                </div>
                
                {error && (
                    <div className="bg-red-50 p-3 rounded-lg text-xs text-red-700 border border-red-200 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span className="whitespace-pre-wrap">{error}</span>
                    </div>
                )}

                {loading && (
                    <div className="flex items-center gap-2 text-slate-500 text-sm justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        분석 중입니다...
                    </div>
                )}

                {previewTasks && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-700">분석 결과 ({previewTasks.length})</h3>
                            <button onClick={() => setPreviewTasks(null)} className="text-xs text-slate-400 underline">취소</button>
                        </div>
                        {previewTasks.map(t => (
                            <div key={t.id} className="bg-white border border-slate-200 rounded p-2.5 shadow-sm">
                                <p className="text-sm font-medium text-slate-900">{t.taskName}</p>
                                <p className="text-xs text-slate-500 mt-1">{t.status} · {t.nextActions[0]}</p>
                            </div>
                        ))}
                        <button 
                            onClick={confirmTasks}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                        >
                            보드에 추가하기
                        </button>
                    </div>
                )}
             </>
        ) : (
            <form onSubmit={handleManualSubmit} className="space-y-3">
                <input 
                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="업무명 입력"
                    value={mName}
                    onChange={e => setMName(e.target.value)}
                    autoFocus
                />
                <input 
                    type="date"
                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={mDue}
                    onChange={e => setMDue(e.target.value)}
                />
                <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> 추가
                </button>
            </form>
        )}
      </div>

      {mode === 'chat' && !previewTasks && (
        <div className="p-4 border-t border-slate-200 bg-white">
            <div className="relative">
                <textarea 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="여기에 입력하세요 (Enter로 줄바꿈)"
                    className="w-full h-24 p-3 pr-10 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                    onKeyDown={e => {
                        if(e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAnalyze();
                        }
                    }}
                />
                <button 
                    onClick={handleAnalyze}
                    disabled={!input.trim() || loading}
                    className="absolute bottom-3 right-3 p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-300 transition-colors"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">
                Shift + Enter로 줄바꿈
            </p>
        </div>
      )}
    </div>
  );
};