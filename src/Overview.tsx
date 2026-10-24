import { useEffect, useRef, useState } from 'react'
import PageHeader from './components/PageHeader'
import OverviewAnalysis from './OverviewAnalysis'
import { CompareIcon, FilterIcon } from './components/Icons'
import {
  datasetNote,
  filterYear,
  formatNumber,
  formatPercent,
  statusLabel,
  students,
  summarize,
  yearRange,
  years,
} from './lib/internshipStats'
import type { BarItem } from './lib/internshipStats'
import './Overview.css'

const yearlyData = years.map((year) => ({
  year,
  ...summarize(filterYear(students, String(year))),
}))

type YearSummary = (typeof yearlyData)[number]

function ScopeBadge({ selectedYear }: { selectedYear: string }) {
  return (
    <span className="scope-badge is-filtered">
      <FilterIcon width="13" height="13" />
      ตามตัวกรอง · {selectedYear === 'all' ? 'ทุกปี' : `ปี ${selectedYear}`}
    </span>
  )
}

function AllYearsBadge() {
  return (
    <span className="scope-badge is-all-years">
      <CompareIcon width="13" height="13" />
      เปรียบเทียบทุกปี
    </span>
  )
}

function Legend() {
  return (
    <div className="ov-legend">
      <span><i className="dot dot-accepted" aria-hidden="true" />{statusLabel.accepted}</span>
      <span><i className="dot dot-pending" aria-hidden="true" />{statusLabel.pending}</span>
    </div>
  )
}

function niceMaximum(value: number) {
  const step = value <= 20 ? 5 : value <= 50 ? 10 : 20
  return Math.max(step, Math.ceil(value / step) * step)
}

