import React, { useState } from 'react';
import { Loader2, Sparkles, PlusCircle } from 'lucide-react';
import { normalizeLines, mergeDuplicates } from '../utils/textUtils';
import { analyzeTasks } from '../services/geminiService';
import { TaskAI } from '../types';

interface QuickInputProps {
  model: string;
  onAddTasks: (tasks: TaskAI[]) => void;
}

export const QuickInput: React.FC<QuickInputProps> = ({ model, onAddTasks }) => {
  const [input, setInput] = useState("");
  const [mergeDupe, setMergeDupe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [analyzedTasks, setAnalyzedTasks] = useState<TaskAI[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setError(null);
    let lines = normalizeLines(input);
    if (mergeDupe) {
      lines = mergeDuplicates(lines);
    }

    if (lines.length === 0) {
      setError("업무 내용을 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const results = await analyzeTasks(lines, model);
      setAnalyzedTasks(results);
    } catch (err: any) {
      setError(err.message || "업무 분석에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToTodoList = () => {
    if (analyzedTasks) {
      onAddTasks(analyzedTasks);
      setAnalyzedTasks(null);
      setInput("");
      setError(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">빠른 입력 (카톡 스타일)</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`- 블로그 글 3개 써야 함\n- 네이버 플레이스 아직 안 만듦\n- 직원 단체사진 촬영 업체 알아봐야 함`}
          className="w-full h-40 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none text-sm leading-relaxed shadow-sm"
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="mergeDupe"
            checked={mergeDupe}
            onChange={(e) => setMergeDupe(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="mergeDupe" className="text-xs text-slate-600 cursor-pointer select-none">
            중복 업무 자동 제거
          </label>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleAnalyze}
          disabled={loading || !input.trim()}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {loading ? "분석 중..." : "AI로 정리(분석)"}
        </button>

        <button
          onClick={handleAddToTodoList}
          disabled={!analyzedTasks}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          목록에 추가 {analyzedTasks ? `(${analyzedTasks.length}건)` : ''}
        </button>
      </div>

      {analyzedTasks && (
        <div className="mt-6 border border-blue-100 bg-blue-50/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">분석 결과 미리보기</h3>
          <ul className="space-y-2">
            {analyzedTasks.map((t) => (
              <li key={t.id} className="text-sm text-slate-700 flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <div>
                  <span className="font-medium">{t.taskName}</span>
                  <span className="text-slate-500 ml-2 text-xs">({t.status})</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};