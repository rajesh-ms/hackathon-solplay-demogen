/**
 * Application constants for SolPlay DemoGen
 */

// ARIA v4 Configuration
export const ARIA_CONFIG = {
  MAX_CONCURRENT_SESSIONS: 10,
  SESSION_TIMEOUT_MS: 3600000, // 1 hour
  WORKFLOW_TIMEOUT_MS: 1800000, // 30 minutes
  ROLE_TRANSITION_DELAY_MS: 1000,
  QUALITY_GATE_TIMEOUT_MS: 300000 // 5 minutes
} as const;

// File Processing Limits
export const FILE_LIMITS = {
  MAX_PDF_SIZE_MB: 50,
  MAX_PAGES: 100,
  SUPPORTED_FORMATS: ['pdf', 'docx', 'pptx'],
  MAX_CONCURRENT_UPLOADS: 5
} as const;

// Demo Generation Configuration
export const DEMO_CONFIG = {
  GENERATION_TIMEOUT_MS: 300000, // 5 minutes
  MAX_DEMO_SIZE_MB: 100,
  RETENTION_DAYS: 30,
  MAX_COMPONENTS_PER_DEMO: 20,
  SUPPORTED_EXPORT_FORMATS: ['pdf', 'pptx', 'html', 'json']
} as const;

// API Configuration
export const API_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  RATE_LIMIT_REQUESTS_PER_MINUTE: 100,
  REQUEST_TIMEOUT_MS: 30000,
  MAX_RETRIES: 3
} as const;

// Use Case Categories and Subcategories
export const USE_CASE_CATEGORIES = {
  'content-generation': {
    label: 'Content Generation',
    subcategories: [
      'document-generation',
      'marketing-content',
      'rfp-response',
      'sales-materials',
      'image-generation',
      'video-content'
    ]
  },
  'process-automation': {
    label: 'Process Automation',
    subcategories: [
      'loan-underwriting',
      'kyc-processing',
      'compliance-checks',
      'document-classification',
      'workflow-automation',
      'intelligent-routing'
    ]
  },
  'personalization': {
    label: 'Personalized Experience',
    subcategories: [
      'customer-profiling',
      'product-recommendations',
      'risk-assessment',
      'investment-advice',
      'personalized-offers',
      'behavioral-analysis'
    ]
  }
} as const;

// Financial Services Industry Specific
export const FINANCIAL_SERVICES = {
  INDUSTRIES: [
    'banking',
    'insurance',
    'investment-management',
    'capital-markets',
    'wealth-management',
    'fintech',
    'credit-union',
    'mortgage-lending'
  ],
  COMPLIANCE_FRAMEWORKS: [
    'SOX',
    'GDPR',
    'PCI-DSS',
    'FFIEC',
    'MiFID-II',
    'BASEL-III',
    'CCAR',
    'DODD-FRANK'
  ],
  DOCUMENT_TYPES: [
    'loan-applications',
    'kyc-documents',
    'financial-statements',
    'compliance-reports',
    'risk-assessments',
    'audit-reports',
    'regulatory-filings',
    'customer-agreements'
  ]
} as const;

// UI/UX Constants
export const UI_CONFIG = {
  DEBOUNCE_SEARCH_MS: 300,
  ANIMATION_DURATION_MS: 200,
  TOAST_DURATION_MS: 5000,
  PROGRESS_UPDATE_INTERVAL_MS: 1000,
  AUTO_SAVE_INTERVAL_MS: 30000
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds the maximum limit',
  UNSUPPORTED_FORMAT: 'File format is not supported',
  PROCESSING_FAILED: 'Failed to process the document',
  NETWORK_ERROR: 'Network connection error',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Invalid input data',
  ARIA_SESSION_TIMEOUT: 'ARIA processing session timed out',
  DEMO_GENERATION_FAILED: 'Failed to generate demo'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  FILE_UPLOADED: 'File uploaded successfully',
  PROCESSING_STARTED: 'Document processing started',
  USE_CASES_EXTRACTED: 'Use cases extracted successfully',
  DEMO_GENERATED: 'Demo generated successfully',
  SETTINGS_SAVED: 'Settings saved successfully',
  ACCOUNT_CREATED: 'Account created successfully',
  PASSWORD_RESET: 'Password reset successfully'
} as const;

// Color Schemes for Demo Customization
export const COLOR_SCHEMES = {
  CORPORATE_BLUE: {
    primary: '#1E40AF',
    secondary: '#3B82F6',
    accent: '#60A5FA',
    background: '#F8FAFC'
  },
  FINANCIAL_GREEN: {
    primary: '#059669',
    secondary: '#10B981',
    accent: '#34D399',
    background: '#F0FDF4'
  },
  PROFESSIONAL_GRAY: {
    primary: '#374151',
    secondary: '#6B7280',
    accent: '#9CA3AF',
    background: '#F9FAFB'
  },
  MODERN_PURPLE: {
    primary: '#7C3AED',
    secondary: '#8B5CF6',
    accent: '#A78BFA',
    background: '#FAF5FF'
  }
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  DEMO_TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  COMPANY_NAME_MAX_LENGTH: 100
} as const;