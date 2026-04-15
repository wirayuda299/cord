
export type Invitation = {
  code: string
  created_at: string
  created_by: string
  id: string
  max_users: number
  uses: number
  server_id: string
  username: string
  server_name: string
  member_count: number
  logo: string | null
  banner_color: string[]
}
