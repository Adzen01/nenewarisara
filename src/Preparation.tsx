import { useState } from 'react'
import dataset from './data/internships.json'
import './Preparation.css'

type Task = {
  id: string
  text: string
}

type Guide = {
  skills: string[]
  project: string
}

const roles = [
  ...new Set(
    dataset.students
      .map((student) => student.interestedRole)
      .filter((role): role is string => Boolean(role)),
  ),
].sort((a, b) => a.localeCompare(b, 'th'))

const commonTasks: Task[] = [
  { id: 'resume', text: 'จัดทำ Resume พร้อมข้อมูลติดต่อที่ตรวจสอบแล้ว' },
  { id: 'portfolio', text: 'เลือกผลงานและอธิบายหน้าที่ที่ตนเองทำ' },
  { id: 'github', text: 'จัดระเบียบ GitHub และเขียน README ของโปรเจกต์' },
  { id: 'intro', text: 'ฝึกแนะนำตัวและอธิบายโปรเจกต์ให้เข้าใจง่าย' },
  { id: 'requirements', text: 'อ่านประกาศรับสมัครจริงและจดทักษะที่ยังต้องฝึก' },
]

const roleTasks: Task[] = [
  { id: 'basics', text: 'ทบทวนพื้นฐานตามสายงานที่เลือก' },
  { id: 'project', text: 'ลงมือทำโปรเจกต์ตัวอย่างให้ใช้งานได้' },
  { id: 'testing', text: 'ทดสอบผลงานและบันทึกปัญหาที่แก้ไข' },
  { id: 'explain', text: 'เขียนสรุปวิธีทำ ผลลัพธ์ และข้อจำกัดของผลงาน' },
]

const storageKey = 'ce-internship-preparation-v1'

function readSavedChecks(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return {}

    const value: unknown = JSON.parse(raw)

    if (
      typeof value !== 'object' ||
      value === null ||
      Array.isArray(value)
    ) {
      return {}
    }

    return Object.fromEntries(
      Object.entries(value).filter(
        ([, checked]) => typeof checked === 'boolean',
      ),
    )
  } catch {
    return {}
  }
}

function getGuide(role: string): Guide {
  const name = role.toLowerCase()

  if (name.includes('full stack') || name.includes('fullstack')) {
    return {
      skills: ['HTML / CSS / JavaScript', 'React', 'API และฐานข้อมูล', 'Git'],
      project: 'ระบบติดตามการสมัครฝึกงานที่เพิ่ม แก้ไข และบันทึกข้อมูลได้',
    }
  }

  if (name.includes('frontend') || name.includes('front-end')) {
    return {
      skills: ['HTML / CSS / JavaScript', 'React', 'Responsive Design', 'Git'],
      project: 'Dashboard จาก JSON พร้อมค้นหา กรองข้อมูล และรองรับมือถือ',
    }
  }

  if (name.includes('backend') || name.includes('back-end')) {
    return {
      skills: ['ภาษาฝั่ง Server', 'HTTP / REST API', 'SQL', 'การตรวจสอบข้อมูล'],
      project: 'API จัดการข้อมูลฝึกงาน พร้อมฐานข้อมูลและการจัดการข้อผิดพลาด',
    }
  }

  if (name.includes('qa') || name.includes('testing')) {
    return {
      skills: ['Test Case', 'Bug Report', 'API Testing', 'Automated Testing'],
      project: 'แผนทดสอบ Dashboard พร้อมรายงานบั๊กและสคริปต์ทดสอบหลัก',
    }
  }

  if (name.includes('data engineering')) {
    return {
      skills: ['Python', 'SQL', 'ETL', 'การตรวจคุณภาพข้อมูล'],
      project: 'Pipeline แปลง Excel เป็นฐานข้อมูล พร้อมตรวจข้อมูลซ้ำและค่าว่าง',
    }
  }

  if (name.includes('data analy')) {
    return {
      skills: ['Spreadsheet', 'SQL', 'สถิติพื้นฐาน', 'Data Visualization'],
      project: 'วิเคราะห์ข้อมูลฝึกงาน พร้อมกราฟและคำอธิบายข้อจำกัดของข้อมูล',
    }
  }

  if (name.includes('devops') || name.includes('cloud')) {
    return {
      skills: ['Linux', 'Docker', 'CI/CD', 'Logs และ Monitoring'],
      project: 'นำเว็บขึ้นใช้งาน พร้อมขั้นตอน build อัตโนมัติและบันทึกวิธี deploy',
    }
  }

  if (name.includes('cyber') || name.includes('security')) {
    return {
      skills: ['Network', 'Linux', 'Web Security', 'การเขียนรายงานช่องโหว่'],
      project: 'ฝึกตรวจระบบในแล็บที่ได้รับอนุญาต พร้อมรายงานและแนวทางแก้ไข',
    }
  }

  if (name.includes('network') || name.includes('support')) {
    return {
      skills: ['TCP/IP', 'การตั้งค่าเครือข่าย', 'ระบบปฏิบัติการ', 'Troubleshooting'],
      project: 'จำลองเครือข่ายขนาดเล็ก พร้อมแผนผังและคู่มือแก้ปัญหา',
    }
  }

  if (name.includes('mobile')) {
    return {
      skills: ['เครื่องมือพัฒนาแอปมือถือ', 'UI และ Navigation', 'API', 'State'],
      project: 'แอปติดตามการสมัครฝึกงาน พร้อมรายการ รายละเอียด และบันทึกสถานะ',
    }
  }

  if (name.includes('ai') || name.includes('machine') || name.includes('ml')) {
    return {
      skills: ['Python', 'การเตรียมข้อมูล', 'Machine Learning', 'การประเมินโมเดล'],
      project: 'ทดลองโมเดลกับชุดข้อมูลสาธารณะ แยกข้อมูลฝึกและทดสอบ พร้อมรายงานผล',
    }
  }

  return {
    skills: ['พื้นฐานของสายงาน', 'Git', 'การแก้ปัญหา', 'การสื่อสาร'],
    project: 'เลือกปัญหาขนาดเล็ก ทำผลงานให้จบ และเขียนอธิบายวิธีทำ',
  }
}

