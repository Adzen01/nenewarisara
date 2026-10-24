import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  bandOf,
  defaultStudentFilters,
  filterStudents,
  gpaBands,
  gpaOf,
  missingGroupId,
  projectBands,
  projectCountOf,
  rateByBand,
  skillHeatmap,
  skillScoreOf,
} from '../src/lib/analysis.ts'
import { emptySkillLevels, skillIds } from '../src/lib/skills.ts'
import type { SkillLevels, Student, StudentProfile } from '../src/lib/types.ts'

function makeStudent(overrides: Partial<Student> & { id: string; profile?: Partial<StudentProfile> | null }): Student {
  const { id, profile, ...rest } = overrides
  return {
    recordId: `REC-${id}`,
    studentId: `SIM-${id}`,
    academicYearBE: 2567,
    academicYearCE: 2024,
    prefix: 'นาย',
    firstName: `ชื่อ${id}`,
    lastName: 'ทดสอบ',
    interestedRole: 'Frontend Development',
    acceptanceStatus: 'ยังไม่ได้ที่ฝึกงาน',
    applicationStage: 'รอสัมภาษณ์',
    accepted: false,
    placement: null,
    profile: profile === null ? null : { studentId: `SIM-${id}`, gpa: 3, skills: null, portfolio: null, ...profile },
    ...rest,
  }
}

const levels = (value: number | null): SkillLevels => Object.fromEntries(skillIds.map((id) => [id, value])) as SkillLevels

// ---------- ข้อมูลจริงของโปรเจกต์ ----------
const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const source = read('../src/data/internships.json') as { students: Omit<Student, 'profile'>[] }
const profileFile = read('../src/data/profiles.json') as { profiles: StudentProfile[] }
const byId = new Map(profileFile.profiles.map((p) => [p.studentId, p]))
const realStudents: Student[] = source.students.map((s) => ({ ...s, profile: byId.get(s.studentId) ?? null }))

test('ข้อมูลจริง: นิสิตทุกคนเชื่อมกับ profile ได้ และ GPA/ทักษะอยู่ในช่วง', () => {
  assert.equal(realStudents.length, 240)
  assert.ok(realStudents.every((s) => s.profile !== null))
  for (const s of realStudents) {
    const gpa = gpaOf(s)
    if (gpa !== null) assert.ok(gpa >= 0 && gpa <= 4)
    const score = skillScoreOf(s)
    if (score !== null) assert.ok(score >= 0 && score <= 5)
  }
})

test('ข้อมูลจริง: ค่าว่างยังเป็น null ไม่ถูกแทนด้วย 0', () => {
  assert.ok(realStudents.some((s) => s.profile?.gpa === null))
  assert.ok(realStudents.some((s) => s.profile?.skills === null))
  assert.ok(realStudents.some((s) => s.profile?.skills && skillIds.some((id) => s.profile!.skills![id] === null)))
})

// ---------- การกรองและค้นหา ----------
test('filterStudents: ค่าเริ่มต้นคืนทุกคน', () => {
  assert.equal(filterStudents(realStudents, defaultStudentFilters).length, realStudents.length)
})

test('filterStudents: ค้นหาด้วยรหัสนิสิต ชื่อ หรือบริษัท (ไม่สนตัวพิมพ์)', () => {
  assert.equal(filterStudents(realStudents, { ...defaultStudentFilters, keyword: 'SIM-2566-001' }).length, 1)
  const kbtg = filterStudents(realStudents, { ...defaultStudentFilters, keyword: '  kbtg ' })
  assert.ok(kbtg.length > 0 && kbtg.every((s) => s.placement?.company === 'KBTG'))
  assert.equal(filterStudents(realStudents, { ...defaultStudentFilters, keyword: 'ไม่มีคนนี้แน่นอน' }).length, 0)
})

test('filterStudents: สถานะ accepted/pending แบ่งข้อมูลครบและไม่ซ้อนกัน', () => {
  const accepted = filterStudents(realStudents, { ...defaultStudentFilters, status: 'accepted' })
  const pending = filterStudents(realStudents, { ...defaultStudentFilters, status: 'pending' })
  assert.equal(accepted.length + pending.length, realStudents.length)
  assert.ok(accepted.every((s) => s.accepted))
  const stage = filterStudents(realStudents, { ...defaultStudentFilters, status: 'รอสัมภาษณ์' })
  assert.ok(stage.length > 0 && stage.every((s) => s.applicationStage === 'รอสัมภาษณ์' && !s.accepted))
})

test('filterStudents: ช่วง GPA รวมกลุ่มไม่มีข้อมูล', () => {
  const rows = [
    makeStudent({ id: '1', profile: { gpa: 2.49 } }),
    makeStudent({ id: '2', profile: { gpa: 2.5 } }),
    makeStudent({ id: '3', profile: { gpa: 3.5 } }),
    makeStudent({ id: '4', profile: { gpa: null } }),
    makeStudent({ id: '5', profile: null }),
  ]
  const ids = (band: string) => filterStudents(rows, { ...defaultStudentFilters, gpaBand: band }).map((s) => s.studentId)
  assert.deepEqual(ids('lt250'), ['SIM-1'])
  assert.deepEqual(ids('250-299'), ['SIM-2'])
  assert.deepEqual(ids('gte350'), ['SIM-3'])
  assert.deepEqual(ids(missingGroupId), ['SIM-4', 'SIM-5'])
})

