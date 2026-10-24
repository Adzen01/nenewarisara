import { useState } from 'react'
import PageHeader from './components/PageHeader'
import DetailDrawer from './components/DetailDrawer'
import EmptyState from './components/EmptyState'
import { ChevronRightIcon, InfoIcon, SearchIcon } from './components/Icons'
import { formatNumber, students, uniqueSorted, years } from './lib/internshipStats'
import { positionRole, roleBenchmarks, skillDefinitions } from './lib/skills'
import './Companies.css'

// ไฟล์โลโก้ที่มีอยู่ในโปรเจกต์ ถ้าโหลดไม่ได้จะแสดงตัวย่อบริษัทแทน
const companyLogos: Record<string, string> = {
  AIS: '/company-logos/ais.png',
  'CDG Systems': '/company-logos/cdg-systems.png',
  'Gosoft (Thailand)': '/company-logos/gosoft.png',
  KBTG: '/company-logos/kbtg.jpg',
  'LINE MAN Wongnai': '/company-logos/line-man-wongnai.jpg',
  'SCB TechX': '/company-logos/scb-techx.jpg',
}

const provinces = uniqueSorted(
  students.filter((student) => student.accepted).map((student) => student.placement?.province),
)

type CompanySummary = {
  name: string
  count: number
  provinces: Set<string>
  businessTypes: Set<string>
  positions: Map<string, number>
}

function initials(name: string) {
  const words = name.replace(/\(.*?\)/g, '').trim().split(/\s+/).filter(Boolean)
  const letters = words.length > 1 ? words.slice(0, 2).map((word) => word[0]).join('') : (words[0] ?? '?').slice(0, 2)
  return letters.toUpperCase()
}

function CompanyMark({ name }: { name: string }) {
  const [failed, setFailed] = useState(false)
  const logo = companyLogos[name]

  if (!logo || failed) {
    return <span className="co-mark co-mark-fallback" aria-hidden="true">{initials(name)}</span>
  }

  return (
    <span className="co-mark">
      <img src={logo} alt="" loading="lazy" onError={() => setFailed(true)} />
    </span>
  )
}

const benchmarkNote = 'เกณฑ์ตัวอย่างที่ทีมผู้จัดทำกำหนดเพื่อสาธิต ไม่ใช่ข้อกำหนดของบริษัท และไม่ได้มาจากประกาศรับสมัครจริง'

// ทักษะที่เกี่ยวข้องกับตำแหน่ง อ้างอิงเกณฑ์ตัวอย่างของสายงานที่จับคู่ไว้
function PositionSkills({ position }: { position: string }) {
  const role = positionRole[position]
  const benchmark = role ? roleBenchmarks[role] : undefined
  if (!benchmark) return <p className="detail-muted">ข้อมูลไม่เพียงพอ: ยังไม่มีเกณฑ์ตัวอย่างสำหรับตำแหน่งนี้</p>
  return (
    <ul className="co-skill-chips" aria-label={`ทักษะที่เกี่ยวข้องกับ ${position}`}>
      {skillDefinitions
        .filter((skill) => benchmark[skill.id] !== undefined)
        .map((skill) => (
          <li key={skill.id}>{skill.label}<strong>ระดับ {benchmark[skill.id]}</strong></li>
        ))}
    </ul>
  )
}

function sortedPositions(company: CompanySummary) {
  return [...company.positions.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'th'))
}

