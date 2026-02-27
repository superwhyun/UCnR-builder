'use client';

import OpenAI from 'openai';
import { Settings } from './settings';
import { UseCase, Requirement } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Generate mermaid diagram from use case flow
export function generateMermaidDiagram(useCase: UseCase): string {
  const MAX_ACTION_LENGTH = 24;
  const MAX_INFO_LENGTH = 34;
  const MAX_INFO_PARAMS = 3;

  const escapeLabel = (value: string): string =>
    value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ').trim();
  const normalizeText = (value: string): string =>
    value.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
  const clamp = (value: string, max: number): string => {
    if (value.length <= max) return value;
    return `${value.slice(0, max - 1).trim()}…`;
  };
  const ACTION_RULES: Array<{ regex: RegExp; label: string }> = [
    { regex: /(로그인|접속|인증|auth|login)/i, label: 'AuthenticateEndpoint' },
    { regex: /(권한|인가|authorize|permission)/i, label: 'AuthorizeAccessRequest' },
    { regex: /(역량|능력|capability|협상|negotiat)/i, label: 'NegotiateCapability' },
    { regex: /(토큰|세션|issue token|session)/i, label: 'IssueSessionToken' },
    { regex: /(정책|policy|rule)/i, label: 'ValidatePolicyRule' },
    { regex: /(등록|register|digital twin)/i, label: 'RegisterDigitalTwin' },
    { regex: /(수집|collect|telemetry)/i, label: 'CollectTelemetrySample' },
    { regex: /(상태|state|correlat)/i, label: 'CorrelateSensorState' },
    { regex: /(시나리오|scenario|학습|training)/i, label: 'GenerateTrainingScenario' },
    { regex: /(배포|publish|update policy)/i, label: 'PublishPolicyUpdate' },
    { regex: /(조회|retrieve|snapshot)/i, label: 'RetrieveTwinState' },
    { regex: /(서명|sign)/i, label: 'SignControlMessage' },
    { regex: /(검증|verify signature|signature)/i, label: 'VerifySignature' },
    { regex: /(암호|encrypt)/i, label: 'EncryptPayload' },
    { regex: /(복호|decrypt)/i, label: 'DecryptPayload' },
    { regex: /(요청|route|forward)/i, label: 'RouteServiceRequest' },
    { regex: /(동기화|sync|state vector)/i, label: 'SynchronizeStateVector' },
    { regex: /(이상|anomaly|detect)/i, label: 'DetectAnomalyEvent' },
    { regex: /(알림|경보|alert|notify)/i, label: 'TriggerSafetyAlert' },
    { regex: /(결과|validation result|return)/i, label: 'ReturnValidationResult' },
  ];
  const INFO_RULES: Array<{ regex: RegExp; label: string }> = [
    { regex: /(역량|능력|capability)/i, label: 'CapabilitySet' },
    { regex: /(토큰|token)/i, label: 'SessionToken' },
    { regex: /(사용자.?id|user.?id|계정.?id)/i, label: 'UserId' },
    { regex: /(장치.?id|device.?id|단말.?id)/i, label: 'DeviceId' },
    { regex: /(트윈.?id|twin.?id)/i, label: 'TwinId' },
    { regex: /(세션.?id|session.?id)/i, label: 'SessionId' },
    { regex: /(정책|policy|rule)/i, label: 'PolicyRule' },
    { regex: /(자격증명|credential|password|otp)/i, label: 'EndpointCredential' },
    { regex: /(접근요청|access request|authorization request)/i, label: 'AccessRequest' },
    { regex: /(트윈 등록|twin registration)/i, label: 'TwinRegistration' },
    { regex: /(텔레메트리|telemetry)/i, label: 'TelemetrySample' },
    { regex: /(상태벡터|state vector|sensor state)/i, label: 'SensorStateVector' },
    { regex: /(센서|sensor)/i, label: 'SensorData' },
    { regex: /(위치|position|location)/i, label: 'PositionData' },
    { regex: /(속도|velocity|speed)/i, label: 'VelocityData' },
    { regex: /(가속도|acceleration)/i, label: 'AccelerationData' },
    { regex: /(시나리오|scenario|training spec)/i, label: 'TrainingScenarioSpec' },
    { regex: /(정책 업데이트|policy update)/i, label: 'PolicyUpdateNotice' },
    { regex: /(스냅샷|snapshot|twin state)/i, label: 'TwinStateSnapshot' },
    { regex: /(서명 메시지|signed control)/i, label: 'SignedControlMessage' },
    { regex: /(서명검증|signature proof|verify)/i, label: 'SignatureProof' },
    { regex: /(암호문|encrypted)/i, label: 'EncryptedPayload' },
    { regex: /(복호문|decrypted)/i, label: 'DecryptedPayload' },
    { regex: /(서비스 요청|service request)/i, label: 'ServiceRequest' },
    { regex: /(동기화 상태|state vector)/i, label: 'StateVector' },
    { regex: /(이상 이벤트|anomaly)/i, label: 'AnomalyEvent' },
    { regex: /(안전 경보|safety alert|alert)/i, label: 'SafetyAlert' },
    { regex: /(검증 결과|validation result|result)/i, label: 'ValidationResult' },
    { regex: /(임계값|threshold)/i, label: 'ThresholdConfig' },
    { regex: /(모델|model)/i, label: 'ModelArtifact' },
    { regex: /(학습 데이터|training data|dataset)/i, label: 'TrainingDataset' },
    { regex: /(감사 로그|audit log)/i, label: 'AuditLogEntry' },
  ];

  const ACTION_DEFAULT_PARAMS: Record<string, string[]> = {
    AuthenticateEndpoint: ['EndpointCredential', 'SessionToken'],
    AuthorizeAccessRequest: ['AccessRequest', 'PolicyRule'],
    NegotiateCapability: ['CapabilitySet', 'PolicyRule'],
    IssueSessionToken: ['SessionToken', 'SessionId'],
    ValidatePolicyRule: ['PolicyRule', 'ValidationResult'],
    RegisterDigitalTwin: ['TwinRegistration', 'TwinId'],
    CollectTelemetrySample: ['TelemetrySample', 'SensorData'],
    CorrelateSensorState: ['SensorStateVector', 'TwinStateSnapshot'],
    GenerateTrainingScenario: ['TrainingScenarioSpec', 'TrainingDataset'],
    PublishPolicyUpdate: ['PolicyUpdateNotice', 'PolicyRule'],
    RetrieveTwinState: ['TwinId', 'TwinStateSnapshot'],
    SignControlMessage: ['SignedControlMessage', 'SignatureProof'],
    VerifySignature: ['SignatureProof', 'ValidationResult'],
    EncryptPayload: ['EncryptedPayload', 'ServiceRequest'],
    DecryptPayload: ['DecryptedPayload', 'ServiceRequest'],
    RouteServiceRequest: ['ServiceRequest', 'PolicyRule'],
    SynchronizeStateVector: ['StateVector', 'SensorStateVector'],
    DetectAnomalyEvent: ['AnomalyEvent', 'TelemetrySample'],
    TriggerSafetyAlert: ['SafetyAlert', 'AnomalyEvent'],
    ReturnValidationResult: ['ValidationResult', 'AuditLogEntry'],
  };

  const matchLabel = (value: string, rules: Array<{ regex: RegExp; label: string }>, fallback: string): string => {
    const matched = rules.find((rule) => rule.regex.test(value));
    return matched?.label ?? fallback;
  };

  const mapAction = (value: string, isResult: boolean): string =>
    matchLabel(value, ACTION_RULES, isResult ? 'ReturnValidationResult' : 'RouteServiceRequest');
  const extractExplicitParams = (value: string): string[] => {
    const params: string[] = [];
    const quoted = [...value.matchAll(/["'`][^"'`]{2,}["'`]/g)].map((m) => m[0].slice(1, -1));
    const ids = [...value.matchAll(/\b[A-Za-z][A-Za-z0-9]*(Id|ID|Token|Rule|Policy|Vector|Dataset|Snapshot)\b/g)].map((m) => m[0]);
    params.push(...quoted, ...ids);
    return params
      .map((s) => s.replace(/[^A-Za-z0-9\s_-]/g, ' ').trim())
      .filter(Boolean)
      .map((s) => s.split(/\s+/).map((w) => w[0].toUpperCase() + w.slice(1)).join(''));
  };
  const mapInformationList = (value: string, isResult: boolean, actionLabel: string): string[] => {
    const keywordMatches = INFO_RULES.filter((rule) => rule.regex.test(value)).map((rule) => rule.label);
    const explicitParams = extractExplicitParams(value);
    const actionDefaults = ACTION_DEFAULT_PARAMS[actionLabel] || (isResult ? ['ValidationResult'] : ['ServiceRequest']);
    const unique = [...new Set([...keywordMatches, ...explicitParams, ...actionDefaults])];
    return unique.slice(0, MAX_INFO_PARAMS);
  };

  const formatActionInfo = (value: string, stepOrder: number, isResult: boolean, fallbackContext: string): string => {
    const normalized = normalizeText(value);
    if (!normalized) {
      const fallbackAction = isResult ? 'ReturnValidationResult' : 'RouteServiceRequest';
      return `${stepOrder}. ${fallbackAction}:${fallbackContext}`;
    }

    if (normalized.includes(':')) {
      const [rawAction, rawInfo] = normalized.split(':');
      const action = clamp(mapAction(rawAction, isResult), MAX_ACTION_LENGTH);
      const infoList = mapInformationList(`${rawInfo} ${fallbackContext}`, isResult, action);
      const info = clamp(infoList.join(','), MAX_INFO_LENGTH);
      return `${stepOrder}. ${action}:${info}`;
    }

    const action = mapAction(normalized, isResult);
    const infoList = mapInformationList(`${normalized} ${fallbackContext}`, isResult, action);
    return `${stepOrder}. ${clamp(action, MAX_ACTION_LENGTH)}:${clamp(infoList.join(','), MAX_INFO_LENGTH)}`;
  };

  const participants = [...new Set(useCase.flow.flatMap((step) => [step.actor, step.target].filter(Boolean) as string[]))];
  const participantIdMap = new Map<string, string>();

  participants.forEach((participant, index) => {
    participantIdMap.set(participant, `participant_${index + 1}`);
  });

  const actorDefs = participants
    .map((participant) => `    participant ${participantIdMap.get(participant)} as "${escapeLabel(participant)}"`)
    .join('\n');

  const sequence = useCase.flow
    .map((step) => {
      const sourceId = participantIdMap.get(step.actor) ?? 'participant_1';
      const fallbackTarget = participants.find((participant) => participant !== step.actor) ?? step.actor;
      const targetName = step.target?.trim() || fallbackTarget;
      const targetId = participantIdMap.get(targetName) ?? sourceId;
      const contextInfo = useCase.title.replace(/[^A-Za-z0-9]/g, '').slice(0, 20) || 'ServiceContext';
      const lines = [`    ${sourceId}->>${targetId}: ${formatActionInfo(step.action, step.order, false, contextInfo)}`];
      if (step.result) {
        lines.push(`    ${targetId}-->>${sourceId}: ${formatActionInfo(step.result, step.order, true, contextInfo)}`);
      }
      return lines.join('\n');
    })
    .join('\n');

  return `sequenceDiagram
    autonumber
${actorDefs}
${sequence}`;
}

// Create OpenAI client
function createOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}

function mergeSystemPrompts(basePrompt: string, customPrompt: string): string {
  const trimmed = customPrompt.trim();
  if (!trimmed) return basePrompt;
  return `${trimmed}\n\n${basePrompt}`;
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
    {"order": 1, "actor": "액터명", "target": "대상 주체", "action": "수행 동작", "result": "결과 (선택사항)"},
    {"order": 2, "actor": "액터명", "target": "대상 주체", "action": "수행 동작", "result": "결과 (선택사항)"}
  ]
}

flow 배열은 반드시 3-8단계의 실제적인 동작 흐름을 포함해야 합니다.
각 step의 target에는 actor가 상호작용하는 실제 대상 주체(다른 actor 또는 구체 컴포넌트)를 명시하세요.
추상적인 "System" 같은 일반명은 target으로 사용하지 마세요.
action은 유즈케이스 문맥에 맞는 설명 문장(한국어 1문장)으로 작성하세요.
result는 해당 step의 결과를 설명하는 문장(한국어 1문장)으로 작성하세요.
action/result 문장은 반드시 명시적 주어(예: 사용자, 운영자, 게이트웨이, 정책 엔진 등)로 시작하세요.
action/result에 "Action:Information" 같은 축약 표기, 키-값 표기, 콤마 나열만 있는 표현은 사용하지 마세요.
문장 안에 필요한 파라미터/데이터 식별자는 자연어로 포함해도 됩니다.`;

  const response = await openai.responses.create({
    model: settings.model,
    instructions: mergeSystemPrompts(systemPrompt, settings.useCaseSystemPrompt),
    input: prompt,
    text: {
      format: {
        type: 'json_schema',
        name: 'usecase_schema',
        strict: true,
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
                  target: { type: 'string' },
                  action: { type: 'string' },
                  result: { type: ['string', 'null'] }
                },
                required: ['order', 'actor', 'target', 'action', 'result'],
                additionalProperties: false
              }
            }
          },
          required: ['title', 'description', 'actors', 'flow'],
          additionalProperties: false
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

문체 규칙(반드시 준수):
- mandatory(필수, priority=high): description은 반드시 "It is required that "로 시작
- strong optional(권고, priority=medium): description은 반드시 "It is recommended that "로 시작
- optional(선택, priority=low): description은 반드시 "It optionally can "로 시작

우선순위 매핑 규칙(반드시 준수):
- mandatory -> high
- strong optional -> medium
- optional -> low

작성 규칙(반드시 준수):
- 추상 주어(예: "the system", "system")를 사용하지 말고, actor 또는 구체 컴포넌트명을 주어로 사용

최소 3개, 최대 8개의 요구사항을 생성하세요.`;

  const response = await openai.responses.create({
    model: settings.model,
    instructions: mergeSystemPrompts(systemPrompt, settings.requirementsSystemPrompt),
    input: prompt,
    text: {
      format: {
        type: 'json_schema',
        name: 'requirements_schema',
        strict: true,
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
                required: ['type', 'description', 'priority'],
                additionalProperties: false
              }
            }
          },
          required: ['requirements'],
          additionalProperties: false
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
