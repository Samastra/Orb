/* eslint-disable react/no-unescaped-entities */

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Terms of Service
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Welcome to Orblin. By using our service, you're agreeing to these terms. Please read them carefully.
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Quick Navigation */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          {['Acceptance', 'Accounts', 'Content', 'Payments', 'Conduct', 'Termination'].map((item, index) => (
            <a 
              key={index}
              href={`#section-${index + 1}`}
              className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors border border-gray-200 hover:border-blue-300"
            >
              {item}
            </a>
          ))}
        </div>

        {/* Main Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/60 overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="space-y-12">
              {/* Acceptance of Terms */}
              <section id="section-1" className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">1</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Acceptance of Terms</h2>
                </div>
                <div className="space-y-3 text-gray-600 leading-relaxed">
                  <p>
                    By accessing or using Orblin ("Service"), you agree to be bound by these Terms of Service 
                    and our Privacy Policy. If you disagree with any part of the terms, you may not access the Service.
                  </p>
                  <p>
                    We reserve the right to modify these terms at any time. We'll notify you of any changes by 
                    posting the new terms on this page and updating the "last updated" date.
                  </p>
                </div>
              </section>

              {/* Accounts and Registration */}
              <section id="section-2" className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-semibold">2</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Accounts and Registration</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-xl p-6">
                    <h3 className="font-semibold text-green-800 mb-3">Account Requirements</h3>
                    <ul className="space-y-2 text-green-700">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        You must be at least 13 years old to use Orblin
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Provide accurate and complete registration information
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Maintain the security of your password and account
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Not share your account credentials with others
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* User Content and Ownership */}
              <section id="section-3" className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 font-semibold">3</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">User Content and Ownership</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-purple-50 rounded-xl p-6">
                    <h3 className="font-semibold text-purple-800 mb-3">Your Rights</h3>
                    <ul className="space-y-2 text-purple-700">
                      <li>• You retain ownership of all content you create</li>
                      <li>• You grant us license to host and display your content</li>
                      <li>• You control who can access your boards</li>
                      <li>• You can export your data at any time</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-6">
                    <h3 className="font-semibold text-blue-800 mb-3">Our Rights</h3>
                    <ul className="space-y-2 text-blue-700">
                      <li>• We may access your content to provide support</li>
                      <li>• We can analyze usage patterns to improve service</li>
                      <li>• We reserve right to remove violating content</li>
                      <li>• AI may process content to provide features</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Payments and Billing */}
              <section id="section-4" className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 font-semibold">4</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Payments and Billing</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-orange-50 rounded-xl p-6">
                    <h3 className="font-semibold text-orange-800 mb-3">Lifetime Access</h3>
                    <p className="text-orange-700 mb-3">
                      "Lifetime Access" means access to the Service for as long as Orblin continues to operate 
                      and offer the service. This is a one-time payment that grants perpetual access to the 
                      current feature set and future updates.
                    </p>
                    <div className="bg-white/50 rounded-lg p-4">
                      <p className="text-orange-800 text-sm font-medium">
                        💡 <strong>Important:</strong> Lifetime access applies to the service, not necessarily 
                        individual features, which may be modified or discontinued.
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-800 mb-3">Billing Details</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li>• All payments are processed securely by our payment partners</li>
                      <li>• Prices are in USD and exclude applicable taxes</li>
                      <li>• No refunds except as specified in our Refund Policy</li>
                      <li>• We may change pricing with 30 days notice</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Acceptable Use and Conduct */}
              <section id="section-5" className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 font-semibold">5</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Acceptable Use and Conduct</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-red-50 rounded-xl p-6">
                    <h3 className="font-semibold text-red-800 mb-3">Prohibited Activities</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-red-700">
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Illegal or harmful content
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Harassment or abuse
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Spam or unauthorized advertising
                        </li>
                      </ul>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Reverse engineering
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Service disruption
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Copyright infringement
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Termination */}
              <section id="section-6" className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-600 font-semibold">6</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Termination</h2>
                </div>
                <div className="space-y-3 text-gray-600">
                  <p>
                    We may terminate or suspend your account immediately, without prior notice, for conduct 
                    that we believe violates these Terms or is harmful to other users, us, or third parties, 
                    or for any other reason.
                  </p>
                  <p>
                    Upon termination, your right to use the Service will immediately cease. If you wish to 
                    terminate your account, you may simply discontinue using the Service.
                  </p>
                </div>
              </section>

              {/* Disclaimer and Limitation of Liability */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 font-semibold">7</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Disclaimer</h2>
                </div>
                <div className="bg-yellow-50 rounded-xl p-6">
                  <p className="text-yellow-800">
                    The Service is provided "as is" without warranties of any kind. We do not guarantee that 
                    the Service will be uninterrupted, secure, or error-free. Your use of the Service is at 
                    your sole risk.
                  </p>
                </div>
              </section>

              {/* Contact Information */}
              <section className="bg-gradient-to-r from-gray-900 to-blue-900 rounded-2xl p-8 text-white">
                <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
                <p className="mb-4 opacity-90">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="bg-white/20 rounded-xl p-4 inline-block">
                  <p className="font-semibold">legal@orblin.com</p>
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