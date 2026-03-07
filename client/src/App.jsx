import { Routes, Route } from "react-router";
import Rootlayout from "./layouts/Rootlayout";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Rootlayout />}></Route>
      </Routes>
    </>
  );
}

export default App;
