import { useEffect, useRef, useState } from 'react'
import type { ComponentType, SVGProps } from 'react'
import Overview from './Overview'
import Students from './Students'
import Companies from './Companies'
import Preparation from './Preparation'
import { BuildingIcon, ChecklistIcon, OverviewIcon, StudentsIcon } from './components/Icons'
import { formatNumber, students, yearRange } from './lib/internshipStats'
import './App.css'

type PageId = 'overview' | 'students' | 'companies' | 'preparation'

const pages: { id: PageId; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { id: 'overview', label: 'ภาพรวม', icon: OverviewIcon },
  { id: 'students', label: 'ข้อมูลนิสิต', icon: StudentsIcon },
  { id: 'companies', label: 'สถานประกอบการ', icon: BuildingIcon },
  { id: 'preparation', label: 'เตรียมความพร้อม', icon: ChecklistIcon },
]

// ใช้ hash เพื่อให้ refresh, ปุ่มย้อนกลับ และการแชร์ลิงก์กลับมาที่หน้าเดิมได้
function readPageFromHash(): PageId {
  const hash = window.location.hash.slice(1)
  return pages.find((page) => page.id === hash)?.id ?? 'overview'
}

function App() {
  const [activePage, setActivePage] = useState<PageId>(readPageFromHash)
  const focusHeadingOnChange = useRef(false)

  useEffect(() => {
    function handleHashChange() {
      focusHeadingOnChange.current = true
      setActivePage(readPageFromHash())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    const label = pages.find((page) => page.id === activePage)?.label
    document.title = `${label} · CE Internship Dashboard`
    if (focusHeadingOnChange.current) {
      focusHeadingOnChange.current = false
      document.querySelector<HTMLElement>('.page-header h1')?.focus({ preventScroll: true })
    }
  }, [activePage])

  return (
    <div className="app">
      <a className="skip-link" href="#main-content" onClick={(event) => {
        event.preventDefault()
        document.getElementById('main-content')?.focus()
      }}>ข้ามไปยังเนื้อหา</a>

      <aside className="sidebar">
        <div className="brand">
          <strong>CE Internship</strong>
          <span>ข้อมูลฝึกงาน วศ.คอมพิวเตอร์</span>
        </div>

        <nav className="navigation" aria-label="เมนูหลัก">
          {pages.map(({ id, label, icon: PageIcon }) => (
            <a
              key={id}
              href={`#${id}`}
              className="nav-link"
              aria-current={activePage === id ? 'page' : undefined}
            >
              <PageIcon />
              <span>{label}</span>
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span>ข้อมูลจำลองสำหรับต้นแบบ</span>
          <span>ปีฝึกงาน {yearRange} · {formatNumber(students.length)} รายการ</span>
        </div>
      </aside>

      <main className="main-content" id="main-content" tabIndex={-1}>
        {activePage === 'overview' && <Overview />}
        {activePage === 'students' && <Students />}
        {activePage === 'companies' && <Companies />}
        {activePage === 'preparation' && <Preparation />}
      </main>
    </div>
  )
}

export default App
