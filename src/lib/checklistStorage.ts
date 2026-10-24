// อ่าน/เขียนค่าใน localStorage แบบปลอดภัย · รับ storage เป็นพารามิเตอร์เพื่อให้ทดสอบได้
export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

export const checklistStorageKey = 'ce-internship-preparation-v1'
export const manualSkillsStorageKey = 'ce-internship-manual-skills-v1'

function browserStorage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function readRecord<T>(key: string, isValue: (value: unknown) => value is T, storage = browserStorage()): Record<string, T> {
  try {
    const raw = storage?.getItem(key)
    if (!raw) return {}
    const value: unknown = JSON.parse(raw)
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return {}
    return Object.fromEntries(Object.entries(value).filter(([, item]) => isValue(item))) as Record<string, T>
  } catch {
    return {}
  }
}

// คืนค่า false เมื่อบันทึกไม่ได้ เช่น โหมดส่วนตัวหรือพื้นที่เต็ม
export function writeRecord(key: string, value: Record<string, unknown>, storage = browserStorage()) {
  try {
    if (!storage) return false
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'
export const isSkillLevel = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 5
