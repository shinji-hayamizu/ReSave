export interface User {
  id: string
  email: string
  createdAt: string
}

export interface UserProfile extends User {
  displayName?: string
  avatarUrl?: string
}
