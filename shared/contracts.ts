/**
 * Mukiria Technical Training Institute (MTTI)
 * Enterprise Shared Data Contracts & Domain Models
 *
 * Defines canonical TypeScript interfaces and schemas shared between
 * client UI components, server API endpoints, and database models.
 */

export type UserRole = "trainee" | "trainer" | "hod" | "admin";

export interface AuthenticatedUserContract {
  id: string;
  email?: string;
  name: string;
  role: UserRole;
  reg_number?: string;
  department_id?: string;
  assigned_units?: string[];
  enrolled_units?: string[];
}

export interface TraineeContract {
  id: string;
  name: string;
  reg_number: string;
  adm_no?: string;
  reg_code?: string;
  class_id?: string;
  class_code?: string;
  department?: string;
  gender?: "M" | "F" | "Other" | string;
  phone?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceContract {
  id: string;
  unit_offering_id: string;
  trainee_id: string;
  week_number: number;
  session_date: string;
  session_index?: number;
  status: "present" | "absent" | "excused" | "X" | "0" | string;
  hours_attended: number;
  remarks?: string;
  marked_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AssessmentMarksContract {
  id: string;
  unit_offering_id: string;
  trainee_id: string;
  assessment_type: string;
  ct_avg: number;
  cp_avg: number;
  cp_scores: number[];
  ct_scores: number[];
  project_score: number;
  weighted_mark: number;
  is_locked: boolean;
  computed_average_practical?: number;
}

export interface ExamSubmissionContract {
  id: string;
  exam_id: string;
  trainee_id: string;
  student_name?: string;
  trainee_admission?: string;
  status: "draft" | "submitted" | "graded" | string;
  total_score: number;
  percentage: number;
  section_a: any[];
  section_b: any[];
  answers: any[];
  feedback?: string;
  graded_by?: string;
  graded_at?: string;
  submitted_at: string;
  created_at: string;
}

export interface PedagogicalDocumentContract {
  id: string;
  unit_offering_id?: string;
  class_code?: string;
  trainer_id?: string;
  department_id?: string;
  approval_status: "pending" | "approved" | "rejected";
  hod_reviewed_by?: string | null;
  hod_reviewer_name?: string | null;
  hod_review_date?: string | null;
  hod_remarks?: string | null;
  payload?: any;
  created_at?: string;
  updated_at?: string;
}
