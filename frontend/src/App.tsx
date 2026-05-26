import { BrowserRouter, Route, Routes } from "react-router-dom";
import TrackDetailPage from "./pages/TrackDetailPage";
import HomePage from "./pages/HomePage";
import Track from "./pages/Track";
import MyMap from "./pages/MyMap";
import Track3DDemo from "./pages/Track3DDemo";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/map" element={<MyMap />} />
        <Route path="/track/:trackId" element={<Track />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/track/:id" element={<TrackDetailPage />} />
        <Route path="/track3d-demo" element={<Track3DDemo />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
