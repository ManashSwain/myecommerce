import React from 'react'
import Collections from '../components/Collections'
import BackToHome from '../components/BackToHome'

const Categorypage = () => {
  return (
  <>
   <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
     <BackToHome />
   </div>
   <Collections title="All categories" />
  </>
  )
}

export default Categorypage
