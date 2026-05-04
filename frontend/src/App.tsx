import { BrowserRouter, Route, Routes } from "react-router-dom";
import TrackDetailPage from "./pages/TrackDetailPage";
import HomePage from "./pages/HomePage";
import Track from "./pages/Track";
import MyMap from "./pages/MyMap";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/map" element={<MyMap />} />
        <Route path="/track/:trackId" element={<Track />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/track/:id" element={<TrackDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
