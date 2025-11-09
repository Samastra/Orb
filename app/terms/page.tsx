export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-600">
              By using Orblin, you agree to these terms. We&apos;re a whiteboard app that helps you organize ideas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Your Content</h2>
            <p className="text-gray-600">
              You own everything you create on Orblin. We just help you organize and collaborate on it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Payments</h2>
            <p className="text-gray-600">
              We use Paddle for payments. Lifetime access means you pay once and use forever.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Contact</h2>
            <p className="text-gray-600">
              Email: your-email@gmail.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}