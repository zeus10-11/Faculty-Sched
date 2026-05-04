export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white">404</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-4">Page not found</p>
        <a href="/" className="inline-block mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}
