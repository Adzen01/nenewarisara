import type { SkillId, SkillLevels } from './types.ts'

export type SkillDefinition = { id: SkillId; label: string; short: string }

export const skillDefinitions: SkillDefinition[] = [
  { id: 'programming', label: 'การเขียนโปรแกรมพื้นฐาน', short: 'Programming' },
  { id: 'frontend', label: 'Web Frontend (HTML/CSS/JS/React)', short: 'Frontend' },
  { id: 'backend', label: 'Backend และ API', short: 'Backend/API' },
  { id: 'database', label: 'ฐานข้อมูลและ SQL', short: 'Database/SQL' },
  { id: 'dataAnalysis', label: 'วิเคราะห์ข้อมูลและสถิติ', short: 'Data Analysis' },
  { id: 'ml', label: 'Machine Learning', short: 'ML' },
  { id: 'cloud', label: 'Cloud / DevOps', short: 'Cloud/DevOps' },
  { id: 'network', label: 'เครือข่ายคอมพิวเตอร์', short: 'Network' },
  { id: 'security', label: 'ความปลอดภัยไซเบอร์', short: 'Security' },
  { id: 'testing', label: 'การทดสอบซอฟต์แวร์', short: 'Testing' },
  { id: 'mobile', label: 'พัฒนาแอปมือถือ', short: 'Mobile' },
  { id: 'git', label: 'Git และการทำงานร่วมกัน', short: 'Git' },
]

export const skillIds = skillDefinitions.map((skill) => skill.id)

export function skillLabel(id: SkillId) {
  return skillDefinitions.find((skill) => skill.id === id)?.label ?? id
}

export const maxSkillLevel = 5

// ความหมายของระดับทักษะ ใช้ทั้งในข้อมูล ตัวกรอง และเกณฑ์ Skill Gap
export const skillLevelMeanings: { level: number; label: string; description: string }[] = [
  { level: 0, label: 'ยังไม่มีประสบการณ์', description: 'ยังไม่เคยเรียนหรือลองใช้' },
  { level: 1, label: 'รู้จักแนวคิด', description: 'อธิบายแนวคิดพื้นฐานได้ แต่ยังไม่เคยลงมือทำ' },
  { level: 2, label: 'ทำตามตัวอย่างได้', description: 'ทำแบบฝึกหัดหรือทำตามบทเรียนได้โดยมีตัวอย่างประกอบ' },
  { level: 3, label: 'ทำงานเองได้', description: 'ทำโจทย์ทั่วไปหรือโปรเจกต์ขนาดเล็กได้เอง' },
  { level: 4, label: 'ประยุกต์ได้', description: 'แก้ปัญหาที่ซับซ้อนขึ้นและเลือกวิธีที่เหมาะสมได้' },
  { level: 5, label: 'แนะนำผู้อื่นได้', description: 'ออกแบบแนวทาง ตรวจงาน หรือสอนผู้อื่นได้' },
]

// เกณฑ์ตัวอย่างที่ทีมผู้จัดทำกำหนดเพื่อสาธิตการคำนวณ Skill Gap
// ไม่ใช่ข้อกำหนดของบริษัทใด และไม่ได้มาจากประกาศรับสมัครจริง
export const roleBenchmarks: Record<string, Partial<Record<SkillId, number>>> = {
  'Frontend Development': { programming: 3, frontend: 4, backend: 2, testing: 2, git: 3 },
  'Backend Development': { programming: 4, backend: 4, database: 3, testing: 2, git: 3 },
  'Full Stack Development': { programming: 3, frontend: 3, backend: 3, database: 3, git: 3 },
  'Data Analytics': { programming: 2, database: 3, dataAnalysis: 4, git: 2 },
  'Data Engineering': { programming: 3, database: 4, dataAnalysis: 2, cloud: 3, git: 3 },
  'AI / Machine Learning': { programming: 3, database: 2, dataAnalysis: 3, ml: 4, git: 3 },
  'DevOps / Cloud': { programming: 3, cloud: 4, network: 3, security: 2, git: 3 },
  Cybersecurity: { programming: 2, network: 3, security: 4, cloud: 2, git: 2 },
  'Network / IT Support': { programming: 1, network: 4, security: 2, cloud: 2 },
  'QA / Software Testing': { programming: 3, testing: 4, database: 2, frontend: 2, git: 3 },
  'Mobile Development': { programming: 3, mobile: 4, backend: 2, testing: 2, git: 3 },
}

export const benchmarkRoles = Object.keys(roleBenchmarks)

