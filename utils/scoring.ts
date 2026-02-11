import { TaskAI, TaskMeta, ViewState } from "../types";

const isBlockerCategory = (t: TaskAI): boolean => {
  return ["외주/업체 관리", "내부 협조/자료 수집", "검토/의사결정"].includes(t.category);
};

export const scoreTask = (t: TaskAI, meta?: TaskMeta): number => {
  let s = 50;

  // Status scoring
  if (t.status === "바로 실행 가능") {
    s += 25;
  } else if (["자료 부족", "선행 작업 필요", "의사결정 필요"].includes(t.status)) {
    s += 10;
  } else if (t.status === "외부 응답 대기") {
    s -= 20;
  } else if (t.status === "잠시 보류해도 무방") {
    s -= 35;
  }

  // Blocker category bonus
  if (isBlockerCategory(t)) {
    s += 10;
  }

  // Quick win
  if (t.nextActions.length === 1) {
    s += 6;
  }

  // Estimated penalty
  if (t.isEstimated) {
    s -= 6;
  }

  // Meta data adjustments
  if (meta) {
    if (meta.due) {
      const today = new Date();
      // Reset time for accurate date comparison
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(meta.due);
      
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) s += 10;
      else if (diffDays <= 2) s += 6;
      else if (diffDays <= 7) s += 3;
    }

    if (meta.estMin) {
      if (meta.estMin >= 90) s -= 5;
      else if (meta.estMin <= 30) s += 3;
    }
  }

  return Math.max(0, Math.min(100, s));
};

export const buildViews = (tasks: TaskAI[], doneIds: Set<string>, metaMap: Record<string, TaskMeta>): ViewState => {
  const activeTasks = tasks.filter(t => !doneIds.has(t.id));
  
  const enriched = activeTasks.map(t => ({
    score: scoreTask(t, metaMap[t.id]),
    task: t
  })).sort((a, b) => b.score - a.score);

  // Immediate TOP 5
  let immediate = enriched.filter(x => x.task.status === "바로 실행 가능");
  if (immediate.length < 5) {
    immediate = enriched; // Fallback if not enough
  }
  const immediateTop5 = immediate.slice(0, 5);

  // Blocker TOP 5
  let blockers = enriched.filter(x => 
    isBlockerCategory(x.task) && x.task.status !== "외부 응답 대기"
  );
  if (blockers.length < 5) {
    // Fallback to specific statuses
    blockers = enriched.filter(x => 
      ["자료 부족", "선행 작업 필요", "의사결정 필요"].includes(x.task.status)
    );
  }
  const blockerTop5 = blockers.slice(0, 5);

  // Waiting
  const waiting = enriched.filter(x => x.task.status === "외부 응답 대기");

  return {
    enriched,
    immediateTop5,
    blockerTop5,
    waiting
  };
};

export const getRemindMessage = (taskName: string, tone: "카톡" | "메일"): string => {
  if (tone === "카톡") {
    return `${taskName} 관련해서 진행 상황 한 번만 확인 부탁드려요! 가능하시면 오늘/내일 중 업데이트 주시면 감사하겠습니다 🙏`;
  }
  return `안녕하세요. ${taskName} 건 관련하여 진행 상황 확인 부탁드립니다.\n가능하시면 오늘/내일 중으로 업데이트 주시면 일정 조율에 큰 도움이 됩니다.\n감사합니다.`;
};
