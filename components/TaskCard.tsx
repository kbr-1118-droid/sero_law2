
import React, { useState } from 'react';
import { CheckCircle, Calendar, ArrowRight, Pencil, Save, X, Link as LinkIcon, ExternalLink, Plus, Copy, AlertTriangle, Link2 } from 'lucide-react';
import { TaskAI, TaskMeta, Channel, TaskLink } from '../types';
import { Badge } from './ui/Badge';
import { generateChaseTemplate } from '../utils/scoring';
import { ResolvePanel } from './ResolvePanel';

interface TaskCardProps {
  task: TaskAI;
  meta?: TaskMeta;
  score: number;
  isStale?: boolean;
  allTasks?: TaskAI[]; // For dependency selection
  onComplete: (id: string) => void;
  onUpdate: (id: string, updates: { taskName?: string, status?: TaskAI['status'] }, metaUpdates: TaskMeta) => void;
  compact?: boolean;
  model?: string; // Passed from App -> Dashboard -> TaskCard
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, meta, score, isStale, allTasks = [], onComplete, onUpdate, compact = false, model = "gemini-3-flash-preview" }) => {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit State
  const [editName, setEditName] = useState(task.taskName);
  const [editStatus, setEditStatus] = useState<TaskAI['status']>(task.status);
  const [editDue, setEditDue] = useState(meta?.due || "");
  const [editChannel, setEditChannel] = useState<Channel | "">(meta?.channel || "");
  const [editNote, setEditNote] = useState(meta?.note || "");
  const [editDepends, setEditDepends] = useState(meta?.dependsOn || "");
  const [editDepIds, setEditDepIds] = useState<string[]>(meta?.dependencyIds || []);
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
            dependencyIds: editDepIds,
            links: links,
            lastUpdated: Date.now()
        }
    );
    setIsEditing(false);
  };

  const handleChaseCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const daysWait = meta?.lastUpdated ? Math.floor((Date.now() - meta.lastUpdated) / (1000 * 60 * 60 * 24)) : 0;
    const text = generateChaseTemplate(task.taskName, daysWait);
    navigator.clipboard.writeText(text);
    alert("독촉 메시지가 복사되었습니다:\n" + text);
  };

  const toggleDepId = (id: string) => {
    if (editDepIds.includes(id)) {
        setEditDepIds(editDepIds.filter(d => d !== id));
    } else {
        setEditDepIds([...editDepIds, id]);
    }
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
    setEditName(task.taskName);
    setEditStatus(task.status);
    setEditDue(meta?.due || "");
    setEditChannel(meta?.channel || "");
    setEditNote(meta?.note || "");
    setEditDepends(meta?.dependsOn || "");
    setEditDepIds(meta?.dependencyIds || []);
    setLinks(meta?.links || []);
    setIsEditing(false);
  };

  const getStatusVariant = (status: string) => {
    switch(status) {
      case "바로 실행 가능": return "success";
      case "자료 부족":
      case "선행 작업 필요": return "warning";
      case "의사결정 필요": return "danger";
      case "외부 응답 대기": return "default";
      default: return "secondary";
    }
  };

  if (isEditing) {
    return (
        <div className="border border-blue-400 rounded-xl bg-white shadow-xl p-4 space-y-4 z-20 relative ring-4 ring-blue-50/50">
            <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">업무명</label>
                <input 
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
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
                    <label className="block text-xs font-semibold text-slate-500 mb-1">선행 업무 (물리적 연결)</label>
                    <div className="border border-slate-300 rounded p-1.5 max-h-24 overflow-y-auto bg-slate-50">
                        {allTasks.filter(t => t.id !== task.id).map(t => (
                            <div key={t.id} className="flex items-center gap-2 mb-1">
                                <input 
                                    type="checkbox" 
                                    checked={editDepIds.includes(t.id)}
                                    onChange={() => toggleDepId(t.id)}
                                    className="rounded border-slate-300 w-3 h-3"
                                />
                                <span className="text-xs truncate">{t.taskName}</span>
                            </div>
                        ))}
                    </div>
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

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                    onClick={handleCancel}
                    className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200"
                >
                    <X className="w-3.5 h-3.5" /> 취소
                </button>
                <button 
                    onClick={handleSave}
                    className="flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 shadow-sm"
                >
                    <Save className="w-3.5 h-3.5" /> 저장
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className={`border rounded-xl bg-white transition-all duration-200 group/card relative ${expanded ? 'ring-1 ring-blue-500 border-blue-500 shadow-lg z-10' : 'border-slate-200 hover:border-blue-300 hover:shadow-md'}`}>
      
      {/* Stale Indicator */}
      {isStale && !compact && (
          <div className="absolute -top-1.5 -right-1.5 z-20">
              <div className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5" title="3일 이상 업데이트 없음">
                  <AlertTriangle className="w-3 h-3" /> 방치됨
              </div>
          </div>
      )}

      {/* Card Header */}
      <div 
        className="p-3.5 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    {!compact && <Badge variant={getStatusVariant(task.status)}>{task.status}</Badge>}
                    <span className="text-[10px] text-slate-400 font-medium truncate max-w-[80px] bg-slate-100 px-1.5 py-0.5 rounded">{task.category}</span>
                    {meta?.due && <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${new Date(meta.due) < new Date() ? 'bg-red-100 text-red-600 font-bold' : 'bg-slate-50 text-slate-500'}`}><Calendar className="w-3 h-3" />{meta.due}</span>}
                </div>
                
                <h3 className={`font-medium text-slate-900 leading-snug break-keep ${compact ? 'text-sm' : 'text-base'}`}>{task.taskName}</h3>
                
                {/* Meta Icons */}
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    {meta?.channel && <span className="flex items-center gap-1 truncate max-w-[100px]"><div className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0"></div>{meta.channel}</span>}
                    {meta?.dependencyIds && meta.dependencyIds.length > 0 && <span className="flex items-center gap-1 text-amber-500" title="선행 업무 있음"><Link2 className="w-3 h-3" /> {meta.dependencyIds.length}</span>}
                    {meta?.links && meta.links.length > 0 && <span className="flex items-center gap-1 text-blue-500"><LinkIcon className="w-3 h-3" /> {meta.links.length}</span>}
                </div>
            </div>

            <div className="flex flex-col gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
                 <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onComplete(task.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg bg-white border border-slate-100 shadow-sm transition-colors"
                    title="완료 처리"
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
                        setEditDepIds(meta?.dependencyIds || []);
                        setLinks(meta?.links || []);
                        setExpanded(false);
                    }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg bg-white border border-slate-100 shadow-sm transition-colors"
                    title="수정"
                >
                    <Pencil className="w-4 h-4" />
                </button>
                
                {/* Chase Button (Only for External Wait) */}
                {task.status === "외부 응답 대기" && (
                    <button
                        onClick={handleChaseCopy}
                        className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg bg-white border border-slate-100 shadow-sm transition-colors"
                        title="독촉 메시지 복사"
                    >
                        <Copy className="w-4 h-4" />
                    </button>
                )}
            </div>
          </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-slate-100 bg-slate-50/50 rounded-b-lg space-y-3 pt-3 text-sm">
           {/* Block Reason & Next Action */}
          <div>
              <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">다음 행동</h4>
                  {task.isEstimated && <span className="text-[10px] text-amber-600 bg-amber-100 px-1.5 rounded">추정됨</span>}
              </div>
              <ul className="space-y-1">
                  {task.nextActions.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-800 text-xs bg-white p-2.5 rounded border border-slate-200 shadow-sm">
                          <ArrowRight className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="leading-relaxed">{action}</span>
                      </li>
                  ))}
              </ul>
          </div>
          
          {/* Resolve Copilot Panel */}
          {!compact && (
            <ResolvePanel task={task} model={model} />
          )}

          {(meta?.dependsOn || meta?.note) && (
             <div className="bg-white p-2.5 rounded border border-slate-200 text-xs text-slate-600 space-y-1.5 shadow-sm">
                 {meta.dependsOn && <div>⚠️ <b>의존성:</b> {meta.dependsOn}</div>}
                 {meta.note && <div>📝 <b>메모:</b> {meta.note}</div>}
             </div>
          )}
          
           {/* Links */}
           {meta?.links && meta.links.length > 0 && (
               <div className="space-y-1 pt-1">
                   {meta.links.map((l, i) => (
                       <a key={i} href={l.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-blue-600 hover:underline p-2 bg-blue-50/50 rounded border border-blue-100">
                           <ExternalLink className="w-3 h-3" /> {l.title}
                       </a>
                   ))}
               </div>
           )}
        </div>
      )}
    </div>
  );
};
