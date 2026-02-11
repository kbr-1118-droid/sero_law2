
import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CopilotPanel } from './components/CopilotPanel';
import { AppState, TaskAI, TaskMeta } from './types';
import { buildViews } from './utils/scoring';

const STORAGE_KEY = 'marketing-ops-v3';
const MODEL_KEY = 'marketing-ops-model';

const App: React.FC = () => {
  const [model, setModel] = useState("gemini-3-flash-preview");
  
  const [appState, setAppState] = useState<AppState>({
    tasks: [],
    doneIds: [],
    meta: {},
  });

  // Load initial state & model
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const savedModel = localStorage.getItem(MODEL_KEY);
    
    if (savedData) {
      try {
        setAppState(JSON.parse(savedData));
      } catch (e) {
        console.error("Failed to load local state", e);
      }
    }

    if (savedModel) {
      setModel(savedModel);
    }
  }, []);

  // Persist state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  }, [appState]);

  // Persist model
  useEffect(() => {
    localStorage.setItem(MODEL_KEY, model);
  }, [model]);

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
  };

  const handleManualAdd = (task: TaskAI, meta: TaskMeta) => {
    setAppState(prev => ({
      ...prev,
      tasks: [...prev.tasks, task],
      meta: { ...prev.meta, [task.id]: meta }
    }));
  };

  const handleUpdateTask = (id: string, updates: { taskName?: string, status?: TaskAI['status'] }, metaUpdates: TaskMeta) => {
    setAppState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
      meta: {
        ...prev.meta,
        [id]: { ...prev.meta[id], ...metaUpdates }
      }
    }));
  };

  const handleComplete = (id: string) => {
    setAppState(prev => ({
      ...prev,
      doneIds: [...prev.doneIds, id]
    }));
  };

  const handleUndoComplete = (id: string) => {
    setAppState(prev => ({
      ...prev,
      doneIds: prev.doneIds.filter(doneId => doneId !== id)
    }));
  };

  const handleSaveFile = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `ops_v3_backup_${new Date().toISOString().slice(0,10)}.json`);
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

  const contextTasks = useMemo(() => appState.tasks.filter(t => !appState.doneIds.includes(t.id)), [appState.tasks, appState.doneIds]);

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      {/* 1. Sidebar (Settings & Data) */}
      <Sidebar 
        model={model} 
        setModel={setModel} 
        onSave={handleSaveFile}
        onLoad={handleLoadFile}
        onReset={handleReset}
      />
      
      {/* 2. Main Content (Kanban & Focus) */}
      <main className="flex-1 flex flex-col h-full min-w-0 shadow-xl z-0">
        <Dashboard 
            appState={appState} 
            viewState={viewState} 
            onComplete={handleComplete} 
            onUndo={handleUndoComplete}
            onUpdate={handleUpdateTask}
        />
      </main>

      {/* 3. Copilot Panel (Input & AI) */}
      <CopilotPanel 
          model={model}
          existingTasks={contextTasks}
          onAddTasks={handleAddTasks}
          onAddManualTask={handleManualAdd}
      />
    </div>
  );
};

export default App;