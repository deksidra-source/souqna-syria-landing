import { MapView } from "@/components/Map";
import { MapPin } from "lucide-react";
import { useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

type Coordinates = { latitude?: number | null; longitude?: number | null };

export function ListingMap({
  coordinates,
  editable = false,
  onChange,
  className,
}: {
  coordinates: Coordinates;
  editable?: boolean;
  onChange?: (coordinates: { latitude: number; longitude: number }) => void;
  className?: string;
}) {
  const { dir, t } = useLanguage();
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const center = {
    lat: coordinates.latitude ?? 33.5138,
    lng: coordinates.longitude ?? 36.2765,
  };

  return (
    <div className={`map-panel ${className || ""}`}>
      {mapUnavailable ? (
        <div className="flex min-h-[270px] flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_50%_35%,#e8f1eb,#f8f2e5)] px-6 py-6 text-center">
          <MapPin size={25} className="text-[#ba8c2f]" />
          <p className="text-xs font-extrabold text-[#3d5a53]">{t("map.unavailable")}</p>
          <p className="max-w-sm text-[10px] leading-5 text-[#7f7b73]">{t("map.fallback")}</p>
          {editable && onChange && (
            <div className={`mt-2 grid w-full max-w-sm grid-cols-2 gap-2 ${dir === "rtl" ? "text-right" : "text-left"}`}>
              <label className="form-field">{t("map.latitude")}
                <input
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={coordinates.latitude ?? ""}
                  onChange={event => {
                    const latitude = Number(event.target.value);
                    if (event.target.value !== "" && Number.isFinite(latitude)) {
                      onChange({ latitude, longitude: coordinates.longitude ?? 36.2765 });
                    }
                  }}
                  placeholder="33.5138"
                />
              </label>
              <label className="form-field">{t("map.longitude")}
                <input
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={coordinates.longitude ?? ""}
                  onChange={event => {
                    const longitude = Number(event.target.value);
                    if (event.target.value !== "" && Number.isFinite(longitude)) {
                      onChange({ latitude: coordinates.latitude ?? 33.5138, longitude });
                    }
                  }}
                  placeholder="36.2765"
                />
              </label>
            </div>
          )}
        </div>
      ) : (
        <MapView
          className="h-[270px] overflow-hidden rounded-[22px]"
          initialCenter={center}
          initialZoom={coordinates.latitude !== undefined && coordinates.latitude !== null ? 14 : 11}
          onMapError={() => setMapUnavailable(true)}
          onMapReady={map => {
            const setMarker = (position: google.maps.LatLngLiteral) => {
              markerRef.current?.map && (markerRef.current.map = null);
              markerRef.current = new google.maps.marker.AdvancedMarkerElement({ map, position, title: t("map.marker") });
            };
            if (coordinates.latitude !== undefined && coordinates.latitude !== null && coordinates.longitude !== undefined && coordinates.longitude !== null) {
              setMarker(center);
            }
            if (editable) {
              map.addListener("click", (event: google.maps.MapMouseEvent) => {
                if (!event.latLng) return;
                const position = { lat: event.latLng.lat(), lng: event.latLng.lng() };
                setMarker(position);
                onChange?.({ latitude: position.lat, longitude: position.lng });
              });
            }
          }}
        />
      )}
      {editable && <p className="map-hint"><MapPin size={15} /> {t("map.hint")}</p>}
    </div>
  );
}
