import React from 'react'
import BackToHome from './BackToHome'

const Contact = () => {
  return (
    <>

<div className="mx-auto max-w-4xl space-y-6 px-4 py-16 text-gray-600 sm:px-6 sm:py-24 lg:px-8">
  <BackToHome />
  <h2 className="text-3xl font-bold tracking-tight text-gray-900">
    Contact Us
  </h2>

  <p className="text-lg leading-8">
    We'd love to hear from you!
  </p>

  <p className="leading-7">
    Have a question about our products, your order, or
    our services? Feel free to get in touch with us.
  </p>

  <div className="grid gap-4 sm:grid-cols-2">
    <div className="rounded-xl border border-gray-200 p-5">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Customer Support
      </h3>

      <div className="space-y-3 text-sm leading-6">
        <p>
          <span className="font-medium text-gray-900">Email:</span>{" "}
          <a
            href="mailto:support@stylehub.com"
            className="break-all underline underline-offset-4 hover:text-gray-900"
          >
            support@stylehub.com
          </a>
        </p>

        <p>
          <span className="font-medium text-gray-900">Phone:</span>{" "}
          +1 (555) 123-4567
        </p>

        <p>
          <span className="font-medium text-gray-900">Address:</span>{" "}
          123 Fashion Street, New York, NY 10001, USA
        </p>
      </div>
    </div>

    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Business Hours
      </h3>

      <div className="space-y-3 text-sm leading-6">
        <p className="flex justify-between gap-4">
          <span>Monday – Friday</span>
          <span className="font-medium text-gray-900">
            9 AM – 6 PM
          </span>
        </p>

        <p className="flex justify-between gap-4">
          <span>Saturday</span>
          <span className="font-medium text-gray-900">
            10 AM – 4 PM
          </span>
        </p>

        <p className="flex justify-between gap-4">
          <span>Sunday</span>
          <span className="font-medium text-gray-900">
            Closed
          </span>
        </p>
      </div>
    </div>
  </div>

  <p className="leading-7">
    Our support team will do its best to respond to your
    inquiries within 1–2 business days.
  </p>

  <p className="font-medium text-gray-900">
    Thank you for shopping with StyleHub!
  </p>
</div>
    </>
  )
}

export default Contact