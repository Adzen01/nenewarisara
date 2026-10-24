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

type YearSummary = (typeof yearlyData)[number]

function countInterestedRoles(rows: Student[]): BarItem[] {
  const counts = new Map<string, number>()

  rows.forEach((student) => {
    const role = student.interestedRole?.trim() || 'ไม่ได้ระบุ'
    counts.set(role, (counts.get(role) ?? 0) + 1)
  })

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'th'))
}

function Ranking({ items }: { items: BarItem[] }) {
  const maximum = Math.max(...items.map((item) => item.count), 1)

  if (items.length === 0) {
    return <p className="ov-empty">ไม่มีข้อมูลในช่วงที่เลือก</p>
  }

  return (
    <ol className="ov-ranking">
      {items.slice(0, 5).map((item, index) => (
        <li className="ov-rank-row" key={item.name}>
          <span className="ov-rank-number">{String(index + 1).padStart(2, '0')}</span>
          <div className="ov-rank-main">
            <div className="ov-rank-label">
              <span>{item.name}</span>
              <strong>{item.count.toLocaleString('th-TH')} คน</strong>
            </div>
            <div className="ov-track" aria-hidden="true">
              <span className="ov-bar" style={{ width: `${(item.count / maximum) * 100}%` }} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}

function YearlyRateChart({ items }: { items: YearSummary[] }) {
  const left = 45
  const top = 18
  const width = 470
  const height = 154
  const points = items.map((item, index) => ({
    ...item,
    x: items.length < 2 ? left + width / 2 : left + (index / (items.length - 1)) * width,
    y: top + height * (1 - (item.acceptanceRate ?? 0) / 100),
  }))

  return (
    <div className="ov-chart-frame">
      <svg className="ov-line-chart" viewBox="0 0 550 225" role="img" aria-label="อัตราการตอบรับแยกตามปีฝึกงาน">
        <title>แนวโน้มอัตราการตอบรับรายปี</title>
        {[0, 50, 100].map((tick) => {
          const y = top + height * (1 - tick / 100)
          return (
            <g key={tick}>
              <line className="ov-gridline" x1={left} x2={left + width} y1={y} y2={y} />
              <text className="ov-axis-label" x={left - 9} y={y + 4} textAnchor="end">{tick}%</text>
            </g>
          )
        })}
        {points.length > 1 && <polyline className="ov-trend-line" points={points.map((point) => `${point.x},${point.y}`).join(' ')} />}
        {points.map((point) => (
          <g key={point.year}>
            <circle className="ov-trend-point" cx={point.x} cy={point.y} r="4.5">
              <title>{point.year}: {point.acceptanceRate?.toFixed(1) ?? '—'}% จาก {point.total} คน</title>
            </circle>
            <text className="ov-point-value" x={point.x} y={Math.max(12, point.y - 11)} textAnchor="middle">
              {point.acceptanceRate?.toFixed(1) ?? '—'}%
            </text>
            <text className="ov-axis-label" x={point.x} y={top + height + 23} textAnchor="middle">{point.year}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function StatusDonut({ accepted, total }: { accepted: number; total: number }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const acceptedLength = total > 0 ? circumference * accepted / total : 0
  const rate = total > 0 ? accepted / total * 100 : null

  return (
    <div className="ov-donut-layout">
      <svg className="ov-donut" viewBox="0 0 150 150" role="img" aria-label={`ตอบรับแล้ว ${accepted} คน จากทั้งหมด ${total} คน`}>
        <title>สัดส่วนผู้ได้รับการตอบรับ</title>
        <circle className="ov-donut-track" cx="75" cy="75" r={radius} />
        <circle className="ov-donut-value" cx="75" cy="75" r={radius}
          strokeDasharray={`${acceptedLength} ${circumference}`} transform="rotate(-90 75 75)" />
        <text className="ov-donut-rate" x="75" y="73" textAnchor="middle">{rate === null ? '—' : `${rate.toFixed(1)}%`}</text>
        <text className="ov-donut-caption" x="75" y="93" textAnchor="middle">ตอบรับแล้ว</text>
      </svg>
      <div className="ov-donut-legend">
        <div><i className="ov-legend-dot is-accepted" /><span>ได้รับการตอบรับ</span><strong>{accepted.toLocaleString('th-TH')} คน</strong></div>
        <div><i className="ov-legend-dot is-pending" /><span>ยังไม่ได้รับการตอบรับ</span><strong>{(total - accepted).toLocaleString('th-TH')} คน</strong></div>
      </div>
    </div>
  )
}

function CompanyScatter({ rows }: { rows: typeof dataset.students }) {
  const companyMap = new Map<string, { accepted: number; positions: Set<string> }>()

  rows.forEach((student) => {
    const name = student.accepted ? student.placement?.company?.trim() : ''
    if (!name) return

    const company = companyMap.get(name) ?? { accepted: 0, positions: new Set<string>() }
    company.accepted += 1
    const position = student.placement?.position?.trim()
    if (position) company.positions.add(position)
    companyMap.set(name, company)
  })

  const points = [...companyMap.entries()].map(([name, value]) => ({ name, ...value }))
  const [highlightedCompany, setHighlightedCompany] = useState<string | null>(null)
  if (points.length === 0) return <p className="ov-empty ov-scatter-empty">ไม่มีบริษัทที่ได้รับการตอบรับในช่วงที่เลือก</p>

  const left = 50
  const top = 15
  const width = 460
  const height = 144
  const minAccepted = Math.min(...points.map((point) => point.accepted))
  const maxAccepted = Math.max(...points.map((point) => point.accepted), 1)
  const acceptedStart = Math.max(0, minAccepted - 2)
  const acceptedEnd = maxAccepted + 2
  const middleAccepted = Math.round((acceptedStart + acceptedEnd) / 2)
  const minPositions = Math.min(...points.map((point) => point.positions.size))
  const maxPositions = Math.max(...points.map((point) => point.positions.size), 0)
  const positionsStart = Math.max(0, minPositions - 1)
  const positionsEnd = Math.max(maxPositions + 1, positionsStart + 1)
  const middlePositions = Math.round((positionsStart + positionsEnd) / 2)
  const countTicks = [...new Set([acceptedStart, middleAccepted, acceptedEnd])]
  const positionTicks = [...new Set([positionsStart, middlePositions, positionsEnd])]
  const highlighted = points.find((point) => point.name === highlightedCompany)
    ?? [...points].sort((a, b) => b.accepted - a.accepted || a.name.localeCompare(b.name, 'th'))[0]

  return (
    <div className="ov-chart-frame">
      <svg className="ov-scatter" viewBox="0 0 550 224" role="group" aria-label="จำนวนผู้ได้รับการตอบรับเทียบกับจำนวนชื่อตำแหน่งของแต่ละบริษัท">
        <title>หนึ่งจุดแทนหนึ่งบริษัท</title>
        <desc>แกนนอนแสดงจำนวนผู้ตอบรับ แกนตั้งแสดงจำนวนชื่อตำแหน่งที่พบใน JSON โดยปรับช่วงแกนตามข้อมูลที่เลือก</desc>
        {positionTicks.map((tick) => {
          const fraction = (tick - positionsStart) / (positionsEnd - positionsStart)
          const y = top + height * (1 - fraction)
          return (
            <g key={`y-${tick}`}>
              <line className="ov-gridline" x1={left} x2={left + width} y1={y} y2={y} />
              <text className="ov-axis-label" x={left - 8} y={y + 4} textAnchor="end">{tick}</text>
            </g>
          )
        })}
        {countTicks.map((tick) => {
          const fraction = (tick - acceptedStart) / (acceptedEnd - acceptedStart)
          const x = left + width * fraction
          return (
            <g key={`x-${tick}`}>
              <line className="ov-gridline ov-gridline-v" x1={x} x2={x} y1={top} y2={top + height} />
              <text className="ov-axis-label" x={x} y={top + height + 18} textAnchor="middle">{tick}</text>
            </g>
          )
        })}
        {points.map((point) => {
          const x = left + (point.accepted - acceptedStart) / (acceptedEnd - acceptedStart) * width
          const y = top + height - (point.positions.size - positionsStart) / (positionsEnd - positionsStart) * height
          return (
            <circle className={`ov-scatter-point ${highlighted.name === point.name ? 'is-highlighted' : ''}`} key={point.name} cx={x} cy={y} r="5.5" tabIndex={0}
              onMouseEnter={() => setHighlightedCompany(point.name)}
              onMouseLeave={() => setHighlightedCompany(null)}
              onFocus={() => setHighlightedCompany(point.name)}
              onBlur={() => setHighlightedCompany(null)}
              aria-label={`${point.name}: ${point.accepted} คน และ ${point.positions.size} ชื่อตำแหน่ง`}>
              <title>{point.name} · ตอบรับ {point.accepted} คน · {point.positions.size} ชื่อตำแหน่ง</title>
            </circle>
          )
        })}
        <text className="ov-axis-title" x={left + width / 2} y="216" textAnchor="middle">ผู้ได้รับการตอบรับ (คน)</text>
        <text className="ov-axis-title" x="12" y={top + height / 2} textAnchor="middle" transform={`rotate(-90 12 ${top + height / 2})`}>จำนวนชื่อตำแหน่ง</text>
      </svg>
      <p className="ov-scatter-selection" aria-live="polite">
        <strong>{highlighted.name}</strong>
        <span>ตอบรับ {highlighted.accepted} คน</span>
        <span>{highlighted.positions.size} ชื่อตำแหน่ง</span>
      </p>
    </div>
  )
}

export default function Overview() {
  const [selectedYear, setSelectedYear] = useState('all')
  const selectedData = filterYear(students, selectedYear)
  const rawSelectedData = dataset.students.filter((student) => selectedYear === 'all' || String(student.academicYearBE) === selectedYear)
  const { total, accepted, notAccepted, acceptanceRate, companies, provinces } = summarize(selectedData)
  const roles = countInterestedRoles(selectedData)
  const scope = selectedYear === 'all' ? `ทุกปีฝึกงาน ${years.join(' · ')}` : `ปีฝึกงาน ${selectedYear}`
  const firstYear = yearlyData[0]
  const latestYear = yearlyData[yearlyData.length - 1]
  const rateChange = firstYear?.acceptanceRate !== null && latestYear?.acceptanceRate !== null
    && firstYear?.acceptanceRate !== undefined && latestYear?.acceptanceRate !== undefined
    ? latestYear.acceptanceRate - firstYear.acceptanceRate
    : null

  const metrics = [
    { label: 'นิสิตทั้งหมด', value: total, unit: 'คน', note: scope },
    { label: 'ได้รับการตอบรับ', value: accepted, unit: 'คน', note: `${total ? (accepted / total * 100).toFixed(1) : '0.0'}% ของข้อมูลที่เลือก` },
    { label: 'ยังไม่ได้รับการตอบรับ', value: notAccepted, unit: 'คน', note: 'รวมทุกขั้นตอนการสมัคร' },
    { label: 'อัตราการตอบรับ', value: acceptanceRate === null ? '—' : acceptanceRate.toFixed(1), unit: acceptanceRate === null ? '' : '%', note: 'ผู้ตอบรับ ÷ นิสิตทั้งหมด' },
  ]

  return (
    <section className="overview" aria-labelledby="overview-title">
      <header className="ov-toolbar">
        <div className="ov-heading">
          <p className="ov-kicker">ภาพรวมข้อมูล</p>
          <h2 id="overview-title">ภาพรวมการฝึกงาน</h2>
          <p className="ov-muted">{scope} <span aria-hidden="true">·</span> {total.toLocaleString('th-TH')} รายการในขอบเขตที่เลือก</p>
        </div>
        <div className="ov-filter">
          <label htmlFor="overview-year">เลือกปีฝึกงาน</label>
          <select id="overview-year" value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>
            <option value="all">ทุกปี</option>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
      </header>

      <section key={`metrics-${selectedYear}`} className="ov-metrics" aria-label="ตัวเลขสรุป">
        {metrics.map((metric, index) => (
          <div className={`ov-metric ${index === 3 ? 'ov-metric-highlight' : ''}`} key={metric.label}>
            <p className="ov-metric-label">{metric.label}</p>
            <p className="ov-metric-number">
              <strong>{typeof metric.value === 'number' ? metric.value.toLocaleString('th-TH') : metric.value}</strong>
              {metric.unit && <span>{metric.unit}</span>}
            </p>
            <p className="ov-metric-note">{metric.note}</p>
          </div>
        ))}
      </section>

      <section key={`charts-${selectedYear}`} className="ov-insight-grid" aria-label="กราฟสรุปผล">
        <article className="ov-panel ov-panel-trend">
          <header className="ov-panel-header">
            <div><p className="ov-panel-index">01 / แนวโน้ม</p><h3>อัตราการตอบรับรายปี</h3></div>
            <span className="ov-unit">หน่วย: %</span>
          </header>
          <p className="ov-panel-subtitle">เปรียบเทียบทุกปี · คำนวณจากผู้ตอบรับ ÷ นิสิตทั้งหมด</p>
          {rateChange !== null && firstYear && latestYear && (
            <p className="ov-trend-summary" aria-live="polite">
              ระหว่าง {firstYear.year}–{latestYear.year} อัตราการตอบรับ
              {' '}{rateChange > 0 ? 'สูงขึ้น' : rateChange < 0 ? 'ลดลง' : 'คงเดิม'}
              {' '}{Math.abs(rateChange).toFixed(1)} จุดเปอร์เซ็นต์
            </p>
          )}
          <YearlyRateChart items={yearlyData} />
        </article>

        <article className="ov-panel ov-panel-status">
          <header className="ov-panel-header">
            <div><p className="ov-panel-index">02 / สถานะ</p><h3>สัดส่วนการตอบรับ</h3></div>
          </header>
          <p className="ov-panel-subtitle">{scope} · แบ่งตามสถานะจาก JSON</p>
          <StatusDonut accepted={accepted} total={total} />
        </article>

        <article className="ov-panel ov-panel-years">
          <header className="ov-panel-header">
            <div><p className="ov-panel-index">03 / เปรียบเทียบ</p><h3>ผลการตอบรับแยกตามปี</h3></div>
            <div className="ov-legend">
              <span><i className="ov-legend-dot is-accepted" /> ตอบรับแล้ว</span>
              <span><i className="ov-legend-dot is-pending" /> ยังไม่ได้</span>
            </div>
          </header>
          <div className="ov-year-chart">
            {yearlyData.map((item) => (
              <div className="ov-year-row" key={item.year}>
                <div className="ov-year-topline">
                  <strong>{item.year}</strong>
                  <span>{item.accepted} / {item.total} คน</span>
                </div>
                <div className="ov-stacked" role="img" aria-label={`${item.year} ได้รับการตอบรับ ${item.accepted} จาก ${item.total} คน`}>
                  <span className="ov-segment is-accepted" style={{ width: `${item.total ? item.accepted / item.total * 100 : 0}%` }} />
                  <span className="ov-segment is-pending" style={{ width: `${item.total ? item.notAccepted / item.total * 100 : 0}%` }} />
                </div>
                <p className="ov-year-detail">ตอบรับ {item.acceptanceRate === null ? '—' : `${item.acceptanceRate.toFixed(1)}%`} <span>·</span> ยังไม่ได้ {item.notAccepted} คน</p>
              </div>
            ))}
          </div>
        </article>

        <article className="ov-panel ov-panel-scatter">
          <header className="ov-panel-header">
            <div><p className="ov-panel-index">04 / การกระจาย</p><h3>ขนาดบริษัทและตำแหน่ง</h3></div>
          </header>
          <p className="ov-panel-subtitle">แต่ละจุดคือบริษัท · โฟกัสเพื่อดูรายละเอียด · ช่วงแกนปรับตามข้อมูล</p>
          <CompanyScatter rows={rawSelectedData} />
        </article>
      </section>

      <section className="ov-rank-section" aria-labelledby="ov-rank-title">
        <header className="ov-rank-heading">
          <div><p className="ov-kicker">รายละเอียดในชุดข้อมูล</p><h3 id="ov-rank-title">อันดับข้อมูลที่พบ</h3></div>
          <p className="ov-muted">สายงานนับจากความสนใจของนิสิตทั้งหมด · บริษัทและจังหวัดนับเฉพาะผู้ได้รับการตอบรับ · {scope}</p>
        </header>
        <div key={`ranks-${selectedYear}`} className="ov-rank-grid">
          <article className="ov-rank-panel">
            <header><h4>สายงานที่สนใจ</h4><p>นิสิตทั้งหมด · ไม่ใช่ตำแหน่งที่ได้รับ</p></header>
            <Ranking items={roles} />
          </article>
          <article className="ov-rank-panel">
            <header><h4>สถานประกอบการ</h4><p>จำนวนผู้ตอบรับ · คน</p></header>
            <Ranking items={companies} />
          </article>
          <article className="ov-rank-panel">
            <header><h4>จังหวัดสถานประกอบการ</h4><p>จำนวนผู้ตอบรับ · คน</p></header>
            <Ranking items={provinces} />
          </article>
        </div>
      </section>

      <footer className="ov-footer">
        <span>ขอบเขตข้อมูล</span> {dataset.metadata.note} · กราฟแนวโน้มและผลรายปีเปรียบเทียบทุกปี ส่วนกราฟอื่นเปลี่ยนตามตัวกรองปี
      </footer>
    </section>
  )
}
