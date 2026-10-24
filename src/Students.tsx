import { useState } from 'react'
import PageHeader from './components/PageHeader'
import DetailDrawer from './components/DetailDrawer'
import EmptyState from './components/EmptyState'
import StatusBadge from './components/StatusBadge'
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from './components/Icons'
import {
  formatNumber,
  fullName,
  statusLabel,
  students,
  uniqueSorted,
  years,
} from './lib/internshipStats'
import type { Student } from './lib/internshipStats'
import './Students.css'

const roles = uniqueSorted(students.map((student) => student.interestedRole))
const pageSize = 15

function Fact({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value === null || value === undefined || value === '' ? '—' : value}</dd>
    </div>
  )
}

function StudentDetail({ student }: { student: Student }) {
  const placement = student.placement

  return (
    <div className="detail-stack">
      <div className="detail-summary">
        <StatusBadge accepted={student.accepted} />
        <span className="detail-muted">{student.studentId}</span>
      </div>

      <section className="detail-section" aria-labelledby="student-detail-application">
        <h3 id="student-detail-application">การสมัคร</h3>
        <dl className="fact-list">
          <Fact label="ปีฝึกงาน" value={`${student.academicYearBE} (ค.ศ. ${student.academicYearCE})`} />
          <Fact label="สายงานที่สนใจ" value={student.interestedRole} />
          <Fact label="ขั้นตอนการสมัคร" value={student.applicationStage} />
        </dl>
      </section>

      <section className="detail-section" aria-labelledby="student-detail-placement">
        <h3 id="student-detail-placement">ที่ฝึกงานที่ได้รับ</h3>
        {placement?.company ? (
          <dl className="fact-list">
            <Fact label="สถานประกอบการ" value={placement.company} />
            <Fact label="ประเภทธุรกิจ" value={placement.businessType} />
            <Fact label="ตำแหน่งฝึกงาน" value={placement.position} />
            <Fact label="ฝ่าย" value={placement.department} />
            <Fact label="หน่วยงาน" value={placement.unit} />
            <Fact label="จังหวัด" value={placement.province} />
          </dl>
        ) : (
          <p className="detail-muted">ยังไม่มีข้อมูลสถานประกอบการในชุดข้อมูล</p>
        )}
      </section>

      <p className="detail-note">
        สายงานที่สนใจกับตำแหน่งฝึกงานที่ได้รับเป็นคนละข้อมูล · ข้อมูลจำลอง
      </p>
    </div>
  )
}

