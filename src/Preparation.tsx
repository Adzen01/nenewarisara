import { useState } from 'react'
import PageHeader from './components/PageHeader'
import { InfoIcon } from './components/Icons'
import { fullName, students, uniqueSorted } from './lib/internshipStats'
import {
  checklistStorageKey,
  isBoolean,
  isSkillLevel,
  manualSkillsStorageKey,
  readRecord,
  writeRecord,
} from './lib/checklistStorage'
import {
  computeSkillGap,
  emptySkillLevels,
  maxSkillLevel,
  prioritizeGaps,
  roleBenchmarks,
  skillActivities,
  skillDefinitions,
  skillLevelMeanings,
} from './lib/skills'
import type { SkillGapRow } from './lib/skills'
import type { SkillLevels } from './lib/types'
import './Preparation.css'

type Task = {
  id: string
  text: string
}

type Guide = {
  skills: string[]
  projects: ProjectIdea[]
}

type ProjectIdea = {
  title: string
  summary: string
  build: string[]
  showcase: string
}

const roles = uniqueSorted(students.map((student) => student.interestedRole))

const commonTasks: Task[] = [
  { id: 'resume', text: 'จัดทำ Resume พร้อมข้อมูลติดต่อที่ตรวจสอบแล้ว' },
  { id: 'portfolio', text: 'เลือกผลงานและอธิบายหน้าที่ที่ตนเองทำ' },
  { id: 'github', text: 'จัดระเบียบ GitHub และเขียน README ของโปรเจกต์' },
  { id: 'intro', text: 'ฝึกแนะนำตัวและอธิบายโปรเจกต์ให้เข้าใจง่าย' },
  { id: 'requirements', text: 'อ่านประกาศรับสมัครจริงและจดทักษะที่ยังต้องฝึก' },
]

// id คงเดิมเพื่อให้รายการที่ติ๊กไว้ในเบราว์เซอร์ยังอยู่
function getRoleTasks(guide: Guide): Task[] {
  return [
    { id: 'basics', text: `ทบทวนพื้นฐาน: ${guide.skills.join(', ')}` },
    { id: 'project', text: `ทำโปรเจกต์ตัวอย่าง เช่น “${guide.projects[0]?.title ?? 'ผลงานของตนเอง'}” ให้ใช้งานได้` },
    { id: 'testing', text: 'ทดสอบผลงานและบันทึกปัญหาที่แก้ไข' },
    { id: 'explain', text: 'เขียนสรุปวิธีทำ ผลลัพธ์ และข้อจำกัดของผลงาน' },
  ]
}

function readManualLevels(): SkillLevels {
  const saved = readRecord(manualSkillsStorageKey, isSkillLevel)
  const levels = emptySkillLevels()
  for (const skill of skillDefinitions) {
    if (saved[skill.id] !== undefined) levels[skill.id] = saved[skill.id]
  }
  return levels
}

const sortedStudents = [...students].sort((a, b) => a.studentId.localeCompare(b.studentId))

function GapMeter({ row }: { row: SkillGapRow }) {
  return (
    <span className="gap-meter" aria-hidden="true">
      {row.current !== null && <span className="gap-current" style={{ width: `${(row.current / maxSkillLevel) * 100}%` }} />}
      <span className="gap-target" style={{ left: `${(row.target / maxSkillLevel) * 100}%` }} />
    </span>
  )
}

