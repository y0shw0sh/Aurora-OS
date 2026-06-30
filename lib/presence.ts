import { supabase } from '@/lib/supabaseClient'

export type PresenceState = {
  userId: string
  typing: boolean
}

export function createPresenceChannel(
  roomId: string,
  userId: string,
  onPresenceChange: (states: PresenceState[]) => void
) {
  const channel = supabase.channel(`room:${roomId}`, {
    config: { presence: { key: userId } },
  })

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<PresenceState>()
      const flat = Object.values(state).flat()
      onPresenceChange(flat)
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ userId, typing: false })
      }
    })

  return channel
}