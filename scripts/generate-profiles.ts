// สร้างข้อมูลจำลอง GPA ทักษะ และ Portfolio แบบทำซ้ำได้ (seed คงที่)
// รัน: npm run data:generate
// ไม่แก้ไข src/data/internships.json (ข้อมูลต้นฉบับ) · เชื่อมกันด้วย studentId
//
// หลักการ:
// - ไม่ใช้สถานะการตอบรับ (accepted) ในการสุ่ม จึงไม่มีการฝังความสัมพันธ์ระหว่าง GPA/ทักษะ/Portfolio กับการได้ที่ฝึกงาน
// - ทักษะที่ตรงกับสายงานที่สนใจมีแนวโน้มสูงขึ้นเล็กน้อย เพื่อให้ Heatmap รายสายงานมีความหมายสำหรับการสาธิต
// - มีค่าว่างโดยตั้งใจ (null) เพื่อทดสอบการแสดงสถานะ "ไม่มีข้อมูล" · ไม่แทนด้วยศูนย์
// - ไม่สร้าง URL ผลงาน เก็บเพียงสถานะว่ามีหลักฐานผลงานหรือไม่
import { readFileSync, writeFileSync } from 'node:fs'
import { roleBenchmarks, skillIds } from '../src/lib/skills.ts'
import type { Portfolio, SkillLevels, StudentProfile } from '../src/lib/types.ts'

const seed = 20251024
const sourcePath = new URL('../src/data/internships.json', import.meta.url)
const outputPath = new URL('../src/data/profiles.json', import.meta.url)

// mulberry32: PRNG ขนาดเล็กที่ให้ผลเหมือนเดิมทุกครั้งเมื่อ seed เท่าเดิม
function createRandom(initial: number) {
  let state = initial >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const random = createRandom(seed)
const chance = (p: number) => random() < p
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function normal(mean: number, sd: number) {
  const u = 1 - random()
  const v = random()
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function pickWeighted<T>(items: [T, number][]) {
  const total = items.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = random() * total
  for (const [item, weight] of items) {
    roll -= weight
    if (roll < 0) return item
  }
  return items[items.length - 1][0]
}

function pickDistinct<T>(pool: T[], count: number) {
  const copy = [...pool]
  const result: T[] = []
  while (result.length < count && copy.length > 0) {
    result.push(copy.splice(Math.floor(random() * copy.length), 1)[0])
  }
  return result
}

const projectTypes = ['โครงงานรายวิชา', 'โครงงานส่วนตัว', 'แข่งขัน / Hackathon', 'งานชมรม / จิตอาสา', 'งานฟรีแลนซ์']

const roleTechnologies: Record<string, string[]> = {
  'Frontend Development': ['React', 'TypeScript', 'Vue', 'Tailwind CSS', 'Figma'],
  'Backend Development': ['Node.js', 'Express', 'Go', 'PostgreSQL', 'Spring Boot'],
  'Full Stack Development': ['React', 'Node.js', 'Next.js', 'PostgreSQL', 'MongoDB'],
  'Data Analytics': ['Python', 'pandas', 'SQL', 'Power BI', 'Excel'],
  'Data Engineering': ['Python', 'SQL', 'Airflow', 'Spark', 'BigQuery'],
  'AI / Machine Learning': ['Python', 'scikit-learn', 'PyTorch', 'pandas', 'Jupyter'],
  'DevOps / Cloud': ['Docker', 'Kubernetes', 'GitHub Actions', 'AWS', 'Terraform'],
  Cybersecurity: ['Linux', 'Wireshark', 'Burp Suite', 'Python', 'Nmap'],
  'Network / IT Support': ['Cisco Packet Tracer', 'Linux', 'Windows Server', 'Bash'],
  'QA / Software Testing': ['Playwright', 'Postman', 'Jest', 'Cypress', 'Selenium'],
  'Mobile Development': ['Flutter', 'Kotlin', 'Swift', 'React Native', 'Firebase'],
}
const commonTechnologies = ['Git', 'Python', 'Java', 'C/C++', 'JavaScript']

function generateSkills(role: string | null): SkillLevels | null {
  // 2% ไม่มีผลประเมินทักษะทั้งชุด
  if (chance(0.02)) return null
  const benchmark = (role && roleBenchmarks[role]) || {}
  return Object.fromEntries(
    skillIds.map((id) => {
      if (chance(0.04)) return [id, null]
      const roleBoost = benchmark[id] !== undefined ? normal(1.2, 0.7) : 0
      return [id, Math.round(clamp(normal(1.5, 0.9) + roleBoost, 0, 5))]
    }),
  ) as SkillLevels
}

function generatePortfolio(role: string | null): Portfolio | null {
  // 5% ไม่มีข้อมูล Portfolio
  if (chance(0.05)) return null
  const projectCount = chance(0.03)
    ? null
    : pickWeighted<number>([[0, 8], [1, 15], [2, 22], [3, 22], [4, 15], [5, 9], [6, 5], [7, 4]])
  if (projectCount === 0) {
    return { projectCount, projectTypes: [], technologies: [], hasEvidence: false }
  }
  const typeCount = Math.min(projectCount ?? 1, 1 + Math.floor(random() * 3))
  const pool = [...new Set([...(role ? roleTechnologies[role] ?? [] : []), ...commonTechnologies])]
  return {
    projectCount,
    projectTypes: pickDistinct(projectTypes, typeCount),
    technologies: pickDistinct(pool, 1 + Math.floor(random() * 4)),
    hasEvidence: chance(0.08) ? null : chance(0.7),
  }
}

type SourceStudent = { studentId: string; recordId: string; interestedRole: string | null }
const source = JSON.parse(readFileSync(sourcePath, 'utf8')) as { students: SourceStudent[] }
const ordered = [...source.students].sort((a, b) => a.recordId.localeCompare(b.recordId))

const profiles: StudentProfile[] = ordered.map((student) => ({
  studentId: student.studentId,
  // 4% ไม่มีข้อมูล GPA
  gpa: chance(0.04) ? null : Number(clamp(normal(3.02, 0.42), 1.75, 4).toFixed(2)),
  skills: generateSkills(student.interestedRole),
  portfolio: generatePortfolio(student.interestedRole),
}))

const output = {
  metadata: {
    schemaVersion: 1,
    joinKey: 'studentId',
    sourceFile: 'src/data/internships.json',
    generator: 'scripts/generate-profiles.ts',
    seed,
    dataType: 'ข้อมูลจำลอง',
    simulatedFields: ['gpa', 'skills', 'portfolio.projectCount', 'portfolio.projectTypes', 'portfolio.technologies', 'portfolio.hasEvidence'],
    note: 'ข้อมูลจำลองทั้งหมด สุ่มโดยไม่อ้างอิงสถานะการตอบรับ ใช้สาธิตการวิเคราะห์เท่านั้น ไม่ใช้ยืนยันปัจจัยความสำเร็จหรือตลาดงานจริง',
    recordCount: profiles.length,
  },
  profiles,
}

writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`)
console.log(`เขียน ${profiles.length} รายการไปที่ src/data/profiles.json (seed ${seed})`)
