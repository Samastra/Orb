export default function RefundsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Refund Policy</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">30-Day Guarantee</h2>
            <p className="text-gray-600">
              Not happy? Email us within 30 days for a full refund.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">How to Get a Refund</h2>
            <p className="text-gray-600">
              Email your-email@gmail.com with your purchase details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Lifetime Access</h2>
            <p className="text-gray-600">
              Refundable within 30 days. After that, it's yours forever.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}