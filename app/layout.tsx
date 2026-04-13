import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BuildFlow MVP',
  description: 'AI-powered CI/CD optimization platform that transforms slow, inefficient build pipelines into fast, intelligent deployment workflows.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}