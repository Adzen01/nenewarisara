import { useState } from 'react'
import dataset from './data/internships.json'
import './Students.css'

const defaultDirectoryAvatar = '/student-directory-avatar.jpg'
const defaultDirectoryCover = '/student-directory-cover.jpg'

async function optimizeImage(file: File, maxSize: number) {
  const image = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.width * scale))
  canvas.height = Math.max(1, Math.round(image.height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is unavailable')
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  image.close()
  return canvas.toDataURL('image/jpeg', 0.82)
}

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
  const [selectedId, setSelectedId] = useState(students[0]?.recordId ?? '')
  const [directoryAvatar, setDirectoryAvatar] = useState(() => {
    try { return localStorage.getItem('ce-student-directory-avatar-v1') || defaultDirectoryAvatar }
    catch { return defaultDirectoryAvatar }
  })
  const [directoryCover, setDirectoryCover] = useState(() => {
    try { return localStorage.getItem('ce-student-directory-cover-v1') || defaultDirectoryCover }
    catch { return defaultDirectoryCover }
  })
  const [imageError, setImageError] = useState('')
  const [avatars, setAvatars] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('ce-student-avatars-v1')
      return saved ? JSON.parse(saved) as Record<string, string> : {}
    } catch { return {} }
  })

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
  const selectedStudent = visibleStudents.find((student) => student.recordId === selectedId)
    ?? visibleStudents[0]

  async function saveAvatar(file?: File) {
    if (!selectedStudent || !file || !file.type.startsWith('image/')) return
    try {
      const image = await optimizeImage(file, 512)
      const next = { ...avatars, [selectedStudent.recordId]: image }
      localStorage.setItem('ce-student-avatars-v1', JSON.stringify(next))
      setAvatars(next)
      setImageError('')
    } catch {
      setImageError('บันทึกรูปไม่สำเร็จ ลองเลือกรูปอื่นหรือรูปที่มีขนาดเล็กลง')
    }
  }

  async function saveDirectoryImage(file: File | undefined, type: 'avatar' | 'cover') {
    if (!file || !file.type.startsWith('image/')) return
    try {
      const image = await optimizeImage(file, type === 'cover' ? 1800 : 512)
      const key = type === 'cover' ? 'ce-student-directory-cover-v1' : 'ce-student-directory-avatar-v1'
      localStorage.setItem(key, image)
      if (type === 'cover') setDirectoryCover(image)
      else setDirectoryAvatar(image)
      setImageError('')
    } catch {
      setImageError('บันทึกรูปไม่สำเร็จ ลองเลือกรูปอื่นหรือรูปที่มีขนาดเล็กลง')
    }
  }

  function removeAvatar() {
    if (!selectedStudent) return
    const next = { ...avatars }
    delete next[selectedStudent.recordId]
    try {
      localStorage.setItem('ce-student-avatars-v1', JSON.stringify(next))
      setAvatars(next)
    } catch { setAvatars(next) }
  }

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
        <h2 id="students-title">รายการนิสิต</h2>
        <p aria-live="polite">
          พบ {filteredStudents.length} จากทั้งหมด {students.length} รายการ
        </p>
      </div>

      <section className="st-notion-page" aria-label="หน้าปกไดเรกทอรีนิสิต">
        <div className="st-cover" style={{ backgroundImage: `url("${directoryCover}")` }}>
          <label className="st-cover-edit" htmlFor="directory-cover-upload">เปลี่ยนภาพปก</label>
          <input id="directory-cover-upload" className="st-visually-hidden" type="file" accept="image/*" onChange={(event) => { void saveDirectoryImage(event.target.files?.[0], 'cover'); event.currentTarget.value = '' }} />
        </div>
        <div className="st-page-identity">
          <div className="st-page-avatar"><img src={directoryAvatar} alt="ภาพประจำหน้าไดเรกทอรี" /></div>
          <div className="st-page-heading">
            <p className="st-page-eyebrow">CE INTERNSHIP / STUDENT DIRECTORY</p>
            <h3>รายชื่อนิสิตที่ได้ฝึกงาน</h3>
            <p>พื้นที่รวบรวมข้อมูลนิสิตและสถานะการสมัครฝึกงาน</p>
          </div>
          <div className="st-page-image-actions">
            <label className="st-button" htmlFor="directory-avatar-upload">เปลี่ยนภาพประจำหน้า</label>
            <input id="directory-avatar-upload" className="st-visually-hidden" type="file" accept="image/*" onChange={(event) => { void saveDirectoryImage(event.target.files?.[0], 'avatar'); event.currentTarget.value = '' }} />
          </div>
        </div>
      </section>
      {imageError && <p className="st-image-error" role="status">{imageError}</p>}

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
              <th scope="col">รายละเอียด</th>
            </tr>
          </thead>

          <tbody>
            {visibleStudents.map((student) => (
              <tr key={student.recordId} className={selectedStudent?.recordId === student.recordId ? 'is-selected' : ''}>
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
                <td><button className="st-link" type="button" onClick={() => setSelectedId(student.recordId)}>ดูรายละเอียด</button></td>
              </tr>
            ))}

            {visibleStudents.length === 0 && (
              <tr>
                <td colSpan={9} className="st-empty">
                  ไม่พบข้อมูลที่ตรงกับเงื่อนไข ลองเปลี่ยนหรือล้างตัวกรอง
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedStudent && <section className="st-profile" aria-label="รายละเอียดนิสิตที่เลือก">
        <div className="st-profile-person">
          <div className="st-avatar">
            {avatars[selectedStudent.recordId]
              ? <img src={avatars[selectedStudent.recordId]} alt={`รูปโปรไฟล์ ${selectedStudent.firstName} ${selectedStudent.lastName}`} />
              : <img src={directoryAvatar} alt={`ภาพตัวแทน ${selectedStudent.firstName} ${selectedStudent.lastName}`} />}
          </div>
          <div>
            <p className="st-profile-id">{selectedStudent.studentId}</p>
            <h3>{selectedStudent.prefix} {selectedStudent.firstName} {selectedStudent.lastName}</h3>
            <span className={`st-status ${selectedStudent.accepted ? 'is-accepted' : 'is-pending'}`}>
              {selectedStudent.accepted ? 'ได้ที่ฝึกงานแล้ว' : 'ยังไม่ได้ที่ฝึกงาน'}
            </span>
          </div>
        </div>
        <dl className="st-profile-facts">
          <div><dt>ปีฝึกงาน</dt><dd>{selectedStudent.academicYearBE}</dd></div>
          <div><dt>สายงานที่สนใจ</dt><dd>{selectedStudent.interestedRole || '—'}</dd></div>
          <div><dt>สถานประกอบการ</dt><dd>{selectedStudent.placement?.company || '—'}</dd></div>
          <div><dt>ตำแหน่งฝึกงาน</dt><dd>{selectedStudent.placement?.position || '—'}</dd></div>
          <div><dt>จังหวัด</dt><dd>{selectedStudent.placement?.province || '—'}</dd></div>
        </dl>
        <div className="st-avatar-actions">
          <label className="st-button st-upload" htmlFor="student-avatar">เปลี่ยนรูป</label>
          <input id="student-avatar" type="file" accept="image/*" onChange={(event) => { saveAvatar(event.target.files?.[0]); event.currentTarget.value = '' }} />
          {avatars[selectedStudent.recordId] && <button className="st-button" type="button" onClick={removeAvatar}>คืนรูปเริ่มต้น</button>}
          <small>รูปนี้บันทึกไว้ในเบราว์เซอร์เครื่องนี้</small>
        </div>
      </section>}

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
