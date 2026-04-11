import Map from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const ReactMap = () => {
  return (
    <Map
      mapboxAccessToken={process.env.MAPBOX_TOKEN || ''}
      initialViewState={{
        longitude: 101.5,
        latitude: 14.0,
        zoom: 5.2
      }}
      style={{
        width: "100%",
        height: "100%",
        filter: "brightness(0.5)",
      }}
      mapStyle="mapbox://styles/brender99/cmmef8kve005x01s6fufgfnfd"
    />
  );
}

export default ReactMap;