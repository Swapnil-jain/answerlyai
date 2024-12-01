export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-24">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
          <section>
            <p className="text-gray-600 mb-6">
              These Terms of Service ("Terms") govern your access to and use of AnswerlyAI's
              website and services. Please read these Terms carefully before using our services.
              By using our services, you agree to be bound by these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Service Provider</h2>
            <p className="text-gray-600">
              AnswerlyAI is operated by Swapnil Jain ("Owner", "we", "us", or "our").
              By accessing or using our services, you are entering into a binding contract
              with the Owner.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Use of Services</h2>
            <p className="text-gray-600 mb-4">
              You agree to use our services only for lawful purposes and in accordance with
              these Terms. You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Maintaining the confidentiality of your account</li>
              <li>All activities that occur under your account</li>
              <li>Ensuring your use complies with applicable laws</li>
              <li>Providing accurate information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Intellectual Property</h2>
            <p className="text-gray-600">
              All content, features, and functionality of our services, including but not
              limited to text, graphics, logos, and software, are the exclusive property
              of AnswerlyAI and are protected by international copyright, trademark, and
              other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Payment Terms</h2>
            <p className="text-gray-600">
              Certain aspects of our services may require payment. You agree to provide
              accurate billing information and authorize us to charge your chosen payment
              method. All payments are non-refundable except as specified in our Refund Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>
            <p className="text-gray-600">
              To the maximum extent permitted by law, AnswerlyAI and its owners, employees,
              and affiliates shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages arising from your use of our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Termination</h2>
            <p className="text-gray-600">
              We reserve the right to terminate or suspend your access to our services
              immediately, without prior notice or liability, for any reason whatsoever,
              including without limitation if you breach these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Changes to Terms</h2>
            <p className="text-gray-600">
              We reserve the right to modify these Terms at any time. We will notify users
              of any material changes via email or through our services. Your continued use
              of our services following such modifications constitutes your acceptance of
              the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Contact Information</h2>
            <p className="text-gray-600">
              For any questions about these Terms, please contact us at{' '}
              <a href="mailto:answerlyai.cloud@gmail.com" className="text-blue-600 hover:text-blue-700">
                answerlyai.cloud@gmail.com
              </a>
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