export default function Students() {
  const [search, setSearch] = useState('')
  const [year, setYear] = useState('all')
  const [status, setStatus] = useState('all')
  const [role, setRole] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const keyword = search.trim().toLocaleLowerCase('th')
  const hasFilters = keyword !== '' || year !== 'all' || status !== 'all' || role !== 'all'

  const filteredStudents = students.filter((student) => {
    const searchableText = [
      student.studentId,
      student.prefix,
      student.firstName,
      student.lastName,
      student.placement?.company,
      student.placement?.position,
    ]
      .join(' ')
      .toLocaleLowerCase('th')

    const matchesStatus =
      status === 'all' ||
      (status === 'accepted' && student.accepted) ||
      (status === 'pending' && !student.accepted)

    return (
      searchableText.includes(keyword) &&
      (year === 'all' || String(student.academicYearBE) === year) &&
      matchesStatus &&
      (role === 'all' || student.interestedRole === role)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const visibleStudents = filteredStudents.slice(startIndex, startIndex + pageSize)
  const selectedStudent = students.find((student) => student.recordId === selectedId) ?? null

  function updateFilter(setter: (value: string) => void) {
    return (value: string) => {
      setter(value)
      setPage(1)
    }
  }

  function resetFilters() {
    setSearch('')
    setYear('all')
    setStatus('all')
    setRole('all')
    setPage(1)
  }

  return (
    <section className="page" aria-labelledby="students-title">
      <PageHeader
        id="students-title"
        title="ข้อมูลนิสิต"
        description="ค้นหาและกรองนิสิตตามปี สถานะ และสายงานที่สนใจ แล้วเปิดดูรายละเอียดรายคน"
      />

      <div className="panel filter-panel">
        <div className="filter-bar">
          <div className="field field-search">
            <label className="field-label" htmlFor="student-search">ค้นหา</label>
            <div className="input-with-icon">
              <SearchIcon />
              <input
                id="student-search"
                type="search"
                placeholder="ชื่อ รหัสนิสิต บริษัท หรือตำแหน่ง"
                value={search}
                onChange={(event) => updateFilter(setSearch)(event.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="student-year">ปีฝึกงาน</label>
            <select id="student-year" value={year} onChange={(event) => updateFilter(setYear)(event.target.value)}>
              <option value="all">ทุกปี</option>
              {years.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="student-status">สถานะ</label>
            <select id="student-status" value={status} onChange={(event) => updateFilter(setStatus)(event.target.value)}>
              <option value="all">ทุกสถานะ</option>
              <option value="accepted">{statusLabel.accepted}</option>
              <option value="pending">{statusLabel.pending}</option>
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="student-role">สายงานที่สนใจ</label>
            <select id="student-role" value={role} onChange={(event) => updateFilter(setRole)(event.target.value)}>
              <option value="all">ทุกสายงาน</option>
              {roles.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          <button className="button button-secondary" type="button" onClick={resetFilters} disabled={!hasFilters}>
            ล้างตัวกรอง
          </button>
        </div>
      </div>

      <p className="result-count" aria-live="polite">
        พบ <strong>{formatNumber(filteredStudents.length)}</strong> จาก {formatNumber(students.length)} รายการ
      </p>

      {filteredStudents.length === 0 ? (
        <div className="panel">
          <EmptyState
            title="ไม่พบนิสิตที่ตรงกับเงื่อนไข"
            description="ลองใช้คำค้นอื่น หรือล้างตัวกรองเพื่อดูรายการทั้งหมด"
            action={<button className="button button-primary" type="button" onClick={resetFilters}>ล้างตัวกรอง</button>}
          />
        </div>
      ) : (
        <div className="panel table-panel">
          <div className="table-scroll">
            <table className="data-table st-table">
              <caption className="visually-hidden">
                รายชื่อนิสิต หน้า {currentPage} จาก {totalPages}
              </caption>
              <thead>
                <tr>
                  <th scope="col">นิสิต</th>
                  <th scope="col">ปีฝึกงาน</th>
                  <th scope="col">สายงานที่สนใจ</th>
                  <th scope="col">สถานะ</th>
                  <th scope="col">สถานประกอบการ</th>
                  <th scope="col"><span className="visually-hidden">รายละเอียด</span></th>
                </tr>
              </thead>
              <tbody>
                {visibleStudents.map((student) => (
                  <tr key={student.recordId}>
                    <td data-label="นิสิต">
                      <span className="cell-primary">{fullName(student)}</span>
                      <span className="cell-secondary">{student.studentId}</span>
                    </td>
                    <td data-label="ปีฝึกงาน" className="cell-number">{student.academicYearBE}</td>
                    <td data-label="สายงานที่สนใจ">{student.interestedRole || '—'}</td>
                    <td data-label="สถานะ">
                      <StatusBadge accepted={student.accepted} />
                      {!student.accepted && student.applicationStage && (
                        <span className="cell-secondary">{student.applicationStage}</span>
                      )}
                    </td>
                    <td data-label="สถานประกอบการ">{student.placement?.company || '—'}</td>
                    <td className="cell-action">
                      <button
                        className="button button-ghost"
                        type="button"
                        onClick={() => setSelectedId(student.recordId)}
                        aria-label={`ดูรายละเอียด ${fullName(student)}`}
                      >
                        รายละเอียด
                        <ChevronRightIcon width="16" height="16" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav className="pagination" aria-label="เลือกหน้ารายการนิสิต">
            <p>
              แสดง {startIndex + 1}–{Math.min(startIndex + pageSize, filteredStudents.length)} จาก{' '}
              {formatNumber(filteredStudents.length)} รายการ
            </p>
            <div className="pagination-controls">
              <button className="button button-secondary" type="button" disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}>
                <ChevronLeftIcon width="16" height="16" />
                ก่อนหน้า
              </button>
              <span>หน้า {currentPage} / {totalPages}</span>
              <button className="button button-secondary" type="button" disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}>
                ถัดไป
                <ChevronRightIcon width="16" height="16" />
              </button>
            </div>
          </nav>
        </div>
      )}

      <p className="page-note">
        ข้อมูลจำลองสำหรับสาธิต · สายงานที่สนใจและตำแหน่งฝึกงานที่ได้รับเป็นคนละข้อมูล · เครื่องหมาย — หมายถึงไม่มีข้อมูลในชุดข้อมูล
      </p>

      <DetailDrawer
        open={selectedStudent !== null}
        onClose={() => setSelectedId(null)}
        eyebrow="รายละเอียดนิสิต"
        title={selectedStudent ? fullName(selectedStudent) : ''}
      >
        {selectedStudent && <StudentDetail student={selectedStudent} />}
      </DetailDrawer>
    </section>
  )
}
