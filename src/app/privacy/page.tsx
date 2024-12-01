export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-24">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="text-gray-600 mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Name and contact information</li>
              <li>Account credentials</li>
              <li>Payment information</li>
              <li>Communication preferences</li>
              <li>Chat logs and interaction data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-600 mb-4">
              We use the collected information for:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Providing and improving our services</li>
              <li>Processing payments</li>
              <li>Sending administrative information</li>
              <li>Responding to your requests</li>
              <li>Analyzing and improving our platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Data Security</h2>
            <p className="text-gray-600">
              We implement appropriate technical and organizational security measures to protect
              your personal information. However, no method of transmission over the Internet
              is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Retention</h2>
            <p className="text-gray-600">
              We retain your personal information for as long as necessary to fulfill the
              purposes outlined in this Privacy Policy, unless a longer retention period is
              required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
            <p className="text-gray-600 mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to data processing</li>
              <li>Request data portability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
            <p className="text-gray-600">
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:answerlyai.cloud@gmail.com" className="text-blue-600 hover:text-blue-700">
              answerlyai.cloud@gmail.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Updates to This Policy</h2>
            <p className="text-gray-600">
              We may update this Privacy Policy from time to time. We will notify you of any
              changes by posting the new Privacy Policy on this page and updating the
              "Last Updated" date.
            </p>
          </section>

          <div className="text-sm text-gray-500 pt-6 border-t">
            Last Updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
} 