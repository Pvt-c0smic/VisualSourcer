// User related types
export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'trainer' | 'trainee';
  rank?: string;
  unit?: string;
  avatarUrl?: string;
  skillSets?: SkillSet[];
  enrollmentDate?: string;
  enrollmentStatus?: string;
  progress?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserLoginRequest {
  username: string;
  password: string;
}

export interface UserRegisterRequest {
  username: string;
  password: string;
  name: string;
  email: string;
  role?: 'admin' | 'trainer' | 'trainee';
  rank?: string;
  unit?: string;
}

// Skill Set related types
export interface SkillSet {
  id: number;
  name: string;
  category: string;
  level: number;
  description?: string;
}

// Program related types
export interface Program {
  id: number;
  code: string;
  name: string;
  description?: string;
  skillSetId: number;
  skillSetCategory: string;
  skillSetLevel: number;
  startDate: string;
  duration: string;
  capacity: number;
  enrolledCount: number;
  venue: 'VTC' | 'Face-to-Face';
  location?: string;
  objectives?: string[];
  prerequisites?: string[];
  status: 'Open' | 'Full' | 'Completed';
  passingScore?: number;
  certificateTitle?: string;
  createdById: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramCreateRequest {
  code: string;
  name: string;
  description?: string;
  skillSetId: number;
  skillSetLevel: number;
  startDate: string;
  duration: string;
  capacity: number;
  venue: 'VTC' | 'Face-to-Face';
  location?: string;
  objectives?: string[];
  prerequisites?: string[];
  passingScore?: number;
  certificateTitle?: string;
}

export interface ProgramModule {
  id: number;
  programId: number;
  title: string;
  description?: string;
  content?: string;
  order: number;
  estimatedDuration?: string;
}

export interface ProgramEnrollment {
  id: number;
  programId: number;
  userId: number;
  user: User;
  enrollmentDate: string;
  status: 'Active' | 'Completed' | 'Dropped';
  progress: number;
  completionDate?: string;
  finalScore?: number;
}

// Calendar Event related types
export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  type: 'training' | 'meeting' | 'ceremony' | 'workshop';
  venueType?: 'VTC' | 'Face-to-Face';
  required?: boolean;
  createdById: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventCreateRequest {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  type: 'training' | 'meeting' | 'ceremony' | 'workshop';
  venueType?: 'VTC' | 'Face-to-Face';
  required?: boolean;
  participants?: number[];
}

// Meeting related types
export interface Meeting {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  type: 'VTC' | 'Face-to-Face';
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Pending';
  agenda?: string[];
  notes?: string;
  tags?: string[];
  priority?: 'High' | 'Normal' | 'Low';
  recurrence?: 'None' | 'Daily' | 'Weekly' | 'Monthly';
  requiredAttendance?: boolean;
  privateNotes?: string;
  externalStakeholders?: ExternalStakeholder[];
  participants: User[];
  createdById: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExternalStakeholder {
  name: string;
  email: string;
  organization: string;
  role?: string;
  notes?: string;
}

export interface MeetingCreateRequest {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  type: 'VTC' | 'Face-to-Face';
  agenda?: string[];
  notes?: string;
  tags?: string[];
  priority?: 'High' | 'Normal' | 'Low';
  recurrence?: 'None' | 'Daily' | 'Weekly' | 'Monthly';
  requiredAttendance?: boolean;
  privateNotes?: string;
  externalStakeholders?: ExternalStakeholder[];
  participants: MeetingParticipantRequest[];
}

export interface MeetingParticipantRequest {
  userId: number;
  role?: 'Organizer' | 'Attendee' | 'Presenter' | 'Stakeholder' | 'Observer' | 'Subject Matter Expert' | 'Trainee' | 'Trainer' | 'Optional';
  stakeholderType?: string;
  requiredAttendance?: boolean;
}

export interface MeetingParticipant {
  id: number;
  meetingId: number;
  userId: number;
  user: User;
  role: 'Organizer' | 'Attendee' | 'Presenter' | 'Stakeholder' | 'Observer' | 'Subject Matter Expert' | 'Trainee' | 'Trainer' | 'Optional';
  stakeholderType?: string;
  status: 'Pending' | 'Confirmed' | 'Declined';
  responseMessage?: string;
  notified: boolean;
  attendance?: 'Present' | 'Absent' | 'Excused' | 'Late';
  requiredAttendance: boolean;
  contributionNotes?: string;
}

// Certificate related types
export interface Certificate {
  id: number;
  title: string;
  userId: number;
  recipient: string;
  programId: number;
  program: string;
  issueDate: string;
  expiryDate?: string;
  certificateNumber: string;
  status: 'Active' | 'Expired' | 'Revoked';
  fileUrl?: string;
  createdById: number;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateCreateRequest {
  title: string;
  userId: number;
  programId: number;
  expiryDate?: string;
  certificateNumber?: string;
  templateId?: number;
}

export interface CertificateTemplate {
  id: number;
  name: string;
  description?: string;
  htmlTemplate: string;
  isDefault: boolean;
  createdById: number;
  createdAt: string;
  updatedAt: string;
}

// Notification related types
export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  link?: string;
  createdAt: string;
}

// Dashboard related types
export interface DashboardStats {
  activeTrainees: number;
  activePrograms: number;
  certificatesIssued: number;
  upcomingMeetings: number;
}

// AI suggestion related types
export interface MeetingSuggestion {
  suggestedDate: string;
  suggestedTime: string;
  reason: string;
  availableParticipants: number;
  totalParticipants: number;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
