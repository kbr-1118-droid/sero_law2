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
}

export interface TaskMeta {
  due?: string; // YYYY-MM-DD
  channel?: Channel;
  estMin?: number;
  dependsOn?: string;
  note?: string;
}

export interface AppState {
  tasks: TaskAI[];
  doneIds: string[];
  meta: Record<string, TaskMeta>;
}

export interface ViewState {
  enriched: Array<{ score: number; task: TaskAI }>;
  immediateTop5: Array<{ score: number; task: TaskAI }>;
  blockerTop5: Array<{ score: number; task: TaskAI }>;
  waiting: Array<{ score: number; task: TaskAI }>;
}
