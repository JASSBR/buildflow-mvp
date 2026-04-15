'use client';

import Link from 'next/link';
import { trackEvent } from './components/GoogleAnalytics';

export default function Home() {
  const handleCtaClick = () => {
    trackEvent('cta_click', 'conversion', 'start_optimizing_builds');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center text-center">
        <h1 className="text-6xl font-bold mb-8 text-gray-900">
          Cut Your Build Times by 30%
        </h1>
        <p className="text-2xl mb-8 text-gray-700 max-w-4xl mx-auto">
          Ship faster with AI-powered CI/CD optimization. Connect your GitHub repo and get instant recommendations that save time and money.
        </p>
        <p className="text-lg mb-12 text-gray-600 max-w-3xl mx-auto">
          Zero-config optimization • 30-second analysis • Measurable savings
        </p>

        <div className="mb-16">
          <Link href="/dashboard">
            <button
              onClick={handleCtaClick}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xl font-semibold px-12 py-4 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 transition-transform"
            >
              Start Optimizing Your Builds →
            </button>
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            Free GitHub connection • No credit card required
          </p>
        </div>

        {/* Social Proof Section */}
        <div className="mb-16 bg-gray-50 -mx-24 px-24 py-16">
          <div className="text-center mb-12">
            <p className="text-3xl font-bold text-gray-900 mb-2">Join 500+ developers optimizing builds</p>
            <p className="text-gray-600">Trusted by engineering teams at startups and enterprises</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">JS</span>
                </div>
                <div className="ml-4">
                  <p className="font-semibold text-gray-900">Jane Smith</p>
                  <p className="text-sm text-gray-600">Senior DevOps Engineer</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm italic">&quot;Cut our CI build times from 12 minutes to 7 minutes. The recommendations were spot-on and easy to implement.&quot;</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">MJ</span>
                </div>
                <div className="ml-4">
                  <p className="font-semibold text-gray-900">Mike Johnson</p>
                  <p className="text-sm text-gray-600">Engineering Lead</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm italic">&quot;Saved us $800/month on CI compute costs. The AI recommendations found optimizations we never considered.&quot;</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-lg">AC</span>
                </div>
                <div className="ml-4">
                  <p className="font-semibold text-gray-900">Alex Chen</p>
                  <p className="text-sm text-gray-600">CTO</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm italic">&quot;30-second analysis, 30% faster deploys. Our team ships features twice as fast now.&quot;</p>
            </div>
          </div>

          <div className="flex justify-center items-center mt-12 space-x-8 text-gray-600">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">2.5k+</p>
              <p className="text-sm">Repos Optimized</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">30%</p>
              <p className="text-sm">Avg. Time Saved</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">$2k+</p>
              <p className="text-sm">Monthly Savings</p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">How BuildFlow Optimizes Your CI/CD</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔗</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Connect GitHub</h3>
              <p className="text-gray-600">One-click OAuth integration with your repositories</p>
            </div>

            <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Analyze Workflows</h3>
              <p className="text-gray-600">Automatic discovery and build time analysis</p>
            </div>

            <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Get AI Recommendations</h3>
              <p className="text-gray-600">Intelligent optimization suggestions with ROI estimates</p>
            </div>

            <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Ship Faster</h3>
              <p className="text-gray-600">Implement optimizations and track improvements</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}