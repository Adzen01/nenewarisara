import { useState } from 'react'
import dataset from './data/internships.json'
import './Companies.css'

const students = dataset.students

const years = [
  ...new Set(students.map((student) => student.academicYearBE)),
].sort((a, b) => a - b)

const provinces = [
  ...new Set(
    students
      .filter((student) => student.accepted && student.placement)
      .map((student) => student.placement?.province)
      .filter((province): province is string => Boolean(province)),
  ),
].sort((a, b) => a.localeCompare(b, 'th'))

type CompanySummary = {
  name: string
  count: number
  provinces: Set<string>
  businessTypes: Set<string>
  positions: Map<string, number>
}

export default function Companies() {
  const [search, setSearch] = useState('')
  const [year, setYear] = useState('all')
  const [province, setProvince] = useState('all')

  const keyword = search.trim().toLocaleLowerCase('th')

  // กรองรายชื่อก่อน แล้วจึงรวมจำนวนแยกตามบริษัท
  const selectedStudents = students.filter((student) => {
    const placement = student.placement

    if (!student.accepted || !placement?.company) {
      return false
    }

    const matchesYear =
      year === 'all' || String(student.academicYearBE) === year

    const matchesProvince =
      province === 'all' || placement.province === province

    const matchesSearch = placement.company
      .toLocaleLowerCase('th')
      .includes(keyword)

    return matchesYear && matchesProvince && matchesSearch
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

    if (placement.province) {
      company.provinces.add(placement.province)
    }

    if (placement.businessType) {
      company.businessTypes.add(placement.businessType)
    }

    const position = placement.position || 'ไม่ระบุตำแหน่ง'

    company.positions.set(
      position,
      (company.positions.get(position) ?? 0) + 1,
    )
  }

  const companies = [...companyMap.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name, 'th'),
  )

  const provinceCount = new Set(
    selectedStudents
      .map((student) => student.placement?.province)
      .filter((item): item is string => Boolean(item)),
  ).size

  function resetFilters() {
    setSearch('')
    setYear('all')
    setProvince('all')
  }

  return (
    <section
      className="companies-page"
      aria-labelledby="companies-title"
    >
      <div className="co-heading">
        <h2 id="companies-title">รายชื่อสถานประกอบการ</h2>
        <p>เฉพาะรายการที่ได้รับการตอบรับในชุดข้อมูลจำลอง</p>
      </div>

      <div className="co-filters">
        <div className="co-field co-search">
          <label htmlFor="company-search">ค้นหาบริษัท</label>
          <input
            id="company-search"
            type="search"
            placeholder="พิมพ์ชื่อสถานประกอบการ"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="co-field">
          <label htmlFor="company-year">ปีฝึกงาน</label>
          <select
            id="company-year"
            value={year}
            onChange={(event) => setYear(event.target.value)}
          >
            <option value="all">ทุกปี</option>
            {years.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="co-field">
          <label htmlFor="company-province">จังหวัด</label>
          <select
            id="company-province"
            value={province}
            onChange={(event) => setProvince(event.target.value)}
          >
            <option value="all">ทุกจังหวัด</option>
            {provinces.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="co-button"
          onClick={resetFilters}
        >
          ล้างตัวกรอง
        </button>
      </div>

      <div className="co-summary" aria-live="polite">
        <span>
          สถานประกอบการ <strong>{companies.length}</strong> แห่ง
        </span>
        <span>
          ผู้ได้รับการตอบรับ <strong>{selectedStudents.length}</strong> คน
        </span>
        <span>
          จังหวัด <strong>{provinceCount}</strong> จังหวัด
        </span>
      </div>

      <div
        className="co-table-wrap"
        role="region"
        aria-label="ตารางสถานประกอบการ เลื่อนแนวนอนเพื่อดูทุกคอลัมน์"
        tabIndex={0}
      >
        <table className="co-table">
          <thead>
            <tr>
              <th scope="col">สถานประกอบการ</th>
              <th scope="col">ประเภทธุรกิจ</th>
              <th scope="col">จังหวัด</th>
              <th scope="col">ผู้ได้รับการตอบรับ</th>
              <th scope="col">ตำแหน่งฝึกงานในชุดข้อมูล</th>
            </tr>
          </thead>

          <tbody>
            {companies.map((company) => (
              <tr key={company.name}>
                <td>
                  <strong className="co-name">{company.name}</strong>
                </td>

                <td>
                  {[...company.businessTypes].join(', ') || '—'}
                </td>

                <td>
                  {[...company.provinces].join(', ') || '—'}
                </td>

                <td className="co-count">{company.count} คน</td>

                <td>
                  <details className="co-details">
                    <summary>
                      ดู {company.positions.size} ตำแหน่ง
                    </summary>

                    <ul className="co-positions">
                      {[...company.positions.entries()]
                        .sort(
                          (a, b) =>
                            b[1] - a[1] ||
                            a[0].localeCompare(b[0], 'th'),
                        )
                        .map(([position, count]) => (
                          <li key={position}>
                            <span>{position}</span>
                            <span>{count} คน</span>
                          </li>
                        ))}
                    </ul>
                  </details>
                </td>
              </tr>
            ))}

            {companies.length === 0 && (
              <tr>
                <td colSpan={5} className="co-empty">
                  ไม่พบสถานประกอบการที่ตรงกับเงื่อนไข
                  ลองเปลี่ยนหรือล้างตัวกรอง
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="co-note">
        จำนวนทั้งหมดคำนวณตามตัวกรองที่เลือก •
        การจับคู่นิสิตกับบริษัทเป็นข้อมูลจำลอง
        ไม่ใช่สถิติการรับจริงหรือประกาศตำแหน่งที่เปิดรับปัจจุบัน
      </p>
    </section>
  )
}