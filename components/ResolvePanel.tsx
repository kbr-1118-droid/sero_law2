
import React, { useState } from 'react';
import { MessageSquare, CheckSquare, FileText, Scale, Loader2, Copy, Check, Info } from 'lucide-react';
import { TaskAI, ResolveType, ResolveOutput } from '../types';
import { generateResolve } from '../services/geminiService';

interface ResolvePanelProps {
  task: TaskAI;
  model: string;
}

export const ResolvePanel: React.FC<ResolvePanelProps> = ({ task, model }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResolveOutput | null>(null);
  const [activeType, setActiveType] = useState<ResolveType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (type: ResolveType) => {
    setLoading(true);
    setActiveType(type);
    setError(null);
    setResult(null);
    try {
      const output = await generateResolve(task, type, model);
      setResult(output);
    } catch (e: any) {
      setError(e.message || "산출물 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const lines = [
        `[${result.제목}]`,
        `${result.한줄요약}`,
        "",
        "▶ 지금 바로(15분)",
        ...result.지금바로15분.map(l => `- ${l}`),
        "",
        "▶ 80점 완료 기준",
        result.완료기준80점,
        "",
        "▶ 산출물 내용",
    ];

    if (result.카톡문구.length) lines.push(...result.카톡문구.map(l => `[카톡] ${l}`));
    if (result.메일문구.length) lines.push(...result.메일문구.map(l => `[메일] ${l}`));
    if (result.체크리스트.length) lines.push(...result.체크리스트.map(l => `[ ] ${l}`));
    if (result.블로그뼈대.length) lines.push(...result.블로그뼈대.map(l => `- ${l}`));
    if (result.의사결정표.length) lines.push(...result.의사결정표.map(l => `• ${l}`));

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 mt-3">
      <h3 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 mb-2">
        ⚡ 해결 Copilot (산출물 생성)
      </h3>
      
      <div className="grid grid-cols-4 gap-2 mb-3">
        <button
          onClick={() => handleGenerate("문구")}
          disabled={loading}
          className={`flex flex-col items-center justify-center p-2 rounded border transition-all text-[10px] gap-1 ${activeType === '문구' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50'}`}
        >
          <MessageSquare className="w-4 h-4" />
          문구
        </button>
        <button
          onClick={() => handleGenerate("체크리스트")}
          disabled={loading}
          className={`flex flex-col items-center justify-center p-2 rounded border transition-all text-[10px] gap-1 ${activeType === '체크리스트' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50'}`}
        >
          <CheckSquare className="w-4 h-4" />
          체크리스트
        </button>
        <button
          onClick={() => handleGenerate("블로그")}
          disabled={loading}
          className={`flex flex-col items-center justify-center p-2 rounded border transition-all text-[10px] gap-1 ${activeType === '블로그' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50'}`}
        >
          <FileText className="w-4 h-4" />
          블로그
        </button>
        <button
          onClick={() => handleGenerate("의사결정")}
          disabled={loading}
          className={`flex flex-col items-center justify-center p-2 rounded border transition-all text-[10px] gap-1 ${activeType === '의사결정' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50'}`}
        >
          <Scale className="w-4 h-4" />
          의사결정
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6 text-indigo-400 text-xs">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          실행 가능한 산출물을 만드는 중...
        </div>
      )}

      {error && (
        <div className="text-red-500 text-xs bg-red-50 p-2 rounded border border-red-100">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white rounded border border-indigo-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-3 bg-indigo-50 border-b border-indigo-100 flex items-start justify-between">
            <div>
                <h4 className="font-bold text-indigo-900 text-sm">{result.제목}</h4>
                <p className="text-xs text-indigo-600 mt-0.5">{result.한줄요약}</p>
            </div>
            <button 
                onClick={handleCopy}
                className="text-xs flex items-center gap-1 text-indigo-500 hover:text-indigo-800 bg-white px-2 py-1 rounded border border-indigo-200 shadow-sm"
            >
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "복사됨" : "전체 복사"}
            </button>
          </div>
          
          <div className="p-3 space-y-4 max-h-[400px] overflow-y-auto scrollbar-thin">
            {/* Immediate Action */}
            <div className="bg-yellow-50 p-2.5 rounded border border-yellow-100">
                <span className="text-[10px] font-bold text-yellow-800 uppercase tracking-wide block mb-1">지금 바로 (15분)</span>
                <ul className="list-disc list-inside text-xs text-slate-800 space-y-0.5">
                    {result.지금바로15분.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            </div>

            {/* Content Body */}
            <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-2">산출물 상세</span>
                <div className="space-y-3 text-xs text-slate-700">
                    {activeType === "문구" && (
                        <>
                            {result.카톡문구.length > 0 && (
                                <div>
                                    <div className="font-bold mb-1 text-indigo-600">💬 카톡/메신저</div>
                                    <div className="bg-slate-50 p-2 rounded border border-slate-100 whitespace-pre-wrap">{result.카톡문구.join('\n\n')}</div>
                                </div>
                            )}
                             {result.메일문구.length > 0 && (
                                <div>
                                    <div className="font-bold mb-1 text-indigo-600">📧 이메일</div>
                                    <div className="bg-slate-50 p-2 rounded border border-slate-100 whitespace-pre-wrap">{result.메일문구.join('\n\n')}</div>
                                </div>
                            )}
                        </>
                    )}

                    {activeType === "체크리스트" && (
                        <div className="space-y-1">
                            {result.체크리스트.map((item, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <input type="checkbox" className="mt-0.5 rounded border-slate-300" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeType === "블로그" && (
                        <div className="bg-slate-50 p-3 rounded border border-slate-100 space-y-1">
                             {result.블로그뼈대.map((item, i) => (
                                <div key={i}>{item}</div>
                            ))}
                        </div>
                    )}

                    {activeType === "의사결정" && (
                         <div className="bg-slate-50 p-3 rounded border border-slate-100 space-y-1">
                             {result.의사결정표.map((item, i) => (
                                <div key={i}>{item}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span title="완료 기준">{result.완료기준80점}</span>
                {result.추정여부 && <span className="flex items-center gap-1 text-amber-500"><Info className="w-3 h-3" /> 일반론 추정 포함</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
