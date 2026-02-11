import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { TaskAI, Channel, TaskMeta } from '../types';

interface StructuredInputProps {
  onAddTask: (task: TaskAI, meta: TaskMeta) => void;
}

export const StructuredInput: React.FC<StructuredInputProps> = ({ onAddTask }) => {
  const [taskName, setTaskName] = useState("");
  const [channel, setChannel] = useState<Channel>("기타");
  const [due, setDue] = useState("");
  const [estMin, setEstMin] = useState(30);
  const [dependsOn, setDependsOn] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    const newTask: TaskAI = {
      id: uuidv4(),
      originalInput: taskName,
      taskName: taskName,
      category: "대기/보류",
      status: (dependsOn || note) ? "의사결정 필요" : "선행 작업 필요",
      blockReason: "(수기 입력) 필요 시 AI로 재분석하세요",
      nextActions: ["업무를 15~30분 단위로 쪼개기"],
      solutionTip: "가장 작은 행동부터 시작",
      isEstimated: true,
      basisSummary: "",
      options: [],
      criteria: [],
      requiredDataCheck: [],
      blogStructure: [],
      placeCheck: [],
    };

    const newMeta: TaskMeta = {
      due: due || undefined,
      channel,
      estMin,
      dependsOn: dependsOn || undefined,
      note: note || undefined,
    };

    onAddTask(newTask, newMeta);
    
    // Reset
    setTaskName("");
    setChannel("기타");
    setDue("");
    setEstMin(30);
    setDependsOn("");
    setNote("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">업무명</label>
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="예: 네이버 플레이스 신규 등록"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">채널</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as Channel)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="블로그">블로그</option>
              <option value="네이버 플레이스">네이버 플레이스</option>
              <option value="홈페이지/랜딩">홈페이지/랜딩</option>
              <option value="외주/업체">외주/업체</option>
              <option value="내부 협업">내부 협업</option>
              <option value="계약/법무">계약/법무</option>
              <option value="기타">기타</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">마감일 (선택)</label>
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">예상 소요(분)</label>
            <input
              type="number"
              min="0"
              step="10"
              value={estMin}
              onChange={(e) => setEstMin(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">의존/막힌 요인</label>
            <input
              type="text"
              value={dependsOn}
              onChange={(e) => setDependsOn(e.target.value)}
              placeholder="예: 업체 자료 회신 필요"
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">메모</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none h-20 resize-none"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-medium transition-colors text-sm"
      >
        <Plus className="w-4 h-4" />
        수기 업무 추가
      </button>
    </form>
  );
};