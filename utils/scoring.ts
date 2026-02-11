
import { TaskAI, TaskMeta, ViewState } from "../types";

const STALE_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

// Helper to count how many tasks are blocked by a specific task ID
const getBottleneckCount = (targetId: string, allMeta: Record<string, TaskMeta>): number => {
  let count = 0;
  Object.values(allMeta).forEach(meta => {
    if (meta.dependencyIds && meta.dependencyIds.includes(targetId)) {
      count++;
    }
  });
  return count;
};

export const scoreTask = (t: TaskAI, meta: TaskMeta | undefined, allMeta: Record<string, TaskMeta>): { score: number, isStale: boolean } => {
  let score = 50;

  // 1. Status Base Score
  if (t.status === "바로 실행 가능") score = 70;
  else if (t.status === "외부 응답 대기") score = 65; // Boosted: Chasing is high priority action
  else if (t.status === "의사결정 필요") score = 60; // Boosted: Decisions block others
  else if (["자료 부족", "선행 작업 필요"].includes(t.status)) score = 40;
  else if (t.status === "잠시 보류해도 무방") score = 10;

  // 2. Bottleneck Bonus (If I block others, I am important)
  const bottleneckCount = getBottleneckCount(t.id, allMeta);
  score += bottleneckCount * 15; // Huge bonus for bottlenecks

  // 3. Waiting Urgency (If waiting > 3 days, it becomes critical to chase)
  const lastUpdated = meta?.lastUpdated || t.createdAt;
  const timeDiff = Date.now() - lastUpdated;
  const isStale = timeDiff > STALE_THRESHOLD_MS;

  if (t.status === "외부 응답 대기" && isStale) {
    score += 20; // Critical Chase needed
  }

  // 4. Deadline Multiplier
  if (meta?.due) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(meta.due);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) score += 30; // Overdue
    else if (diffDays <= 1) score += 15; // Urgent
    else if (diffDays <= 3) score += 5;
  }

  // 5. Quick Win Bonus
  if (t.nextActions.length === 1 && !t.isEstimated && t.status === "바로 실행 가능") {
    score += 5;
  }

  // Cap score
  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    isStale
  };
};

export const buildViews = (tasks: TaskAI[], doneIds: Set<string>, metaMap: Record<string, TaskMeta>): ViewState => {
  const activeTasks = tasks.filter(t => !doneIds.has(t.id));
  
  const enriched = activeTasks.map(t => {
    const { score, isStale } = scoreTask(t, metaMap[t.id], metaMap);
    return { score, isStale, task: t };
  }).sort((a, b) => b.score - a.score);

  // Zone 1: The Doer (Actionable & High Priority)
  const doer = enriched.filter(x => 
    x.task.status === "바로 실행 가능" && x.score >= 50
  );

  // Zone 2: The Manager (Waiting & Decision - Needs Chasing or Unblocking)
  const manager = enriched.filter(x => 
    ["외부 응답 대기", "의사결정 필요"].includes(x.task.status)
  );

  // Zone 3: The Planner (Blocked, Low Priority, Backlog)
  const processedIds = new Set([
    ...doer.map(x => x.task.id),
    ...manager.map(x => x.task.id)
  ]);
  
  const planner = enriched.filter(x => !processedIds.has(x.task.id));

  return {
    enriched,
    doer,
    manager,
    planner
  };
};

export const generateChaseTemplate = (taskName: string, daysWait: number): string => {
    const timeRef = daysWait > 3 ? "지난번 요청드린" : "관련하여";
    return `안녕하세요, ${taskName} ${timeRef} 건 확인 부탁드립니다. 일정 조율을 위해 오늘 중 회신 주시면 감사하겠습니다.`;
};
