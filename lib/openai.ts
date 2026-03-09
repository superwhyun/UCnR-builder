'use client';

import OpenAI from 'openai';
import { Settings } from './settings';
import { UseCase, Requirement } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import {
  DEFAULT_REQUIREMENTS_SYSTEM_PROMPT,
  DEFAULT_SEQUENCE_SYSTEM_PROMPT,
  DEFAULT_USECASE_SYSTEM_PROMPT,
} from './default-system-prompts';

// Generate D2 diagram from use case flow
export function generateD2Diagram(useCase: UseCase): string {
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

  const formatActionInfo = (value: string, isResult: boolean, fallbackContext: string): string => {
    const normalized = normalizeText(value);
    if (!normalized) {
      const fallbackAction = isResult ? 'ReturnValidationResult' : 'RouteServiceRequest';
      return `${fallbackAction}:${fallbackContext}`;
    }

    if (normalized.includes(':')) {
      const [rawAction, rawInfo] = normalized.split(':');
      const action = clamp(mapAction(rawAction, isResult), MAX_ACTION_LENGTH);
      const infoList = mapInformationList(`${rawInfo} ${fallbackContext}`, isResult, action);
      const info = clamp(infoList.join(','), MAX_INFO_LENGTH);
      return `${action}:${info}`;
    }

    const action = mapAction(normalized, isResult);
    const infoList = mapInformationList(`${normalized} ${fallbackContext}`, isResult, action);
    return `${clamp(action, MAX_ACTION_LENGTH)}:${clamp(infoList.join(','), MAX_INFO_LENGTH)}`;
  };
  const formatParticipant = (value: string) => `"${escapeLabel(value)}"`;
  const participants = [...new Set(useCase.flow.flatMap((flowStep) => [flowStep.actor, flowStep.target].filter(Boolean) as string[]))];

  const sequence = useCase.flow
    .map((step) => {
      const fallbackTarget = participants.find((participant) => participant !== step.actor) ?? step.actor;
      const targetName = step.target?.trim() || fallbackTarget;
      const contextInfo = useCase.title.replace(/[^A-Za-z0-9]/g, '').slice(0, 20) || 'ServiceContext';
      const lines = [
        `${formatParticipant(step.actor)} -> ${formatParticipant(targetName)}: "${escapeLabel(
          formatActionInfo(step.action, false, contextInfo)
        )}"`,
      ];
      if (step.result) {
        lines.push(
          `${formatParticipant(targetName)} -> ${formatParticipant(step.actor)}: "${escapeLabel(
            formatActionInfo(step.result, true, contextInfo)
          )}"`
        );
      }
      return lines.join('\n');
    })
    .join('\n');

  return `shape: sequence_diagram
${sequence}`;
}

// Create OpenAI client
function createOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}

function resolveSystemPrompt(customPrompt: string, defaultPrompt: string): string {
  const trimmed = customPrompt.trim();
  return trimmed || defaultPrompt;
}

function normalizeActors(actors: any[]): Array<{ name: string; description: string }> {
  const names = new Set<string>();
  const normalized: Array<{ name: string; description: string }> = [];

  (actors || []).forEach((actor) => {
    const rawName = typeof actor?.name === 'string' ? actor.name : '';
    const name = rawName.trim();
    if (!name || names.has(name)) return;
    names.add(name);
    normalized.push({
      name,
      description: (typeof actor?.description === 'string' ? actor.description : '').trim() || '역할 설명 없음',
    });
  });

  return normalized;
}

function normalizeFlowToActors(
  flow: any[],
  actors: Array<{ name: string; description: string }>
) {
  const actorNames = actors.map((actor) => actor.name);
  const actorNameSet = new Set(actorNames);

  if (actorNames.length === 0) return [];

  const pickFallbackTarget = (actor: string) => actorNames.find((name) => name !== actor) ?? actor;

  return (flow || []).map((step, index) => {
    const rawActor = typeof step?.actor === 'string' ? step.actor.trim() : '';
    const actor = actorNameSet.has(rawActor) ? rawActor : actorNames[0];

    const rawTarget = typeof step?.target === 'string' ? step.target.trim() : '';
    const target = actorNameSet.has(rawTarget) ? rawTarget : pickFallbackTarget(actor);

    return {
      order: Number.isFinite(Number(step?.order)) ? Number(step.order) : index + 1,
      actor,
      target,
      action: (typeof step?.action === 'string' ? step.action : '').trim() || `${actor}가 ${target}와 상호작용한다.`,
      result: typeof step?.result === 'string' ? step.result.trim() || null : null,
    };
  });
}

function buildUseCaseSchema() {
  return {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      assumptions: {
        type: 'array',
        items: { type: 'string' }
      },
      actors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' }
          },
          required: ['name', 'description'],
          additionalProperties: false
        }
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
    required: ['title', 'description', 'assumptions', 'actors', 'flow'],
    additionalProperties: false
  };
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

  const response = await openai.responses.create({
    model: settings.model,
    instructions: resolveSystemPrompt(settings.useCaseSystemPrompt, DEFAULT_USECASE_SYSTEM_PROMPT),
    input: prompt,
    text: {
      format: {
        type: 'json_schema',
        name: 'usecase_schema',
        strict: true,
        schema: buildUseCaseSchema()
      }
    }
  });

  const content = response.output_text;
  if (!content) {
    throw new Error('API 응답이 비어있습니다.');
  }

  const parsed = JSON.parse(content);

  const actors = normalizeActors(parsed.actors || []);
  const flow = normalizeFlowToActors(parsed.flow, actors);

  const useCase: UseCase = {
    id: uuidv4(),
    title: parsed.title,
    description: parsed.description,
    assumptions: parsed.assumptions || [],
    actors,
    flow,
    d2Diagram: '',
    requirements: [],
    createdAt: new Date(),
  };

  return useCase;
}

