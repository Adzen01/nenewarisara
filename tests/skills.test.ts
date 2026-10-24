import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  benchmarkRoles,
  computeSkillGap,
  emptySkillLevels,
  minRatedSkills,
  positionRole,
  prioritizeGaps,
  roleBenchmarks,
  skillIds,
  skillScore,
} from '../src/lib/skills.ts'
import { checklistStorageKey, isBoolean, isSkillLevel, readRecord, writeRecord } from '../src/lib/checklistStorage.ts'
import type { SkillLevels } from '../src/lib/types.ts'

test('computeSkillGap: Gap = max(เป้าหมาย − ปัจจุบัน, 0)', () => {
  const current: SkillLevels = { ...emptySkillLevels(), programming: 1, frontend: 5, backend: 2, testing: null, git: 3 }
  const rows = computeSkillGap(current, roleBenchmarks['Frontend Development'])
  const gap = Object.fromEntries(rows.map((row) => [row.skill, row.gap]))
  assert.deepEqual(gap, { programming: 2, frontend: 0, backend: 0, testing: null, git: 0 })
  // แสดงเฉพาะทักษะที่อยู่ในเกณฑ์
  assert.deepEqual(rows.map((row) => row.skill), ['programming', 'frontend', 'backend', 'testing', 'git'])
})

test('computeSkillGap: ไม่มีข้อมูลทักษะทั้งชุด → gap เป็น null ทุกข้อ (ข้อมูลไม่เพียงพอ)', () => {
  const rows = computeSkillGap(null, roleBenchmarks['Data Analytics'])
  assert.ok(rows.length > 0 && rows.every((row) => row.current === null && row.gap === null))
  assert.deepEqual(prioritizeGaps(rows), [])
})

test('computeSkillGap: ระดับ 0 คือมีข้อมูล ไม่ใช่ค่าว่าง', () => {
  const rows = computeSkillGap({ ...emptySkillLevels(), security: 0 }, { security: 4 })
  assert.deepEqual(rows[0], { skill: 'security', label: rows[0].label, target: 4, current: 0, gap: 4 })
})

test('prioritizeGaps: เรียง gap มาก→น้อย แล้วตามระดับเป้าหมาย และตัดทักษะที่ถึงเกณฑ์/ไม่มีข้อมูล', () => {
  const current: SkillLevels = { ...emptySkillLevels(), programming: 3, backend: 2, database: 1, testing: 0, git: null }
  const ordered = prioritizeGaps(computeSkillGap(current, roleBenchmarks['Backend Development']))
  // programming 4−3=1, backend 4−2=2, database 3−1=2, testing 2−0=2, git ไม่มีข้อมูล
  assert.deepEqual(ordered.map((row) => [row.skill, row.gap]), [['backend', 2], ['database', 2], ['testing', 2], ['programming', 1]])
})

test('skillScore: เฉลี่ยเฉพาะทักษะที่มีผลประเมิน และต้องมีอย่างน้อยครึ่งหนึ่ง', () => {
  assert.equal(skillScore(null), null)
  const half = emptySkillLevels()
  skillIds.slice(0, minRatedSkills).forEach((id, index) => { half[id] = index % 2 === 0 ? 2 : 4 })
  assert.equal(skillScore(half), 3)
  const tooFew = emptySkillLevels()
  skillIds.slice(0, minRatedSkills - 1).forEach((id) => { tooFew[id] = 5 })
  assert.equal(skillScore(tooFew), null)
})

test('เกณฑ์ตัวอย่าง: ทุกระดับอยู่ใน 0–5 และทุกตำแหน่งจับคู่กับสายงานที่มีเกณฑ์', () => {
  for (const role of benchmarkRoles) {
    for (const level of Object.values(roleBenchmarks[role])) assert.ok(level! >= 0 && level! <= 5)
  }
  for (const role of Object.values(positionRole)) assert.ok(roleBenchmarks[role], role)
})

// ---------- เช็กลิสต์ใน localStorage ----------
function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value) },
    data,
  }
}

test('checklist: บันทึกแล้วอ่านกลับได้เหมือนเดิม', () => {
  const storage = memoryStorage()
  const value = { 'common:resume': true, 'gap:Backend Development:database:0': false }
  assert.equal(writeRecord(checklistStorageKey, value, storage), true)
  assert.deepEqual(readRecord(checklistStorageKey, isBoolean, storage), value)
})

test('checklist: JSON เสียหรือชนิดไม่ถูกต้อง → คืนค่าว่างโดยไม่ error', () => {
  assert.deepEqual(readRecord(checklistStorageKey, isBoolean, memoryStorage({ [checklistStorageKey]: '{bad' })), {})
  assert.deepEqual(readRecord(checklistStorageKey, isBoolean, memoryStorage({ [checklistStorageKey]: '[true]' })), {})
  const mixed = memoryStorage({ [checklistStorageKey]: JSON.stringify({ a: true, b: 'yes', c: 1 }) })
  assert.deepEqual(readRecord(checklistStorageKey, isBoolean, mixed), { a: true })
  assert.deepEqual(readRecord(checklistStorageKey, isBoolean, null), {})
})

test('checklist: storage เต็มหรือถูกบล็อก → writeRecord คืน false', () => {
  const blocked = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError') } }
  assert.equal(writeRecord(checklistStorageKey, { a: true }, blocked), false)
  assert.equal(writeRecord(checklistStorageKey, { a: true }, null), false)
})

test('ระดับทักษะที่กรอกเอง: รับเฉพาะจำนวนเต็ม 0–5', () => {
  const storage = memoryStorage({ manual: JSON.stringify({ programming: 3, frontend: 7, backend: 2.5, database: -1, git: 0 }) })
  assert.deepEqual(readRecord('manual', isSkillLevel, storage), { programming: 3, git: 0 })
})
