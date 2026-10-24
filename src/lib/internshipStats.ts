import dataset from '../data/internships.json'

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
}

export type BarItem = { name: string; count: number }

export const students: Student[] = dataset.students
export const datasetNote = dataset.metadata.note

// ใช้คำเดียวกับค่า acceptanceStatus ใน JSON ทุกหน้า
export const statusLabel = {
  accepted: 'ได้ที่ฝึกงานแล้ว',
  pending: 'ยังไม่ได้ที่ฝึกงาน',
} as const

export const missingLabel = 'ไม่ได้ระบุ'

export function groupCount(rows: Student[], getName: (row: Student) => string | null | undefined): BarItem[] {
  const counts = new Map<string, number>()
  rows.forEach((row) => {
    const name = getName(row)?.trim() || missingLabel
    counts.set(name, (counts.get(name) ?? 0) + 1)
  })
  return Array.from(counts, ([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'th'))
}

export function summarize(rows: Student[]) {
  const acceptedRows = rows.filter((row) => row.accepted)
  const total = rows.length
  const accepted = acceptedRows.length
  return {
    total,
    accepted,
    notAccepted: total - accepted,
    acceptanceRate: total ? (accepted / total) * 100 : null,
    // สายงานที่สนใจนับจากนิสิตทุกคน ไม่ใช่ตำแหน่งที่ได้รับ
    interestedRoles: groupCount(rows, (row) => row.interestedRole),
    companies: groupCount(acceptedRows, (row) => row.placement?.company),
    provinces: groupCount(acceptedRows, (row) => row.placement?.province),
  }
}

export function getYears(rows: Student[]) {
  return [...new Set(rows.map((row) => row.academicYearBE))].sort((a, b) => a - b)
}

export function filterYear(rows: Student[], year: string) {
  return year === 'all' ? rows : rows.filter((row) => String(row.academicYearBE) === year)
}

export function uniqueSorted(values: (string | null | undefined)[]) {
  return [...new Set(values.filter((value): value is string => Boolean(value?.trim())))]
    .sort((a, b) => a.localeCompare(b, 'th'))
}

export function fullName(student: Student) {
  return `${student.prefix}${student.firstName} ${student.lastName}`
}

export function formatNumber(value: number) {
  return value.toLocaleString('th-TH')
}

export function formatPercent(part: number, total: number) {
  return total ? `${((part / total) * 100).toFixed(1)}%` : '—'
}

export const years = getYears(students)
export const yearRange = years.length > 1 ? `${years[0]}–${years[years.length - 1]}` : String(years[0] ?? '—')