function getGuide(role: string): Guide {
  const name = role.toLowerCase()

  if (name.includes('full stack') || name.includes('fullstack')) {
    return {
      skills: ['HTML / CSS / JavaScript', 'React', 'API และฐานข้อมูล', 'Git'],
      projects: [
        { title: 'ระบบติดตามการสมัครฝึกงาน', summary: 'จัดการบริษัท ตำแหน่ง สถานะ และวันนัดหมายในที่เดียว', build: ['ทำ CRUD พร้อม validation และค้นหา/กรอง', 'ออกแบบ API และฐานข้อมูลให้เชื่อมกัน', 'เพิ่มประวัติการเปลี่ยนสถานะหรือ export รายการ'], showcase: 'ภาพหน้าจอ, ER diagram, API examples และบัญชีทดลอง' },
        { title: 'ระบบจองอุปกรณ์ห้องแล็บ', summary: 'ให้ผู้ใช้ดูอุปกรณ์ว่าง จองเวลา และติดตามรายการของตนเอง', build: ['ทำระบบ role ผู้ใช้และผู้ดูแลแบบง่าย', 'ป้องกันการจองเวลาซ้ำและตรวจสอบข้อมูล', 'แสดงสถานะการจองและประวัติการใช้งาน'], showcase: 'user flow, schema, test cases และคลิปสาธิตการจอง' },
      ],
    }
  }

  if (name.includes('frontend') || name.includes('front-end')) {
    return {
      skills: ['HTML / CSS / JavaScript', 'React', 'Responsive Design', 'Git'],
      projects: [
        { title: 'Dashboard สำรวจข้อมูลฝึกงาน', summary: 'ช่วยค้นหาและเปรียบเทียบข้อมูลจากชุดข้อมูลที่ระบุแหล่งที่มา', build: ['ทำตัวกรองที่อัปเดตตัวเลขและกราฟพร้อมกัน', 'ออกแบบตารางให้อ่านได้บนมือถือและใช้แป้นพิมพ์ได้', 'ทำ empty state, loading state และข้อความอธิบายหน่วย'], showcase: 'ภาพหน้าจอหลายขนาด, live demo และตัวอย่างการใช้งานตัวกรอง' },
        { title: 'เว็บติดตามงานสมัคร', summary: 'ช่วยจัดลำดับบริษัทที่สนใจและจดบันทึกขั้นตอนของตนเอง', build: ['สร้างมุมมองรายการและรายละเอียด', 'จำสถานะบนอุปกรณ์หรือเชื่อม API', 'เพิ่มค้นหาและแจ้งเตือนวันติดตามผล'], showcase: 'user flow, เหตุผลในการออกแบบ และข้อจำกัดของข้อมูลทดลอง' },
      ],
    }
  }

  if (name.includes('backend') || name.includes('back-end')) {
    return {
      skills: ['ภาษาฝั่ง Server', 'HTTP / REST API', 'SQL', 'การตรวจสอบข้อมูล'],
      projects: [
        { title: 'Internship Directory API', summary: 'ให้บริการข้อมูลบริษัท ตำแหน่ง และรายการสมัครด้วย REST API', build: ['กำหนด schema, validation และ pagination', 'จัดการ error response และ logging ให้สม่ำเสมอ', 'เขียน unit/integration tests สำหรับกรณีสำคัญ'], showcase: 'API documentation, request examples, schema และผลทดสอบ' },
        { title: 'ระบบยืมคืนอุปกรณ์', summary: 'จัดการรายการอุปกรณ์ คำขอยืม และกำหนดคืน', build: ['สร้าง endpoint ตาม resource และสถานะ', 'ป้องกันข้อมูลไม่ครบและคำขอซ้ำ', 'เพิ่ม filter, sort และ audit trail เบื้องต้น'], showcase: 'sequence diagram, API collection และตัวอย่าง error cases' },
      ],
    }
  }

  if (name.includes('qa') || name.includes('testing')) {
    return {
      skills: ['Test Case', 'Bug Report', 'API Testing', 'Automated Testing'],
      projects: [
        { title: 'แผนทดสอบ Internship Dashboard', summary: 'แสดงวิธีตรวจความถูกต้องของตัวกรอง ตาราง และตัวเลขสรุป', build: ['เขียน test scenario จาก user flow', 'ทดสอบ edge cases เช่น ไม่มีผลลัพธ์และข้อมูลไม่ครบ', 'ทำ automation สำหรับเส้นทางใช้งานหลัก'], showcase: 'test plan, test cases, bug report และผลรันที่ทำซ้ำได้' },
        { title: 'ชุดทดสอบ API', summary: 'ตรวจสัญญา API และพฤติกรรมเมื่อรับข้อมูลถูก/ผิดรูปแบบ', build: ['ครอบคลุม success, validation และ permission cases', 'แยก test data และจัดการ cleanup', 'เชื่อมชุดทดสอบกับ CI ให้รันอัตโนมัติ'], showcase: 'coverage ที่ตีความได้, ตัวอย่าง defect และไฟล์ตั้งค่ารันทดสอบ' },
      ],
    }
  }

  if (name.includes('data engineering')) {
    return {
      skills: ['Python', 'SQL', 'ETL', 'การตรวจคุณภาพข้อมูล'],
      projects: [
        { title: 'Pipeline ข้อมูลสมัครฝึกงาน', summary: 'นำเข้าข้อมูลจากไฟล์ตัวอย่าง ตรวจคุณภาพ และจัดเก็บในฐานข้อมูล', build: ['แยกขั้นตอน extract, transform และ load', 'ตรวจ schema, ค่าว่าง, ค่าซ้ำ และชนิดข้อมูล', 'บันทึกจำนวนแถวที่ผ่าน/ไม่ผ่านพร้อมเหตุผล'], showcase: 'data flow diagram, quality report และตัวอย่างข้อมูลก่อน/หลัง' },
        { title: 'Incremental data loader', summary: 'อัปเดตเฉพาะข้อมูลที่เปลี่ยนและเก็บร่องรอยการประมวลผล', build: ['กำหนด key สำหรับตรวจรายการใหม่/เปลี่ยนแปลง', 'ทำให้รันซ้ำได้โดยไม่สร้างข้อมูลซ้ำ', 'เพิ่ม log, retry และการจัดการความล้มเหลว'], showcase: 'ตัวอย่าง run log, ตารางผลลัพธ์ และวิธี recovery' },
      ],
    }
  }

  if (name.includes('data analy')) {
    return {
      skills: ['Spreadsheet', 'SQL', 'สถิติพื้นฐาน', 'Data Visualization'],
      projects: [
        { title: 'รายงานสำรวจข้อมูลฝึกงาน', summary: 'ตอบคำถามที่ชัดเจนด้วยตัวเลข กราฟ และการอธิบายขอบเขตข้อมูล', build: ['ตรวจจำนวนแถว ค่าว่าง ค่าซ้ำ และนิยามตัวแปร', 'เลือกกราฟตามคำถามและระบุหน่วย/ตัวหาร', 'สรุปสิ่งที่ข้อมูลบอกได้และบอกไม่ได้'], showcase: 'รายงานสั้น, notebook ที่รันซ้ำได้ และ data dictionary' },
        { title: 'วิเคราะห์แนวโน้มรายปี', summary: 'เปรียบเทียบกลุ่มหรือช่วงเวลาโดยใช้ฐานคำนวณที่เทียบกันได้', build: ['คำนวณอัตราจาก numerator/denominator ที่ถูกต้อง', 'ตรวจความต่างของขนาดกลุ่มและข้อมูลที่หายไป', 'เพิ่มกราฟและตารางตรวจสอบค่าที่ใช้'], showcase: 'คำถามวิเคราะห์, ขั้นคำนวณ และข้อจำกัดก่อนสรุปผล' },
      ],
    }
  }

  if (name.includes('devops') || name.includes('cloud')) {
    return {
      skills: ['Linux', 'Docker', 'CI/CD', 'Logs และ Monitoring'],
      projects: [
        { title: 'CI/CD สำหรับเว็บตัวอย่าง', summary: 'ทำให้การตรวจและส่งเว็บรุ่นใหม่ทำซ้ำได้', build: ['สร้าง pipeline สำหรับ lint และ build', 'ทำ Docker image และ deploy ไป environment ทดลอง', 'เพิ่ม health check และขั้นตอน rollback'], showcase: 'pipeline file, architecture diagram และ log การ deploy' },
        { title: 'ระบบติดตามสถานะบริการ', summary: 'รวบรวม health check และ log เพื่อสังเกตปัญหาของแอปทดลอง', build: ['ตั้ง health endpoint และตรวจตามรอบ', 'กำหนด alert จากเงื่อนไขที่อธิบายได้', 'เขียน runbook สำหรับตรวจและกู้ระบบ'], showcase: 'dashboard จากระบบทดลอง, alert ตัวอย่าง และ runbook' },
      ],
    }
  }

  if (name.includes('cyber') || name.includes('security')) {
    return {
      skills: ['Network', 'Linux', 'Web Security', 'การเขียนรายงานช่องโหว่'],
      projects: [
        { title: 'Security review เว็บทดลอง', summary: 'ตรวจการตั้งค่าความปลอดภัยของแอปที่สร้างเองหรือแล็บที่ได้รับอนุญาต', build: ['ทำ threat model และระบุขอบเขตการทดสอบ', 'ตรวจ input validation, session และ security headers', 'จัดลำดับความเสี่ยงพร้อมแนวทางแก้และ retest'], showcase: 'ขอบเขตที่ได้รับอนุญาต, หลักฐานแบบปกปิดข้อมูล และ remediation report' },
        { title: 'Secure coding demo', summary: 'สาธิตช่องโหว่ในแอปจำลองและแสดงวิธีแก้แบบปลอดภัย', build: ['ใช้ข้อมูลสมมติในสภาพแวดล้อม local เท่านั้น', 'เปรียบเทียบโค้ดก่อน/หลังแก้', 'เพิ่ม test เพื่อป้องกัน regression'], showcase: 'โค้ดตัวอย่าง, test ที่ยืนยันการแก้ และบทเรียนที่ได้' },
      ],
    }
  }

  if (name.includes('network') || name.includes('support')) {
    return {
      skills: ['TCP/IP', 'การตั้งค่าเครือข่าย', 'ระบบปฏิบัติการ', 'Troubleshooting'],
      projects: [
        { title: 'แล็บเครือข่ายสำนักงานขนาดเล็ก', summary: 'จำลองการแบ่งเครือข่ายและการเชื่อมต่อบริการพื้นฐาน', build: ['วาง subnet, routing และแผน IP', 'ทดสอบ DNS, DHCP และการเชื่อมต่อ', 'บันทึกจุดตรวจและวิธีแก้เมื่อใช้งานไม่ได้'], showcase: 'network diagram, configuration ที่ลบข้อมูลลับแล้ว และ test log' },
        { title: 'คู่มือวิเคราะห์ปัญหา IT', summary: 'ทำ runbook สำหรับอาการที่พบบ่อยและแนวทางแยกสาเหตุ', build: ['จัดลำดับคำถามและขั้นตอนตรวจทีละข้อ', 'แนบคำสั่งตรวจสอบพร้อมผลที่คาดหวัง', 'ระบุเงื่อนไขส่งต่อและวิธีบันทึก incident'], showcase: 'runbook, decision tree และเคสจำลองที่ทดลองทำตาม' },
      ],
    }
  }

  if (name.includes('mobile')) {
    return {
      skills: ['เครื่องมือพัฒนาแอปมือถือ', 'UI และ Navigation', 'API', 'State'],
      projects: [
        { title: 'แอปติดตามการสมัคร', summary: 'เก็บรายการบริษัทที่สนใจและอัปเดตสถานะการสมัครได้จากมือถือ', build: ['ทำหน้ารายการ รายละเอียด และแบบฟอร์มเพิ่มข้อมูล', 'รองรับ loading, error และ offline state', 'ออกแบบให้ใช้ได้ด้วยมือเดียวและตัวอักษรอ่านง่าย'], showcase: 'ภาพหน้าจอ, flow การใช้งาน และวิดีโอสาธิตบน emulator' },
        { title: 'แอปเช็กลิสต์เตรียมสัมภาษณ์', summary: 'จัดหมวดหัวข้อฝึกและบันทึกความคืบหน้าเฉพาะผู้ใช้', build: ['แยกหมวดและค้นหารายการได้', 'บันทึกสถานะในเครื่องหรือซิงก์ผ่าน API', 'เพิ่ม accessibility labels และทดสอบหลายขนาดจอ'], showcase: 'หน้าจอจริง, usability notes และวิธีจัดเก็บข้อมูล' },
      ],
    }
  }

  if (name.includes('ai') || name.includes('machine') || name.includes('ml')) {
    return {
      skills: ['Python', 'การเตรียมข้อมูล', 'Machine Learning', 'การประเมินโมเดล'],
      projects: [
        { title: 'โมเดลจำแนกข้อมูลสาธารณะ', summary: 'เปรียบเทียบ baseline กับโมเดลที่เลือกและรายงานความคลาดเคลื่อน', build: ['ตรวจคุณภาพข้อมูลและป้องกัน data leakage', 'แยก train/validation/test อย่างเหมาะสม', 'ใช้ metric ให้ตรงกับโจทย์และอธิบายข้อจำกัด'], showcase: 'notebook, model card, confusion matrix และตัวอย่างความผิดพลาด' },
        { title: 'เว็บทดลอง inference', summary: 'ให้ผู้ใช้ทดลองป้อนข้อมูลตัวอย่างและดูผลโมเดลพร้อมคำอธิบาย', build: ['ทำ preprocessing ให้ตรงกับตอน train', 'แสดง confidence/ข้อจำกัดอย่างไม่กล่าวเกินจริง', 'ทดสอบ input ผิดรูปแบบและ latency เบื้องต้น'], showcase: 'demo, model card, input/output examples และข้อควรระวัง' },
      ],
    }
  }

  return {
    skills: ['พื้นฐานของสายงาน', 'Git', 'การแก้ปัญหา', 'การสื่อสาร'],
    projects: [
      { title: 'เครื่องมือแก้ปัญหาเล็ก ๆ', summary: 'เลือกปัญหาจริงใกล้ตัวและทำต้นแบบที่คนอื่นทดลองใช้ได้', build: ['เขียนโจทย์และผู้ใช้เป้าหมายให้ชัด', 'ทำรุ่นเล็กให้จบก่อนเพิ่มฟีเจอร์', 'ทดสอบกับกรณีใช้งานจริงและแก้จาก feedback'], showcase: 'ภาพการใช้งาน, วิธีติดตั้ง, ผลทดสอบ และสิ่งที่เรียนรู้' },
      { title: 'ผลงานต่อยอดวิชาเรียน', summary: 'นำสิ่งที่เรียนมาปรับเป็นชิ้นงานที่มีโจทย์และผลลัพธ์ตรวจสอบได้', build: ['ระบุส่วนที่พัฒนาต่อจากโจทย์เดิม', 'อธิบายบทบาทของตนเองและการตัดสินใจ', 'เพิ่ม test หรือการวัดผลตามลักษณะงาน'], showcase: 'โจทย์เดิม/สิ่งที่เพิ่ม, demo และสรุปข้อจำกัด' },
    ],
  }
}

