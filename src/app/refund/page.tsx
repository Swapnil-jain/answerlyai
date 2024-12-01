export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-24">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Refund Policy</h1>
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
          <section>
            <p className="text-gray-600 mb-6">
              At AnswerlyAI, we believe in transparency and fairness in our billing practices. 
              Since we offer a comprehensive free trial that allows you to fully evaluate our service 
              before making a purchase, we maintain a no-refund policy on all purchases.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Subscription Cancellation</h2>
            <p className="text-gray-600 mb-4">
              While we don't offer refunds, you have the flexibility to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Cancel your subscription at any time</li>
              <li>Continue using the service until the end of your current billing period</li>
              <li>Switch to our free tier after your paid period ends</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Billing Corrections</h2>
            <p className="text-gray-600">
              While we don't provide refunds for service cancellations, we will address any billing 
              errors or duplicate charges that may occur. Please contact our support team if you 
              notice any billing discrepancies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Free Trial</h2>
            <p className="text-gray-600">
              We encourage all potential customers to take advantage of our free trial period 
              to ensure our service meets your needs before making a purchase. This allows you 
              to make an informed decision about your subscription.
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