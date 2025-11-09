/* eslint-disable react/no-unescaped-entities */

export default function RefundsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Refund Policy
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We stand behind our product. If you're not satisfied, we'll make it right.
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-green-600 to-blue-600 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Main Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/60 overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="space-y-12">
              {/* 30-Day Guarantee */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-semibold">✓</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">30-Day Money-Back Guarantee</h2>
                </div>
                
                <div className="bg-green-50 rounded-xl p-6">
                  <p className="text-green-800 text-lg font-medium mb-4">
                    We offer a full refund within 30 days of your purchase, no questions asked.
                  </p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-green-800 mb-3">What's Covered</h3>
                      <ul className="space-y-2 text-green-700">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Dissatisfaction with features
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Technical issues we can't resolve
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Change of mind within 30 days
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800 mb-3">Process</h3>
                      <ul className="space-y-2 text-green-700">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Email us within 30 days
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Include your purchase details
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Refund processed in 5-7 days
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Lifetime Access Specifics */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">∞</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Lifetime Access Details</h2>
                </div>
                
                <div className="bg-blue-50 rounded-xl p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-white text-xs">i</span>
                      </div>
                      <div>
                        <p className="text-blue-800 font-medium">What "Lifetime" Means</p>
                        <p className="text-blue-700 text-sm">
                          Lifetime access grants you perpetual use of Orblin for as long as we continue to 
                          operate and offer the service. This includes all current features and future updates.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-white text-xs">!</span>
                      </div>
                      <div>
                        <p className="text-blue-800 font-medium">Refund Eligibility</p>
                        <p className="text-blue-700 text-sm">
                          Lifetime access purchases are refundable within the first 30 days. After 30 days, 
                          all sales are final as you retain access to the service permanently.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* How to Request a Refund */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 font-semibold">→</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">How to Request a Refund</h2>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-purple-600 font-semibold">1</span>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">Contact Us</h3>
                    <p className="text-gray-600 text-sm">
                      Email refunds@orblin.com within 30 days of purchase
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-purple-600 font-semibold">2</span>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">Provide Details</h3>
                    <p className="text-gray-600 text-sm">
                      Include your email and order information
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-purple-600 font-semibold">3</span>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">Get Refund</h3>
                    <p className="text-gray-600 text-sm">
                      We'll process your refund within 5-7 business days
                    </p>
                  </div>
                </div>
              </section>

              {/* Non-Refundable Circumstances */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 font-semibold">!</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Non-Refundable Circumstances</h2>
                </div>
                
                <div className="bg-orange-50 rounded-xl p-6">
                  <ul className="space-y-3 text-orange-800">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <span>Requests made after 30 days from purchase</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <span>Accounts terminated for violation of our Terms of Service</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <span>Partial refunds for unused time (all plans are all-or-nothing)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <span>Change of mind after 30 days for lifetime access</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Contact & Support */}
              <section className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white text-center">
                <h2 className="text-2xl font-bold mb-4">We're Here to Help</h2>
                <p className="mb-6 opacity-90 max-w-2xl mx-auto">
                  If you're experiencing issues with Orblin, please contact our support team first. 
                  We'd love the opportunity to fix any problems before you consider a refund.
                </p>
                <div className="space-y-3">
                  <div className="bg-white/20 rounded-xl p-4 inline-block mx-2">
                    <p className="font-semibold">refunds@orblin.com</p>
                  </div>
                  <div className="bg-white/20 rounded-xl p-4 inline-block mx-2">
                    <p className="font-semibold">support@orblin.com</p>
                  </div>
                </div>
              </section>

              {/* Last Updated */}
              <div className="text-center text-gray-500 text-sm border-t pt-8">
                <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}