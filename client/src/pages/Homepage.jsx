import Promosection from '../components/Promosection'
import Collections from '../components/Collections'
import SignatureEdit from '../components/SignatureEdit'
import Promobanner from '../components/Promobanner'
import Productlist from '../components/Productlist'
import Newsletter from '../components/Newsletter'

const Homepage = () => {
  return (
   <>
   <Promosection/>
   <Collections limit={3} showMoreLink />
   <SignatureEdit/>
   <Promobanner/>
   <Productlist/>
   <Newsletter/>
   </>
  )
}

export default Homepage