// วาด SVG ตามความกว้างจริงของกล่อง ตัวอักษรในกราฟจึงไม่ถูกย่อจนอ่านไม่ออกบนมือถือ
function YearlyStatusChart({ items, selectedYear }: { items: YearSummary[]; selectedYear: string }) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(560)

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(260, Math.round(entry.contentRect.width)))
    })
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  const height = 252
  const margin = { top: 24, right: 8, bottom: 58, left: 36 }
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom
  const maximum = niceMaximum(Math.max(...items.map((item) => Math.max(item.accepted, item.notAccepted)), 1))
  const step = maximum / 4
  const ticks = [0, 1, 2, 3, 4].map((index) => index * step)
  const baseline = margin.top + plotHeight
  const toY = (value: number) => baseline - (value / maximum) * plotHeight
  const groupWidth = plotWidth / Math.max(items.length, 1)
  const barWidth = Math.min(46, groupWidth * 0.3)
  const gap = 4

  function barPath(x: number, value: number) {
    const top = toY(value)
    const radius = Math.min(4, barWidth / 2, baseline - top)
    return `M${x},${baseline} V${top + radius} Q${x},${top} ${x + radius},${top} H${x + barWidth - radius} Q${x + barWidth},${top} ${x + barWidth},${top + radius} V${baseline} Z`
  }

  return (
    <div className="ov-year-chart" ref={frameRef}>
      <svg width={width} height={height} role="img" aria-labelledby="ov-year-chart-desc">
        <desc id="ov-year-chart-desc">
          {items.map((item) => `ปี ${item.year}: ${statusLabel.accepted} ${item.accepted} คน, ${statusLabel.pending} ${item.notAccepted} คน จาก ${item.total} คน`).join(' · ')}
        </desc>
        {ticks.map((tick) => (
          <g key={tick}>
            <line className={tick === 0 ? 'ov-axis-base' : 'ov-gridline'} x1={margin.left} x2={width - margin.right} y1={toY(tick)} y2={toY(tick)} />
            <text className="ov-tick" x={margin.left - 8} y={toY(tick) + 4} textAnchor="end">{tick}</text>
          </g>
        ))}
        {items.map((item, index) => {
          const center = margin.left + groupWidth * (index + 0.5)
          const acceptedX = center - gap / 2 - barWidth
          const pendingX = center + gap / 2
          const dimmed = selectedYear !== 'all' && String(item.year) !== selectedYear
          return (
            <g key={item.year} className={`ov-year-group${dimmed ? ' is-dimmed' : ''}`}>
              <path className="ov-bar-accepted" d={barPath(acceptedX, item.accepted)}>
                <title>{`${item.year} · ${statusLabel.accepted} ${item.accepted} คน`}</title>
              </path>
              <path className="ov-bar-pending" d={barPath(pendingX, item.notAccepted)}>
                <title>{`${item.year} · ${statusLabel.pending} ${item.notAccepted} คน`}</title>
              </path>
              <text className="ov-value" x={acceptedX + barWidth / 2} y={toY(item.accepted) - 7} textAnchor="middle">{item.accepted}</text>
              <text className="ov-value" x={pendingX + barWidth / 2} y={toY(item.notAccepted) - 7} textAnchor="middle">{item.notAccepted}</text>
              <text className="ov-year-label" x={center} y={baseline + 22} textAnchor="middle">{item.year}</text>
              <text className="ov-year-sub" x={center} y={baseline + 42} textAnchor="middle">
                {item.total} คน · ได้ {formatPercent(item.accepted, item.total)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function StatusDonut({ accepted, total }: { accepted: number; total: number }) {
  const radius = 66
  const circumference = 2 * Math.PI * radius
  const acceptedLength = total ? (circumference * accepted) / total : 0
  const pendingLength = total ? circumference - acceptedLength : 0
  const gap = accepted > 0 && accepted < total ? 3 : 0
  const notAccepted = total - accepted

  return (
    <div className="ov-donut-layout">
      <svg className="ov-donut" viewBox="0 0 168 168" role="img"
        aria-label={`${statusLabel.accepted} ${accepted} คน ${statusLabel.pending} ${notAccepted} คน จากทั้งหมด ${total} คน`}>
        <circle className="ov-donut-track" cx="84" cy="84" r={radius} />
        {acceptedLength > 0 && (
          <circle className="ov-donut-accepted" cx="84" cy="84" r={radius}
            strokeDasharray={`${Math.max(acceptedLength - gap, 0)} ${circumference}`} transform="rotate(-90 84 84)" />
        )}
        {pendingLength > 0 && (
          <circle className="ov-donut-pending" cx="84" cy="84" r={radius}
            strokeDasharray={`${Math.max(pendingLength - gap, 0)} ${circumference}`} strokeDashoffset={-acceptedLength}
            transform="rotate(-90 84 84)" />
        )}
        <text className="ov-donut-rate" x="84" y="88" textAnchor="middle">{formatPercent(accepted, total)}</text>
        <text className="ov-donut-caption" x="84" y="110" textAnchor="middle">{statusLabel.accepted}</text>
      </svg>
      <dl className="ov-donut-legend">
        <div>
          <dt><i className="dot dot-accepted" aria-hidden="true" />{statusLabel.accepted}</dt>
          <dd>{formatNumber(accepted)}<small>คน · {formatPercent(accepted, total)}</small></dd>
        </div>
        <div>
          <dt><i className="dot dot-pending" aria-hidden="true" />{statusLabel.pending}</dt>
          <dd>{formatNumber(notAccepted)}<small>คน · {formatPercent(notAccepted, total)}</small></dd>
        </div>
      </dl>
    </div>
  )
}

function Ranking({ items, label }: { items: BarItem[]; label: string }) {
  if (items.length === 0) {
    return <p className="ov-empty">ไม่มีข้อมูลในปีที่เลือก</p>
  }

  const maximum = Math.max(...items.map((item) => item.count), 1)

  return (
    <ol className="ov-ranking" aria-label={label}>
      {items.map((item) => (
        <li key={item.name}>
          <span className="ov-rank-name">{item.name}</span>
          <span className="ov-rank-track" aria-hidden="true">
            <span className="ov-rank-bar" style={{ width: `${(item.count / maximum) * 100}%` }} />
          </span>
          <span className="ov-rank-value">{formatNumber(item.count)}<span className="visually-hidden"> คน</span></span>
        </li>
      ))}
    </ol>
  )
}

function ProvinceShare({ items }: { items: BarItem[] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0)

  if (total === 0) {
    return <p className="ov-empty">ไม่มีข้อมูลในปีที่เลือก</p>
  }

  return (
    <>
      <div className="ov-share" role="img" aria-label={items.map((item) => `${item.name} ${item.count} คน`).join(', ')}>
        {items.map((item, index) => (
          <span key={item.name} className={`ov-share-part tone-${Math.min(index, 2)}`} style={{ flexBasis: `${(item.count / total) * 100}%` }}
            title={`${item.name} ${item.count} คน`} />
        ))}
      </div>
      <ul className="ov-share-legend">
        {items.map((item, index) => (
          <li key={item.name}>
            <i className={`dot ov-share-dot tone-${Math.min(index, 2)}`} aria-hidden="true" />
            <span>{item.name}</span>
            <strong>{formatNumber(item.count)} คน · {formatPercent(item.count, total)}</strong>
          </li>
        ))}
      </ul>
    </>
  )
}

export default function Overview() {
  const [selectedYear, setSelectedYear] = useState('all')
  const selectedRows = filterYear(students, selectedYear)
  const { total, accepted, notAccepted, interestedRoles, companies, provinces } = summarize(selectedRows)
  const scope = selectedYear === 'all' ? `ทุกปีฝึกงาน (${yearRange})` : `ปีฝึกงาน ${selectedYear}`
  const placedCount = provinces.reduce((sum, item) => sum + item.count, 0)

  const yearFilter = (
    <div className="year-filter">
      <span className="field-label" id="overview-year-label">ปีฝึกงาน</span>
      <div className="segmented" role="group" aria-labelledby="overview-year-label">
        {['all', ...years.map(String)].map((year) => (
          <button key={year} type="button" aria-pressed={selectedYear === year} onClick={() => setSelectedYear(year)}>
            {year === 'all' ? 'ทุกปี' : year}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <section className="page overview" aria-labelledby="overview-title">
      <PageHeader
        id="overview-title"
        title="ภาพรวมการฝึกงาน"
        description={<span aria-live="polite">{scope} · {formatNumber(total)} รายการ</span>}
        actions={yearFilter}
      />

      <section className="ov-metrics" aria-label={`ตัวเลขสรุป ${scope}`}>
        <div className="ov-metric">
          <p className="ov-metric-label">นิสิตทั้งหมด</p>
          <p className="ov-metric-value">{formatNumber(total)}<small>คน</small></p>
          <p className="ov-metric-note">{scope}</p>
        </div>
        <div className="ov-metric">
          <p className="ov-metric-label"><i className="dot dot-accepted" aria-hidden="true" />{statusLabel.accepted}</p>
          <p className="ov-metric-value">{formatNumber(accepted)}<small>คน</small></p>
          <p className="ov-metric-note">{formatPercent(accepted, total)} ของทั้งหมด</p>
        </div>
        <div className="ov-metric">
          <p className="ov-metric-label"><i className="dot dot-pending" aria-hidden="true" />{statusLabel.pending}</p>
          <p className="ov-metric-value">{formatNumber(notAccepted)}<small>คน</small></p>
          <p className="ov-metric-note">รวมทุกขั้นตอนการสมัคร</p>
        </div>
        <div className="ov-metric">
          <p className="ov-metric-label">อัตราได้ที่ฝึกงาน</p>
          <p className="ov-metric-value">{total ? ((accepted / total) * 100).toFixed(1) : '—'}<small>%</small></p>
          <p className="ov-metric-note">{formatNumber(accepted)} ÷ {formatNumber(total)} คน</p>
        </div>
      </section>

      <div className="ov-row ov-row-top">
        <article className="panel" aria-labelledby="ov-yearly-title">
          <header className="panel-header">
            <div>
              <h2 id="ov-yearly-title">สถานะการฝึกงานรายปี</h2>
              <p className="panel-meta">จำนวนนิสิต (คน) แยกตามสถานะ · แกนเริ่มที่ 0</p>
            </div>
            <AllYearsBadge />
          </header>
          <Legend />
          <YearlyStatusChart items={yearlyData} selectedYear={selectedYear} />
        </article>

        <article className="panel" aria-labelledby="ov-status-title">
          <header className="panel-header">
            <div>
              <h2 id="ov-status-title">สัดส่วนสถานะ</h2>
              <p className="panel-meta">หน่วย: คน และ %</p>
            </div>
            <ScopeBadge selectedYear={selectedYear} />
          </header>
          <StatusDonut accepted={accepted} total={total} />
        </article>
      </div>

      <div className="ov-row ov-row-rank">
        <article className="panel" aria-labelledby="ov-role-title">
          <header className="panel-header">
            <div>
              <h2 id="ov-role-title">สายงานที่สนใจ</h2>
              <p className="panel-meta">นิสิตทั้งหมดในขอบเขต · หน่วย: คน · ไม่ใช่ตำแหน่งที่ได้รับ</p>
            </div>
            <ScopeBadge selectedYear={selectedYear} />
          </header>
          <Ranking items={interestedRoles} label="จำนวนนิสิตตามสายงานที่สนใจ" />
          <p className="ov-caption">แสดงครบ {interestedRoles.length} สายงาน</p>
        </article>

        <div className="ov-column">
          <article className="panel" aria-labelledby="ov-company-title">
            <header className="panel-header">
              <div>
                <h2 id="ov-company-title">สถานประกอบการ</h2>
                <p className="panel-meta">เฉพาะผู้ได้ที่ฝึกงาน · หน่วย: คน</p>
              </div>
              <ScopeBadge selectedYear={selectedYear} />
            </header>
            <Ranking items={companies} label="จำนวนผู้ได้ที่ฝึกงานตามสถานประกอบการ" />
          </article>

          <article className="panel" aria-labelledby="ov-province-title">
            <header className="panel-header">
              <div>
                <h2 id="ov-province-title">จังหวัดของสถานประกอบการ</h2>
                <p className="panel-meta">เฉพาะผู้ได้ที่ฝึกงาน · {formatNumber(placedCount)} คน</p>
              </div>
              <ScopeBadge selectedYear={selectedYear} />
            </header>
            <ProvinceShare items={provinces} />
          </article>
        </div>
      </div>

      <OverviewAnalysis rows={selectedRows} scopeLabel={selectedYear === 'all' ? 'ทุกปี' : `ปี ${selectedYear}`} />

      <p className="page-note">
        {datasetNote} · ตัวเลขทั้งหมดเป็นการนับเชิงพรรณนา ไม่ได้บอกเหตุผลหรือโอกาสในการได้รับการตอบรับ
      </p>
    </section>
  )
}
