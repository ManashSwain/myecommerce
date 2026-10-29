import { Outlet } from 'react-router'
import { Show } from '@clerk/react'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import Aichatbox from '../components/Aichatbox'
import AccountStatusProvider from '../components/AccountStatusProvider'

const Rootlayout = () => {
  return (
   <AccountStatusProvider>
   <Navbar/>
   <Outlet/>
   <Footer/>
   <Show when="signed-in">
   <Aichatbox/>
   </Show>
   </AccountStatusProvider>
  )
}

export default Rootlayout
