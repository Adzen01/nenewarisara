export type Student = {
  recordId: string
  academicYearBE: number
  interestedRole: string | null
  accepted: boolean
  placement: { company: string | null; province: string | null } | null
}

export type BarItem = { name: string; count: number }

function groupCount(rows: Student[], getName: (row: Student) => string | null | undefined): BarItem[] {
  const counts = new Map<string, number>()
  rows.forEach((row) => {
    const name = getName(row)?.trim() || 'ไม่ได้ระบุ'
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
    roles: groupCount(acceptedRows, (row) => row.interestedRole),
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
