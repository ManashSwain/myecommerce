import { Routes, Route } from "react-router";
import Rootlayout from "./layouts/Rootlayout";
import Homepage from "./pages/Homepage";
import Categoriespage from "./pages/Categoriespage";
import Categoryproducts from "./pages/Categoryproducts";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Rootlayout />}>
          <Route path="/" element={<Homepage />} />
          <Route path="categories">
          <Route index element={<Categoriespage/>}/>
          <Route path=":categoryname" element={<Categoryproducts/>}/>
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
