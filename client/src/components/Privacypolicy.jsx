import React from 'react'
import BackToHome from './BackToHome'

const Privacypolicy = () => {
  return (
    <>

<div className="mx-auto max-w-4xl space-y-6 px-4 py-16 text-gray-600 sm:px-6 sm:py-24 lg:px-8">
  <BackToHome />
  <h2 className="text-3xl font-bold tracking-tight text-gray-900">
    Privacy Policy
  </h2>

  <p className="leading-7">
    At StyleHub, we respect your privacy and are committed
    to protecting your personal information.
  </p>

  <section className="space-y-2">
    <h3 className="text-lg font-semibold text-gray-900">
      Information We Collect
    </h3>
    <p className="leading-7">
      We may collect information such as your name, email
      address, shipping address, contact number, and order
      details when you use our website.
    </p>
  </section>

  <section className="space-y-2">
    <h3 className="text-lg font-semibold text-gray-900">
      How We Use Your Information
    </h3>
    <ul className="list-disc space-y-2 pl-6 leading-7 marker:text-gray-400">
      <li>To process and manage your orders.</li>
      <li>To provide customer support.</li>
      <li>To improve our website and shopping experience.</li>
      <li>To send order updates and relevant notifications.</li>
    </ul>
  </section>

  <section className="space-y-2">
    <h3 className="text-lg font-semibold text-gray-900">
      Information Security
    </h3>
    <p className="leading-7">
      We take reasonable measures to protect your personal
      information from unauthorized access, misuse, or disclosure.
    </p>
  </section>

  <section className="space-y-2">
    <h3 className="text-lg font-semibold text-gray-900">
      Cookies
    </h3>
    <p className="leading-7">
      Our website may use cookies to improve functionality,
      remember preferences, and enhance your browsing experience.
    </p>
  </section>

  <section className="space-y-2">
    <h3 className="text-lg font-semibold text-gray-900">
      Third-Party Services
    </h3>
    <p className="leading-7">
      Certain services, such as payment processing or delivery,
      may be provided by third parties. Their use of your
      information is subject to their respective privacy policies.
    </p>
  </section>

  <section className="space-y-2">
    <h3 className="text-lg font-semibold text-gray-900">
      Policy Updates
    </h3>
    <p className="leading-7">
      We may update this Privacy Policy from time to time.
      Any changes will be reflected on this page.
    </p>
  </section>

  <section className="space-y-2">
    <h3 className="text-lg font-semibold text-gray-900">
      Contact Us
    </h3>
    <p className="leading-7">
      If you have questions about this Privacy Policy, please
      contact us at{" "}
      <a
        href="mailto:support@stylehub.com"
        className="font-medium text-gray-900 underline underline-offset-4 hover:text-gray-600"
      >
        support@stylehub.com
      </a>.
    </p>
  </section>

  <p className="rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-800">
    This is sample privacy policy content for a demo
    application and is not a legally reviewed policy.
  </p>
</div>
    </>
  )
}

export default Privacypolicy