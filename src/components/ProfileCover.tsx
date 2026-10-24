import { profile } from '../profile'

// ภาพปกและรูปโปรไฟล์แบบหน้า Notion · รูปเป็นภาพตกแต่ง จึงไม่ต้องให้ screen reader อ่าน
export default function ProfileCover() {
  return (
    <div className="profile-cover">
      <div className="profile-cover-image">
        <img src={profile.coverSrc} alt="" style={{ objectPosition: profile.coverPosition }} />
      </div>
      <div className="profile-identity">
        <img className="profile-avatar" src={profile.avatarSrc} alt="รูปโปรไฟล์" width="112" height="112" />
        <div className="profile-text">
          <p className="profile-title">{profile.title}</p>
          <p className="profile-subtitle">{profile.subtitle}</p>
        </div>
      </div>
    </div>
  )
}
