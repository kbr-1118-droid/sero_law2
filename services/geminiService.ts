import { GoogleGenAI, Type } from "@google/genai";
import { PlanAIRaw, TaskAI, TaskAIRaw } from "../types";
import { v4 as uuidv4 } from 'uuid';

const SYSTEM_INSTRUCTION = `
너는 15년차 시니어 마케팅 PM이자 운영 컨설턴트다.
상황: 광고 집행 전 초기 구축 단계(블로그/플레이스/홈페이지/외주/내부협업/계약검토/자료제공) 업무가 병렬로 진행된다.

목표:
- 입력된 업무를 구조화하고(업무명/분류/상태),
- 15~30분 단위의 매우 구체적인 '다음 행동'을 1~2개만 제시하여 실행을 돕는다.
- 이미 존재하는 업무와 중복된다면 최대한 합치거나, 기존 업무의 상태를 업데이트하는 방향으로 분석하라.

절대 규칙:
- 입력에 없는 사실을 만들지 마라.
- 업무는 반드시 원본입력 1항목에서만 도출해라. 서로 다른 항목을 합치지 마라.
- 모호하면 추정여부=True. 상태는 '의사결정 필요' 또는 '자료 부족' 또는 '잠시 보류'로 보내라.
- 근거요약은 원본입력에서 그대로 가져와라(새로 만들지 마라). 근거가 없으면 빈 문자열.
- 다음행동은 '정리하기/확인하기' 같은 추상어를 피하고, 실제 행동 문장으로 써라. (예: "OO업체에 견적 요청 메일 발송", "팀장님께 예산안 결재 올리기")
- 블로그/플레이스/홈페이지/외주/계약 관련이면 해당 도메인 체크리스트를 적극 채워라.
- 출력은 반드시 주어진 JSON 스키마(PlanAI)를 만족해야 한다.
`;

const USER_TEMPLATE = (rawTasks: string, contextTasks: string) => `
아래는 사용자가 입력한 새로운 업무 목록이다.

[기존 보유 업무 목록 (참고용 - 중복 방지)]
${contextTasks || "(없음)"}

[사용자 입력 (신규)]
${rawTasks}

[출력 요구]
- 업무상세: 모든 항목에 대해 TaskAI를 작성하라.
- '다음행동'은 15~30분 단위로 1~2개, 매우 구체적으로.
- '막히는이유' 1줄, '해결팁' 1개.
- 의사결정 필요인 경우에만 선택지(2~3개)와 판단기준(3개)를 채워라(모호하면 추정 표시).
- 홈페이지/외주 자료제공이면 요구자료체크를 채워라.
- 블로그 업무면 블로그구조를 채워라.
- 네이버 플레이스 업무면 플레이스체크를 채워라.
`;

// Helper to convert raw Korean keys to domain model English keys
const mapRawToDomain = (raw: TaskAIRaw): TaskAI => {
  return {
    id: raw.id || uuidv4(),
    originalInput: raw.원본입력,
    taskName: raw.업무명,
    category: raw.업무분류,
    status: raw.업무상태,
    blockReason: raw.막히는이유,
    nextActions: raw.다음행동,
    solutionTip: raw.해결팁,
    isEstimated: raw.추정여부,
    basisSummary: raw.근거요약 || "",
    options: raw.선택지 || [],
    criteria: raw.판단기준 || [],
    requiredDataCheck: raw.요구자료체크 || [],
    blogStructure: raw.블로그구조 || [],
    placeCheck: raw.플레이스체크 || [],
    createdAt: Date.now(),
  };
};

// Safe API Key Retrieval
export const getApiKey = (): string => {
  // 1. Try process.env (Node/Webpack/some Vite configs)
  try {
    if (typeof process !== 'undefined' && process.env?.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {}

  // 2. Try import.meta.env (Standard Vite)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
       // @ts-ignore
       return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {}

  // 3. Try LocalStorage (User entered)
  try {
    const localKey = localStorage.getItem('user_gemini_api_key');
    if (localKey) return localKey;
  } catch (e) {}

  return "";
};

export const hasValidApiKey = (): boolean => {
    return !!getApiKey();
};

export const setLocalApiKey = (key: string) => {
    localStorage.setItem('user_gemini_api_key', key);
};

export const removeLocalApiKey = () => {
    localStorage.removeItem('user_gemini_api_key');
};


export const analyzeTasks = async (lines: string[], modelName: string, existingTasks: TaskAI[] = []): Promise<TaskAI[]> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("API Key가 없습니다. 설정 메뉴에서 키를 입력해주세요.");
  }

  // Initialize per request to ensure we use the latest key
  const ai = new GoogleGenAI({ apiKey });

  // Context summary for deduplication
  const contextSummary = existingTasks.map(t => `- ${t.taskName} (${t.status})`).slice(0, 50).join('\n');
  const prompt = USER_TEMPLATE(lines.join('\n'), contextSummary);

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            업무상세: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  원본입력: { type: Type.STRING },
                  업무명: { type: Type.STRING },
                  업무분류: { type: Type.STRING, enum: ["콘텐츠/자산 구축", "외주/업체 관리", "내부 협조/자료 수집", "검토/의사결정", "대기/보류"] },
                  업무상태: { type: Type.STRING, enum: ["바로 실행 가능", "선행 작업 필요", "외부 응답 대기", "자료 부족", "의사결정 필요", "잠시 보류해도 무방"] },
                  막히는이유: { type: Type.STRING },
                  다음행동: { type: Type.ARRAY, items: { type: Type.STRING } },
                  해결팁: { type: Type.STRING },
                  추정여부: { type: Type.BOOLEAN },
                  근거요약: { type: Type.STRING },
                  선택지: { type: Type.ARRAY, items: { type: Type.STRING } },
                  판단기준: { type: Type.ARRAY, items: { type: Type.STRING } },
                  요구자료체크: { type: Type.ARRAY, items: { type: Type.STRING } },
                  블로그구조: { type: Type.ARRAY, items: { type: Type.STRING } },
                  플레이스체크: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["id", "원본입력", "업무명", "업무분류", "업무상태", "막히는이유", "다음행동", "해결팁", "추정여부"],
              }
            }
          },
          required: ["업무상세"]
        }
      },
      contents: prompt,
    });

    const textPart = response.text;
    if (!textPart) {
        throw new Error("Invalid response format from AI");
    }

    let parsedResponse: PlanAIRaw | null = null;
    try {
        parsedResponse = JSON.parse(textPart) as PlanAIRaw;
    } catch (e) {
         // Fallback cleaning
         const jsonText = textPart.replace(/```json/g, '').replace(/```/g, '').trim();
         parsedResponse = JSON.parse(jsonText) as PlanAIRaw;
    }

    if (!parsedResponse?.업무상세) {
       throw new Error("Failed to parse AI response structure.");
    }

    return parsedResponse.업무상세.map(mapRawToDomain);
  } catch (error: any) {
    console.error("Analysis Error:", error);
    // Explicitly handle API key errors
    if (error.message?.includes("API key") || error.status === 403) {
        throw new Error("API Key가 유효하지 않습니다. 설정에서 키를 확인해주세요.");
    }
    throw error;
  }
};