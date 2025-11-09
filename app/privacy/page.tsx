/* eslint-disable react/no-unescaped-entities */

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We believe in transparency and protecting your data. Here's how we handle your information.
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Main Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/60 overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="space-y-12">
              {/* Introduction */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">1</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Introduction</h2>
                </div>
                <div className="space-y-3 text-gray-600 leading-relaxed">
                  <p>
                    At Orblin, we take your privacy seriously. This Privacy Policy explains how we collect, 
                    use, disclose, and safeguard your information when you use our AI-powered whiteboard service.
                  </p>
                  <p>
                    By using Orblin, you consent to the data practices described in this policy. 
                    If you do not agree with the terms, please do not access or use our services.
                  </p>
                </div>
              </section>

              {/* Information We Collect */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-semibold">2</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-800 mb-3">Personal Information</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Account information (name, email, profile picture)
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Billing and payment information
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Communication preferences
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-800 mb-3">Content and Usage Data</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        Whiteboard content, ideas, and collaborative sessions
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        AI-generated insights and connections
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        Usage patterns, feature interactions, and performance data
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-800 mb-3">Technical Information</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        IP address, browser type, and device information
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Cookies and similar tracking technologies
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* How We Use Your Information */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 font-semibold">3</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">How We Use Your Information</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-xl p-6">
                    <h3 className="font-semibold text-blue-800 mb-3">Service Operation</h3>
                    <ul className="space-y-2 text-blue-700">
                      <li>• Provide and maintain Orblin services</li>
                      <li>• Process transactions and send confirmations</li>
                      <li>• Enable real-time collaboration features</li>
                      <li>• Deliver AI-powered insights and suggestions</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 rounded-xl p-6">
                    <h3 className="font-semibold text-green-800 mb-3">Improvement & Analytics</h3>
                    <ul className="space-y-2 text-green-700">
                      <li>• Enhance user experience and develop new features</li>
                      <li>• Monitor and analyze service performance</li>
                      <li>• Conduct research and development</li>
                      <li>• Ensure platform security and integrity</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Data Sharing & Disclosure */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 font-semibold">4</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Data Sharing & Disclosure</h2>
                </div>
                
                <div className="space-y-4 text-gray-600">
                  <p>
                    We do not sell your personal information. We may share data with:
                  </p>
                  
                  <div className="bg-orange-50 rounded-xl p-6">
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-white text-sm">✓</span>
                        </div>
                        <div>
                          <span className="font-semibold text-orange-800">Service Providers:</span>
                          <p className="text-orange-700">Payment processors, hosting services, and analytics providers under strict data protection agreements</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-white text-sm">✓</span>
                        </div>
                        <div>
                          <span className="font-semibold text-orange-800">Legal Requirements:</span>
                          <p className="text-orange-700">When required by law, court order, or governmental regulations</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-white text-sm">✓</span>
                        </div>
                        <div>
                          <span className="font-semibold text-orange-800">Business Transfers:</span>
                          <p className="text-orange-700">In connection with a merger, acquisition, or sale of assets</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Data Security */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 font-semibold">5</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Data Security</h2>
                </div>
                <div className="space-y-3 text-gray-600">
                  <p>
                    We implement industry-standard security measures including encryption, access controls, 
                    and regular security assessments to protect your data.
                  </p>
                  <p>
                    While we strive to use commercially acceptable means to protect your information, 
                    no method of transmission over the Internet is 100% secure.
                  </p>
                </div>
              </section>

              {/* Your Rights */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold">6</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Your Rights</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    "Access and download your data",
                    "Correct inaccurate information",
                    "Delete your personal data",
                    "Object to processing",
                    "Data portability",
                    "Withdraw consent"
                  ].map((right, index) => (
                    <div key={index} className="flex items-center gap-3 bg-indigo-50 rounded-lg p-4">
                      <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">✓</span>
                      </div>
                      <span className="text-indigo-800 font-medium">{right}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Contact */}
              <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                <h2 className="text-2xl font-bold mb-4">Questions?</h2>
                <p className="mb-4 opacity-90">
                  If you have any questions about this Privacy Policy or our data practices, 
                  please contact us at:
                </p>
                <div className="bg-white/20 rounded-xl p-4 inline-block">
                  <p className="font-semibold">privacy@orblin.com</p>
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