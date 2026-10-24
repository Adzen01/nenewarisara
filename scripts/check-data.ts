// ตรวจคุณภาพข้อมูล: รหัสซ้ำ ค่าว่าง ช่วงค่า และความสอดคล้อง แล้วเขียนรายงานที่ docs/data-quality.md
// รัน: npm run data:check · จบด้วย exit code 1 เมื่อพบข้อผิดพลาด
import { readFileSync, writeFileSync } from 'node:fs'
import { acceptedStage, applicationStages } from '../src/lib/analysis.ts'
import { positionRole, roleBenchmarks, skillIds } from '../src/lib/skills.ts'
import type { Placement, StudentProfile } from '../src/lib/types.ts'

type SourceStudent = {
  recordId: string
  studentId: string
  academicYearBE: number
  academicYearCE: number
  interestedRole: string | null
  acceptanceStatus: string
  applicationStage: string | null
  accepted: boolean
  placement: Placement | null
}

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const source = read('../src/data/internships.json') as { students: SourceStudent[] }
const profileFile = read('../src/data/profiles.json') as { metadata: { seed: number }; profiles: StudentProfile[] }
const students = source.students
const profiles = profileFile.profiles

type Check = { name: string; failures: string[] }
const checks: Check[] = []
function check(name: string, failures: string[]) {
  checks.push({ name, failures })
}

function duplicates(values: string[]) {
  const seen = new Set<string>()
  return [...new Set(values.filter((value) => (seen.has(value) ? true : (seen.add(value), false))))]
}

// ---------- รหัสซ้ำและการเชื่อมข้อมูล ----------
check('recordId ไม่ซ้ำ', duplicates(students.map((s) => s.recordId)))
check('studentId ไม่ซ้ำ (internships.json)', duplicates(students.map((s) => s.studentId)))
check('studentId ไม่ซ้ำ (profiles.json)', duplicates(profiles.map((p) => p.studentId)))
const profileIds = new Set(profiles.map((p) => p.studentId))
const studentIds = new Set(students.map((s) => s.studentId))
check('นิสิตทุกคนมี profile', students.filter((s) => !profileIds.has(s.studentId)).map((s) => s.studentId))
check('ไม่มี profile ที่ไม่มีนิสิตคู่กัน', profiles.filter((p) => !studentIds.has(p.studentId)).map((p) => p.studentId))

// ---------- ช่วงค่า ----------
check('GPA อยู่ในช่วง 0–4', profiles.filter((p) => p.gpa !== null && !(p.gpa >= 0 && p.gpa <= 4)).map((p) => `${p.studentId}: ${p.gpa}`))
check(
  'ระดับทักษะเป็นจำนวนเต็ม 0–5 และมีครบทุกทักษะ',
  profiles.flatMap((p) =>
    p.skills === null
      ? []
      : skillIds
          .filter((id) => !(id in p.skills!) || (p.skills![id] !== null && !(Number.isInteger(p.skills![id]) && p.skills![id]! >= 0 && p.skills![id]! <= 5)))
          .map((id) => `${p.studentId}.${id}: ${p.skills![id]}`),
  ),
)
check(
  'จำนวนโครงการเป็นจำนวนเต็มไม่ติดลบ',
  profiles
    .filter((p) => p.portfolio?.projectCount != null && !(Number.isInteger(p.portfolio.projectCount) && p.portfolio.projectCount >= 0))
    .map((p) => p.studentId),
)
check(
  'ปี ค.ศ. = ปี พ.ศ. − 543',
  students.filter((s) => s.academicYearCE !== s.academicYearBE - 543).map((s) => s.recordId),
)

