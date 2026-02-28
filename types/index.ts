export interface Actor {
  name: string;
  description: string;
}

export interface Step {
  order: number;
  actor: string;
  target?: string;
  action: string;
  result?: string;
}

export interface UseCase {
  id: string;
  title: string;
  description: string;
  assumptions: string[];
  actors: Actor[];
  flow: Step[];
  d2Diagram: string;
  requirements: Requirement[];
  createdAt: Date;
}

export interface Requirement {
  id: string;
  useCaseId: string;
  type: 'functional' | 'non-functional';
  description: string;
  priority: 'high' | 'medium' | 'low';
  selected: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
