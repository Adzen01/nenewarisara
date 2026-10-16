import { useState } from 'react'
import dataset from './data/internships.json'
import './Students.css'

const students = dataset.students

const years = [...new Set(
  students.map((student) => student.academicYearBE),
)].sort((a, b) => a - b)

const roles = [...new Set(
  students.map((student) => student.interestedRole),
)]
  .filter((role): role is string => Boolean(role))
  .sort((a, b) => a.localeCompare(b, 'th'))

const pageSize = 15

export default function Students() {
  const [search, setSearch] = useState('')
  const [year, setYear] = useState('all')
  const [status, setStatus] = useState('all')
  const [role, setRole] = useState('all')
  const [page, setPage] = useState(1)

  const keyword = search.trim().toLocaleLowerCase('th')

  const filteredStudents = students.filter((student) => {
    const searchableText = [
      student.studentId,
      student.prefix,
      student.firstName,
      student.lastName,
      student.placement?.company,
    ]
      .join(' ')
      .toLocaleLowerCase('th')

    const matchesSearch = searchableText.includes(keyword)

    const matchesYear =
      year === 'all' || String(student.academicYearBE) === year

    const matchesStatus =
      status === 'all' ||
      (status === 'accepted' && student.accepted) ||
      (status === 'pending' && !student.accepted)

    const matchesRole =
      role === 'all' || student.interestedRole === role

    return matchesSearch && matchesYear && matchesStatus && matchesRole
  })

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / pageSize),
  )

  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize

  const visibleStudents = filteredStudents.slice(
    startIndex,
    startIndex + pageSize,
  )

  function resetFilters() {
    setSearch('')
    setYear('all')
    setStatus('all')
    setRole('all')
    setPage(1)
  }

  return (
    <section className="students-page" aria-labelledby="students-title">
      <div className="st-heading">
        <h2 id="students-title">รายชื่อนิสิต</h2>
        <p aria-live="polite">
          พบ {filteredStudents.length} จากทั้งหมด {students.length} รายการ
        </p>
      </div>

      <div className="st-filters">
        <div className="st-field st-search">
          <label htmlFor="student-search">ค้นหา</label>
          <input
            id="student-search"
            type="search"
            placeholder="ชื่อ รหัสนิสิตจำลอง หรือบริษัท"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
        </div>

        <div className="st-field">
          <label htmlFor="student-year">ปีฝึกงาน</label>
          <select
            id="student-year"
            value={year}
            onChange={(event) => {
              setYear(event.target.value)
              setPage(1)
            }}
          >
            <option value="all">ทุกปี</option>
            {years.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="st-field">
          <label htmlFor="student-status">สถานะ</label>
          <select
            id="student-status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
          >
            <option value="all">ทุกสถานะ</option>
            <option value="accepted">ได้ที่ฝึกงานแล้ว</option>
            <option value="pending">ยังไม่ได้ที่ฝึกงาน</option>
          </select>
        </div>

        <div className="st-field">
          <label htmlFor="student-role">สายงานที่สนใจ</label>
          <select
            id="student-role"
            value={role}
            onChange={(event) => {
              setRole(event.target.value)
              setPage(1)
            }}
          >
            <option value="all">ทุกสายงาน</option>
            {roles.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <button
          className="st-button"
          type="button"
          onClick={resetFilters}
        >
          ล้างตัวกรอง
        </button>
      </div>

      <div
        className="st-table-wrap"
        role="region"
        aria-label="ตารางรายชื่อนิสิต เลื่อนแนวนอนเพื่อดูทุกคอลัมน์"
        tabIndex={0}
      >
        <table className="st-table">
          <thead>
            <tr>
              <th scope="col">ชื่อ–นามสกุล</th>
              <th scope="col">ปีฝึกงาน</th>
              <th scope="col">สายงานที่สนใจ</th>
              <th scope="col">สถานะ</th>
              <th scope="col">ขั้นตอนการสมัคร</th>
              <th scope="col">สถานประกอบการ</th>
              <th scope="col">ตำแหน่งฝึกงาน</th>
              <th scope="col">จังหวัด</th>
            </tr>
          </thead>

          <tbody>
            {visibleStudents.map((student) => (
              <tr key={student.recordId}>
                <td>
                  <span className="st-name">
                    {student.prefix} {student.firstName} {student.lastName}
                  </span>
                  <span className="st-id">{student.studentId}</span>
                </td>

                <td>{student.academicYearBE}</td>

                <td>
                  <span className="st-role">
                    {student.interestedRole || 'ไม่ระบุ'}
                  </span>
                </td>

                <td>
                  <span
                    className={`st-status ${
                      student.accepted ? 'is-accepted' : 'is-pending'
                    }`}
                  >
                    {student.accepted
                      ? 'ได้ที่ฝึกงานแล้ว'
                      : 'ยังไม่ได้ที่ฝึกงาน'}
                  </span>
                </td>

                <td>{student.applicationStage || '—'}</td>
                <td>{student.placement?.company || '—'}</td>
                <td>{student.placement?.position || '—'}</td>
                <td>{student.placement?.province || '—'}</td>
              </tr>
            ))}

            {visibleStudents.length === 0 && (
              <tr>
                <td colSpan={8} className="st-empty">
                  ไม่พบข้อมูลที่ตรงกับเงื่อนไข ลองเปลี่ยนหรือล้างตัวกรอง
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="st-pagination">
        <p>
          {filteredStudents.length > 0
            ? `แสดง ${startIndex + 1}–${Math.min(
                startIndex + pageSize,
                filteredStudents.length,
              )} จาก ${filteredStudents.length} รายการ`
            : 'ไม่มีรายการ'}
        </p>

        <div className="st-page-controls">
          <button
            className="st-button"
            type="button"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            ก่อนหน้า
          </button>

          <span>หน้า {currentPage} / {totalPages}</span>

          <button
            className="st-button"
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            ถัดไป
          </button>
        </div>
      </div>

      <p className="st-note">
        ข้อมูลจำลองสำหรับสาธิต • สายงานที่สนใจและตำแหน่งฝึกงานเป็นคนละข้อมูล
        • เครื่องหมาย — หมายถึงไม่มีข้อมูลในชุดข้อมูล
      </p>
    </section>
  )
}