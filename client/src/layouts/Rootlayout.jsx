import { Outlet } from 'react-router'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

const Rootlayout = () => {
  return (
   <>
   <Navbar/>
   <Outlet/>
   <Footer/>
   </>
  )
}

export default Rootlayout
