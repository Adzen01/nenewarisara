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
import {
  applicationStages,
  acceptedStage,
  defaultStudentFilters,
  filterStudents,
  gpaBands,
  gpaOf,
  missingGroupId,
  skillScoreOf,
} from './lib/analysis'
import type { StudentFilters } from './lib/analysis'
import { maxSkillLevel, minRatedSkills, skillDefinitions, skillLevelMeanings } from './lib/skills'
import type { SkillId } from './lib/types'
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

function formatSkillScore(score: number | null) {
  return score === null ? 'ข้อมูลไม่เพียงพอ' : score.toFixed(2)
}

function SkillBars({ student }: { student: Student }) {
  const skills = student.profile?.skills
  if (!skills) return <p className="detail-muted">ไม่มีผลประเมินทักษะ</p>
  return (
    <ul className="skill-bars" aria-label="ระดับทักษะรายด้าน (0–5)">
      {skillDefinitions.map((skill) => {
        const level = skills[skill.id]
        return (
          <li key={skill.id}>
            <span className="skill-bars-name">{skill.label}</span>
            <span className="skill-bars-track" aria-hidden="true">
              {level !== null && <span style={{ width: `${(level / maxSkillLevel) * 100}%` }} />}
            </span>
            <span className={`skill-bars-value${level === null ? ' is-missing' : ''}`}>
              {level === null ? 'ไม่มีข้อมูล' : `${level} · ${skillLevelMeanings[level].label}`}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function PortfolioDetail({ student }: { student: Student }) {
  const portfolio = student.profile?.portfolio
  const evidence =
    portfolio?.hasEvidence === true ? 'มีหลักฐานผลงาน' : portfolio?.hasEvidence === false ? 'ยังไม่มีหลักฐานผลงาน' : 'ไม่มีข้อมูล'
  return (
    <section className="detail-section" aria-labelledby="student-detail-portfolio">
      <h3 id="student-detail-portfolio">Portfolio <span className="sim-tag">ข้อมูลจำลอง</span></h3>
      {portfolio ? (
        <dl className="fact-list">
          <Fact label="จำนวนโครงการ" value={portfolio.projectCount === null ? 'ไม่มีข้อมูล' : `${portfolio.projectCount} โครงการ`} />
          <Fact label="หลักฐานผลงาน" value={evidence} />
          <Fact label="ประเภทโครงการ" value={portfolio.projectTypes.join(', ')} />
          <Fact label="เทคโนโลยี" value={portfolio.technologies.join(', ')} />
        </dl>
      ) : (
        <p className="detail-muted">ไม่มีข้อมูล Portfolio</p>
      )}
      <p className="detail-muted">ชุดข้อมูลเก็บเพียงสถานะว่ามีหลักฐานผลงานหรือไม่ ไม่มีลิงก์ผลงาน</p>
    </section>
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

      <section className="detail-section" aria-labelledby="student-detail-gpa">
        <h3 id="student-detail-gpa">ผลการเรียนและทักษะ <span className="sim-tag">ข้อมูลจำลอง</span></h3>
        <dl className="fact-list">
          <Fact label="GPA สะสม (0–4)" value={gpaOf(student)?.toFixed(2) ?? 'ไม่มีข้อมูล'} />
          <Fact label="คะแนนทักษะเฉลี่ย (0–5)" value={formatSkillScore(skillScoreOf(student))} />
        </dl>
        <SkillBars student={student} />
      </section>

      <PortfolioDetail student={student} />

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
  const [filters, setFilters] = useState<StudentFilters>(defaultStudentFilters)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const hasFilters = (Object.keys(filters) as (keyof StudentFilters)[]).some(
    (key) => key !== 'minLevel' && filters[key].trim() !== defaultStudentFilters[key],
  )
  const filteredStudents = filterStudents(students, filters)

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const visibleStudents = filteredStudents.slice(startIndex, startIndex + pageSize)
  const selectedStudent = students.find((student) => student.recordId === selectedId) ?? null

  function updateFilter(key: keyof StudentFilters) {
    return (value: string) => {
      setFilters((current) => ({ ...current, [key]: value }))
      setPage(1)
    }
  }

  function resetFilters() {
    setFilters(defaultStudentFilters)
    setPage(1)
  }

  return (
    <section className="page" aria-labelledby="students-title">
      <PageHeader
        id="students-title"
        title="ข้อมูลนิสิต"
        description="ค้นหาและกรองนิสิตตามปี สถานะ สายงานที่สนใจ GPA และระดับทักษะ แล้วเปิดดูรายละเอียดรายคน"
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
                value={filters.keyword}
                onChange={(event) => updateFilter('keyword')(event.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="student-year">ปีฝึกงาน</label>
            <select id="student-year" value={filters.year} onChange={(event) => updateFilter('year')(event.target.value)}>
              <option value="all">ทุกปี</option>
              {years.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="student-status">สถานะ</label>
            <select id="student-status" value={filters.status} onChange={(event) => updateFilter('status')(event.target.value)}>
              <option value="all">ทุกสถานะ</option>
              <option value="accepted">{statusLabel.accepted}</option>
              <option value="pending">{statusLabel.pending} (ทุกขั้นตอน)</option>
              <optgroup label="ขั้นตอนของผู้ที่ยังไม่ได้">
                {applicationStages.filter((stage) => stage !== acceptedStage).map((stage) => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="student-role">สายงานที่สนใจ</label>
            <select id="student-role" value={filters.role} onChange={(event) => updateFilter('role')(event.target.value)}>
              <option value="all">ทุกสายงาน</option>
              {roles.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="student-gpa">ช่วง GPA</label>
            <select id="student-gpa" value={filters.gpaBand} onChange={(event) => updateFilter('gpaBand')(event.target.value)}>
              <option value="all">ทุกช่วง</option>
              {gpaBands.map((band) => <option key={band.id} value={band.id}>{band.label}</option>)}
              <option value={missingGroupId}>ไม่มีข้อมูล GPA</option>
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="student-skill">ทักษะ</label>
            <select id="student-skill" value={filters.skill} onChange={(event) => updateFilter('skill')(event.target.value)}>
              <option value="all">ทุกทักษะ</option>
              {skillDefinitions.map((skill) => <option key={skill.id} value={skill.id}>{skill.label}</option>)}
            </select>
          </div>

          <div className="field field-narrow">
            <label className="field-label" htmlFor="student-level">ระดับอย่างน้อย</label>
            <select id="student-level" value={filters.minLevel} disabled={filters.skill === 'all'}
              onChange={(event) => updateFilter('minLevel')(event.target.value)}>
              {skillLevelMeanings.filter((item) => item.level > 0).map((item) => (
                <option key={item.level} value={item.level}>{item.level} · {item.label}</option>
              ))}
            </select>
          </div>

          <button className="button button-secondary" type="button" onClick={resetFilters} disabled={!hasFilters}>
            ล้างตัวกรอง
          </button>
        </div>
      </div>

      <p className="result-count" aria-live="polite">
        พบ <strong>{formatNumber(filteredStudents.length)}</strong> จาก {formatNumber(students.length)} รายการ
        {filters.skill !== 'all' && ` · ทักษะ ${skillDefinitions.find((skill) => skill.id === (filters.skill as SkillId))?.label} ระดับ ${filters.minLevel} ขึ้นไป (ไม่รวมผู้ที่ไม่มีผลประเมินทักษะนี้)`}
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
                  <th scope="col">GPA</th>
                  <th scope="col">ทักษะเฉลี่ย</th>
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
                    <td data-label="GPA" className="cell-number">{gpaOf(student)?.toFixed(2) ?? '—'}</td>
                    <td data-label="ทักษะเฉลี่ย (0–5)" className="cell-number">{skillScoreOf(student)?.toFixed(2) ?? '—'}</td>
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
        ข้อมูลจำลองสำหรับสาธิต · สายงานที่สนใจและตำแหน่งฝึกงานที่ได้รับเป็นคนละข้อมูล · เครื่องหมาย — หมายถึงไม่มีข้อมูลในชุดข้อมูล ·
        ทักษะเฉลี่ยคำนวณเมื่อมีผลประเมินอย่างน้อย {minRatedSkills} จาก {skillDefinitions.length} ทักษะ และไม่ใช่เปอร์เซ็นต์โอกาสได้ฝึกงาน
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
