import { BrowserRouter, Route, Routes } from "react-router-dom";
import TrackDetailPage from "./pages/TrackDetailPage";
import HomePage from "./pages/HomePage";
import HomePage2 from "./pages/HomePage2";
import HomePage3 from "./pages/HomePage3";
import HomePage4 from "./pages/HomePage4";
import HomePage5 from "./pages/HomePage5";
import HomePage6 from "./pages/HomePage6";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage6 />} />
        <Route path="/5" element={<HomePage5 />} />
        <Route path="/4" element={<HomePage4 />} />
        <Route path="/3" element={<HomePage3 />} />
        <Route path="/2" element={<HomePage2 />} />
        <Route path="/1" element={<HomePage />} />
        <Route path="/track/:id" element={<TrackDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
