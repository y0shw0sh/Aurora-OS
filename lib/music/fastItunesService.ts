interface iTunesSearchResult {
  results: iTunesTrack[]
}

interface iTunesTrack {
  trackId: number
  artistName: string
  trackName: string
  artworkUrl100: string
}

class FastItunesService {
  private readonly baseURL = 'https://itunes.apple.com/search'
  private coverCache = new Map<string, string>()

  async getAlbumCover(artist: string, track: string): Promise<string | null> {
    const cacheKey = `${artist.toLowerCase()}-${track.toLowerCase()}`
    if (this.coverCache.has(cacheKey)) return this.coverCache.get(cacheKey)!

    try {
      const clean = (s: string) =>
        s.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()
      const q = encodeURIComponent(`${clean(artist)} ${clean(track)}`)
      const url = `${this.baseURL}?term=${q}&media=music&entity=song&limit=3`
      const res = await fetch(url)
      if (!res.ok) return null
      const data: iTunesSearchResult = await res.json()
      const match = data.results?.find((t) => t.artworkUrl100)
      if (match) {
        const hq = match.artworkUrl100.replace('100x100bb', '600x600bb')
        this.coverCache.set(cacheKey, hq)
        return hq
      }
      return null
    } catch {
      return null
    }
  }
}

export const fastItunesService = new FastItunesService()