export async function reviseUseCaseFromPrompt(
  useCase: UseCase,
  prompt: string,
  editableClauses: {
    description: boolean;
    assumptions: boolean;
    actors: boolean;
    useCase: boolean;
  },
  settings: Settings
): Promise<Pick<UseCase, 'title' | 'description' | 'assumptions' | 'actors' | 'flow'>> {
  if (!settings.openaiApiKey) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다.');
  }

  const openai = createOpenAIClient(settings.openaiApiKey);

  const response = await openai.responses.create({
    model: settings.model,
    instructions: resolveSystemPrompt(settings.useCaseSystemPrompt, DEFAULT_USECASE_SYSTEM_PROMPT),
    input: `기존 유즈케이스:
제목: ${useCase.title}
설명: ${useCase.description}
가정: ${useCase.assumptions.join('; ')}
액터: ${useCase.actors.map((a) => `${a.name}(${a.description})`).join(', ')}
흐름: ${JSON.stringify(useCase.flow)}

절별 수정 권한:
- Description 수정 가능: ${editableClauses.description}
- Assumption 수정 가능: ${editableClauses.assumptions}
- Actors 수정 가능: ${editableClauses.actors}
- Use Case(Flow) 수정 가능: ${editableClauses.useCase}
- 수정 불가(false)인 절은 현재 값을 유지하고, 문맥 참고용으로만 사용

사용자 수정 요청:
${prompt}`,
    text: {
      format: {
        type: 'json_schema',
        name: 'usecase_revision_schema',
        strict: true,
        schema: buildUseCaseSchema()
      }
    }
  });

  const content = response.output_text;
  if (!content) throw new Error('API 응답이 비어있습니다.');
  const parsed = JSON.parse(content);

  const actors = normalizeActors(parsed.actors || []);
  const flow = normalizeFlowToActors(parsed.flow, actors);

  return {
    title: parsed.title,
    description: parsed.description,
    assumptions: parsed.assumptions,
    actors,
    flow,
  };
}

export async function generateSequenceDiagramFromPrompt(
  useCase: UseCase,
  prompt: string,
  settings: Settings
): Promise<string> {
  if (!settings.openaiApiKey) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다.');
  }

  const openai = createOpenAIClient(settings.openaiApiKey);

  const response = await openai.responses.create({
    model: settings.model,
    instructions: resolveSystemPrompt(settings.sequenceSystemPrompt, DEFAULT_SEQUENCE_SYSTEM_PROMPT),
    input: `Use case title: ${useCase.title}
Description: ${useCase.description}
Assumptions: ${useCase.assumptions.join('; ')}
Actors: ${useCase.actors.map((a) => `${a.name}(${a.description})`).join(', ')}
Flow: ${JSON.stringify(useCase.flow)}
Additional sequence request: ${prompt || 'none'}`,
    text: {
      format: {
        type: 'json_schema',
        name: 'sequence_schema',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            d2Diagram: { type: 'string' }
          },
          required: ['d2Diagram'],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.output_text;
  if (!content) throw new Error('API 응답이 비어있습니다.');
  const parsed = JSON.parse(content);
  return parsed.d2Diagram;
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

  const requirementsContext = `Use case title: ${useCase.title}
Description: ${useCase.description}
Assumptions: ${useCase.assumptions.join('; ')}
Actors: ${useCase.actors.map((a) => `${a.name}(${a.description})`).join(', ')}
Flow: ${JSON.stringify(useCase.flow)}
User request: ${prompt}`;

  const schema = {
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
  };

  const fetchRequirements = async (extraInput = '') => {
    const response = await openai.responses.create({
      model: settings.model,
      instructions: resolveSystemPrompt(settings.requirementsSystemPrompt, DEFAULT_REQUIREMENTS_SYSTEM_PROMPT),
      input: extraInput ? `${requirementsContext}\n\n${extraInput}` : requirementsContext,
      text: {
        format: {
          type: 'json_schema',
          name: 'requirements_schema',
          strict: true,
          schema
        }
      }
    });

    const content = response.output_text;
    if (!content) {
      throw new Error('API 응답이 비어있습니다.');
    }
    const parsed = JSON.parse(content);
    return parsed.requirements || [];
  };

  const hasBannedWords = (description: string): boolean => /\b(shall|should|may)\b/i.test(description);

  let requirementsArray = await fetchRequirements();
  if (requirementsArray.some((req: any) => hasBannedWords(req.description || ''))) {
    requirementsArray = await fetchRequirements(
      '중요: 방금 출력에 금지어가 포함되었습니다. description에서 shall, should, may를 절대 사용하지 마세요.'
    );
  }
  if (requirementsArray.some((req: any) => hasBannedWords(req.description || ''))) {
    throw new Error('요구사항 생성 결과에 금지어(shall/should/may)가 포함되어 생성이 중단되었습니다. 다시 시도해주세요.');
  }

  const normalizeRequirementDescription = (description: string, priority: 'high' | 'medium' | 'low'): string => {
    const prefixByPriority: Record<'high' | 'medium' | 'low', string> = {
      high: 'It is required that ',
      medium: 'It is recommended that ',
      low: 'It optionally can ',
    };
    const targetPrefix = prefixByPriority[priority];
    const cleaned = (description || '')
      .replace(/^(It is required that|It is recommended that|It optionally can)\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    return `${targetPrefix}${cleaned || 'the actor performs the required operation.'}`;
  };

  return requirementsArray.map((req: any) => ({
    id: uuidv4(),
    useCaseId: useCase.id,
    type: req.type,
    description: normalizeRequirementDescription(req.description, req.priority),
    priority: req.priority,
    selected: false,
  }));
}
