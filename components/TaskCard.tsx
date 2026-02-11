import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle, Clock, Calendar, StickyNote, ArrowRight, Pencil, Save, X, Link as LinkIcon, ExternalLink, Plus } from 'lucide-react';
import { TaskAI, TaskMeta, Channel, TaskLink } from '../types';
import { Badge } from './ui/Badge';

interface TaskCardProps {
  task: TaskAI;
  meta?: TaskMeta;
  score: number;
  onComplete: (id: string) => void;
  onUpdate: (id: string, updates: { taskName?: string, status?: TaskAI['status'] }, metaUpdates: TaskMeta) => void;
  compact?: boolean; // For Kanban View
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, meta, score, onComplete, onUpdate, compact = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit State
  const [editName, setEditName] = useState(task.taskName);
  const [editStatus, setEditStatus] = useState<TaskAI['status']>(task.status);
  const [editDue, setEditDue] = useState(meta?.due || "");
  const [editChannel, setEditChannel] = useState<Channel | "">(meta?.channel || "");
  const [editNote, setEditNote] = useState(meta?.note || "");
  const [editDepends, setEditDepends] = useState(meta?.dependsOn || "");
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [links, setLinks] = useState<TaskLink[]>(meta?.links || []);

  const handleSave = () => {
    onUpdate(
        task.id, 
        { taskName: editName, status: editStatus }, 
        { 
            due: editDue || undefined, 
            channel: editChannel as Channel || undefined, 
            note: editNote || undefined,
            dependsOn: editDepends || undefined,
            links: links
        }
    );
    setIsEditing(false);
  };

  const handleAddLink = () => {
    if(newLinkTitle && newLinkUrl) {
      setLinks([...links, { title: newLinkTitle, url: newLinkUrl }]);
      setNewLinkTitle("");
      setNewLinkUrl("");
    }
  };

  const removeLink = (idx: number) => {
    setLinks(links.filter((_, i) => i !== idx));
  };

  const handleCancel = () => {
    // Reset to props
    setEditName(task.taskName);
    setEditStatus(task.status);
    setEditDue(meta?.due || "");
    setEditChannel(meta?.channel || "");
    setEditNote(meta?.note || "");
    setEditDepends(meta?.dependsOn || "");
    setLinks(meta?.links || []);
    setIsEditing(false);
  };

  const getStatusVariant = (status: string) => {
    switch(status) {
      case "바로 실행 가능": return "success";
      case "자료 부족":
      case "선행 작업 필요": return "warning";
      case "의사결정 필요": return "danger";
      default: return "secondary";
    }
  };

