
import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CopilotPanel } from './components/CopilotPanel';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AppState, TaskAI, TaskMeta } from './types';
import { buildViews } from './utils/scoring';
import { hasValidApiKey } from './services/geminiService';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'marketing-ops-v3';
const MODEL_KEY = 'marketing-ops-model';

const App: React.FC = () => {
  const [model, setModel] = useState("gemini-3-flash-preview");
  const [hasKey, setHasKey] = useState(true); // Default check triggers effect
  
  const [appState, setAppState] = useState<AppState>({
    tasks: [],
    doneIds: [],
    meta: {},
  });

  // Check API Key
  useEffect(() => {
    setHasKey(hasValidApiKey());
  }, []);

  // Helper: Sanitize loaded tasks to ensure unique IDs (Fixes "Shared State" bug)
  const sanitizeLoadedData = (data: AppState): AppState => {
    const seenIds = new Set<string>();
    const newTasks: TaskAI[] = [];
    const newMeta = { ...data.meta };
    let hasChanges = false;

    data.tasks.forEach(t => {
      if (seenIds.has(t.id)) {
        // Collision detected! Generate new ID
        const newId = uuidv4();
        // Try to preserve meta if possible (copy from old ID)
        if (newMeta[t.id]) {
            newMeta[newId] = { ...newMeta[t.id] };
        } else {
            newMeta[newId] = {};
        }
        newTasks.push({ ...t, id: newId });
        hasChanges = true;
      } else {
        seenIds.add(t.id);
        newTasks.push(t);
      }
    });

    if (hasChanges) {
      console.warn("Fixed duplicate task IDs in loaded data.");
      return { ...data, tasks: newTasks, meta: newMeta };
    }
    return data;
  };

  // Load initial state & model
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const savedModel = localStorage.getItem(MODEL_KEY);
    
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Apply sanitization immediately on load
        const cleanData = sanitizeLoadedData(parsed);
        setAppState(cleanData);
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
      // Double check uniqueness against existing
      const existingIds = new Set(prev.tasks.map(t => t.id));
      const safeNewTasks = newTasks.map(t => {
          if (existingIds.has(t.id)) return { ...t, id: uuidv4() };
          return t;
      });

      const existingNames = new Set(prev.tasks.map(t => t.taskName));
      const filtered = safeNewTasks.filter(t => !existingNames.has(t.taskName));
      
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
    // Ensure ID is unique
    const safeTask = { ...task };
    if (appState.tasks.some(t => t.id === safeTask.id)) {
        safeTask.id = uuidv4();
    }

    setAppState(prev => ({
      ...prev,
      tasks: [...prev.tasks, safeTask],
      meta: { ...prev.meta, [safeTask.id]: meta }
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
    // Sanitize uploaded file too
    setAppState(sanitizeLoadedData(data));
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
      {!hasKey && <ApiKeyModal onSaved={() => setHasKey(true)} />}
      
      <Sidebar 
        model={model} 
        setModel={setModel} 
        onSave={handleSaveFile}
        onLoad={handleLoadFile}
        onReset={handleReset}
        onResetKey={() => setHasKey(false)}
      />
      
      <main className="flex-1 flex flex-col h-full min-w-0 shadow-xl z-0">
        <Dashboard 
            appState={appState} 
            viewState={viewState} 
            onComplete={handleComplete} 
            onUndo={handleUndoComplete}
            onUpdate={handleUpdateTask}
            model={model}
        />
      </main>

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
