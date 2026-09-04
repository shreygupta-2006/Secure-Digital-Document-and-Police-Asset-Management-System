export type UserRole = 'ADMIN' | 'OFFICER' | 'STORE_KEEPER' | 'AUDITOR' | 'VIEWER';

export type AssetStatus = 'REGISTERED' | 'AVAILABLE' | 'ASSIGNED' | 'IN_MAINTENANCE' | 'RETIRED' | 'LOST' | 'DAMAGED';

export type AssetCondition = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';

export type AssetCategory =
  | 'FIREARM'
  | 'VEHICLE'
  | 'COMMUNICATION'
  | 'TACTICAL'
  | 'ELECTRONICS'
  | 'UNIFORM'
  | 'EVIDENCE_TECH'
  | 'OTHER';

export type DocumentType =
  | 'FIR'
  | 'INVESTIGATION_REPORT'
  | 'EVIDENCE'
  | 'COURT_ORDER'
  | 'INTERNAL_MEMO'
  | 'IDENTIFICATION'
  | 'LICENSE'
  | 'CERTIFICATE'
  | 'CORRESPONDENCE'
  | 'OTHER';

export type DocumentCategory = DocumentType;

// ---- Backend LoginResponse ----
export interface LoginResponseData {
  token: string;
  tokenType: string;
  email: string;
  name: string;
  role: UserRole;
}

// ---- Backend UserResponse ----
export interface User {
  id: string | number;
  name: string;
  email: string;
  role: UserRole;
  status?: string;
  badgeNumber?: string;
  department?: string;
  createdAt?: string;
  updatedAt?: string;
  // Computed/compat fields for UI display
  fullName?: string;
  username?: string;
}

// ---- Backend AssetResponse ----
export interface Asset {
  id: string | number;
  assetCode: string;
  name: string;
  category: string;
  description?: string;
  status: AssetStatus;
  condition?: AssetCondition;
  location: string;
  purchasePrice?: number;
  purchaseDate?: string;
  warrantyExpiryDate?: string;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  // Computed/compat for UI
  currentLocation?: string;
  assignedOfficerName?: string;
  assignedOfficerId?: string | number | null;
  model?: string;
  purchaseCost?: number;
  warrantyExpiry?: string;
  specifications?: Record<string, string | number>;
  notes?: string;
}

// ---- Backend AssignmentResponse ----
export interface AssetAssignment {
  id: string | number;
  assetId: string | number;
  assetCode?: string;
  assignedToId?: string | number;
  assignedToName: string;
  assignedByName?: string;
  assignedToBadge?: string;
  assignedToUserId?: string | number;
  assignedByUserId?: string | number;
  assignedAt?: string;
  assignmentDate?: string;
  returnedAt?: string | null;
  expectedReturnDate?: string | null;
  actualReturnDate?: string | null;
  status: string;
  purpose?: string;
  remarks?: string;
  notes?: string;
}

// ---- Backend MovementResponse ----
export interface AssetMovement {
  id: string | number;
  assetId: string | number;
  assetCode?: string;
  fromLocation: string;
  toLocation: string;
  movedByName?: string;
  movedByUserId?: string | number;
  movedAt?: string;
  movementDate?: string;
  authorizationRef?: string;
  reason: string;
  status?: string;
}

// ---- Backend MaintenanceResponse ----
export interface AssetMaintenance {
  id: string | number;
  assetId: string | number;
  assetCode?: string;
  description?: string;
  performedByName?: string;
  status: string;
  cost?: number;
  maintenanceDate?: string;
  completedDate?: string | null;
  remarks?: string;
  // Compat fields for UI
  title?: string;
  issueDescription?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  serviceProvider?: string;
  technicianName?: string;
  scheduledDate?: string;
  createdAt?: string;
}

// ---- Backend DocumentResponse ----
export interface DocumentRecord {
  id: string | number;
  title: string;
  documentType?: DocumentCategory;
  category?: DocumentCategory;
  description?: string;
  fileName: string;
  contentType?: string;
  fileSize: number;
  fileHash?: string;
  uploadedByName?: string;
  latestVersion?: number;
  createdAt?: string;
  updatedAt?: string;
  // Compat fields for UI
  version?: number | string;
  isIndexed?: boolean;
  indexedAt?: string | null;
  uploadedAt?: string;
  fileType?: string;
  downloadUrl?: string;
  assetId?: string | number | null;
  assetCode?: string | null;
  tags?: string[];
  caseId?: string | number | null;
  caseNumber?: string | null;
}

// ---- Backend DocumentVersionResponse ----
export interface DocumentVersion {
  id: string | number;
  documentId: string | number;
  versionNumber?: number | string;
  version?: number | string;
  fileName: string;
  fileSize?: number;
  contentType?: string;
  fileHash?: string;
  changeDescription?: string;
  changeSummary?: string;
  uploadedByName?: string;
  uploadedBy?: string;
  createdAt?: string;
  uploadedAt?: string;
}

// ---- AI Response Types ----
export interface AISummarySection {
  overview: string;
  keyPoints: string[];
  rolesAndResponsibilities: string[];
  criticalNotices?: string[];
  complianceNotes?: string[];
}

export interface AISourceChunk {
  chunkId: string | number;
  chunkIndex?: number;
  documentId?: string | number;
  title?: string;
  content?: string;
  snippet?: string;
  pageNumber?: number;
  similarityScore?: number;
  relevanceScore?: number;
}

export interface AIQueryResponse {
  question: string;
  answer: string;
  documentId?: string | number;
  documentTitle?: string;
  sources: AISourceChunk[];
  generatedAt?: string;
  confidence?: number;
  associatedAssetCode?: string;
}

export type AiQueryResponse = AIQueryResponse;

// ---- Backend AuditLogResponse ----
export interface AuditLog {
  id: string | number;
  timestamp?: string;
  action: string;
  principal?: string;
  performedByName?: string;
  userName?: string;
  role?: UserRole;
  performedByRole?: string;
  entity?: string;
  entityType?: string;
  entityId?: string | number;
  details?: string;
  description?: string;
  ipAddress?: string;
  status?: 'SUCCESS' | 'FAILED' | 'FAILURE' | 'WARNING';
  metadata?: Record<string, unknown>;
}

// ---- Dashboard types (derived from API, not from backend) ----
export interface DashboardStats {
  totalAssets: number;
  availableAssets: number;
  assignedAssets: number;
  underMaintenance: number;
  retiredAssets: number;
}

// ---- Pagination helper ----
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size?: number;
  number?: number;
}

// ---- MaintenancePriority type (for UI) ----
export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// ---- MaintenanceStatus type (for UI) ----
export type MaintenanceStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// ---- UserProfile (alias for User) ----
export type UserProfile = User;

// ---- Backend CaseResponse ----
export type CaseStatus = 'OPEN' | 'CLOSED' | 'ARCHIVED';

export interface CaseAssignment {
  id: string | number;
  caseId: string | number;
  caseNumber?: string;
  userId: string | number;
  userName: string;
  userRole?: string;
  status: string;
  remarks?: string;
  createdAt?: string;
}

export interface CaseRecord {
  id: string | number;
  caseNumber: string;
  title: string;
  description?: string;
  status: CaseStatus;
  createdAt?: string;
  updatedAt?: string;
  assignments?: CaseAssignment[];
}