export default function Preparation() {
  const [selectedRole, setSelectedRole] = useState(
    () => roles.find((role) => role.toLowerCase().includes('frontend')) ?? roles[0] ?? '',
  )
  const [checked, setChecked] = useState<Record<string, boolean>>(() => readRecord(checklistStorageKey, isBoolean))
  const [saveError, setSaveError] = useState('')
  const [source, setSource] = useState<'sample' | 'manual'>('sample')
  const [sampleId, setSampleId] = useState(sortedStudents[0]?.recordId ?? '')
  const [manualLevels, setManualLevels] = useState<SkillLevels>(readManualLevels)

  const sampleStudent = sortedStudents.find((student) => student.recordId === sampleId) ?? null
  const currentLevels: SkillLevels | null = source === 'manual' ? manualLevels : sampleStudent?.profile?.skills ?? null
  const benchmark = roleBenchmarks[selectedRole]
  const gapRows = benchmark ? computeSkillGap(currentLevels, benchmark) : []
  const knownRows = gapRows.filter((row) => row.gap !== null)
  const missingRows = gapRows.filter((row) => row.gap === null)
  const priorities = prioritizeGaps(gapRows)
  const insufficient = !benchmark || knownRows.length === 0
  const metCount = knownRows.filter((row) => row.gap === 0).length
  const gapTasks = priorities.flatMap((row) =>
    skillActivities[row.skill].map((text, index) => ({ key: `gap:${selectedRole}:${row.skill}:${index}`, text })),
  )
  const gapCompleted = gapTasks.filter((task) => checked[task.key]).length

  function chooseSample(recordId: string) {
    setSampleId(recordId)
    const role = sortedStudents.find((student) => student.recordId === recordId)?.interestedRole
    // ใช้สายงานที่นิสิตสนใจเป็นค่าเริ่มต้น ผู้ใช้เปลี่ยนสายงานเป้าหมายเองได้
    if (role && roles.includes(role)) setSelectedRole(role)
  }

  function setManualLevel(skill: keyof SkillLevels, value: string) {
    const next = { ...manualLevels, [skill]: value === '' ? null : Number(value) }
    setManualLevels(next)
    const toSave = Object.fromEntries(Object.entries(next).filter(([, level]) => level !== null))
    if (!writeRecord(manualSkillsStorageKey, toSave)) {
      setSaveError('เบราว์เซอร์บันทึกไม่ได้ ค่าที่กรอกจะอยู่เฉพาะระหว่างเปิดหน้านี้')
    }
  }

  function resetManual() {
    setManualLevels(emptySkillLevels())
    writeRecord(manualSkillsStorageKey, {})
  }

  const guide = getGuide(selectedRole)
  const roleTasks = getRoleTasks(guide).map((task) => ({ ...task, key: `role:${selectedRole}:${task.id}` }))
  const generalTasks = commonTasks.map((task) => ({ ...task, key: `common:${task.id}` }))
  const tasks = [...generalTasks, ...roleTasks]
  const completed = tasks.filter((task) => checked[task.key]).length

  function toggleTask(key: string) {
    const next = { ...checked, [key]: !checked[key] }
    setChecked(next)
    setSaveError(writeRecord(checklistStorageKey, next) ? '' : 'เบราว์เซอร์บันทึกไม่ได้ รายการที่ติ๊กจะอยู่เฉพาะระหว่างเปิดหน้านี้')
  }

  function renderTask(task: Task & { key: string }) {
    const inputId = `task-${task.key.replace(/[^a-zA-Z0-9]+/g, '-')}`
    return (
      <li key={task.key}>
        <input id={inputId} type="checkbox" checked={Boolean(checked[task.key])} onChange={() => toggleTask(task.key)} />
        <label htmlFor={inputId}>{task.text}</label>
      </li>
    )
  }

  const roleSelect = (
    <div className="field prep-role-field">
      <label className="field-label" htmlFor="prep-role">สายงานเป้าหมาย</label>
      <select
        id="prep-role"
        value={selectedRole}
        onChange={(event) => setSelectedRole(event.target.value)}
        disabled={roles.length === 0}
      >
        {roles.length === 0 && <option value="">ไม่มีสายงานในชุดข้อมูล</option>}
        {roles.map((role) => <option key={role} value={role}>{role}</option>)}
      </select>
    </div>
  )

  return (
    <section className="page" aria-labelledby="prep-title">
      <PageHeader
        id="prep-title"
        title="เตรียมความพร้อม"
        description="เลือกนิสิตตัวอย่างหรือกรอกระดับทักษะของตนเอง เทียบกับเกณฑ์ตัวอย่างของสายงานเป้าหมาย แล้วใช้เช็กลิสต์ติดตามสิ่งที่ลงมือทำ"
        actions={roleSelect}
      />

      <p className="callout">
        <InfoIcon />
        <span>
          เกณฑ์ระดับทักษะและเนื้อหานี้เป็นตัวอย่างที่ทีมผู้จัดทำกำหนด ไม่ใช่ข้อกำหนดของบริษัท ควรตรวจคุณสมบัติจากประกาศรับสมัครจริงก่อนสมัคร ·
          Skill Gap ไม่ใช่คะแนนหรือเปอร์เซ็นต์โอกาสได้ฝึกงาน
        </span>
      </p>

      <div className="gap-layout">
        <section className="panel" aria-labelledby="gap-input-title">
          <header className="panel-header">
            <div>
              <h2 id="gap-input-title">ระดับทักษะปัจจุบัน</h2>
              <p className="panel-meta">ระดับ 0–5 · เลือกแหล่งข้อมูล</p>
            </div>
          </header>
          <div className="segmented" role="group" aria-label="แหล่งข้อมูลระดับทักษะ">
            <button type="button" aria-pressed={source === 'sample'} onClick={() => setSource('sample')}>นิสิตตัวอย่าง</button>
            <button type="button" aria-pressed={source === 'manual'} onClick={() => setSource('manual')}>กรอกเอง</button>
          </div>

          {source === 'sample' ? (
            <div className="field">
              <label className="field-label" htmlFor="gap-sample">นิสิตตัวอย่าง <span className="sim-tag">ข้อมูลจำลอง</span></label>
              <select id="gap-sample" value={sampleId} onChange={(event) => chooseSample(event.target.value)}>
                {sortedStudents.map((student) => (
                  <option key={student.recordId} value={student.recordId}>
                    {student.studentId} · {fullName(student)} · {student.interestedRole ?? 'ไม่ระบุสายงาน'}
                  </option>
                ))}
              </select>
              {sampleStudent && !sampleStudent.profile?.skills && (
                <p className="form-error">นิสิตคนนี้ไม่มีผลประเมินทักษะ</p>
              )}
            </div>
          ) : (
            <>
              <div className="gap-manual">
                {skillDefinitions.map((skill) => (
                  <div className="field" key={skill.id}>
                    <label className="field-label" htmlFor={`manual-${skill.id}`}>{skill.label}</label>
                    <select id={`manual-${skill.id}`} value={manualLevels[skill.id] ?? ''} onChange={(event) => setManualLevel(skill.id, event.target.value)}>
                      <option value="">ไม่ระบุ</option>
                      {skillLevelMeanings.map((item) => <option key={item.level} value={item.level}>{item.level} · {item.label}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <button type="button" className="button button-secondary" onClick={resetManual}>ล้างค่าที่กรอก</button>
              <p className="panel-meta">ค่าที่กรอกบันทึกในเบราว์เซอร์นี้เท่านั้น · “ไม่ระบุ” จะไม่ถูกนับเป็นระดับ 0</p>
            </>
          )}

          <details className="gap-criteria">
            <summary>ดูเกณฑ์ของสายงานและความหมายของระดับ</summary>
            <p className="panel-meta">เกณฑ์ตัวอย่างของทีม · สายงาน {selectedRole || '—'}</p>
            {benchmark ? (
              <ul className="gap-criteria-list">
                {skillDefinitions.filter((skill) => benchmark[skill.id] !== undefined).map((skill) => (
                  <li key={skill.id}><span>{skill.label}</span><strong>ระดับ {benchmark[skill.id]}</strong></li>
                ))}
              </ul>
            ) : <p className="detail-muted">ข้อมูลไม่เพียงพอ: ยังไม่มีเกณฑ์สำหรับสายงานนี้</p>}
            <dl className="gap-levels">
              {skillLevelMeanings.map((item) => (
                <div key={item.level}><dt>{item.level} · {item.label}</dt><dd>{item.description}</dd></div>
              ))}
            </dl>
          </details>
        </section>

        <section className="panel" aria-labelledby="gap-compare-title">
          <header className="panel-header">
            <div>
              <h2 id="gap-compare-title">เปรียบเทียบกับเกณฑ์สายงาน</h2>
              <p className="panel-meta">Skill Gap = max(ระดับเป้าหมาย − ระดับปัจจุบัน, 0)</p>
            </div>
          </header>

          {insufficient ? (
            <div className="empty-state" role="status">
              <p className="empty-state-title">ข้อมูลไม่เพียงพอ</p>
              <p className="empty-state-text">
                {benchmark ? 'ยังไม่มีระดับทักษะที่ตรงกับเกณฑ์ของสายงานนี้ เลือกนิสิตคนอื่นหรือกรอกระดับทักษะของตนเอง' : 'ยังไม่มีเกณฑ์ตัวอย่างสำหรับสายงานนี้'}
              </p>
            </div>
          ) : (
            <>
              <dl className="gap-summary" aria-live="polite">
                <div><dt>ถึงเกณฑ์แล้ว</dt><dd>{metCount}<small>/ {gapRows.length} ทักษะ</small></dd></div>
                <div><dt>ยังต่ำกว่าเกณฑ์</dt><dd>{priorities.length}<small>ทักษะ</small></dd></div>
                <div><dt>ข้อมูลไม่เพียงพอ</dt><dd>{missingRows.length}<small>ทักษะ</small></dd></div>
              </dl>
              <div className="gap-legend" aria-hidden="true">
                <span><i className="gap-key-current" />ระดับปัจจุบัน</span>
                <span><i className="gap-key-target" />ระดับเป้าหมาย</span>
              </div>
              <table className="gap-table">
                <caption className="visually-hidden">Skill Gap รายทักษะ สายงาน {selectedRole}</caption>
                <thead>
                  <tr><th scope="col">ทักษะ</th><th scope="col">ปัจจุบัน</th><th scope="col">เป้าหมาย</th><th scope="col"><span className="visually-hidden">กราฟ</span></th><th scope="col">Gap</th></tr>
                </thead>
                <tbody>
                  {gapRows.map((row) => (
                    <tr key={row.skill}>
                      <th scope="row">{row.label}</th>
                      <td>{row.current ?? '—'}</td>
                      <td>{row.target}</td>
                      <td className="gap-meter-cell"><GapMeter row={row} /></td>
                      <td>
                        {row.gap === null
                          ? <span className="gap-badge is-missing">ข้อมูลไม่เพียงพอ</span>
                          : row.gap === 0
                            ? <span className="gap-badge is-met">ถึงเกณฑ์</span>
                            : <span className="gap-badge is-gap">ขาด {row.gap}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </section>
      </div>

      <section className="panel" aria-labelledby="gap-priority-title">
        <header className="panel-header">
          <div>
            <h2 id="gap-priority-title">ทักษะที่ควรฝึกก่อน</h2>
            <p className="panel-meta">เรียงจาก Gap มากไปน้อย ถ้าเท่ากันเรียงตามระดับเป้าหมาย · {gapTasks.length > 0 ? `ทำแล้ว ${gapCompleted} จาก ${gapTasks.length} กิจกรรม` : 'ไม่มีกิจกรรม'}</p>
          </div>
        </header>
        {insufficient ? (
          <p className="detail-muted">ข้อมูลไม่เพียงพอ จึงยังไม่จัดลำดับทักษะ</p>
        ) : priorities.length === 0 ? (
          <p className="detail-muted">
            ถึงเกณฑ์ตัวอย่างทุกทักษะที่มีข้อมูล{missingRows.length > 0 && ` · ยังประเมินไม่ได้ ${missingRows.length} ทักษะเพราะข้อมูลไม่เพียงพอ`}
          </p>
        ) : (
          <ol className="gap-priorities">
            {priorities.map((row, index) => (
              <li key={row.skill} className={index < 3 ? 'is-top' : undefined}>
                <div className="gap-priority-head">
                  <span className="gap-rank">{index + 1}</span>
                  <strong>{row.label}</strong>
                  <span className="gap-badge is-gap">ระดับ {row.current} → {row.target} (ขาด {row.gap})</span>
                </div>
                <ul className="prep-tasks">
                  {skillActivities[row.skill].map((text, activityIndex) => renderTask({ id: `${row.skill}-${activityIndex}`, text, key: `gap:${selectedRole}:${row.skill}:${activityIndex}` }))}
                </ul>
              </li>
            ))}
          </ol>
        )}
        {!insufficient && missingRows.length > 0 && priorities.length > 0 && (
          <p className="panel-meta">ไม่ได้จัดลำดับ {missingRows.map((row) => row.label).join(', ')} เพราะข้อมูลไม่เพียงพอ</p>
        )}
        {saveError && <p className="form-error" role="status">{saveError}</p>}
      </section>

      <div className="prep-layout">
        <div className="prep-guide">
          <section className="panel" aria-labelledby="prep-skills-title">
            <header className="panel-header">
              <div>
                <h2 id="prep-skills-title">หัวข้อที่ควรฝึกเบื้องต้น</h2>
                <p className="panel-meta">สำหรับสายงาน {selectedRole || 'ที่เลือก'}</p>
              </div>
            </header>
            <ul className="prep-skills">
              {guide.skills.map((skill) => <li key={skill}>{skill}</li>)}
            </ul>
          </section>

          <section className="panel" aria-labelledby="prep-projects-title">
            <header className="panel-header">
              <div>
                <h2 id="prep-projects-title">ไอเดียโปรเจกต์สำหรับ Portfolio</h2>
                <p className="panel-meta">เลือกทำหนึ่งชิ้นให้จบ หรือปรับโจทย์ให้เป็นผลงานของตัวเอง</p>
              </div>
              <span className="count-badge">{guide.projects.length} แนวทาง</span>
            </header>

            <div className="prep-projects">
              {guide.projects.map((project) => (
                <article className="prep-project" key={project.title}>
                  <h3>{project.title}</h3>
                  <p className="prep-project-summary">{project.summary}</p>
                  <h4>แนวทางต่อยอด</h4>
                  <ul>
                    {project.build.map((step) => <li key={step}>{step}</li>)}
                  </ul>
                  <div className="prep-showcase">
                    <h4>สิ่งที่นำเสนอได้</h4>
                    <p>{project.showcase}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="prep-tip">
              <h3>ทำให้คนดูเข้าใจผลงานได้เร็ว</h3>
              <ul>
                <li>เล่าโจทย์และผู้ใช้ที่ต้องการช่วย</li>
                <li>บอกส่วนที่คุณลงมือทำและเหตุผลที่เลือกวิธีนั้น</li>
                <li>แนบภาพหรือ demo พร้อมวิธีติดตั้งและทดสอบ</li>
                <li>สรุปข้อจำกัด สิ่งที่เรียนรู้ และสิ่งที่จะพัฒนาต่อ</li>
              </ul>
            </div>
          </section>
        </div>

        <section className="panel prep-checklist" aria-labelledby="prep-check-title">
          <header className="panel-header">
            <div>
              <h2 id="prep-check-title">เช็กลิสต์ของฉัน</h2>
              <p className="panel-meta" aria-live="polite">ทำแล้ว {completed} จาก {tasks.length} ข้อ</p>
            </div>
          </header>

          <progress className="prep-progress" value={completed} max={tasks.length} aria-label={`ทำแล้ว ${completed} จาก ${tasks.length} ข้อ`} />

          <fieldset className="prep-task-group">
            <legend>ทุกสายงาน</legend>
            <ul className="prep-tasks">{generalTasks.map(renderTask)}</ul>
          </fieldset>

          <fieldset className="prep-task-group">
            <legend>สำหรับสายงาน {selectedRole || 'ที่เลือก'}</legend>
            <ul className="prep-tasks">{roleTasks.map(renderTask)}</ul>
          </fieldset>

          {saveError && <p className="form-error" role="status">{saveError}</p>}

          <p className="panel-meta">
            บันทึกเฉพาะในเบราว์เซอร์นี้ ไม่ซิงก์ข้ามอุปกรณ์ และอาจหายเมื่อล้างข้อมูลเว็บไซต์
            จำนวนข้อที่ติ๊กใช้ติดตามงานของตัวเองเท่านั้น ไม่ใช่คะแนนหรือโอกาสได้ฝึกงาน
          </p>
        </section>
      </div>
    </section>
  )
}
