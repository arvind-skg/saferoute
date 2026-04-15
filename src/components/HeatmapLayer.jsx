import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

export default function HeatmapLayer({ data }) {
  const map = useMap();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const heat = L.heatLayer(data, {
      radius: 25,
      blur: 20,
      maxZoom: 16,
      max: 1.0,
      gradient: {
        0.0: '#22c55e',
        0.3: '#84cc16',
        0.5: '#f59e0b',
        0.7: '#f97316',
        0.9: '#ef4444',
        1.0: '#dc2626',
      },
    });

    heat.addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, data]);

  return null;
}
