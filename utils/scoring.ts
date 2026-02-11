import { TaskAI, TaskMeta, ViewState } from "../types";

const isBlockerCategory = (t: TaskAI): boolean => {
  return ["외주/업체 관리", "내부 협조/자료 수집", "검토/의사결정"].includes(t.category);
};

export const scoreTask = (t: TaskAI, meta?: TaskMeta): number => {
  // Base Score
  let base = 50;

  // 1. Status Base Score
  if (t.status === "바로 실행 가능") base = 70;
  else if (["자료 부족", "선행 작업 필요", "의사결정 필요"].includes(t.status)) base = 40;
  else if (t.status === "외부 응답 대기") base = 30; // Waiting is important but not actionable right now
  else if (t.status === "잠시 보류해도 무방") base = 10;

  let score = base;

  // 2. Category Bonus (Strategic Importance)
  if (isBlockerCategory(t)) score += 10;

  // 3. Multipliers (Urgency & Bottleneck)
  let multiplier = 1.0;

  if (meta?.due) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(meta.due);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) multiplier *= 2.0; // Overdue: Critical
    else if (diffDays <= 1) multiplier *= 1.5; // D-1: Urgent
    else if (diffDays <= 3) multiplier *= 1.2; // D-3: High
  }

  // Quick Win Bonus (Actionability)
  if (t.nextActions.length === 1 && !t.isEstimated) {
    score += 5;
  }

  // 4. Decay (Freshness)
  // Reduce score by 1 for every 2 days passed since creation
  if (t.createdAt) {
    const daysSinceCreation = Math.floor((Date.now() - t.createdAt) / (1000 * 60 * 60 * 24));
    const decay = Math.floor(daysSinceCreation / 2);
    score -= Math.min(decay, 20); // Max decay 20 points
  }

  // Apply Multiplier
  score *= multiplier;

  // 5. Final Constraints
  return Math.max(0, Math.min(100, Math.round(score)));
};

export const buildViews = (tasks: TaskAI[], doneIds: Set<string>, metaMap: Record<string, TaskMeta>): ViewState => {
  const activeTasks = tasks.filter(t => !doneIds.has(t.id));
  
  const enriched = activeTasks.map(t => ({
    score: scoreTask(t, metaMap[t.id]),
    task: t
  })).sort((a, b) => b.score - a.score);

  // Categorize for Kanban Columns
  
  // 1. Focus (Ready & High Score)
  const focus = enriched.filter(x => 
    x.task.status === "바로 실행 가능" && x.score >= 60
  );

  // 2. Waiting (External blockers)
  const waiting = enriched.filter(x => 
    x.task.status === "외부 응답 대기"
  );

  // 3. Blocked (Internal blockers / Decisions / Missing Data)
  const blocked = enriched.filter(x => 
    ["자료 부족", "의사결정 필요", "선행 작업 필요"].includes(x.task.status)
  );

  // 4. Backlog (Low priority ready tasks or deferred)
  // Everything else that is not in the above categories
  const processedIds = new Set([
    ...focus.map(x => x.task.id),
    ...waiting.map(x => x.task.id),
    ...blocked.map(x => x.task.id)
  ]);
  
  const backlog = enriched.filter(x => !processedIds.has(x.task.id));

  return {
    enriched,
    focus,
    waiting,
    blocked,
    backlog
  };
};

export const getRemindMessage = (taskName: string, tone: "카톡" | "메일"): string => {
  if (tone === "카톡") {
    return `${taskName} 관련해서 진행 상황 한 번만 확인 부탁드려요! 가능하시면 오늘/내일 중 업데이트 주시면 감사하겠습니다 🙏`;
  }
  return `안녕하세요. ${taskName} 건 관련하여 진행 상황 확인 부탁드립니다.\n가능하시면 오늘/내일 중으로 업데이트 주시면 일정 조율에 큰 도움이 됩니다.\n감사합니다.`;
};