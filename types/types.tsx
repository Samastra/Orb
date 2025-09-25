export type Tool = "select" | "stickyNote" | "text" | "rect" | "pen" | "connect" | "sort" | "ellipse" | "shapes"| "triangle" | "arrow" | "circle" | "stage";


export interface CreateUser {
  id: string // UUID
  clerk_user_id: string
  email: string | null
  username: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string // ISO timestamp
  updated_at: string // ISO timestamp
}
