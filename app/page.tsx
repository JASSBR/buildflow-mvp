export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-6xl font-bold text-center mb-8">
          BuildFlow MVP
        </h1>
        <p className="text-xl text-center mb-12 text-gray-600">
          AI-powered CI/CD optimization platform that transforms slow,
          inefficient build pipelines into fast, intelligent deployment workflows.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">GitHub Integration</h3>
            <p className="text-gray-600">OAuth integration with GitHub repositories</p>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Pipeline Analysis</h3>
            <p className="text-gray-600">Automatic workflow discovery and build time analysis</p>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Optimization Engine</h3>
            <p className="text-gray-600">AI-powered recommendations for build improvements</p>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Performance Dashboard</h3>
            <p className="text-gray-600">Visual metrics and impact tracking</p>
          </div>
        </div>
      </div>
    </main>
  )
}