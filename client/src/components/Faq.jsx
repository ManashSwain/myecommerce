import React from 'react'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { MinusSmallIcon, PlusSmallIcon } from '@heroicons/react/24/outline'
import BackToHome from './BackToHome'

const faqs = [
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept major credit and debit cards, UPI, and other secure online payment methods.",
  },
  {
    question: 'How long does delivery take?',
    answer:
      'Orders are usually delivered within 3-7 business days, depending on your location.',
  },
  {
    question: 'Can I return or exchange an item?',
    answer:
      'Yes. Eligible products can be returned or exchanged within the specified return period.',
  },
  {
    question: 'How can I track my order?',
    answer:
      "Once your order is shipped, you'll receive tracking details to follow your delivery.",
  },
  {
    question: "How do I choose the right size?",
    answer:
      'Check the size guide available on each product page to find the best fit.',
  },
  {
    question: 'Can I cancel my order?',
    answer:
      "Orders can be cancelled before they are shipped. Once shipped, cancellation may not be available."
  }
]
const Faq = () => {
  return (
    <>
    <div className="bg-white -mt-24 ">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
        <div className="mb-8"><BackToHome /></div>
        <div className="mx-auto max-w-4xl">
          <h2 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl ">
            Frequently asked questions
          </h2>
          <dl className="mt-16 divide-y divide-gray-900/10 ">
            {faqs.map((faq) => (
              <Disclosure key={faq.question} as="div" className="py-6 first:pt-0 last:pb-0">
                <dt>
                  <DisclosureButton className="group flex w-full items-start justify-between text-left text-gray-900">
                    <span className="text-base/7 font-semibold">{faq.question}</span>
                    <span className="ml-6 flex h-7 items-center">
                      <PlusSmallIcon aria-hidden="true" className="size-6 group-data-open:hidden" />
                      <MinusSmallIcon aria-hidden="true" className="size-6 group-not-data-open:hidden" />
                    </span>
                  </DisclosureButton>
                </dt>
                <DisclosurePanel as="dd" className="mt-2 pr-12">
                  <p className="text-base/7 text-gray-600 ">{faq.answer}</p>
                </DisclosurePanel>
              </Disclosure>
            ))}
          </dl>
        </div>
      </div>
    </div>
    </>
  )
}

export default Faq