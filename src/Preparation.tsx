import { useState } from 'react'
import dataset from './data/internships.json'
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

          <div className="prep-project-heading">
            <div>
              <h3>ไอเดียโปรเจกต์สำหรับ Portfolio</h3>
              <p className="prep-muted">เลือกทำหนึ่งชิ้นให้จบ หรือปรับโจทย์ให้เป็นผลงานของตัวเอง</p>
            </div>
            <span>{guide.projects.length} แนวทาง</span>
          </div>

          <div className="prep-project-grid">
            {guide.projects.map((project, index) => (
              <article className="prep-project-card" key={project.title}>
                <p className="prep-project-index">PROJECT 0{index + 1}</p>
                <h4>{project.title}</h4>
                <p className="prep-project-summary">{project.summary}</p>
                <h5>แนวทางต่อยอด</h5>
                <ul>
                  {project.build.map((step) => <li key={step}>{step}</li>)}
                </ul>
                <div className="prep-project-showcase">
                  <strong>สิ่งที่นำเสนอได้</strong>
                  <p>{project.showcase}</p>
                </div>
              </article>
            ))}
          </div>

          <aside className="prep-portfolio-tip">
            <strong>ทำให้คนดูเข้าใจผลงานได้เร็ว</strong>
            <ul>
              <li>เล่าโจทย์และผู้ใช้ที่ต้องการช่วย</li>
              <li>บอกส่วนที่คุณลงมือทำและเหตุผลที่เลือกวิธีนั้น</li>
              <li>แนบภาพหรือ demo พร้อมวิธีติดตั้งและทดสอบ</li>
              <li>สรุปข้อจำกัด สิ่งที่เรียนรู้ และสิ่งที่จะพัฒนาต่อ</li>
            </ul>
          </aside>
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
