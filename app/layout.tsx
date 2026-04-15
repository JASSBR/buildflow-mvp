import type { Metadata } from 'next'
import './globals.css'
import GoogleAnalytics from './components/GoogleAnalytics'

export const metadata: Metadata = {
  title: 'BuildFlow MVP - Cut Build Times by 30% with AI-Powered CI/CD Optimization',
  description: 'Cut your build times by 30% and ship faster with intelligent CI/CD optimization. Zero-config AI recommendations for GitHub repositories. Free analysis in under 30 seconds.',
  keywords: [
    'ci/cd optimization',
    'github actions',
    'build time optimization',
    'devops automation',
    'ai powered development',
    'continuous integration',
    'deployment optimization'
  ],
  authors: [{ name: 'BuildFlow MVP' }],
  creator: 'BuildFlow MVP',
  publisher: 'BuildFlow MVP',
  metadataBase: new URL('https://buildflow-mvp.vercel.app'),
  openGraph: {
    title: 'BuildFlow MVP - Cut Build Times by 30%',
    description: 'AI-powered CI/CD optimization that saves time and money. Connect your GitHub repo and get instant optimization recommendations.',
    url: 'https://buildflow-mvp.vercel.app',
    siteName: 'BuildFlow MVP',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BuildFlow MVP - AI-Powered CI/CD Optimization',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BuildFlow MVP - Cut Build Times by 30%',
    description: 'AI-powered CI/CD optimization that saves time and money.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  )
}