import { useParams } from "react-router-dom";

export default function TrackDetailPage() {
  const { id } = useParams();

  return (
    <div style={{ padding: "20px" }}>
      <h1>Track Detail Page</h1>
      <p>Track id: {id}</p>
    </div>
  );
}
