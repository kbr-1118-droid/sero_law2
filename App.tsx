import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { QuickInput } from './components/QuickInput';
import { StructuredInput } from './components/StructuredInput';
import { Dashboard } from './components/Dashboard';
import { AppState, TaskAI, TaskMeta } from './types';
import { buildViews } from './utils/scoring';
import { LayoutDashboard, Zap, PenTool } from 'lucide-react';

const STORAGE_KEY = 'marketing-ops-v2';

const App: React.FC = () => {
  const [model, setModel] = useState("gemini-2.0-flash");
  const [activeTab, setActiveTab] = useState<'dashboard' | 'quick' | 'structured'>('dashboard');
  
  const [appState, setAppState] = useState<AppState>({
    tasks: [],
    doneIds: [],
    meta: {},
  });

  // Load initial state
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setAppState(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load local state", e);
      }
    }
  }, []);

  // Persist state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  }, [appState]);

  const handleAddTasks = (newTasks: TaskAI[]) => {
    setAppState(prev => {
      const existingNames = new Set(prev.tasks.map(t => t.taskName));
      const filtered = newTasks.filter(t => !existingNames.has(t.taskName));
      
      const newMeta: Record<string, TaskMeta> = { ...prev.meta };
      filtered.forEach(t => {
        newMeta[t.id] = {};
      });

      return {
        ...prev,
        tasks: [...prev.tasks, ...filtered],
        meta: newMeta
      };
    });
    setActiveTab('dashboard');
  };

  const handleManualAdd = (task: TaskAI, meta: TaskMeta) => {
    setAppState(prev => ({
      ...prev,
      tasks: [...prev.tasks, task],
      meta: { ...prev.meta, [task.id]: meta }
    }));
    setActiveTab('dashboard');
  };

  const handleComplete = (id: string) => {
    setAppState(prev => ({
      ...prev,
      doneIds: [...prev.doneIds, id]
    }));
  };

  const handleSaveFile = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `ops_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleLoadFile = (data: AppState) => {
    setAppState(data);
  };

  const handleReset = () => {
    setAppState({ tasks: [], doneIds: [], meta: {} });
  };

  const viewState = useMemo(() => {
    return buildViews(appState.tasks, new Set(appState.doneIds), appState.meta);
  }, [appState]);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar 
        model={model} 
        setModel={setModel} 
        onSave={handleSaveFile}
        onLoad={handleLoadFile}
        onReset={handleReset}
      />
      
      <main className="flex-1 flex flex-col h-full min-w-0">
        {/* Top Navigation */}
        <div className="flex-none bg-white border-b border-slate-200 px-6">
            <div className="flex gap-6">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`py-4 px-2 border-b-2 text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <LayoutDashboard className="w-4 h-4" /> 대시보드
                </button>
                <button
                    onClick={() => setActiveTab('quick')}
                    className={`py-4 px-2 border-b-2 text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === 'quick' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Zap className="w-4 h-4" /> 빠른 입력 (AI)
                </button>
                <button
                    onClick={() => setActiveTab('structured')}
                    className={`py-4 px-2 border-b-2 text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === 'structured' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <PenTool className="w-4 h-4" /> 구조 입력 (수기)
                </button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
            {activeTab === 'dashboard' && (
                <Dashboard 
                    appState={appState} 
                    viewState={viewState} 
                    onComplete={handleComplete} 
                />
            )}
            
            {activeTab === 'quick' && (
                <div className="p-8 max-w-4xl mx-auto overflow-y-auto h-full">
                    <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
                        <QuickInput model={model} onAddTasks={handleAddTasks} />
                    </div>
                </div>
            )}

            {activeTab === 'structured' && (
                <div className="p-8 max-w-4xl mx-auto overflow-y-auto h-full">
                    <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800 mb-6">개별 업무 추가</h2>
                        <StructuredInput onAddTask={handleManualAdd} />
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default App;