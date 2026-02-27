'use client';

import OpenAI from 'openai';
import { Settings } from './settings';
import { UseCase, Requirement } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Generate mermaid diagram from use case flow
export function generateMermaidDiagram(useCase: UseCase): string {
  const actors = [...new Set(useCase.flow.map(step => step.actor))];
  const actorDefs = actors.map((actor) => `actor ${actor.replace(/\s+/g, '_')}`).join('\n');
  
  let sequence = '';
  useCase.flow.forEach((step) => {
    const actor = step.actor.replace(/\s+/g, '_');
    sequence += `    ${actor}->>System: ${step.action}\n`;
    if (step.result) {
      sequence += `    System-->>${actor}: ${step.result}\n`;
    }
  });

  return `sequenceDiagram
    autonumber
${actorDefs}
    participant System
${sequence}`;
}

// Create OpenAI client
function createOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}

// Generate use case from prompt using OpenAI Responses API
export async function generateUseCaseFromPrompt(
  prompt: string,
  settings: Settings
): Promise<UseCase> {
  if (!settings.openaiApiKey) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다. 설정 메뉴에서 API 키를 입력해주세요.');
  }

  const openai = createOpenAIClient(settings.openaiApiKey);

  const systemPrompt = `당신은 소프트웨어 요구사항 분석 전문가입니다. 사용자의 설명을 바탕으로 유즈케이스를 분석하여 JSON 형식으로 반환하세요.

중요: 반드시 유효한 JSON만 반환하세요. 마크다운 코드 블록이나 설명 없이 순수 JSON만 반환해야 합니다.

응답은 반드시 다음 JSON 형식을 따라야 합니다:
{
  "title": "유즈케이스 제목 (간결하게)",
  "description": "유즈케이스에 대한 상세 설명 (2-3문장)",
  "actors": ["액터1", "액터2"],
  "flow": [
    {"order": 1, "actor": "액터명", "action": "수행 동작", "result": "결과 (선택사항)"},
    {"order": 2, "actor": "액터명", "action": "수행 동작", "result": "결과 (선택사항)"}
  ]
}

flow 배열은 반드시 3-8단계의 실제적인 동작 흐름을 포함해야 합니다.`;

  const response = await openai.responses.create({
    model: settings.model,
    instructions: systemPrompt,
    input: prompt,
    text: {
      format: {
        type: 'json_schema',
        name: 'usecase_schema',
        schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            actors: { 
              type: 'array',
              items: { type: 'string' }
            },
            flow: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  order: { type: 'number' },
                  actor: { type: 'string' },
                  action: { type: 'string' },
                  result: { type: 'string' }
                },
                required: ['order', 'actor', 'action']
              }
            }
          },
          required: ['title', 'description', 'actors', 'flow']
        }
      }
    }
  });

  const content = response.output_text;
  if (!content) {
    throw new Error('API 응답이 비어있습니다.');
  }

  const parsed = JSON.parse(content);
  
  const useCase: UseCase = {
    id: uuidv4(),
    title: parsed.title,
    description: parsed.description,
    actors: parsed.actors,
    flow: parsed.flow,
    mermaidDiagram: '',
    requirements: [],
    createdAt: new Date(),
  };
  
  useCase.mermaidDiagram = generateMermaidDiagram(useCase);
  return useCase;
}

// Generate requirements from prompt using OpenAI Responses API
export async function generateRequirements(
  useCase: UseCase,
  prompt: string,
  settings: Settings
): Promise<Requirement[]> {
  if (!settings.openaiApiKey) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다.');
  }

  const openai = createOpenAIClient(settings.openaiApiKey);

  const systemPrompt = `당신은 소프트웨어 요구사항 분석 전문가입니다. 주어진 유즈케이스에 대해 사용자의 추가 요청사항을 바탕으로 요구사항 목록을 JSON 형식으로 생성하세요.

중요: 반드시 유효한 JSON만 반환하세요. 마크다운 코드 블록이나 설명 없이 순수 JSON만 반환해야 합니다.

유즈케이스: ${useCase.title}
설명: ${useCase.description}

응답은 반드시 다음 JSON 형식의 배열을 따라야 합니다:
{
  "requirements": [
    {
      "type": "functional" 또는 "non-functional",
      "description": "요구사항 상세 설명",
      "priority": "high" | "medium" | "low"
    }
  ]
}

functional: 사용자가 시스템을 통해 수행할 수 있는 구체적인 기능
non-functional: 성능, 보안, 사용성 등 시스템의 품질 속성

최소 3개, 최대 8개의 요구사항을 생성하세요.`;

  const response = await openai.responses.create({
    model: settings.model,
    instructions: systemPrompt,
    input: prompt,
    text: {
      format: {
        type: 'json_schema',
        name: 'requirements_schema',
        schema: {
          type: 'object',
          properties: {
            requirements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { 
                    type: 'string',
                    enum: ['functional', 'non-functional']
                  },
                  description: { type: 'string' },
                  priority: { 
                    type: 'string',
                    enum: ['high', 'medium', 'low']
                  }
                },
                required: ['type', 'description', 'priority']
              }
            }
          },
          required: ['requirements']
        }
      }
    }
  });

  const content = response.output_text;
  if (!content) {
    throw new Error('API 응답이 비어있습니다.');
  }

  const parsed = JSON.parse(content);
  const requirementsArray = parsed.requirements || [];
  
  return requirementsArray.map((req: any) => ({
    id: uuidv4(),
    useCaseId: useCase.id,
    type: req.type,
    description: req.description,
    priority: req.priority,
    selected: false,
  }));
}