export default function Preparation() {
  const [selectedRole, setSelectedRole] = useState(
    () => roles.find((role) => role.toLowerCase().includes('frontend'))
      ?? roles[0]
      ?? '',
  )

  const [checked, setChecked] =
    useState<Record<string, boolean>>(readSavedChecks)

  const [saveError, setSaveError] = useState('')

  const guide = getGuide(selectedRole)

  const tasks = [
    ...commonTasks.map((task) => ({
      ...task,
      key: `common:${task.id}`,
    })),
    ...roleTasks.map((task) => ({
      ...task,
      key: `role:${selectedRole}:${task.id}`,
    })),
  ]

  const completed = tasks.filter((task) => checked[task.key]).length

  function toggleTask(key: string) {
    const next = { ...checked, [key]: !checked[key] }

    setChecked(next)

    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
      setSaveError('')
    } catch {
      setSaveError(
        'เบราว์เซอร์บันทึกไม่ได้ รายการที่ติ๊กจะอยู่เฉพาะระหว่างเปิดหน้านี้',
      )
    }
  }

  return (
    <section className="prep-page" aria-labelledby="prep-title">
      <div className="prep-toolbar">
        <div>
          <h2 id="prep-title">วางแผนก่อนสมัครฝึกงาน</h2>
          <p>เลือกสายงาน แล้วใช้เช็กลิสต์ติดตามสิ่งที่ลงมือทำ</p>
        </div>

        <div className="prep-field">
          <label htmlFor="prep-role">สายงานที่สนใจ</label>
          <select
            id="prep-role"
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value)}
            disabled={roles.length === 0}
          >
            {roles.length === 0 && (
              <option value="">ไม่มีสายงานในชุดข้อมูล</option>
            )}
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="prep-grid">
        <section className="prep-panel">
          <h3>หัวข้อที่ควรฝึกเบื้องต้น</h3>

          <div className="prep-tags">
            {guide.skills.map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>

          <h3>ไอเดียโปรเจกต์สำหรับ Portfolio</h3>
          <p className="prep-project">{guide.project}</p>

          <p className="prep-muted">
            ใส่คำอธิบายปัญหา วิธีทำ หน้าที่ของตนเอง
            วิธีทดสอบ และสิ่งที่อยากปรับปรุงใน README
          </p>
        </section>

        <section className="prep-panel">
          <div className="prep-check-heading">
            <h3>เช็กลิสต์ของฉัน</h3>
            <span aria-live="polite">
              ทำแล้ว {completed} / {tasks.length} ข้อ
            </span>
          </div>

          <progress
            className="prep-progress"
            value={completed}
            max={tasks.length}
            aria-label="จำนวนรายการที่ทำแล้ว"
          />

          <div className="prep-tasks">
            {tasks.map((task, index) => (
              <div key={task.key}>
                {index === commonTasks.length && (
                  <p className="prep-divider">
                    สำหรับสายงาน {selectedRole || 'ที่เลือก'}
                  </p>
                )}

                <label className="prep-task">
                  <input
                    type="checkbox"
                    checked={Boolean(checked[task.key])}
                    onChange={() => toggleTask(task.key)}
                  />
                  <span>{task.text}</span>
                </label>
              </div>
            ))}
          </div>

          {saveError && (
            <p className="prep-error" role="status">{saveError}</p>
          )}

          <p className="prep-muted prep-storage-note">
            บันทึกเฉพาะเบราว์เซอร์นี้ ไม่ซิงก์ข้ามอุปกรณ์
            และอาจหายเมื่อคุณล้างข้อมูลเว็บไซต์
          </p>
        </section>
      </div>

      <p className="prep-footer">
        แนวทางนี้เป็นเนื้อหาเบื้องต้น ไม่ใช่ข้อกำหนดของบริษัท
        ควรตรวจประกาศรับสมัครจริงก่อนสมัคร
        จำนวนข้อที่ติ๊กใช้ติดตามงานส่วนตัว ไม่ใช่คะแนนหรือโอกาสได้ฝึกงาน
      </p>
    </section>
  )
}