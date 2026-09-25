import Promosection from '../components/Promosection'
import Collections from '../components/Collections'
import SignatureEdit from '../components/SignatureEdit'
import Productlist from '../components/Productlist'
import Newsletter from '../components/Newsletter'

const Homepage = () => {
  return (
   <>
   <Promosection/>
   <Collections limit={3} showMoreLink />
   <SignatureEdit/>
   <Productlist/>
   <Newsletter/>
   </>
  )
}

export default Homepage
