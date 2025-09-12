import { z } from 'zod';

// ARIA v4 Types
export const ARIARole = z.enum([
  'ScrumMaster',
  'Architect', 
  'Developer',
  'DevOpsEngineer',
  'UXDesigner',
  'Tester',
  'SecurityEngineer',
  'PM'
]);

export const ARIAState = z.enum([
  'S0', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'BLOCKED'
]);

export const TShirtSize = z.enum(['XS', 'S', 'M', 'L', 'XL']);
export const WorkflowPath = z.enum(['shallow', 'deep']);
export const RequestType = z.enum(['new', 'enhancement', 'bugfix', 'review', 'question']);

export const ARIAControlBlock = z.object({
  role: ARIARole,
  state: ARIAState,
  request_type: RequestType,
  tshirt_size: TShirtSize,
  workflow_path: WorkflowPath,
  story_id: z.string(),
  current_step: z.string(),
  next_role: ARIARole.nullable(),
  active_roles: z.array(ARIARole),
  blockers: z.array(z.string()),
  quality_gates_passed: z.boolean(),
  todo_ledger_version: z.number(),
  pm_docs_required: z.array(z.string())
});

export const TodoItem = z.object({
  id: z.number(),
  title: z.string(),
  size: TShirtSize,
  role: ARIARole,
  state: ARIAState,
  status: z.enum(['Pending', 'InProgress', 'Completed', 'Blocked']),
  owner: ARIARole,
  due: z.string(),
  dependencies: z.array(z.string()),
  docs_required: z.array(z.string())
});

export const ARIASession = z.object({
  id: z.string(),
  useCaseId: z.string(),
  currentRole: ARIARole,
  state: ARIAState,
  tshirtSize: TShirtSize,
  workflowPath: WorkflowPath,
  roleOutputs: z.record(z.any()),
  todoLedger: z.array(TodoItem),
  startedAt: z.date(),
  completedAt: z.date().optional()
});

// Solution Play Types
export const UseCaseCategory = z.enum([
  'content-generation',
  'process-automation', 
  'personalization'
]);

export const UseCasePriority = z.enum(['high', 'medium', 'low']);

export const ProcessingStatus = z.enum([
  'uploaded',
  'processing', 
  'completed',
  'failed'
]);

export const SolutionPlayDocument = z.object({
  id: z.string(),
  filename: z.string(),
  uploadedAt: z.date(),
  processingStatus: ProcessingStatus,
  extractedUseCases: z.array(z.string()), // Use case IDs
  originalContent: z.string(),
  metadata: z.object({
    pageCount: z.number(),
    language: z.string(),
    industry: z.array(z.string()),
    confidence: z.number()
  })
});

export const UseCase = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: UseCaseCategory,
  subcategory: z.string(),
  priority: UseCasePriority,
  complexity: TShirtSize,
  extractionConfidence: z.number(),
  requirements: z.array(z.string()),
  technicalSpecs: z.any(),
  businessValue: z.string(),
  demoScenario: z.string()
});

// Demo Types
export const GenerationStatus = z.enum([
  'queued',
  'generating',
  'completed', 
  'failed'
]);

export const DemoComponent = z.object({
  id: z.string(),
  type: z.enum(['form', 'chart', 'table', 'document', 'video', 'interactive']),
  title: z.string(),
  content: z.any(),
  metadata: z.record(z.any())
});

export const DemoAnalytics = z.object({
  views: z.number(),
  uniqueUsers: z.number(),
  avgSessionDuration: z.number(),
  interactions: z.record(z.number()),
  conversionRate: z.number().optional()
});

export const DemoCustomization = z.object({
  branding: z.object({
    primaryColor: z.string(),
    secondaryColor: z.string(),
    logo: z.string().optional(),
    companyName: z.string()
  }),
  content: z.object({
    customIntro: z.string().optional(),
    customOutro: z.string().optional(),
    contactInfo: z.string().optional()
  }),
  features: z.object({
    enableAnalytics: z.boolean(),
    enableExport: z.boolean(),
    enableSharing: z.boolean()
  })
});

export const GeneratedDemo = z.object({
  id: z.string(),
  useCaseId: z.string(),
  title: z.string(),
  description: z.string(),
  demoUrl: z.string(),
  ariaSessionId: z.string(),
  generationStatus: GenerationStatus,
  components: z.array(DemoComponent),
  analytics: DemoAnalytics,
  customizations: DemoCustomization,
  createdAt: z.date()
});

// API Response Types
export const APIResponse = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  error: z.string().optional(),
  timestamp: z.date()
});

export const PaginatedResponse = z.object({
  items: z.array(z.any()),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  hasMore: z.boolean()
});

// Export type definitions
export type ARIARole = z.infer<typeof ARIARole>;
export type ARIAState = z.infer<typeof ARIAState>;
export type TShirtSize = z.infer<typeof TShirtSize>;
export type WorkflowPath = z.infer<typeof WorkflowPath>;
export type RequestType = z.infer<typeof RequestType>;
export type ARIAControlBlock = z.infer<typeof ARIAControlBlock>;
export type TodoItem = z.infer<typeof TodoItem>;
export type ARIASession = z.infer<typeof ARIASession>;
export type UseCaseCategory = z.infer<typeof UseCaseCategory>;
export type UseCasePriority = z.infer<typeof UseCasePriority>;
export type ProcessingStatus = z.infer<typeof ProcessingStatus>;
export type SolutionPlayDocument = z.infer<typeof SolutionPlayDocument>;
export type UseCase = z.infer<typeof UseCase>;
export type GenerationStatus = z.infer<typeof GenerationStatus>;
export type DemoComponent = z.infer<typeof DemoComponent>;
export type DemoAnalytics = z.infer<typeof DemoAnalytics>;
export type DemoCustomization = z.infer<typeof DemoCustomization>;
export type GeneratedDemo = z.infer<typeof GeneratedDemo>;
export type APIResponse = z.infer<typeof APIResponse>;
export type PaginatedResponse = z.infer<typeof PaginatedResponse>;