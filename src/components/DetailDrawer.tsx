import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { CloseIcon } from './Icons'

type DetailDrawerProps = {
  open: boolean
  title: ReactNode
  eyebrow?: ReactNode
  onClose: () => void
  children: ReactNode
}

// ใช้ <dialog> ของเบราว์เซอร์ จึงได้ focus trap, ปุ่ม Esc และคืน focus ให้ปุ่มที่เปิดโดยอัตโนมัติ
export default function DetailDrawer({ open, title, eyebrow, onClose, children }: DetailDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className="drawer"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="drawer-panel">
        <header className="drawer-header">
          <div className="drawer-heading">
            {eyebrow && <p className="drawer-eyebrow">{eyebrow}</p>}
            <h2 id={titleId}>{title}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="ปิดรายละเอียด">
            <CloseIcon />
          </button>
        </header>
        <div className="drawer-body">{open && children}</div>
      </div>
    </dialog>
  )
}
