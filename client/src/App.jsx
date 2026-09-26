import { Routes, Route } from "react-router";
import Rootlayout from "./layouts/Rootlayout";
import Homepage from "./pages/Homepage";
import Categoriespage from "./pages/Categoriespage";
import Categoryproducts from "./pages/Categoryproducts";
import Productdetail from "./components/Productdetail";
import Orderpage from "./pages/Orderpage";
import History from "./components/History";
import Checkoutpage from "./pages/Checkoutpage";
import Aboutus from "./components/Aboutus";
import Privacypolicy from "./components/Privacypolicy";
import Licensing from "./components/Licensing";
import Contact from "./components/Contact";
import Faq from "./components/Faq";
import Wishlistpage from "./pages/Wishlistpage";
import Savedaddressespage from "./pages/Savedaddressespage";
import Toast from "./components/Toast";
import Shoppage from "./pages/Shoppage";
import Featuredproducts from "./pages/Featuredproducts";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Rootlayout />}>
          <Route path="/" element={<Homepage />} />
          <Route path="categories">
            <Route index element={<Categoriespage />} />
            <Route path=":categoryname" element={<Categoryproducts />}></Route>
          </Route>
          <Route path="product/:productId" element={<Productdetail />} />
          <Route path="shop" element={<Shoppage/>}/>
          <Route path="featured-products" element={<Featuredproducts/>}/>
          <Route path="orders" element={<Orderpage/>}/>
          <Route path="wishlist" element={<Wishlistpage/>}/>
          <Route path="addresses" element={<Savedaddressespage/>}/>
          <Route path="faq" element={<Faq/>}/>
          <Route path="history" element={<History/>}/>
          <Route path="checkout" element={<Checkoutpage/>}/>
          <Route path="about" element={<Aboutus/>}/>
          <Route path="policy" element={<Privacypolicy/>}/>
          <Route path="licensing" element={<Licensing/>}/>
          <Route path="contact" element={<Contact/>}/>
        </Route>
      </Routes>
      <Toast />
    </>
  );
}

export default App;

