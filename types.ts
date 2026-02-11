
export type Category = 
  | "콘텐츠/자산 구축"
  | "외주/업체 관리"
  | "내부 협조/자료 수집"
  | "검토/의사결정"
  | "대기/보류";

export type Status = 
  | "바로 실행 가능"
  | "선행 작업 필요"
  | "외부 응답 대기"
  | "자료 부족"
  | "의사결정 필요"
  | "잠시 보류해도 무방";

export type Channel = 
  | "블로그"
  | "네이버 플레이스"
  | "홈페이지/랜딩"
  | "외주/업체"
  | "내부 협업"
  | "계약/법무"
  | "기타";

export type Tone = "카톡" | "메일";

// Raw response from Gemini (Korean keys)
export interface TaskAIRaw {
  id: string;
  원본입력: string;
  업무명: string;
  업무분류: Category;
  업무상태: Status;
  막히는이유: string;
  다음행동: string[];
  해결팁: string;
  추정여부: boolean;
  근거요약: string;
  선택지?: string[];
  판단기준?: string[];
  요구자료체크?: string[];
  블로그구조?: string[];
  플레이스체크?: string[];
}

export interface PlanAIRaw {
  업무상세: TaskAIRaw[];
}

// Frontend Domain Model (CamelCase)
export interface TaskAI {
  id: string;
  originalInput: string;
  taskName: string;
  category: Category;
  status: Status;
  blockReason: string;
  nextActions: string[];
  solutionTip: string;
  isEstimated: boolean;
  basisSummary: string;
  options: string[];
  criteria: string[];
  requiredDataCheck: string[];
  blogStructure: string[];
  placeCheck: string[];
  createdAt: number; // timestamp
}

export interface TaskLink {
  title: string;
  url: string;
}

export interface TaskMeta {
  due?: string; // YYYY-MM-DD
  channel?: Channel;
  estMin?: number;
  dependsOn?: string; // Text description (Legacy)
  dependencyIds?: string[]; // IDs of tasks that block this task (Physical Link)
  note?: string;
  links?: TaskLink[];
  lastUpdated?: number; // For "Stale" check
}

export interface AppState {
  tasks: TaskAI[];
  doneIds: string[];
  meta: Record<string, TaskMeta>;
}

export interface ViewState {
  enriched: Array<{ score: number; isStale: boolean; task: TaskAI }>;
  doer: Array<{ score: number; isStale: boolean; task: TaskAI }>; // Ready to execute (High Priority)
  manager: Array<{ score: number; isStale: boolean; task: TaskAI }>; // Waiting & Decisions (Needs Chasing)
  planner: Array<{ score: number; isStale: boolean; task: TaskAI }>; // Backlog & Blocked
}

// --- Resolve Copilot Types ---
export type ResolveType = "문구" | "체크리스트" | "블로그" | "의사결정";

export interface ResolveOutput {
  제목: string;
  한줄요약: string;
  추정여부: boolean;
  근거요약: string;
  카톡문구: string[];
  메일문구: string[];
  체크리스트: string[];
  블로그뼈대: string[];
  의사결정표: string[];
  지금바로15분: string[];
  완료기준80점: string;
}
