import { statusLabel } from '../lib/internshipStats'

export default function StatusBadge({ accepted }: { accepted: boolean }) {
  return (
    <span className={`status-badge ${accepted ? 'is-accepted' : 'is-pending'}`}>
      <i className={`dot ${accepted ? 'dot-accepted' : 'dot-pending'}`} aria-hidden="true" />
      {accepted ? statusLabel.accepted : statusLabel.pending}
    </span>
  )
}
