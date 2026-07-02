export interface AppConfig {
  id: string
  name: string
  emoji: string
  color: string
}

export const apps: AppConfig[] = [
  {
    id: 'todo',
    name: 'To-Do',
    emoji: '✅',
    color: 'linear-gradient(135deg, rgba(255,159,67,0.85), rgba(255,99,72,0.85))',
  },
  {
    id: 'notes',
    name: 'Notes',
    emoji: '📝',
    color: 'linear-gradient(135deg, rgba(255,221,89,0.85), rgba(255,159,67,0.85))',
  },
  {
    id: 'gallery',
    name: 'Gallery',
    emoji: '📸',
    color: 'linear-gradient(135deg, rgba(120,200,255,0.85), rgba(99,132,255,0.85))',
  },
  {
    id: 'lounge',
    name: 'Lounge',
    emoji: '💬',
    color: 'linear-gradient(135deg, rgba(170,140,255,0.85), rgba(120,99,255,0.85))',
  },
  {
    id: 'music',
    name: 'Vynora',
    emoji: '🎵',
    color: 'linear-gradient(135deg, #1a1a2e, #16213e)',
  },
]