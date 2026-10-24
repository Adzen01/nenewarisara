// ชนิดข้อมูลกลางของทั้งระบบ ไม่มี import อื่น เพื่อให้สคริปต์และชุดทดสอบใช้ร่วมได้

export type SkillId =
  | 'programming'
  | 'frontend'
  | 'backend'
  | 'database'
  | 'dataAnalysis'
  | 'ml'
  | 'cloud'
  | 'network'
  | 'security'
  | 'testing'
  | 'mobile'
  | 'git'

// ระดับ 0–5 ต่อทักษะ · null = ไม่ได้ประเมินทักษะนั้น (ไม่ใช่ระดับ 0)
export type SkillLevels = Record<SkillId, number | null>

export type Portfolio = {
  projectCount: number | null
  projectTypes: string[]
  technologies: string[]
  // มีหลักฐานผลงานให้ตรวจได้หรือไม่ เช่น repo, demo, เอกสาร · ชุดข้อมูลไม่เก็บ URL
  hasEvidence: boolean | null
}

export type StudentProfile = {
  studentId: string
  gpa: number | null
  // null = ไม่มีผลประเมินทักษะทั้งชุด
  skills: SkillLevels | null
  // null = ไม่มีข้อมูล Portfolio
  portfolio: Portfolio | null
}

export type Placement = {
  company: string | null
  businessType: string | null
  country: string | null
  province: string | null
  unit: string | null
  department: string | null
  position: string | null
}

export type Student = {
  recordId: string
  studentId: string
  academicYearBE: number
  academicYearCE: number
  prefix: string
  firstName: string
  lastName: string
  interestedRole: string | null
  acceptanceStatus: string
  applicationStage: string | null
  accepted: boolean
  placement: Placement | null
  profile: StudentProfile | null
}
