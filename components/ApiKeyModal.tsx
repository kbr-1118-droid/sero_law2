import React, { useState } from 'react';
import { Key, ChevronRight, Lock, CircleHelp, ExternalLink } from 'lucide-react';
import { setLocalApiKey } from '../services/geminiService';

interface ApiKeyModalProps {
  onSaved: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSaved }) => {
  const [key, setKey] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim().length > 10) {
      setLocalApiKey(key.trim());
      onSaved();
    } else {
      alert("유효한 API Key를 입력해주세요.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="bg-slate-900 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-blue-600 opacity-20 transform -skew-y-6 origin-top-left"></div>
            <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                    <Key className="w-6 h-6 text-blue-200" />
                </div>
                <h2 className="text-xl font-bold">API Key가 필요해요</h2>
                <p className="text-slate-300 text-sm mt-1">AI 모델(Gemini)을 사용하기 위한 필수 열쇠입니다.</p>
            </div>
        </div>
        
        <div className="p-6">
            {!showGuide ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Gemini API Key</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input 
                                type="password"
                                value={key}
                                onChange={e => setKey(e.target.value)}
                                placeholder="AIza... 로 시작하는 키 입력"
                                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button 
                            type="button"
                            onClick={() => setShowGuide(true)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                        >
                            <CircleHelp className="w-4 h-4" />
                            발급 방법
                        </button>
                        <button 
                            type="submit"
                            className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold text-sm transition-colors shadow-sm"
                        >
                            저장하고 시작하기
                        </button>
                    </div>

                    <p className="text-[11px] text-center text-slate-400 mt-2">
                        입력된 키는 서버로 전송되지 않고,<br/>회원님의 브라우저에만 안전하게 저장됩니다.
                    </p>
                </form>
            ) : (
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs">?</span>
                        무료 키 발급 가이드
                    </h3>
                    <ol className="space-y-3 text-xs text-slate-600 list-decimal pl-4 marker:font-bold marker:text-slate-400">
                        <li className="pl-1">
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline hover:text-blue-800 inline-flex items-center gap-1">
                                Google AI Studio <ExternalLink className="w-3 h-3" />
                            </a>
                            에 접속합니다. (구글 로그인)
                        </li>
                        <li className="pl-1">
                            화면의 <span className="font-bold text-slate-800">Get API key</span> 버튼을 클릭합니다.
                        </li>
                        <li className="pl-1">
                            <span className="font-bold text-slate-800">Create API key</span>를 누르고, 새 프로젝트에서 키를 생성합니다.
                        </li>
                        <li className="pl-1">
                            생성된 키(AIza...)를 복사하여 이곳에 붙여넣습니다.
                        </li>
                    </ol>
                    <button 
                        onClick={() => setShowGuide(false)}
                        className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium mt-2"
                    >
                        알겠습니다 (입력하러 가기)
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};