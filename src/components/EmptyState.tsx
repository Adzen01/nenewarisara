import type { ReactNode } from 'react'
import { SearchIcon } from './Icons'

type EmptyStateProps = {
  title: string
  description: string
  action?: ReactNode
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state" role="status">
      <span className="empty-state-icon" aria-hidden="true"><SearchIcon width="22" height="22" /></span>
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-text">{description}</p>
      {action}
    </div>
  )
}
