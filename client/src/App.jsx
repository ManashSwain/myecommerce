import { Routes, Route } from "react-router";
import Rootlayout from "./layouts/Rootlayout";
import Homepage from "./pages/Homepage";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Rootlayout />}>
        <Route path="/" element={<Homepage/>}/>
        </Route>
      </Routes>
    </>
  );
}

export default App;
