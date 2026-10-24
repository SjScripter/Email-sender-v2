// Core data types for SchoolReach AI

export type SchoolRecord = {
  id: string;
  // Raw data from CSV/Excel
  raw: Record<string, string>;
  // Mapped fields
  school_name: string;
  email: string;
  principal_name?: string;
  director_name?: string;
  city?: string;
  area?: string;
  board?: string;
  student_count?: string;
  annual_fee?: string;
  academic_performance?: string;
  edtech_maturity?: string;
  primary_pain?: string;
  buying_signal?: string;
  target_score?: string;
  priority?: string;
  website?: string;
  // Validation
  status: 'valid' | 'invalid_email' | 'missing_email' | 'missing_name' | 'duplicate';
  validationMessage?: string;
};

export type ColumnMapping = {
  school_name: string;
  email: string;
  principal_name: string;
  director_name: string;
  city: string;
  area: string;
  board: string;
  student_count: string;
  annual_fee: string;
  academic_performance: string;
  edtech_maturity: string;
  primary_pain: string;
  buying_signal: string;
  target_score: string;
  priority: string;
  website: string;
};

export type PersonalizationConfidence = 'high' | 'medium' | 'low';

export type PersonalizedEmail = {
  schoolId: string;
  subject: string;
  greeting: string;
  opening: string;
  body: string;
  cta: string;
  fullHtml: string;
  confidence: PersonalizationConfidence;
  isPersonalized: boolean;
  isManuallyEdited: boolean;
  aiError?: string;
  generatedAt?: string;
};

export type EmailConfig = {
  campaignName: string;
  senderName: string;
  replyTo: string;
  subject: string;
  body: string;
  aiPersonalization: boolean;
};

export type PromotionalMaterial = {
  type: 'none' | 'image' | 'pdf' | 'html';
  // For image
  imageData?: string; // base64
  imageName?: string;
  imageDisplayMode?: 'inline' | 'attachment';
  // For PDF
  pdfData?: string; // base64
  pdfName?: string;
  // For HTML
  html?: string;
};

export type SendingResult = {
  schoolId: string;
  school_name: string;
  email: string;
  principal_name?: string;
  target_score?: string;
  priority?: string;
  subject: string;
  personalization_confidence: PersonalizationConfidence;
  status: 'sent' | 'failed' | 'skipped' | 'demo';
  messageId?: string;
  error?: string;
  sentAt?: string;
};

export type BatchSendRequest = {
  schools: Array<{
    school: SchoolRecord;
    email: PersonalizedEmail;
  }>;
  emailConfig: EmailConfig;
  promotionalMaterial: PromotionalMaterial;
  demoMode: boolean;
};

export type BatchSendResponse = {
  results: SendingResult[];
};

export type PersonalizeRequest = {
  school: SchoolRecord;
  genericSubject: string;
  genericBody: string;
  demoMode?: boolean;
};

export type PersonalizeResponse = {
  subject: string;
  greeting: string;
  opening: string;
  body: string;
  cta: string;
  confidence: PersonalizationConfidence;
  error?: string;
};

export type TestEmailRequest = {
  to: string;
  school: SchoolRecord;
  email: PersonalizedEmail;
  emailConfig: EmailConfig;
  promotionalMaterial: PromotionalMaterial;
  demoMode: boolean;
};

export type WorkflowStep =
  | 'upload'
  | 'map'
  | 'select'
  | 'compose'
  | 'personalize'
  | 'preview'
  | 'send'
  | 'results';

export type AppState = {
  step: WorkflowStep;
  demoMode: boolean;
  // Upload
  rawHeaders: string[];
  rawRows: Record<string, string>[];
  fileName: string;
  // Mapping
  columnMapping: Partial<ColumnMapping>;
  // Schools
  schools: SchoolRecord[];
  selectedSchoolIds: Set<string>;
  // Email
  emailConfig: EmailConfig;
  promotionalMaterial: PromotionalMaterial;
  // Personalized emails
  personalizedEmails: Map<string, PersonalizedEmail>;
  // Results
  sendingResults: SendingResult[];
  isSending: boolean;
  sendingStopped: boolean;
};
