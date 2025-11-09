export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">What We Collect</h2>
            <p className="text-gray-600">
              Basic account info and your whiteboard content. We need this to make the app work.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">How We Use It</h2>
            <p className="text-gray-600">
              To provide the whiteboard service and improve your experience.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Data Sharing</h2>
            <p className="text-gray-600">
              We only share with Paddle for payments. We don't sell your data.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}