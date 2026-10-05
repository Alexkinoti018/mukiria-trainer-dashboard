import staticUnits from "./curriculum_database.json";

export interface LearningOutcome {
  title: string;
  duration_hours: number;
  content: string[];
  assessment_methods: string[];
}

export interface ElementOfCompetence {
  element_title: string;
  performance_criteria: string[];
}

export interface WeekPlan {
  week: number;
  title: string;
  outcomes: string[];
  resources: string[];
  safety: string;
}

export interface CurriculumUnit {
  id: string;
  unit_code: string;
  isced_code: string;
  cdacc_code: string;
  unit_title: string;
  department: string;
  course: string;
  level: number;
  duration_hours: number;
  description: string;
  source_file?: string;
  learning_outcomes: LearningOutcome[];
  elements: ElementOfCompetence[];
  weeks_breakdown: WeekPlan[];
  suggested_resources: string[];
  safety_protocols: string;
}

export interface DepartmentSummary {
  name: string;
  unit_count: number;
}

// Fetch all departments
export async function getCurriculumDepartments(): Promise<DepartmentSummary[]> {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/curriculum/departments");
    if (res.ok) {
      const data = await res.json();
      if (data.departments && data.departments.length > 0) {
        return data.departments;
      }
    }
  } catch (err) {
    console.warn("Backend curriculum API unavailable, using local static data:", err);
  }

  // Fallback to local JSON
  const depts: Record<string, number> = {};
  (staticUnits as CurriculumUnit[]).forEach(u => {
    depts[u.department] = (depts[u.department] || 0) + 1;
  });
  return Object.entries(depts).map(([name, unit_count]) => ({ name, unit_count }));
}

// Fetch units with optional filters
export async function getCurriculumUnits(filters?: {
  department?: string;
  level?: number;
  search?: string;
}): Promise<CurriculumUnit[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.department && filters.department !== "All") params.append("department", filters.department);
    if (filters?.level) params.append("level", String(filters.level));
    if (filters?.search) params.append("search", filters.search);

    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`http://127.0.0.1:8000/api/curriculum/units${query}`);
    if (res.ok) {
      const data = await res.json();
      if (data.units && data.units.length > 0) {
        return data.units as CurriculumUnit[];
      }
    }
  } catch (err) {
    console.warn("Backend curriculum API unavailable, using local static fallback:", err);
  }

  // Fallback to local static JSON
  let results = (staticUnits as unknown) as CurriculumUnit[];
  if (filters?.department && filters.department !== "All") {
    const dLower = filters.department.toLowerCase();
    results = results.filter(u => u.department.toLowerCase().includes(dLower));
  }
  if (filters?.level) {
    results = results.filter(u => u.level === filters.level);
  }
  if (filters?.search) {
    const sLower = filters.search.toLowerCase();
    results = results.filter(
      u =>
        u.unit_title.toLowerCase().includes(sLower) ||
        u.unit_code.toLowerCase().includes(sLower) ||
        u.course.toLowerCase().includes(sLower)
    );
  }
  return results;
}

// Fetch single unit details
export async function getUnitDetails(code: string): Promise<CurriculumUnit | null> {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/curriculum/unit/${encodeURIComponent(code)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.unit) return data.unit as CurriculumUnit;
    }
  } catch (err) {
    console.warn("Backend unit details API unavailable:", err);
  }

  // Fallback
  const codeClean = code.trim().toUpperCase().replace(/[\s\/-]/g, "");
  const found = (staticUnits as unknown as CurriculumUnit[]).find(u => {
    const c1 = u.unit_code.toUpperCase().replace(/[\s\/-]/g, "");
    const c2 = u.cdacc_code.toUpperCase().replace(/[\s\/-]/g, "");
    const c3 = u.id.toUpperCase().replace(/[\s\/-]/g, "");
    return c1 === codeClean || c2 === codeClean || c3 === codeClean || u.unit_title.toLowerCase().includes(code.toLowerCase());
  });

  return found || null;
}

// Trigger rescan of D:\Curriculum and OS
export async function rescanCurriculumFolder(): Promise<{ success: boolean; count?: number; message?: string }> {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/curriculum/rescan", {
      method: "POST"
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err?.message || "Failed to reach backend scanner" };
  }
}