export default function Companies() {
  const [search, setSearch] = useState('')
  const [year, setYear] = useState('all')
  const [province, setProvince] = useState('all')
  const [selectedName, setSelectedName] = useState<string | null>(null)

  const keyword = search.trim().toLocaleLowerCase('th')
  const hasFilters = keyword !== '' || year !== 'all' || province !== 'all'

  // กรองรายชื่อก่อน แล้วจึงรวมจำนวนแยกตามบริษัท
  const selectedStudents = students.filter((student) => {
    const placement = student.placement
    if (!student.accepted || !placement?.company) return false
    return (
      (year === 'all' || String(student.academicYearBE) === year) &&
      (province === 'all' || placement.province === province) &&
      placement.company.toLocaleLowerCase('th').includes(keyword)
    )
  })

  const companyMap = new Map<string, CompanySummary>()

  for (const student of selectedStudents) {
    const placement = student.placement
    if (!placement?.company) continue

    let company = companyMap.get(placement.company)
    if (!company) {
      company = {
        name: placement.company,
        count: 0,
        provinces: new Set<string>(),
        businessTypes: new Set<string>(),
        positions: new Map<string, number>(),
      }
      companyMap.set(placement.company, company)
    }

    company.count += 1
    if (placement.province) company.provinces.add(placement.province)
    if (placement.businessType) company.businessTypes.add(placement.businessType)
    const position = placement.position || 'ไม่ระบุตำแหน่ง'
    company.positions.set(position, (company.positions.get(position) ?? 0) + 1)
  }

  const companies = [...companyMap.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name, 'th'),
  )
  const maxCount = Math.max(...companies.map((company) => company.count), 1)
  const provinceCount = new Set(selectedStudents.map((student) => student.placement?.province).filter(Boolean)).size
  const positionTotals = new Map<string, number>()
  for (const student of selectedStudents) {
    const position = student.placement?.position
    if (position) positionTotals.set(position, (positionTotals.get(position) ?? 0) + 1)
  }
  const positionCounts = [...positionTotals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'th'))
  const selectedCompany = companies.find((company) => company.name === selectedName) ?? null
  const scope = [year === 'all' ? 'ทุกปี' : `ปี ${year}`, province === 'all' ? 'ทุกจังหวัด' : province].join(' · ')

  function resetFilters() {
    setSearch('')
    setYear('all')
    setProvince('all')
  }

  return (
    <section className="page" aria-labelledby="companies-title">
      <PageHeader
        id="companies-title"
        title="สถานประกอบการ"
        description="บริษัทที่มีผู้ได้ที่ฝึกงานในชุดข้อมูล จำนวนผู้ได้รับการตอบรับ จังหวัด ตำแหน่งที่พบ และทักษะที่เกี่ยวข้องกับตำแหน่ง"
      />

      <div className="panel filter-panel">
        <div className="filter-bar">
          <div className="field field-search">
            <label className="field-label" htmlFor="company-search">ค้นหาบริษัท</label>
            <div className="input-with-icon">
              <SearchIcon />
              <input
                id="company-search"
                type="search"
                placeholder="พิมพ์ชื่อสถานประกอบการ"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="company-year">ปีฝึกงาน</label>
            <select id="company-year" value={year} onChange={(event) => setYear(event.target.value)}>
              <option value="all">ทุกปี</option>
              {years.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="company-province">จังหวัด</label>
            <select id="company-province" value={province} onChange={(event) => setProvince(event.target.value)}>
              <option value="all">ทุกจังหวัด</option>
              {provinces.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          <button type="button" className="button button-secondary" onClick={resetFilters} disabled={!hasFilters}>
            ล้างตัวกรอง
          </button>
        </div>
      </div>

      <dl className="co-summary" aria-live="polite">
        <div><dt>สถานประกอบการ</dt><dd>{formatNumber(companies.length)}<small>แห่ง</small></dd></div>
        <div><dt>ผู้ได้ที่ฝึกงาน</dt><dd>{formatNumber(selectedStudents.length)}<small>คน</small></dd></div>
        <div><dt>จังหวัด</dt><dd>{formatNumber(provinceCount)}<small>จังหวัด</small></dd></div>
        <div className="co-summary-scope"><dt>ขอบเขต</dt><dd className="co-scope-text">{scope}</dd></div>
      </dl>

      {companies.length === 0 ? (
        <div className="panel">
          <EmptyState
            title="ไม่พบสถานประกอบการที่ตรงกับเงื่อนไข"
            description="ลองเปลี่ยนคำค้นหรือล้างตัวกรองเพื่อดูรายการทั้งหมด"
            action={<button className="button button-primary" type="button" onClick={resetFilters}>ล้างตัวกรอง</button>}
          />
        </div>
      ) : (
        <div className="panel table-panel">
          <div className="table-scroll">
            <table className="data-table co-table">
              <caption className="visually-hidden">สถานประกอบการ {scope}</caption>
              <thead>
                <tr>
                  <th scope="col">สถานประกอบการ</th>
                  <th scope="col">จังหวัด</th>
                  <th scope="col">ผู้ได้ที่ฝึกงาน</th>
                  <th scope="col">ตำแหน่งในชุดข้อมูลจำลอง</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.name}>
                    <td data-label="สถานประกอบการ">
                      <div className="co-company">
                        <CompanyMark name={company.name} />
                        <div>
                          <span className="cell-primary">{company.name}</span>
                          <span className="cell-secondary">{[...company.businessTypes].join(', ') || '—'}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="จังหวัด">{[...company.provinces].join(', ') || '—'}</td>
                    <td data-label="ผู้ได้ที่ฝึกงาน">
                      <div className="co-count">
                        <span className="co-count-value">{formatNumber(company.count)} คน</span>
                        <span className="co-count-track" aria-hidden="true">
                          <span style={{ width: `${(company.count / maxCount) * 100}%` }} />
                        </span>
                      </div>
                    </td>
                    <td data-label="ตำแหน่งในชุดข้อมูลจำลอง">
                      <button
                        className="button button-ghost"
                        type="button"
                        onClick={() => setSelectedName(company.name)}
                        aria-label={`ดู ${company.positions.size} ตำแหน่งของ ${company.name}`}
                      >
                        ดู {company.positions.size} ตำแหน่ง
                        <ChevronRightIcon width="16" height="16" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {positionCounts.length > 0 && (
        <section className="panel" aria-labelledby="co-position-skills-title">
          <header className="panel-header">
            <div>
              <h2 id="co-position-skills-title">ทักษะที่เกี่ยวข้องกับตำแหน่ง</h2>
              <p className="panel-meta">ตำแหน่งที่พบตามตัวกรอง ({scope}) · ระดับ 0–5 ตามเกณฑ์ตัวอย่างของทีม</p>
            </div>
            <span className="count-badge">{positionCounts.length} ตำแหน่ง</span>
          </header>
          <p className="callout"><InfoIcon /><span>{benchmarkNote} · ใช้ชุดเดียวกับเกณฑ์ Skill Gap ในหน้าเตรียมความพร้อม</span></p>
          <ul className="co-position-skills">
            {positionCounts.map(([position, count]) => (
              <li key={position}>
                <div className="co-position-row">
                  <strong>{position}</strong>
                  <span>{formatNumber(count)} คน</span>
                </div>
                <PositionSkills position={position} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="page-note">
        จำนวนคำนวณตามตัวกรองที่เลือก · การจับคู่นิสิตกับบริษัทและตำแหน่งเป็นข้อมูลจำลอง
        ไม่ใช่สถิติการรับจริงหรือประกาศเปิดรับสมัครในปัจจุบัน
      </p>

      <DetailDrawer
        open={selectedCompany !== null}
        onClose={() => setSelectedName(null)}
        eyebrow="ตำแหน่งในชุดข้อมูล"
        title={selectedCompany?.name ?? ''}
      >
        {selectedCompany && (
          <div className="detail-stack">
            <div className="co-drawer-identity">
              <CompanyMark name={selectedCompany.name} />
              <dl className="fact-list fact-list-inline">
                <div><dt>ประเภทธุรกิจ</dt><dd>{[...selectedCompany.businessTypes].join(', ') || '—'}</dd></div>
                <div><dt>จังหวัด</dt><dd>{[...selectedCompany.provinces].join(', ') || '—'}</dd></div>
                <div><dt>ผู้ได้ที่ฝึกงาน</dt><dd>{formatNumber(selectedCompany.count)} คน · {scope}</dd></div>
              </dl>
            </div>

            <section className="detail-section" aria-labelledby="company-positions-title">
              <h3 id="company-positions-title">ตำแหน่งที่พบ ({selectedCompany.positions.size})</h3>
              <ul className="co-positions">
                {sortedPositions(selectedCompany).map(([position, count]) => (
                  <li key={position} className="co-position-item">
                    <div className="co-position-row">
                      <span>{position}</span>
                      <strong>{formatNumber(count)} คน</strong>
                    </div>
                    <p className="co-position-role">ทักษะที่เกี่ยวข้อง (เกณฑ์ตัวอย่างของทีม · สายงาน {positionRole[position] ?? 'ไม่มีข้อมูล'})</p>
                    <PositionSkills position={position} />
                  </li>
                ))}
              </ul>
            </section>

            <p className="callout">
              <InfoIcon />
              <span>ตำแหน่งเหล่านี้มาจากชุดข้อมูลจำลอง ไม่ใช่ประกาศเปิดรับสมัครของบริษัทในปัจจุบัน · ระดับทักษะเป็น{benchmarkNote}</span>
            </p>
          </div>
        )}
      </DetailDrawer>
    </section>
  )
}
