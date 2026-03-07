import { Routes, Route } from "react-router";
import Rootlayout from "./layouts/Rootlayout";

function App() {
  return (
    <>
      <h1 className="text-3xl font-bold underline">Hello world!</h1>
       <Routes>
      <Route path="/" element={<Rootlayout />} />
    </Routes>
    </>
  );
}

export default App;
