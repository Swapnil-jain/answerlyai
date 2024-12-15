export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-24">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Refund Policy</h1>
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
          <section>
            <p className="text-gray-600 mb-6">
              At AnswerlyAI, we believe in transparency and fairness in our billing practices. 
              We maintain a no-refund policy on all purchases to ensure consistent service quality 
              and resource allocation for all our customers. 
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Subscription Management</h2>
            <p className="text-gray-600 mb-4">
              While we don't offer refunds, you have the flexibility to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Cancel your subscription at any time</li>
              <li>Upgrade or downgrade your plan as your needs change</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Billing Corrections</h2>
            <p className="text-gray-600">
              While we don't provide refunds for service cancellations, we will address any billing 
              errors or duplicate charges that may occur. Please contact our support team if you 
              notice any billing discrepancies. Please note that if a subscription is cancelled in the middle of a cycle,
              you will LOSE your premium access IMMEDIATELY. No refunds shall be issued in such cases.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Service Commitment</h2>
            <p className="text-gray-600">
              We are committed to providing high-quality service and ensuring your success with our platform. 
              Our support team is available to help you make the most of your subscription and address 
              any concerns you may have. 
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Contact Us</h2>
            <p className="text-gray-600">
              If you have any questions about our billing practices or need assistance with 
              canceling your subscription, please contact us at{' '}
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