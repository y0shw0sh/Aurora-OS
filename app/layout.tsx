import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'

export const metadata: Metadata = {
  title: 'Aurora',
  description: 'Shared private space',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
  href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Nunito:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
      </head>
      <body className="h-full">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}