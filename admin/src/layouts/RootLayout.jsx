import React from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/sidebar'

const RootLayout = () => {
  return (
   <div className="min-h-screen">
    <Navbar />
    {/* Offset the fixed navbar's height (h-16) so content isn't hidden. */}
    <div className="pt-16">
      <Sidebar />
    </div>
   </div>
  )
}

export default RootLayout
