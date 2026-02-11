import React, { useState } from 'react';
import { Key, ChevronRight, Lock } from 'lucide-react';
import { setLocalApiKey } from '../services/geminiService';

interface ApiKeyModalProps {
  onSaved: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSaved }) => {
  const [key, setKey] = useState("");

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-blue-600 p-6 text-white text-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Key className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold">API Key 설정</h2>
            <p className="text-blue-100 text-sm mt-1">AI 비서를 사용하기 위해 키가 필요합니다.</p>
        </div>
        
        <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Gemini API Key</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input 
                            type="password"
                            value={key}
                            onChange={e => setKey(e.target.value)}
                            placeholder="AI Studio에서 발급받은 키를 입력하세요"
                            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600 border border-slate-200">
                    <p className="font-semibold mb-1">키가 없으신가요?</p>
                    <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                        Google AI Studio에서 무료 발급받기 <ChevronRight className="w-3 h-3" />
                    </a>
                </div>

                <button 
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-bold text-sm transition-colors"
                >
                    저장하고 시작하기
                </button>

                <p className="text-[10px] text-center text-slate-400">
                    입력하신 키는 서버로 전송되지 않고,<br/>오직 브라우저(로컬)에만 저장됩니다.
                </p>
            </form>
        </div>
      </div>
    </div>
  );
};