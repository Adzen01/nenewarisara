import type { ReactNode } from 'react'

type PageHeaderProps = {
  id: string
  title: string
  description: ReactNode
  actions?: ReactNode
}

export default function PageHeader({ id, title, description, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header-text">
        <div className="page-title-row">
          <h1 id={id} tabIndex={-1}>{title}</h1>
          <span className="demo-badge">ข้อมูลจำลอง</span>
        </div>
        <p className="page-description">{description}</p>
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  )
}