// ---------- ความสอดคล้อง ----------
check(
  'accepted ⇔ acceptanceStatus "ได้ที่ฝึกงานแล้ว" ⇔ applicationStage "ได้รับการตอบรับ"',
  students
    .filter((s) => s.accepted !== (s.acceptanceStatus === 'ได้ที่ฝึกงานแล้ว') || s.accepted !== (s.applicationStage === acceptedStage))
    .map((s) => s.recordId),
)
check('applicationStage อยู่ในรายการที่กำหนด', students.filter((s) => !applicationStages.includes(s.applicationStage ?? '')).map((s) => s.recordId))
check('ผู้ได้ที่ฝึกงานมีบริษัทและตำแหน่ง', students.filter((s) => s.accepted && !(s.placement?.company && s.placement.position)).map((s) => s.recordId))
check('ผู้ยังไม่ได้ที่ฝึกงานไม่มีข้อมูลบริษัท', students.filter((s) => !s.accepted && s.placement !== null).map((s) => s.recordId))
check('สายงานที่สนใจมีเกณฑ์ตัวอย่าง', students.filter((s) => s.interestedRole && !roleBenchmarks[s.interestedRole]).map((s) => `${s.recordId}: ${s.interestedRole}`))
check(
  'ตำแหน่งฝึกงานจับคู่กับสายงานของเกณฑ์ได้',
  [...new Set(students.map((s) => s.placement?.position).filter((p): p is string => Boolean(p) && !positionRole[p!]))],
)
check(
  'Portfolio 0 โครงการ ⇒ ไม่มีประเภท/เทคโนโลยี และไม่มีหลักฐาน',
  profiles
    .filter((p) => p.portfolio?.projectCount === 0 && (p.portfolio.projectTypes.length > 0 || p.portfolio.technologies.length > 0 || p.portfolio.hasEvidence === true))
    .map((p) => p.studentId),
)
check(
  'ไม่มี URL ในข้อมูล Portfolio',
  profiles.filter((p) => JSON.stringify(p.portfolio ?? {}).match(/https?:\/\//)).map((p) => p.studentId),
)

// ---------- ค่าว่าง (เป็นข้อมูล ไม่ใช่ข้อผิดพลาด) ----------
const count = (predicate: (p: StudentProfile) => boolean) => profiles.filter(predicate).length
const nullRows: [string, number][] = [
  ['interestedRole', students.filter((s) => s.interestedRole === null).length],
  ['placement (ทั้งหมด)', students.filter((s) => s.placement === null).length],
  ['gpa', count((p) => p.gpa === null)],
  ['skills (ทั้งชุด)', count((p) => p.skills === null)],
  ['skills (รายทักษะ, นับเป็นช่อง)', profiles.reduce((sum, p) => sum + (p.skills ? skillIds.filter((id) => p.skills![id] === null).length : 0), 0)],
  ['portfolio (ทั้งชุด)', count((p) => p.portfolio === null)],
  ['portfolio.projectCount', count((p) => p.portfolio !== null && p.portfolio.projectCount === null)],
  ['portfolio.hasEvidence', count((p) => p.portfolio !== null && p.portfolio.hasEvidence === null)],
]

const gpas = profiles.map((p) => p.gpa).filter((g): g is number => g !== null)
const failed = checks.filter((c) => c.failures.length > 0)

const report = `# รายงานตรวจคุณภาพข้อมูล

สร้างโดย \`npm run data:check\` (scripts/check-data.ts) · อย่าแก้ไฟล์นี้ด้วยมือ

- นิสิต (internships.json): ${students.length} รายการ
- Profile จำลอง (profiles.json): ${profiles.length} รายการ · seed ${profileFile.metadata.seed}
- GPA ที่มีค่า: ${gpas.length} รายการ · ต่ำสุด ${Math.min(...gpas).toFixed(2)} · สูงสุด ${Math.max(...gpas).toFixed(2)}
- ผลรวม: ${failed.length === 0 ? 'ผ่านทุกข้อ' : `ไม่ผ่าน ${failed.length} ข้อ`}

## ผลตรวจ

| รายการตรวจ | ผล | ตัวอย่างที่ไม่ผ่าน |
| --- | --- | --- |
${checks.map((c) => `| ${c.name} | ${c.failures.length === 0 ? 'ผ่าน' : `ไม่ผ่าน (${c.failures.length})`} | ${c.failures.slice(0, 5).join(', ') || '—'} |`).join('\n')}

## ค่าว่าง (null)

ค่าว่างเป็นข้อมูลที่ตั้งใจเก็บไว้ ไม่แทนด้วยศูนย์ และหน้าเว็บแสดงเป็น "ไม่มีข้อมูล"

| ฟิลด์ | จำนวนค่าว่าง |
| --- | --- |
${nullRows.map(([name, value]) => `| ${name} | ${value} |`).join('\n')}
`

writeFileSync(new URL('../docs/data-quality.md', import.meta.url), report)
console.log(checks.map((c) => `${c.failures.length === 0 ? '✓' : '✗'} ${c.name}${c.failures.length ? ` (${c.failures.length})` : ''}`).join('\n'))
if (failed.length > 0) process.exit(1)
