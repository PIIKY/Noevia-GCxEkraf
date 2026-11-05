export type WorkTopicCategory =
  | 'Starting a Business'
  | 'Marketing'
  | 'Finance & Pricing'
  | 'Operations'
  | 'Customer Experience'
  | 'Business Growth'
  | 'Other Challenges';

export type BusinessCategoryOption =
  | 'Food & Beverage'
  | 'Fashion'
  | 'Beauty & Personal Care'
  | 'Creative Services'
  | 'Retail & Online Shop'
  | 'Handicraft'
  | 'Home Business'
  | 'Digital Services';

export type BusinessStageOption =
  | 'Planning'
  | 'Starting'
  | 'Already Operating';

export type ConsultationStep =
  | 'step-02-category'
  | 'step-03-challenge'
  | 'step-04-discovery'
  | 'step-05-understanding'
  | 'step-06-results';

export type ConsultationFrameworkStage =
  | '01 · Tell Your Story'
  | '02 · Understand Your Business'
  | '03 · Explore the Problem'
  | '04 · Confirm Understanding'
  | '05 · Analyze & Discover'
  | '06 · Explore Solutions'
  | '07 · Build Your Action Plan'
  | '08 · Continue Consultation';

export type ConsultationStatus =
  | 'Discovery'
  | 'Understanding Review'
  | 'Analyzed & Active'
  | 'Completed';

export type AppLanguage = 'id' | 'en';

export interface ExternalReference {
  id: string;
  title: string;
  publisher: string;
  url: string;
  updatedAt?: string;
  relevanceReason: string;
  sourceType?: 'google-search-grounding' | 'url-context' | 'official-portal';
}

export interface VideoTimestampSegment {
  time: string;
  topic: string;
}

export interface VideoResource {
  id: string;
  title: string;
  channelOrSource: string;
  url: string;
  durationLabel: string;
  topicRelevance: string;
  verifiedTimestamps?: VideoTimestampSegment[];
}

export interface VisualDiagramStep {
  label: string;
  valueOrNote: string;
  detail: string;
}

export interface VisualDiagramSpec {
  type:
    | 'sales-funnel'
    | 'pricing-breakdown'
    | 'customer-retention'
    | 'operational-workflow'
    | 'validation-roadmap';
  title: string;
  subtitle: string;
  steps: VisualDiagramStep[];
}

export interface ProblemAnalysisMatrixItem {
  possibleCause: string;
  supportingEvidence: string;
  requiredEvidence: string;
  verificationStatus:
    | 'Terverifikasi dari Data'
    | 'Indikasi Awal'
    | 'Belum Diverifikasi';
  riskIfUnaddressed: string;
  solutionDirection: string;
}

export interface DeterministicCalculatedMetric {
  key: string;
  labelId: string;
  labelEn: string;
  valueFormatted: string;
  rawValue: number;
  formula: string;
  explanationId: string;
  explanationEn: string;
}

export interface DeterministicBusinessAnalysis {
  kind: 'hpp-pricing' | 'sales-funnel' | 'inventory-cashflow';
  titleId: string;
  titleEn: string;
  isIllustrative: boolean;
  inputs: Record<string, number>;
  computedMetrics: DeterministicCalculatedMetric[];
  assumptionsId: string[];
  assumptionsEn: string[];
}

export interface ImplementationMonitoringData {
  baselineInquiriesWeekly: number;
  baselineTransactionsWeekly: number;
  currentInquiriesWeekly: number;
  currentTransactionsWeekly: number;
  obstaclesReported: string;
  implementationNotes: string;
  lastUpdatedAt?: string;
}

export interface TailoredDeliverableSection {
  heading: string;
  items: string[];
}

export type TailoredDeliverableType =
  | 'marketing-strategy-plan'
  | 'content-calendar-14d'
  | 'campaign-brief'
  | 'social-media-copywriting-pack'
  | 'pricing-hpp-calculator'
  | 'pricing-worksheet'
  | 'cash-flow-tracker'
  | 'financial-planning-worksheet'
  | 'basic-business-sop'
  | 'inventory-tracker'
  | 'workflow-documentation'
  | 'customer-retention-plan'
  | 'customer-feedback-form'
  | 'service-improvement-checklist'
  | 'business-validation-checklist'
  | 'business-model-plan'
  | 'growth-strategy-roadmap'
  | 'sales-improvement-plan';

export interface TailoredDeliverable {
  id: string;
  type: TailoredDeliverableType;
  title: string;
  subtitle: string;
  reasonSuggested: string;
  recommendedFormats?: DeliverableFormat[];
  sections: TailoredDeliverableSection[];
  tableHeaders?: string[];
  tableRows?: string[][];
}

