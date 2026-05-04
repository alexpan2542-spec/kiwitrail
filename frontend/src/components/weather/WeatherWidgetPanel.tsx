export type WeatherWidgetPanelProps = {
  sourcePageUrl: string;
  top: number;
  left: number;
  width?: number;
  height?: number;
};

export default function WeatherWidgetPanel({
  sourcePageUrl,
  top,
  left,
  width = 340,
  height = 470,
}: WeatherWidgetPanelProps) {
  return (
    <div
      className="weather-popup"
      style={{
        position: "absolute",
        top,
        left,
        width,
        zIndex: 1000,
      }}
    >
      <iframe
        title="Weather"
        width={width}
        height={height}
        src={sourcePageUrl}
      />
    </div>
  );
}
