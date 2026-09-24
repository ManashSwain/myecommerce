import React from 'react'
import BackToHome from './BackToHome'

const Aboutus = () => {
  return (
    <>

<div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
    <BackToHome />
  </div>
<div className="mx-auto max-w-4xl space-y-6 px-4 pt-6 pb-16 text-gray-600 sm:px-6 sm:pb-24 lg:px-8">
  <h2 className="text-3xl font-bold tracking-tight text-gray-900">
    About Us
  </h2>

  <p className="text-lg leading-8">
    Welcome to <strong className="font-semibold text-gray-900">StyleHub</strong>,
    your destination for everyday fashion and modern style.
  </p>

  <p className="leading-7">
    At StyleHub, we believe that fashion should be simple,
    comfortable, and accessible to everyone. Our collection
    includes a variety of clothing styles designed to suit
    your everyday needs, from casual wear to trendy outfits.
  </p>

  <p className="leading-7">
    Our goal is to provide a smooth and enjoyable shopping
    experience with quality products, stylish designs, and
    customer-focused service.
  </p>

  <p className="leading-7">
    Whether you're refreshing your wardrobe or looking for
    something new, StyleHub is here to help you express your
    personal style.
  </p>

  <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
    <h3 className="mb-3 text-xl font-semibold text-gray-900">
      Our Mission
    </h3>
    <p className="leading-7">
      To make fashion accessible, convenient, and enjoyable
      for everyone.
    </p>
  </div>

  <p className="font-medium text-gray-900">
    Thank you for choosing StyleHub!
  </p>
</div>
    </>
  )
}

export default Aboutus