import { useState } from 'react'
import {
  acceptanceRateDefinition,
  gpaBands,
  gpaOf,
  mean,
  projectBands,
  projectCountOf,
  rateByBand,
  skillHeatmap,
  skillScoreOf,
  smallSampleThreshold,
} from './lib/analysis'
import type { RateGroup } from './lib/analysis'
import { formatNumber, fullName, statusLabel, uniqueSorted } from './lib/internshipStats'
import type { Student } from './lib/internshipStats'
import { minRatedSkills, skillDefinitions } from './lib/skills'
import { useElementWidth } from './lib/useElementWidth'

const formatRate = (rate: number | null) => (rate === null ? '—' : `${(rate * 100).toFixed(1)}%`)
const formatScore = (value: number | null, digits = 2) => (value === null ? 'ไม่มีข้อมูล' : value.toFixed(digits))

type Point = { student: Student; gpa: number; score: number }

// เพชรสำหรับ "ยังไม่ได้ที่ฝึกงาน" เพื่อไม่ให้แยกสถานะด้วยสีอย่างเดียว
function diamondPath(x: number, y: number, r: number) {
  return `M${x},${y - r} L${x + r},${y} L${x},${y + r} L${x - r},${y} Z`
}

function GpaSkillScatter({ rows }: { rows: Student[] }) {
  const [frameRef, width] = useElementWidth<HTMLDivElement>(560)
  const [active, setActive] = useState<Point | null>(null)

  const points: Point[] = []
  let missing = 0
  for (const student of rows) {
    const gpa = gpaOf(student)
    const score = skillScoreOf(student)
    if (gpa === null || score === null) missing += 1
    else points.push({ student, gpa, score })
  }

  if (points.length === 0) {
    return <p className="ov-empty">ไม่มีนิสิตที่มีทั้ง GPA และคะแนนทักษะในขอบเขตที่เลือก</p>
  }

  const height = 300
  const margin = { top: 12, right: 12, bottom: 44, left: 44 }
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom
  // แกน GPA เริ่มที่ช่วง 0.5 ที่ต่ำกว่าค่าต่ำสุด เพื่อไม่ให้จุดกระจุกตัว · ระบุไว้ใต้กราฟ
  const xMin = Math.max(0, Math.floor(Math.min(...points.map((p) => p.gpa)) * 2) / 2)
  const xTicks = Array.from({ length: Math.round((4 - xMin) / 0.5) + 1 }, (_, i) => xMin + i * 0.5)
  const toX = (gpa: number) => margin.left + ((gpa - xMin) / (4 - xMin)) * plotWidth
  const toY = (score: number) => margin.top + plotHeight - (score / 5) * plotHeight

  const groups = [
    { key: 'accepted', label: statusLabel.accepted, items: points.filter((p) => p.student.accepted) },
    { key: 'pending', label: statusLabel.pending, items: points.filter((p) => !p.student.accepted) },
  ]

  return (
    <>
      <div className="ov-legend">
        {groups.map((group) => (
          <span key={group.key}>
            <svg width="12" height="12" aria-hidden="true">
              {group.key === 'accepted'
                ? <circle cx="6" cy="6" r="5" className="sc-accepted" />
                : <path d={diamondPath(6, 6, 5.5)} className="sc-pending" />}
            </svg>
            {group.label} ({formatNumber(group.items.length)} คน)
          </span>
        ))}
      </div>

      <div className="sc-frame" ref={frameRef} onMouseLeave={() => setActive(null)}>
        <svg width={width} height={height} role="img" aria-labelledby="sc-desc">
          <desc id="sc-desc">
            {groups.map((g) => `${g.label} ${g.items.length} คน GPA เฉลี่ย ${formatScore(mean(g.items.map((p) => p.gpa)))} คะแนนทักษะเฉลี่ย ${formatScore(mean(g.items.map((p) => p.score)))}`).join(' · ')}
          </desc>
          {[0, 1, 2, 3, 4, 5].map((tick) => (
            <g key={`y${tick}`}>
              <line className={tick === 0 ? 'ov-axis-base' : 'ov-gridline'} x1={margin.left} x2={width - margin.right} y1={toY(tick)} y2={toY(tick)} />
              <text className="ov-tick" x={margin.left - 8} y={toY(tick) + 4} textAnchor="end">{tick}</text>
            </g>
          ))}
          {xTicks.map((tick) => (
            <text key={`x${tick}`} className="ov-tick" x={toX(tick)} y={margin.top + plotHeight + 18} textAnchor="middle">{tick.toFixed(1)}</text>
          ))}
          <text className="sc-axis-title" x={margin.left + plotWidth / 2} y={height - 4} textAnchor="middle">GPA (สะสม 0–4)</text>
          <text className="sc-axis-title" transform={`translate(12 ${margin.top + plotHeight / 2}) rotate(-90)`} textAnchor="middle">คะแนนทักษะเฉลี่ย (0–5)</text>

          {groups.map((group) => (
            <g key={group.key}>
              {group.items.map((point) => {
                const x = toX(point.gpa)
                const y = toY(point.score)
                const isActive = active?.student.recordId === point.student.recordId
                return (
                  <g key={point.student.recordId} onMouseEnter={() => setActive(point)} onClick={() => setActive(point)}>
                    {/* วงโปร่งใสขนาดใหญ่กว่าจุด ให้ชี้หรือแตะได้ง่ายขึ้น */}
                    <circle cx={x} cy={y} r={9} className="sc-hit" />
                    {group.key === 'accepted'
                      ? <circle cx={x} cy={y} r={isActive ? 6 : 4.5} className="sc-dot sc-accepted" />
                      : <path d={diamondPath(x, y, isActive ? 7 : 5.5)} className="sc-dot sc-pending" />}
                  </g>
                )
              })}
            </g>
          ))}
        </svg>

        {active && (
          <div
            className="sc-tooltip"
            role="status"
            style={{
              left: Math.min(Math.max(toX(active.gpa), 90), width - 90),
              top: toY(active.score) > height / 2 ? toY(active.score) - 12 : toY(active.score) + 16,
              transform: toY(active.score) > height / 2 ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
            }}
          >
            <strong>{fullName(active.student)}</strong>
            <span>{active.student.studentId} · ปี {active.student.academicYearBE}</span>
            <span>GPA {active.gpa.toFixed(2)} · ทักษะเฉลี่ย {active.score.toFixed(2)} / 5</span>
            <span>สายงานที่สนใจ: {active.student.interestedRole ?? 'ไม่มีข้อมูล'}</span>
            <span>สถานะ: {active.student.accepted ? statusLabel.accepted : `${statusLabel.pending} (${active.student.applicationStage ?? 'ไม่มีข้อมูล'})`}</span>
          </div>
        )}
      </div>

      <table className="sc-summary">
        <caption className="visually-hidden">ค่าเฉลี่ยแยกตามสถานะ</caption>
        <thead>
          <tr><th scope="col">กลุ่ม</th><th scope="col">จำนวน</th><th scope="col">GPA เฉลี่ย</th><th scope="col">ทักษะเฉลี่ย (0–5)</th></tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <tr key={group.key}>
              <th scope="row">{group.label}</th>
              <td>{formatNumber(group.items.length)} คน</td>
              <td>{formatScore(mean(group.items.map((p) => p.gpa)))}</td>
              <td>{formatScore(mean(group.items.map((p) => p.score)))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="ov-caption">
        แสดง {formatNumber(points.length)} คน · ไม่แสดง {formatNumber(missing)} คนที่ไม่มี GPA หรือมีผลประเมินทักษะไม่ถึง {minRatedSkills} จาก {skillDefinitions.length} ทักษะ ·
        แกน GPA เริ่มที่ {xMin.toFixed(1)} · ชี้หรือแตะจุดเพื่อดูรายละเอียด · คะแนนทักษะไม่ใช่เปอร์เซ็นต์โอกาสได้ฝึกงาน
      </p>
    </>
  )
}

function RateBars({ groups, overall, label }: { groups: RateGroup[]; overall: number | null; label: string }) {
  return (
    <>
      <ol className="rt-list" aria-label={label}>
        {groups.map((group) => (
          <li key={group.id}>
            <span className="rt-name">
              {group.label}
              {group.total > 0 && group.total < smallSampleThreshold && <span className="rt-small">ตัวอย่างน้อย</span>}
            </span>
            <span className="rt-track" aria-hidden="true">
              {group.rate !== null && <span className="rt-bar" style={{ width: `${group.rate * 100}%` }} />}
              {overall !== null && <span className="rt-overall" style={{ left: `${overall * 100}%` }} />}
            </span>
            <span className="rt-value">
              {group.total === 0 ? (
                <span className="rt-none">ไม่มีข้อมูล</span>
              ) : (
                <>
                  <strong>{formatRate(group.rate)}</strong>
                  <small>{formatNumber(group.accepted)} ÷ {formatNumber(group.total)} คน</small>
                </>
              )}
            </span>
          </li>
        ))}
      </ol>
      <p className="ov-caption">
        <span className="rt-overall-key" aria-hidden="true" /> เส้นแนวตั้ง = อัตรารวมของขอบเขตนี้ {formatRate(overall)} ·
        กลุ่มน้อยกว่า {smallSampleThreshold} คนมีป้าย “ตัวอย่างน้อย” เพราะอัตราเปลี่ยนแรงเมื่อเพิ่มหรือลดเพียงไม่กี่คน
      </p>
    </>
  )
}

// สีไล่ระดับม่วงเดียว อ่อน → เข้ม ตามค่าเฉลี่ย 0–5
function heatColor(value: number) {
  return `color-mix(in srgb, var(--accent) ${Math.round(8 + (value / 5) * 82)}%, #ffffff)`
}

function SkillHeatmap({ rows, roles, highlightRole }: { rows: Student[]; roles: string[]; highlightRole: string }) {
  const heatmap = skillHeatmap(rows, roles)

  if (rows.length === 0) {
    return <p className="ov-empty">ไม่มีข้อมูลในขอบเขตที่เลือก</p>
  }

  return (
    <>
      <div className="hm-legend" aria-hidden="true">
        <span>0</span>
        <span className="hm-gradient" />
        <span>5</span>
        <span className="hm-empty-key" /> <span>ไม่มีข้อมูล</span>
      </div>
      <div className="table-scroll hm-scroll">
        <table className="hm-table">
          <caption className="visually-hidden">ระดับทักษะเฉลี่ย (0–5) แยกตามสายงานที่สนใจ</caption>
          <thead>
            <tr>
              <th scope="col">สายงานที่สนใจ</th>
              {skillDefinitions.map((skill) => (
                <th key={skill.id} scope="col" title={skill.label}><span>{skill.short}</span></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmap.map((row) => (
              <tr key={row.role} className={highlightRole === row.role ? 'is-highlight' : undefined}>
                <th scope="row">
                  {row.role}
                  <small>n = {formatNumber(row.students)} คน</small>
                </th>
                {skillDefinitions.map((skill) => {
                  const cell = row.cells[skill.id]
                  const title = `${row.role} · ${skill.label}: ${cell.mean === null ? 'ไม่มีข้อมูล' : `เฉลี่ย ${cell.mean.toFixed(2)}`} (มีผลประเมิน ${cell.n} จาก ${row.students} คน)`
                  return cell.mean === null ? (
                    <td key={skill.id} className="hm-cell hm-missing" title={title}>—<span className="visually-hidden">{title}</span></td>
                  ) : (
                    <td key={skill.id} className={`hm-cell${cell.mean >= 2.8 ? ' is-dark' : ''}`} style={{ background: heatColor(cell.mean) }} title={title}>
                      {cell.mean.toFixed(1)}
                      <span className="visually-hidden"> ({title})</span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="ov-caption">
        ตัวเลขในช่อง = ค่าเฉลี่ยระดับทักษะ 0–5 ของนิสิตที่มีผลประเมินทักษะนั้น · n = จำนวนนิสิตในสายงาน ·
        ชี้ที่ช่องเพื่อดูจำนวนผู้ที่มีผลประเมินจริง
      </p>
    </>
  )
}

export default function OverviewAnalysis({ rows, scopeLabel }: { rows: Student[]; scopeLabel: string }) {
  const [role, setRole] = useState('all')
  const roles = uniqueSorted(rows.map((row) => row.interestedRole))
  const activeRole = role !== 'all' && roles.includes(role) ? role : 'all'
  const analysisRows = activeRole === 'all' ? rows : rows.filter((row) => row.interestedRole === activeRole)
  const overall = analysisRows.length ? analysisRows.filter((row) => row.accepted).length / analysisRows.length : null
  const scope = `${scopeLabel} · ${activeRole === 'all' ? 'ทุกสายงาน' : activeRole} · ${formatNumber(analysisRows.length)} คน`

  return (
    <section className="ov-analysis" aria-labelledby="ov-analysis-title">
      <header className="ov-analysis-header">
        <div>
          <h2 id="ov-analysis-title">GPA ทักษะ และ Portfolio กับการได้ที่ฝึกงาน</h2>
          <p className="panel-meta">{scope}</p>
        </div>
        <div className="field ov-analysis-filter">
          <label className="field-label" htmlFor="ov-analysis-role">สายงานที่สนใจ</label>
          <select id="ov-analysis-role" value={activeRole} onChange={(event) => setRole(event.target.value)}>
            <option value="all">ทุกสายงาน</option>
            {roles.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </header>

      <p className="callout">
        <span>
          GPA ทักษะ และ Portfolio เป็นข้อมูลจำลองที่สุ่มโดยไม่อ้างอิงสถานะการตอบรับ ใช้สาธิตวิธีวิเคราะห์เท่านั้น ·
          ความแตกต่างที่เห็นไม่ใช่เหตุและผล และไม่ใช้ยืนยันปัจจัยความสำเร็จหรือตลาดงานจริง · {acceptanceRateDefinition}
        </span>
      </p>

      <article className="panel" aria-labelledby="ov-scatter-title">
        <header className="panel-header">
          <div>
            <h2 id="ov-scatter-title">GPA กับคะแนนทักษะเฉลี่ย</h2>
            <p className="panel-meta">1 จุด = นิสิต 1 คน · สีและรูปทรงแยกตามสถานะ</p>
          </div>
        </header>
        <GpaSkillScatter rows={analysisRows} />
      </article>

      <div className="ov-row ov-row-rank">
        <article className="panel" aria-labelledby="ov-rate-gpa-title">
          <header className="panel-header">
            <div>
              <h2 id="ov-rate-gpa-title">อัตราได้ที่ฝึกงานแยกช่วง GPA</h2>
              <p className="panel-meta">หน่วย: % ของนิสิตในแต่ละช่วง · แกนเริ่มที่ 0%</p>
            </div>
          </header>
          <RateBars groups={rateByBand(analysisRows, gpaBands, gpaOf)} overall={overall} label="อัตราได้ที่ฝึกงานแยกช่วง GPA" />
        </article>

        <article className="panel" aria-labelledby="ov-rate-project-title">
          <header className="panel-header">
            <div>
              <h2 id="ov-rate-project-title">อัตราได้ที่ฝึกงานแยกจำนวนโครงการ</h2>
              <p className="panel-meta">จำนวนโครงการใน Portfolio · หน่วย: % · แกนเริ่มที่ 0%</p>
            </div>
          </header>
          <RateBars groups={rateByBand(analysisRows, projectBands, projectCountOf)} overall={overall} label="อัตราได้ที่ฝึกงานแยกกลุ่มจำนวนโครงการ" />
        </article>
      </div>

      <article className="panel" aria-labelledby="ov-heatmap-title">
        <header className="panel-header">
          <div>
            <h2 id="ov-heatmap-title">ระดับทักษะเฉลี่ยแยกตามสายงานที่สนใจ</h2>
            <p className="panel-meta">{scopeLabel} · ทุกสายงาน{activeRole !== 'all' ? ` · เน้นแถว ${activeRole}` : ''} · ระดับ 0–5</p>
          </div>
        </header>
        <SkillHeatmap rows={rows} roles={roles} highlightRole={activeRole} />
      </article>
    </section>
  )
}
