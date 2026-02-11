import React, { useRef } from 'react';
import { Save, Upload, Trash2, Settings, FileJson } from 'lucide-react';
import { AppState } from '../types';

interface SidebarProps {
  model: string;
  setModel: (m: string) => void;
  onSave: () => void;
  onLoad: (data: AppState) => void;
  onReset: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ model, setModel, onSave, onLoad, onReset }) => {
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
            <Settings className="w-4 h-4" /> 설정
          </h2>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">모델명 (Model ID)</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gemini-2.0-flash"
              className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-400">
              AI Studio 모델 ID와 일치해야 합니다.
            </p>
          </div>
        </div>

        {/* Data Management */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <FileJson className="w-4 h-4" /> 데이터 관리
          </h2>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onSave}
              className="flex flex-col items-center justify-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 gap-1"
            >
              <Save className="w-5 h-5" />
              <span className="text-xs font-medium">저장</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 gap-1"
            >
              <Upload className="w-5 h-5" />
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

          <button
            onClick={() => {
              if(confirm("정말로 모든 업무 목록을 초기화하시겠습니까?")) onReset();
            }}
            className="w-full flex items-center justify-center gap-2 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4" />
            전체 초기화
          </button>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <p className="text-[10px] text-slate-400 text-center">
          Powered by Google Gemini
        </p>
      </div>
    </div>
  );
};