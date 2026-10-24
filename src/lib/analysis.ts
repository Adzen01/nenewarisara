// ฟังก์ชันวิเคราะห์แบบ pure ใช้ทั้งในหน้าเว็บและชุดทดสอบ (tests/)
import { skillDefinitions, skillScore } from './skills.ts'
import type { SkillId, Student } from './types.ts'

export const missingGroupId = 'missing'
// กลุ่มที่มีตัวอย่างน้อยกว่านี้จะแสดงคำเตือนว่าอัตราไม่เสถียร
export const smallSampleThreshold = 10

// นิยามสถานะเดียวกันทั้งระบบ: "ได้ที่ฝึกงานแล้ว" = applicationStage "ได้รับการตอบรับ" = accepted === true
export const acceptedStage = 'ได้รับการตอบรับ'
export const applicationStages = ['กำลังค้นหา', 'ส่งใบสมัครแล้ว', 'รอสัมภาษณ์', 'รอผลสัมภาษณ์', acceptedStage]
export const acceptanceRateDefinition =
  'อัตราได้ที่ฝึกงาน = จำนวนนิสิตที่ได้รับการตอบรับ ÷ จำนวนนิสิตทั้งหมดในกลุ่ม (รวมผู้ที่ยังค้นหาหรือรอผล)'

export type Band = { id: string; label: string; test: (value: number) => boolean }

export const gpaBands: Band[] = [
  { id: 'lt250', label: 'ต่ำกว่า 2.50', test: (gpa) => gpa < 2.5 },
  { id: '250-299', label: '2.50–2.99', test: (gpa) => gpa >= 2.5 && gpa < 3 },
  { id: '300-349', label: '3.00–3.49', test: (gpa) => gpa >= 3 && gpa < 3.5 },
  { id: 'gte350', label: '3.50–4.00', test: (gpa) => gpa >= 3.5 },
]

export const projectBands: Band[] = [
  { id: '0', label: '0 โครงการ', test: (count) => count === 0 },
  { id: '1-2', label: '1–2 โครงการ', test: (count) => count >= 1 && count <= 2 },
  { id: '3-4', label: '3–4 โครงการ', test: (count) => count >= 3 && count <= 4 },
  { id: '5+', label: '5 โครงการขึ้นไป', test: (count) => count >= 5 },
]

export function bandOf(bands: Band[], value: number | null | undefined) {
  if (value === null || value === undefined) return missingGroupId
  return bands.find((band) => band.test(value))?.id ?? missingGroupId
}

export const gpaOf = (student: Student) => student.profile?.gpa ?? null
export const projectCountOf = (student: Student) => student.profile?.portfolio?.projectCount ?? null
export const skillScoreOf = (student: Student) => skillScore(student.profile?.skills ?? null)
export const skillLevelOf = (student: Student, skill: SkillId) => student.profile?.skills?.[skill] ?? null

export type RateGroup = {
  id: string
  label: string
  total: number
  accepted: number
  // null เมื่อกลุ่มไม่มีตัวอย่าง (ตัวหารเป็น 0)
  rate: number | null
}

export function rateByBand(rows: Student[], bands: Band[], getValue: (student: Student) => number | null): RateGroup[] {
  const groups = [...bands.map((band) => ({ id: band.id, label: band.label })), { id: missingGroupId, label: 'ไม่มีข้อมูล' }]
  return groups.map((group) => {
    const members = rows.filter((row) => bandOf(bands, getValue(row)) === group.id)
    const accepted = members.filter((row) => row.accepted).length
    return { ...group, total: members.length, accepted, rate: members.length ? accepted / members.length : null }
  })
}

export type HeatmapCell = { mean: number | null; n: number }
export type HeatmapRow = { role: string; students: number; cells: Record<SkillId, HeatmapCell> }

// ค่าเฉลี่ยระดับทักษะต่อสายงานที่สนใจ · n ของแต่ละช่อง = จำนวนนิสิตที่มีผลประเมินทักษะนั้น
export function skillHeatmap(rows: Student[], roles: string[]): HeatmapRow[] {
  return roles.map((role) => {
    const members = rows.filter((row) => row.interestedRole === role)
    const cells = Object.fromEntries(
      skillDefinitions.map(({ id }) => {
        const values = members.map((row) => skillLevelOf(row, id)).filter((value): value is number => value !== null)
        return [id, { n: values.length, mean: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null }]
      }),
    ) as Record<SkillId, HeatmapCell>
    return { role, students: members.length, cells }
  })
}

export type StudentFilters = {
  keyword: string
  year: string
  status: string
  role: string
  gpaBand: string
  skill: string
  minLevel: string
}

export const defaultStudentFilters: StudentFilters = {
  keyword: '',
  year: 'all',
  status: 'all',
  role: 'all',
  gpaBand: 'all',
  skill: 'all',
  minLevel: '3',
}

function matchesStatus(student: Student, status: string) {
  if (status === 'all') return true
  if (status === 'accepted') return student.accepted
  if (status === 'pending') return !student.accepted
  // ค่าอื่นคือขั้นตอนการสมัคร เช่น "รอสัมภาษณ์"
  return student.applicationStage === status
}

export function filterStudents(rows: Student[], filters: StudentFilters) {
  const keyword = filters.keyword.trim().toLocaleLowerCase('th')
  return rows.filter((student) => {
    const searchableText = [
      student.studentId,
      student.prefix,
      student.firstName,
      student.lastName,
      student.placement?.company,
      student.placement?.position,
    ]
      .join(' ')
      .toLocaleLowerCase('th')

    // นิสิตที่ไม่มีระดับของทักษะที่เลือก (null) ไม่ผ่านเงื่อนไข "ระดับอย่างน้อย"
    const level = filters.skill === 'all' ? null : skillLevelOf(student, filters.skill as SkillId)
    const matchesSkill = filters.skill === 'all' || (level !== null && level >= Number(filters.minLevel))

    return (
      searchableText.includes(keyword) &&
      (filters.year === 'all' || String(student.academicYearBE) === filters.year) &&
      matchesStatus(student, filters.status) &&
      (filters.role === 'all' || student.interestedRole === filters.role) &&
      (filters.gpaBand === 'all' || bandOf(gpaBands, gpaOf(student)) === filters.gpaBand) &&
      matchesSkill
    )
  })
}

export function mean(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
}
