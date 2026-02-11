import { GoogleGenAI, Type } from "@google/genai";
import { PlanAIRaw, TaskAI, TaskAIRaw } from "../types";
import { v4 as uuidv4 } from 'uuid';

const SYSTEM_INSTRUCTION = `
너는 12년차 시니어 마케팅 PM + 운영 컨설턴트다.
상황: 광고 집행 전 초기 구축 단계(블로그/플레이스/홈페이지/외주/내부협업/계약검토/자료제공) 업무가 병렬로 진행된다.

목표:
- 입력된 업무를 구조화하고(업무명/분류/상태),
- 15~30분 단위의 매우 구체적인 '다음 행동'을 1~2개만 제시하여 실행을 돕는다.

절대 규칙:
- 입력에 없는 사실을 만들지 마라.
- 업무는 반드시 원본입력 1항목에서만 도출해라. 서로 다른 항목을 합치지 마라.
- 모호하면 추정여부=True. 상태는 '의사결정 필요' 또는 '자료 부족' 또는 '잠시 보류'로 보내라.
- 근거요약은 원본입력에서 그대로 가져와라(새로 만들지 마라). 근거가 없으면 빈 문자열.
- 다음행동은 '정리하기/확인하기' 같은 추상어를 피하고, 실제 행동 문장으로 써라.
- 블로그/플레이스/홈페이지/외주/계약 관련이면 해당 도메인 체크리스트를 적극 채워라.
- 출력은 반드시 주어진 JSON 스키마(PlanAI)를 만족해야 한다.
`;

const USER_TEMPLATE = (rawTasks: string) => `
아래는 사용자가 입력한 업무 목록이다. 각 항목은 독립 업무다.

[사용자 입력]
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
  };
};

export const analyzeTasks = async (lines: string[], modelName: string): Promise<TaskAI[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing in environment variables.");
  }

  const client = new GoogleGenAI({ apiKey });
  const prompt = USER_TEMPLATE(lines.join('\n'));

  // Define Response Schema
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      업무상세: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "Unique ID" },
            원본입력: { type: Type.STRING, description: "User original input" },
            업무명: { type: Type.STRING, description: "Refined task name" },
            업무분류: { 
              type: Type.STRING, 
              enum: ["콘텐츠/자산 구축", "외주/업체 관리", "내부 협조/자료 수집", "검토/의사결정", "대기/보류"] 
            },
            업무상태: { 
              type: Type.STRING, 
              enum: ["바로 실행 가능", "선행 작업 필요", "외부 응답 대기", "자료 부족", "의사결정 필요", "잠시 보류해도 무방"] 
            },
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
  };

  try {
    const response = await client.models.generateContent({
      model: modelName || "gemini-2.0-flash", // Default fallback if empty
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0,
      }
    });

    let parsedResponse = response.parsed as PlanAIRaw | null;
    
    // Fallback: If parsed is missing (sometimes happens with specific SDK versions or model responses),
    // try to manually parse the text.
    if (!parsedResponse && response.text) {
        try {
            const rawText = response.text;
            // Remove code blocks if present (though responseMimeType usually prevents this, it's safer)
            const jsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            parsedResponse = JSON.parse(jsonText) as PlanAIRaw;
        } catch (e) {
            console.error("Manual parsing failed:", e);
            console.log("Raw Response Text:", response.text);
        }
    }

    if (!parsedResponse?.업무상세) {
       console.error("Invalid Response Structure:", parsedResponse);
       throw new Error("Failed to parse response structure. Please try again or check the API key/Model.");
    }

    return parsedResponse.업무상세.map(mapRawToDomain);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
