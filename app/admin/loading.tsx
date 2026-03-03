export default function AdminLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-500">Loading...</p>
      </div>
    </div>
  );
}
