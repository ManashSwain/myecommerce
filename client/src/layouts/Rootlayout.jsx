import { Outlet } from 'react-router'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import AccountStatusProvider from '../components/AccountStatusProvider'

const Rootlayout = () => {
  return (
   <AccountStatusProvider>
   <Navbar/>
   <Outlet/>
   <Footer/>
   </AccountStatusProvider>
  )
}

export default Rootlayout