  if (isEditing) {
    return (
        <div className="border border-blue-300 rounded-xl bg-white shadow-lg p-4 space-y-4 z-10 relative">
            <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">업무명</label>
                <input 
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">상태</label>
                    <select 
                        className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs bg-white"
                        value={editStatus}
                        onChange={e => setEditStatus(e.target.value as TaskAI['status'])}
                    >
                        <option>바로 실행 가능</option>
                        <option>선행 작업 필요</option>
                        <option>외부 응답 대기</option>
                        <option>자료 부족</option>
                        <option>의사결정 필요</option>
                        <option>잠시 보류해도 무방</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">채널</label>
                    <select 
                        className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs bg-white"
                        value={editChannel}
                        onChange={e => setEditChannel(e.target.value as any)}
                    >
                        <option value="">(선택 안함)</option>
                        <option value="블로그">블로그</option>
                        <option value="네이버 플레이스">네이버 플레이스</option>
                        <option value="홈페이지/랜딩">홈페이지/랜딩</option>
                        <option value="외주/업체">외주/업체</option>
                        <option value="내부 협업">내부 협업</option>
                        <option value="계약/법무">계약/법무</option>
                        <option value="기타">기타</option>
                    </select>
                </div>
            </div>

             <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">마감일</label>
                    <input 
                        type="date"
                        className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs"
                        value={editDue}
                        onChange={e => setEditDue(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">의존성/대기</label>
                    <input 
                        className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs"
                        placeholder="예: 업체 연락 대기"
                        value={editDepends}
                        onChange={e => setEditDepends(e.target.value)}
                    />
                </div>
             </div>

             {/* Links Editor */}
             <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">참조 링크</label>
                <div className="space-y-2 mb-2">
                    {links.map((link, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-50 p-1.5 rounded text-xs border border-slate-200">
                             <span className="font-medium flex-1 truncate">{link.title}</span>
                             <span className="text-slate-400 truncate max-w-[100px]">{link.url}</span>
                             <button onClick={() => removeLink(idx)}><X className="w-3 h-3 text-red-400" /></button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input 
                        placeholder="제목 (예: 기획안)" 
                        className="flex-1 border border-slate-300 rounded px-2 py-1 text-xs"
                        value={newLinkTitle}
                        onChange={e => setNewLinkTitle(e.target.value)}
                    />
                    <input 
                        placeholder="URL" 
                        className="flex-1 border border-slate-300 rounded px-2 py-1 text-xs"
                        value={newLinkUrl}
                        onChange={e => setNewLinkUrl(e.target.value)}
                    />
                    <button type="button" onClick={handleAddLink} className="p-1 bg-slate-100 rounded border border-slate-300 hover:bg-slate-200"><Plus className="w-4 h-4 text-slate-600" /></button>
                </div>
             </div>

             <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">메모</label>
                <textarea 
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs h-16 resize-none"
                    value={editNote}
                    onChange={e => setEditNote(e.target.value)}
                />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                    onClick={handleCancel}
                    className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200"
                >
                    <X className="w-3.5 h-3.5" /> 취소
                </button>
                <button 
                    onClick={handleSave}
                    className="flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                >
                    <Save className="w-3.5 h-3.5" /> 저장
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className={`border rounded-lg bg-white transition-all duration-200 group/card ${expanded ? 'ring-1 ring-blue-500 border-blue-500 shadow-lg relative z-10' : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'}`}>
      {/* Kanban Card Header */}
      <div 
        className="p-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${score >= 70 ? 'bg-blue-600' : score >= 50 ? 'bg-slate-500' : 'bg-slate-300'}`}>
                    {score}
                    </span>
                    {!compact && <Badge variant={getStatusVariant(task.status)}>{task.status}</Badge>}
                    <span className="text-[10px] text-slate-400 font-medium truncate max-w-[80px]">{task.category}</span>
                </div>
                <h3 className={`font-medium text-slate-900 leading-snug ${compact ? 'text-sm' : 'text-base'}`}>{task.taskName}</h3>
                
                {/* Meta Icons */}
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    {meta?.channel && <span className="flex items-center gap-1 truncate max-w-[100px]"><span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0"></span>{meta.channel}</span>}
                    {meta?.due && <span className={`flex items-center gap-1 ${new Date(meta.due) < new Date() ? 'text-red-500 font-bold' : ''}`}><Calendar className="w-3 h-3" />{meta.due}</span>}
                    {meta?.links && meta.links.length > 0 && <span className="flex items-center gap-1 text-blue-500"><LinkIcon className="w-3 h-3" /> {meta.links.length}</span>}
                </div>
            </div>

            <div className="flex flex-col gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                 <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onComplete(task.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded bg-white border border-slate-100 shadow-sm"
                    title="완료"
                >
                    <CheckCircle className="w-4 h-4" />
                </button>
                 <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                        setEditName(task.taskName);
                        setEditStatus(task.status);
                        setEditDue(meta?.due || "");
                        setEditChannel(meta?.channel || "");
                        setEditNote(meta?.note || "");
                        setEditDepends(meta?.dependsOn || "");
                        setLinks(meta?.links || []);
                        setExpanded(false);
                    }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded bg-white border border-slate-100 shadow-sm"
                    title="수정"
                >
                    <Pencil className="w-4 h-4" />
                </button>
            </div>
          </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-slate-100 bg-slate-50/50 rounded-b-lg space-y-3 pt-3 text-sm">
           {/* Links */}
           {meta?.links && meta.links.length > 0 && (
               <div className="space-y-1">
                   {meta.links.map((l, i) => (
                       <a key={i} href={l.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-blue-600 hover:underline p-1.5 bg-blue-50 rounded border border-blue-100">
                           <ExternalLink className="w-3 h-3" /> {l.title}
                       </a>
                   ))}
               </div>
           )}

          {/* Block Reason & Next Action */}
          <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">다음 행동</h4>
              <ul className="space-y-1">
                  {task.nextActions.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-800 text-xs bg-white p-2 rounded border border-slate-200">
                          <ArrowRight className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span>{action}</span>
                      </li>
                  ))}
              </ul>
          </div>
          
           {/* Tips */}
          <div>
             <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">막힘 해결</h4>
             <p className="text-xs text-slate-600 bg-amber-50 p-2 rounded border border-amber-100">
                🚧 {task.blockReason} <br/>
                💡 {task.solutionTip}
             </p>
          </div>

          {(meta?.dependsOn || meta?.note) && (
             <div className="bg-slate-100 p-2 rounded text-xs text-slate-600 space-y-1">
                 {meta.dependsOn && <div>⚠️ 의존: {meta.dependsOn}</div>}
                 {meta.note && <div>📝 {meta.note}</div>}
             </div>
          )}
        </div>
      )}
    </div>
  );
};