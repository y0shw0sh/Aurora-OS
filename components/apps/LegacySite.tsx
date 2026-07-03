'use client'

export default function LegacySite() {
  return (
    <iframe
      src="/legacy-site/index.html"
      className="w-full h-full border-0"
      allow="autoplay; fullscreen; picture-in-picture"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
      title="My Site"
    />
  )
}