test('filterStudents: ทักษะระดับอย่างน้อย ไม่นับคนที่ไม่มีผลประเมิน', () => {
  const withNull = { ...levels(4), backend: null }
  const rows = [
    makeStudent({ id: '1', profile: { skills: levels(4) } }),
    makeStudent({ id: '2', profile: { skills: levels(2) } }),
    makeStudent({ id: '3', profile: { skills: withNull } }),
    makeStudent({ id: '4', profile: { skills: null } }),
  ]
  const result = filterStudents(rows, { ...defaultStudentFilters, skill: 'backend', minLevel: '3' })
  assert.deepEqual(result.map((s) => s.studentId), ['SIM-1'])
  const zero = filterStudents(rows, { ...defaultStudentFilters, skill: 'backend', minLevel: '0' })
  assert.deepEqual(zero.map((s) => s.studentId), ['SIM-1', 'SIM-2'])
})

test('filterStudents: หลายเงื่อนไขพร้อมกันเท่ากับการกรองทีละขั้น', () => {
  const filters = { ...defaultStudentFilters, year: '2567', status: 'accepted', role: 'Backend Development', gpaBand: '300-349' }
  const expected = realStudents.filter(
    (s) => s.academicYearBE === 2567 && s.accepted && s.interestedRole === 'Backend Development' && bandOf(gpaBands, gpaOf(s)) === '300-349',
  )
  assert.deepEqual(filterStudents(realStudents, filters), expected)
})

// ---------- อัตราตอบรับ ----------
test('rateByBand: ตัวตั้ง ตัวหาร และกลุ่มว่าง', () => {
  const rows = [
    makeStudent({ id: '1', accepted: true, profile: { gpa: 3.6 } }),
    makeStudent({ id: '2', accepted: false, profile: { gpa: 3.7 } }),
    makeStudent({ id: '3', accepted: true, profile: { gpa: 3.9 } }),
    makeStudent({ id: '4', accepted: true, profile: { gpa: 2.6 } }),
    makeStudent({ id: '5', accepted: false, profile: { gpa: null } }),
  ]
  const groups = rateByBand(rows, gpaBands, gpaOf)
  const get = (id: string) => groups.find((g) => g.id === id)!
  assert.deepEqual([get('gte350').accepted, get('gte350').total], [2, 3])
  assert.equal(get('gte350').rate, 2 / 3)
  assert.equal(get('250-299').rate, 1)
  // ไม่มีตัวอย่าง → rate เป็น null ไม่ใช่ 0%
  assert.equal(get('lt250').total, 0)
  assert.equal(get('lt250').rate, null)
  assert.deepEqual([get(missingGroupId).accepted, get(missingGroupId).total], [0, 1])
  // ทุกคนอยู่ในกลุ่มเดียวพอดี
  assert.equal(groups.reduce((sum, g) => sum + g.total, 0), rows.length)
})

test('rateByBand: แถวว่างทั้งหมดไม่ error และทุกกลุ่มเป็น null', () => {
  const groups = rateByBand([], projectBands, projectCountOf)
  assert.ok(groups.every((g) => g.total === 0 && g.rate === null))
})

test('rateByBand บนข้อมูลจริง: ผลรวมตัวหารเท่ากับจำนวนนิสิตและผลรวมตัวตั้งเท่ากับผู้ได้ที่ฝึกงาน', () => {
  const groups = rateByBand(realStudents, projectBands, projectCountOf)
  assert.equal(groups.reduce((sum, g) => sum + g.total, 0), realStudents.length)
  assert.equal(groups.reduce((sum, g) => sum + g.accepted, 0), realStudents.filter((s) => s.accepted).length)
})

test('bandOf: ขอบเขตกลุ่มจำนวนโครงการ', () => {
  assert.equal(bandOf(projectBands, 0), '0')
  assert.equal(bandOf(projectBands, 2), '1-2')
  assert.equal(bandOf(projectBands, 3), '3-4')
  assert.equal(bandOf(projectBands, 9), '5+')
  assert.equal(bandOf(projectBands, null), missingGroupId)
})

// ---------- Heatmap ----------
test('skillHeatmap: เฉลี่ยเฉพาะค่าที่มี และกลุ่มว่างเป็น null', () => {
  const rows = [
    makeStudent({ id: '1', profile: { skills: { ...emptySkillLevels(), frontend: 4 } } }),
    makeStudent({ id: '2', profile: { skills: { ...emptySkillLevels(), frontend: 2 } } }),
    makeStudent({ id: '3', profile: { skills: null } }),
  ]
  const [frontendRow, emptyRow] = skillHeatmap(rows, ['Frontend Development', 'Cybersecurity'])
  assert.equal(frontendRow.students, 3)
  assert.deepEqual(frontendRow.cells.frontend, { mean: 3, n: 2 })
  assert.deepEqual(frontendRow.cells.backend, { mean: null, n: 0 })
  assert.equal(emptyRow.students, 0)
  assert.ok(Object.values(emptyRow.cells).every((cell) => cell.mean === null && cell.n === 0))
})
