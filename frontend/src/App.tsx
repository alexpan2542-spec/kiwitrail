import { BrowserRouter, Route, Routes } from "react-router-dom";
import TrackDetailPage from "./pages/TrackDetailPage";
import HomePage6 from "./pages/HomePage6";
import HomePage7 from "./pages/HomePage7";
import HomePage5 from "./pages/HomePage5";
import HomePage from "./pages/HomePage";
import Track from "./pages/Track";
import MyMap from "./pages/MyMap";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/my-map" element={<MyMap />} />
        <Route path="/track/:trackId" element={<Track />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/5" element={<HomePage5 />} />
        <Route path="/6" element={<HomePage6 />} />
        <Route path="/7" element={<HomePage7 />} />
        <Route path="/track/:id" element={<TrackDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