// ตำแหน่งฝึกงานในชุดข้อมูล → สายงานที่ใช้เกณฑ์ตัวอย่างร่วมกัน
export const positionRole: Record<string, string> = {
  'Frontend Developer Intern': 'Frontend Development',
  'Backend Developer Intern': 'Backend Development',
  'Full Stack Developer Intern': 'Full Stack Development',
  'Data Analyst Intern': 'Data Analytics',
  'Data Engineer Intern': 'Data Engineering',
  'AI / ML Engineer Intern': 'AI / Machine Learning',
  'DevOps Engineer Intern': 'DevOps / Cloud',
  'Cybersecurity Intern': 'Cybersecurity',
  'IT Support Intern': 'Network / IT Support',
  'QA Engineer Intern': 'QA / Software Testing',
  'Mobile Developer Intern': 'Mobile Development',
}

export const skillActivities: Record<SkillId, string[]> = {
  programming: ['ทำโจทย์ฝึกเขียนโปรแกรมสัปดาห์ละ 3 ข้อ และอธิบายวิธีคิด', 'เขียนโปรแกรมเล็กที่อ่านไฟล์ ประมวลผล และมี unit test'],
  frontend: ['สร้างหน้าเว็บ responsive จากแบบที่กำหนด', 'ทำแอป React ที่มีฟอร์ม ตัวกรอง และ empty state'],
  backend: ['ทำ REST API ที่มี validation และ error response ชัดเจน', 'เขียนเอกสาร API และตัวอย่าง request'],
  database: ['ออกแบบ ER diagram และ schema ของระบบตัวอย่าง', 'ฝึกเขียน SQL แบบ JOIN และ GROUP BY กับชุดข้อมูลจริงที่เปิดเผย'],
  dataAnalysis: ['ตั้งคำถามและวิเคราะห์ชุดข้อมูลสาธารณะพร้อมระบุตัวหาร', 'ทำกราฟที่มีหน่วย คำอธิบายสี และข้อจำกัดของข้อมูล'],
  ml: ['ทำ baseline model และเทียบกับโมเดลที่เลือก', 'เขียน model card สรุป metric และข้อจำกัด'],
  cloud: ['ทำ Dockerfile และ pipeline สำหรับ build/test', 'deploy แอปตัวอย่างพร้อม health check'],
  network: ['จำลองเครือข่ายด้วย subnet และ routing ใน lab', 'ฝึกแก้ปัญหา DNS/DHCP และจดขั้นตอนตรวจ'],
  security: ['ทำ threat model ของแอปที่สร้างเอง', 'ฝึกใน lab ที่อนุญาต และเขียนรายงานพร้อมวิธีแก้'],
  testing: ['เขียน test case จาก user flow ของแอปตัวอย่าง', 'ทำ automated test สำหรับเส้นทางใช้งานหลัก'],
  mobile: ['ทำแอปมือถือที่มีหน้ารายการและรายละเอียด', 'รองรับ loading/error/offline state'],
  git: ['ใช้ branch และ pull request กับโปรเจกต์กลุ่ม', 'เขียน README และ commit message ที่อธิบายการเปลี่ยนแปลง'],
}

export type SkillGapRow = {
  skill: SkillId
  label: string
  target: number
  current: number | null
  // max(target − current, 0) · null เมื่อไม่มีระดับปัจจุบัน
  gap: number | null
}

export function computeSkillGap(levels: SkillLevels | null, benchmark: Partial<Record<SkillId, number>>): SkillGapRow[] {
  return skillDefinitions
    .filter((skill) => benchmark[skill.id] !== undefined)
    .map((skill) => {
      const target = benchmark[skill.id] as number
      const current = levels?.[skill.id] ?? null
      return {
        skill: skill.id,
        label: skill.label,
        target,
        current,
        gap: current === null ? null : Math.max(target - current, 0),
      }
    })
}

// ทักษะที่ควรฝึกก่อน: ช่องว่างมากก่อน ถ้าเท่ากันเลือกทักษะที่เกณฑ์สูงกว่า
export function prioritizeGaps(rows: SkillGapRow[]) {
  return rows
    .filter((row): row is SkillGapRow & { gap: number } => row.gap !== null && row.gap > 0)
    .sort((a, b) => b.gap - a.gap || b.target - a.target || skillIds.indexOf(a.skill) - skillIds.indexOf(b.skill))
}

// ต้องมีผลประเมินอย่างน้อยครึ่งหนึ่งของทักษะทั้งหมด จึงคำนวณคะแนนเฉลี่ย
export const minRatedSkills = Math.ceil(skillIds.length / 2)

// คะแนนทักษะเฉลี่ย 0–5 จากทักษะที่มีผลประเมิน · ไม่ใช่เปอร์เซ็นต์โอกาสได้ฝึกงาน
export function skillScore(levels: SkillLevels | null): number | null {
  if (!levels) return null
  const rated = skillIds.map((id) => levels[id]).filter((value): value is number => value !== null)
  if (rated.length < minRatedSkills) return null
  return rated.reduce((sum, value) => sum + value, 0) / rated.length
}

export function emptySkillLevels(): SkillLevels {
  return Object.fromEntries(skillIds.map((id) => [id, null])) as SkillLevels
}
