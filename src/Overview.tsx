import { useState } from 'react'
import dataset from './data/internships.json'
import { filterYear, getYears, summarize } from './lib/internshipStats'
import type { BarItem, Student } from './lib/internshipStats'
import './Overview.css'

const students: Student[] = dataset.students
const years = getYears(students)

const yearlyData = years.map((year) => ({
  year,
  ...summarize(filterYear(students, String(year))),
}))

function Ranking({ items }: { items: BarItem[] }) {
  const maximum = Math.max(...items.map((item) => item.count), 1)

  if (!items.length) {
    return <p className="ov-muted">ไม่มีข้อมูลในช่วงที่เลือก</p>
  }

  return (
    <div className="ov-ranking">
      {items.map((item) => (
        <div className="ov-rank-row" key={item.name}>
          <div className="ov-rank-label">
            <span>{item.name}</span>
            <strong>{item.count.toLocaleString('th-TH')} คน</strong>
          </div>

          <div className="ov-track" aria-hidden="true">
            <div
              className="ov-bar"
              style={{ width: `${(item.count / maximum) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Overview() {
  const [selectedYear, setSelectedYear] = useState('all')

  const selectedData = filterYear(students, selectedYear)

  const {
    total,
    accepted,
    notAccepted,
    acceptanceRate,
    roles,
    companies,
    provinces,
  } = summarize(selectedData)

  const scope =
    selectedYear === 'all'
      ? `รวมปีฝึกงาน ${years.join(', ')}`
      : `ปีฝึกงาน ${selectedYear}`

  const metrics = [
    {
      label: 'นิสิตทั้งหมด',
      value: total.toLocaleString('th-TH'),
      detail: 'คน ในขอบเขตที่เลือก',
    },
    {
      label: 'ได้ที่ฝึกงานแล้ว',
      value: accepted.toLocaleString('th-TH'),
      detail: 'คน ได้รับการตอบรับ',
    },
    {
      label: 'ยังไม่ได้ที่ฝึกงาน',
      value: notAccepted.toLocaleString('th-TH'),
      detail: 'คน รวมทุกขั้นตอนการสมัคร',
    },
    {
      label: 'อัตราได้ที่ฝึกงาน',
      value:
        acceptanceRate === null
          ? '—'
          : `${acceptanceRate.toFixed(1)}%`,
      detail: total
        ? `${accepted} ÷ ${total} × 100`
        : 'ไม่มีข้อมูลในช่วงที่เลือก',
    },
  ]

  return (
    <div className="overview">
      <div className="ov-toolbar">
        <div>
          <h2>ภาพรวมการฝึกงาน</h2>
          <p className="ov-muted">{scope}</p>
        </div>

        <div className="ov-filter">
          <label htmlFor="overview-year">ปีฝึกงาน</label>
          <select
            id="overview-year"
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
          >
            <option value="all">ทุกปี</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="ov-metrics">
        {metrics.map((metric) => (
          <div className="ov-metric" key={metric.label}>
            <h3>{metric.label}</h3>
            <strong className="ov-metric-value">{metric.value}</strong>
            <p>{metric.detail}</p>
          </div>
        ))}
      </div>

      <div className="ov-grid">
        <section className="ov-panel">
          <header className="ov-panel-header">
            <h3>สถานะการได้ที่ฝึกงานรายปี</h3>
            <p>
              เปรียบเทียบทุกปี • ความยาวแถบแสดงสัดส่วนภายในแต่ละปี
            </p>
          </header>

          <div className="ov-legend">
            <span>
              <i className="ov-dot accepted" /> ได้แล้ว
            </span>
            <span>
              <i className="ov-dot pending" /> ยังไม่ได้
            </span>
          </div>

          <div className="ov-years">
            {yearlyData.map((item) => (
              <div className="ov-year-row" key={item.year}>
                <div className="ov-year-label">
                  <strong>{item.year}</strong>
                  <span>
                    ได้แล้ว {item.accepted} / ยังไม่ได้ {item.notAccepted} คน
                  </span>
                </div>

                <div className="ov-stacked" aria-hidden="true">
                  <div
                    className="ov-segment accepted"
                    style={{ width: `${item.acceptanceRate ?? 0}%` }}
                  />
                  <div
                    className="ov-segment pending"
                    style={{
                      width: `${
                        item.total
                          ? (item.notAccepted / item.total) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <p className="ov-year-rate">
                  ทั้งหมด {item.total} คน • อัตราได้ที่ฝึกงาน{' '}
                  {item.acceptanceRate === null
                    ? '—'
                    : `${item.acceptanceRate.toFixed(1)}%`}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="ov-panel">
          <header className="ov-panel-header">
            <h3>สายงานที่สนใจของผู้ได้รับการตอบรับ</h3>
            <p>
              {Math.min(5, roles.length)} อันดับแรก จาก {roles.length}{' '}
              สายงาน • {scope}
            </p>
          </header>

          <Ranking items={roles.slice(0, 5)} />
        </section>

        <section className="ov-panel">
          <header className="ov-panel-header">
            <h3>สถานประกอบการ</h3>
            <p>จำนวนผู้ได้รับการตอบรับ • {scope}</p>
          </header>

          <Ranking items={companies} />
        </section>

        <section className="ov-panel">
          <header className="ov-panel-header">
            <h3>จังหวัดที่ตั้งสถานประกอบการ</h3>
            <p>
              เฉพาะผู้ได้รับการตอบรับ {accepted} คน • {scope}
            </p>
          </header>

          <Ranking items={provinces} />

          <div className="ov-location-summary">
            {provinces.map((province) => (
              <div key={province.name}>
                <span>{province.name}</span>
                <strong>
                  {accepted
                    ? ((province.count / accepted) * 100).toFixed(1)
                    : '0.0'}
                  %
                </strong>
              </div>
            ))}
          </div>

          <p className="ov-note">
            นับจังหวัดตามสถานประกอบการในชุดข้อมูล
            ไม่ใช่จังหวัดที่อยู่อาศัยของนิสิต
          </p>
        </section>
      </div>

      <footer className="ov-footer">
        {dataset.metadata.note} • สายงานหมายถึงสายงานที่สนใจ
      </footer>
    </div>
  )
}