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
          <Route path="orders" element={<Orderpage/>}/>
          <Route path="history" element={<History/>}/>
          <Route path="checkout" element={<Checkoutpage/>}/>
          <Route path="about" element={<Aboutus/>}/>
          <Route path="policy" element={<Privacypolicy/>}/>
          <Route path="licensing" element={<Licensing/>}/>
          <Route path="contact" element={<Contact/>}/>
        </Route>
      </Routes>
    </>
  );
}

export default App;
