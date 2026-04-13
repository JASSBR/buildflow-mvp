export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          BuildFlow - AI-Powered CI/CD Optimization
        </h1>

        <p className="text-xl text-gray-600 mb-8">
          Transform slow, inefficient build pipelines into fast, intelligent deployment workflows with AI-powered optimization recommendations.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              🚀 Speed Optimization
            </h3>
            <p className="text-gray-600">
              Reduce build times by 30%+ with intelligent pipeline analysis and optimization recommendations.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              🤖 AI-Powered Insights
            </h3>
            <p className="text-gray-600">
              Get smart suggestions for improving your GitHub Actions workflows based on best practices.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              📊 Performance Analytics
            </h3>
            <p className="text-gray-600">
              Track build performance metrics and identify bottlenecks across your CI/CD pipelines.
            </p>
          </div>
        </div>

        <div className="mt-12">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-blue-900 mb-3">
              Ready to Optimize Your CI/CD?
            </h2>
            <p className="text-blue-700 mb-4">
              Connect your GitHub repository and get instant optimization recommendations.
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}