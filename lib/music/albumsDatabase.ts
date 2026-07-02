export interface AlbumData {
  id: string
  title: string
  artist: string
  youtubeId: string
  albumCover: string
  albumName?: string
  year?: number
}

export const ALBUMS_DATABASE: AlbumData[] = [
  { id: '1',  title: 'Anti-Hero',       artist: 'Taylor Swift',    youtubeId: 'b1kbLWvqugk', albumName: 'Midnights',                    year: 2022, albumCover: '' },
  { id: '2',  title: 'Flowers',         artist: 'Miley Cyrus',     youtubeId: 'G7KNmW9a75Y', albumName: 'Endless Summer Vacation',      year: 2023, albumCover: '' },
  { id: '3',  title: 'Unholy',          artist: 'Sam Smith',       youtubeId: 'Uq9gPaIzbe8', albumName: 'Gloria',                       year: 2023, albumCover: '' },
  { id: '4',  title: 'As It Was',       artist: 'Harry Styles',    youtubeId: 'H5v3kku4y6Q', albumName: "Harry's House",                year: 2022, albumCover: '' },
  { id: '5',  title: 'Heat Waves',      artist: 'Glass Animals',   youtubeId: 'mRD0-GxqHVo', albumName: 'Dreamland',                    year: 2020, albumCover: '' },
  { id: '6',  title: 'Stay',            artist: 'The Kid LAROI',   youtubeId: 'kTJczUoc26U', albumName: 'F*CK LOVE 3: OVER YOU',        year: 2021, albumCover: '' },
  { id: '7',  title: 'Industry Baby',   artist: 'Lil Nas X',       youtubeId: 'UTHLKHL_whs', albumName: 'MONTERO',                      year: 2021, albumCover: '' },
  { id: '8',  title: 'Good 4 U',        artist: 'Olivia Rodrigo',  youtubeId: 'gNi_6U5Pm_o', albumName: 'SOUR',                         year: 2021, albumCover: '' },
  { id: '9',  title: 'Levitating',      artist: 'Dua Lipa',        youtubeId: 'TUVcZfQe-Kw', albumName: 'Future Nostalgia',             year: 2020, albumCover: '' },
  { id: '10', title: 'Blinding Lights', artist: 'The Weeknd',      youtubeId: '4NRXx6U8ABQ', albumName: 'After Hours',                  year: 2020, albumCover: '' },
  { id: '11', title: 'Save Your Tears', artist: 'The Weeknd',      youtubeId: 'XXYlFuWEuKI', albumName: 'After Hours',                  year: 2021, albumCover: '' },
  { id: '12', title: 'Peaches',         artist: 'Justin Bieber',   youtubeId: 'tQ0yjYUFKAE', albumName: 'Justice',                      year: 2021, albumCover: '' },
  { id: '13', title: 'Montero',         artist: 'Lil Nas X',       youtubeId: 'SXyvDMnVNdc', albumName: 'MONTERO',                      year: 2021, albumCover: '' },
  { id: '14', title: 'drivers license', artist: 'Olivia Rodrigo',  youtubeId: 'ZmDBbnmKpqQ', albumName: 'SOUR',                         year: 2021, albumCover: '' },
  { id: '15', title: 'Watermelon Sugar',artist: 'Harry Styles',    youtubeId: 'E07s5ZYygMg', albumName: 'Fine Line',                    year: 2019, albumCover: '' },
  { id: '16', title: 'Bad Guy',         artist: 'Billie Eilish',   youtubeId: 'DyDfgMOUjCI', albumName: 'When We All Fall Asleep',      year: 2019, albumCover: '' },
  { id: '17', title: 'Shivers',         artist: 'Ed Sheeran',      youtubeId: 'Il0S8BoucSA', albumName: '=',                            year: 2021, albumCover: '' },
  { id: '18', title: 'Easy On Me',      artist: 'Adele',           youtubeId: 'U3ASj1L6_sY', albumName: '30',                           year: 2021, albumCover: '' },
  { id: '19', title: 'About Damn Time', artist: 'Lizzo',           youtubeId: 'IXXxciRCMps', albumName: 'Special',                      year: 2022, albumCover: '' },
  { id: '20', title: 'Running Up That Hill', artist: 'Kate Bush',  youtubeId: 'wp43OdtAAkM', albumName: 'Hounds of Love',               year: 1985, albumCover: '' },
  { id: '21', title: 'As It Was',       artist: 'Harry Styles',    youtubeId: 'H5v3kku4y6Q', albumName: "Harry's House",                year: 2022, albumCover: '' },
  { id: '22', title: 'Cruel Summer',    artist: 'Taylor Swift',    youtubeId: 'ic8j13piAhQ', albumName: 'Lover',                        year: 2019, albumCover: '' },
  { id: '23', title: 'Golden Hour',     artist: 'JVKE',            youtubeId: 'PEM0Vs8jf1w', albumName: 'this is what ____ feels like', year: 2022, albumCover: '' },
  { id: '24', title: 'Creepin',         artist: 'Metro Boomin',    youtubeId: 'ctCFYhMYgmU', albumName: 'Heroes & Villains',            year: 2022, albumCover: '' },
  { id: '25', title: 'Calm Down',       artist: 'Rema',            youtubeId: 'WcIcVapfqXw', albumName: 'Rave & Roses',                 year: 2022, albumCover: '' },
]

export function getAllAlbums(): AlbumData[] {
  return ALBUMS_DATABASE
}

export function searchAlbums(query: string): AlbumData[] {
  const q = query.toLowerCase()
  return ALBUMS_DATABASE.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.artist.toLowerCase().includes(q) ||
      (a.albumName ?? '').toLowerCase().includes(q)
  )
}

export function getRandomAlbums(count: number): AlbumData[] {
  return [...ALBUMS_DATABASE].sort(() => Math.random() - 0.5).slice(0, count)
}