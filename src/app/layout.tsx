import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BuildFlow - AI-Powered CI/CD Optimization',
  description: 'Transform slow, inefficient build pipelines into fast, intelligent deployment workflows with AI-powered optimization recommendations.',
  keywords: ['CI/CD', 'GitHub Actions', 'Build Optimization', 'DevOps', 'AI', 'Automation'],
  authors: [{ name: 'Yassir Sabbar' }],
  openGraph: {
    title: 'BuildFlow - AI-Powered CI/CD Optimization',
    description: 'Reduce build times by 30%+ with intelligent CI/CD pipeline optimization',
    type: 'website',
    url: 'https://buildflow.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BuildFlow - AI-Powered CI/CD Optimization',
    description: 'Reduce build times by 30%+ with intelligent CI/CD pipeline optimization',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  )
}