export interface Todo {
  id: string
  user_id: string
  text: string
  completed: boolean
  is_habit: boolean
  created_at: string
}

export interface Streak {
  user_id: string
  current_streak: number
  longest_streak: number
  last_completed_date: string | null
}

export interface Note {
  id: string
  user_id: string
  type: 'note' | 'journal'
  title: string | null
  content: string
  is_private: boolean
  created_at: string
  updated_at: string
}

export interface GalleryEntry {
  id: string
  user_id: string
  photo_url: string
  caption: string | null
  entry_date: string
  created_at: string
}

export interface Message {
  id: string
  user_id: string
  content: string
  created_at: string
}