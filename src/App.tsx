import { useState } from 'react'
import Overview from './Overview'
import Students from './Students'
import Companies from './Companies'
import Preparation from './Preparation'
import './App.css'

const pages = [
  {
    id: 'overview',
    label: 'ภาพรวม',
    title: 'Internship Overview',
    description: 'ภาพรวมการฝึกงานนิสิตวิศวกรรมคอมพิวเตอร์',
  },
  {
    id: 'students',
    label: 'ข้อมูลนิสิต',
    title: 'Student Directory',
    description: 'ข้อมูลนิสิตและสถานะการสมัครฝึกงาน',
  },
  {
    id: 'companies',
    label: 'สถานประกอบการ',
    title: 'Company Directory',
    description: 'สำรวจสถานประกอบการและตำแหน่งฝึกงานในชุดข้อมูล',
  },
  {
    id: 'preparation',
    label: 'เตรียมความพร้อม',
    title: 'Internship Preparation',
    description: 'สำรวจสายงานและวางแผนก่อนสมัครฝึกงาน',
  },
]

function App() {
  const [activePage, setActivePage] = useState('overview')

  const currentPage =
    pages.find((page) => page.id === activePage) ?? pages[0]

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-name">CE / INTERNSHIP</span>
          <p>ข้อมูลและแนวทางฝึกงาน</p>
        </div>

        <nav className="navigation" aria-label="เมนูหลัก">
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              className={`nav-button ${
                activePage === page.id ? 'active' : ''
              }`}
              aria-current={
                activePage === page.id ? 'page' : undefined
              }
              onClick={() => setActivePage(page.id)}
            >
              {page.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>ปีฝึกงาน 2566–2568</p>
          <span>ข้อมูลจำลองสำหรับต้นแบบ</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="page-header">
          <p className="breadcrumb">
            CE Internship / {currentPage.label}
          </p>

          <h1>{currentPage.title}</h1>

          <p className="page-description">
            {currentPage.description}
          </p>
        </header>

        <div className="notice">
          {activePage === 'preparation'
            ? 'แนวทางฝึกเบื้องต้นและเช็กลิสต์ส่วนตัว โปรดตรวจข้อกำหนดจากประกาศรับสมัครจริง'
            : 'ข้อมูลจำลอง ปีฝึกงาน 2566–2568 สำหรับสาธิต Dashboard'}
        </div>

        {activePage === 'overview' && <Overview />}
        {activePage === 'students' && <Students />}
        {activePage === 'companies' && <Companies />}
        {activePage === 'preparation' && <Preparation />}
      </main>
    </div>
  )
}

export default App