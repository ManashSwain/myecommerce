import { Outlet } from 'react-router'
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
   <Aichatbox/>
   </AccountStatusProvider>
  )
}

export default Rootlayout