export type DeliverableFormat = 'PDF' | 'CSV' | 'XLSX' | 'DOCX';

export interface GeneratedDocumentMeta {
  id: string;
  consultationId: string;
  ownerId?: string | null;
  kind: 'consultation-report' | 'action-plan' | 'tailored-document';
  title: string;
  fileName: string;
  format: DeliverableFormat;
  generatedAt: string;
}

export interface Message {
  id: string;
  consultationId: string;
  ownerId?: string | null;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  phase?: 'discovery' | 'continuation';
  knowledgeReferences?: KnowledgeReference[];
  externalReferences?: ExternalReference[];
  videoResources?: VideoResource[];
}

export interface BusinessOverview {
  businessName: string;
  businessCategory: string;
  businessStage: BusinessStageOption;
  workTopic: WorkTopicCategory;
  businessDescription: string;
  mainChallenge: string;
  currentStrategy: string;
  targetAudience: string;
  businessGoals: string;
  availableResources: string;
  budgetConstraints: string;
}

export interface BusinessContextData extends BusinessOverview {
  id: string;
  consultationId: string;
  confirmedFacts: string[];
  userReportedSymptoms?: string[];
  preliminaryInferences: string[];
  assumptionsToVerify?: string[];
  missingInformation: string[];
  problemSummary: string;
  previousAttempts?: string;
}

export interface PossibleCause {
  cause: string;
  confidence:
    | 'Kemungkinan penyebab'
    | 'Indikasi awal'
    | 'Perlu diperiksa lebih lanjut';
  explanation: string;
}

export interface KnowledgeReference {
  id: string;
  consultationId?: string;
  documentId: string;
  documentTitle: string;
  sectionHeading: string;
  pageNumber: number | null;
  relevantContent: string;
  relevanceReason?: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  whyItMatters: string;
  whyItFits?: string;
  steps: string[];
  expectedOutcome: string;
  requiredResources: string;
  limitationsToConsider?: string;
  howToMeasureSuccess?: string;
  effortLevel?: 'Rendah' | 'Menengah' | 'Tinggi';
  priority: 'High' | 'Medium' | 'Foundational';
  helpfulFeedback?: 'helpful' | 'needs-adjustment' | null;
}

export interface ActionPlanItem {
  day: number;
  action: string;
  objective: string;
  priority?: 'Tinggi' | 'Menengah' | 'Fondasi';
  timeline?: string;
  requiredResources?: string;
  expectedOutcome?: string;
  successMeasurement?: string;
  completed?: boolean;
}

export interface ConsultationResult {
  id: string;
  consultationId: string;
  mainProblem: string;
  problemSummary: string;
  supportingFindings: string[];
  possibleCauses: PossibleCause[];
  problemAnalysisMatrix?: ProblemAnalysisMatrixItem[];
  deterministicAnalysis?: DeterministicBusinessAnalysis;
  implementationMonitoring?: ImplementationMonitoringData;
  additionalConsiderations: string[];
  knowledgeReferences: KnowledgeReference[];
  externalReferences?: ExternalReference[];
  videoResources?: VideoResource[];
  visualDiagram?: VisualDiagramSpec;
  tailoredDeliverable?: TailoredDeliverable;
  successIndicators?: string[];
  recommendations: Recommendation[];
  actionPlan: ActionPlanItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Consultation {
  id: string;
  userId: string | null;
  title: string;
  businessName: string;
  businessCategory: string;
  businessStage: BusinessStageOption;
  workTopic: WorkTopicCategory;
  initialProblem: string;
  consultationStatus: ConsultationStatus;
  currentStep: ConsultationStep;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  businessContext: BusinessContextData;
  result: ConsultationResult | null;
  generatedDocuments?: GeneratedDocumentMeta[];
}

export type DocumentProcessingStatus =
  | 'Uploaded'
  | 'Processing'
  | 'Ready'
  | 'Failed';

export interface KnowledgeSection {
  sectionId: string;
  sectionHeading: string;
  pageNumber: number;
  content: string;
  keywords: string[];
}

export interface KnowledgeDocument {
  id: string;
  documentName: string;
  description: string;
  category: string;
  source: string;
  fileType: 'PDF' | 'CSV';
  storagePath: string;
  processingStatus: DocumentProcessingStatus;
  mainTopics: string[];
  sections: KnowledgeSection[];
  createdAt: string;
  updatedAt: string;
}
