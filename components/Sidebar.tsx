import React, { useRef } from 'react';
import { Save, Upload, Trash2, Settings, FileJson, Cpu, Key } from 'lucide-react';
import { AppState } from '../types';
import { removeLocalApiKey } from '../services/geminiService';

interface SidebarProps {
  model: string;
  setModel: (m: string) => void;
  onSave: () => void;
  onLoad: (data: AppState) => void;
  onReset: () => void;
  onResetKey: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ model, setModel, onSave, onLoad, onReset, onResetKey }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onLoad(json);
      } catch (err) {
        alert("JSON 파일 파싱에 실패했습니다.");
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleClearKey = () => {
    if(confirm("저장된 API Key를 삭제하시겠습니까?")) {
        removeLocalApiKey();
        onResetKey();
    }
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0">
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="text-2xl">🧠</span> Ops AI
        </h1>
        <p className="text-xs text-slate-500 mt-1">마케팅 초기 구축 운영 v2</p>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-8">
        {/* Settings */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4" /> AI 모델 설정
          </h2>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">사용 모델</label>
            <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
                <option value="gemini-2.0-flash">Gemini 2.0 Flash (빠름/추천)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (정교한 추론)</option>
            </select>
            
            {/* Custom Model Input (Fallback) */}
            <div className="pt-1">
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="직접 입력 (예: gemini-2.0-pro-exp)"
                  className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 text-slate-500 focus:outline-none focus:border-blue-400"
                />
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              'Flash'는 속도가 빠르고, 'Pro'는 복잡한 맥락 파악에 유리합니다.
            </p>
            
            <button 
                onClick={handleClearKey}
                className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 mt-2 underline"
            >
                <Key className="w-3 h-3" /> API Key 재설정
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 my-2"></div>

        {/* Data Management */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <FileJson className="w-4 h-4" /> 데이터 관리
          </h2>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onSave}
              className="flex flex-col items-center justify-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-700 gap-1.5"
            >
              <Save className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-medium">백업 저장</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-700 gap-1.5"
            >
              <Upload className="w-5 h-5 text-green-600" />
              <span className="text-xs font-medium">불러오기</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="application/json" 
              onChange={handleFileChange}
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3">
         <button
            onClick={() => {
              if(confirm("🚨 경고: 모든 업무 데이터가 삭제됩니다.\n정말로 초기화하시겠습니까?")) onReset();
            }}
            className="w-full flex items-center justify-center gap-2 p-2.5 text-red-600 bg-white border border-red-100 hover:bg-red-50 hover:border-red-200 rounded-lg transition-colors text-xs font-medium"
          >
            <Trash2 className="w-4 h-4" />
            데이터 전체 초기화
          </button>
        <p className="text-[10px] text-slate-400 text-center">
          Powered by Google Gemini
        </p>
      </div>
    </div>
  );
};