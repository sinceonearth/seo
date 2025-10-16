"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Globe from "react-globe.gl";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { StatsDashboard } from "@/components/StatsDashboard";
import TripHistory from "@/pages/TripHistory";
import Admin from "@/pages/Admin";
import { apiRequest } from "@/lib/queryClient";
import type { Flight } from "@shared/schema";
import ManualAddFlight from "@/components/ManualAddFlight";

const countryCoordinates: Record<string, { lat: number; lon: number }> = {
  India: { lat: 20.5937, lon: 78.9629 },
  USA: { lat: 37.0902, lon: -95.7129 },
  Canada: { lat: 56.1304, lon: -106.3468 },
  Germany: { lat: 51.1657, lon: 10.4515 },
  Other: { lat: 0, lon: 0 },
};

function getCoords(country?: string) {
  if (!country) return countryCoordinates["Other"];
  const trimmed = country.trim();
  return (
    countryCoordinates[trimmed] ||
    Object.entries(countryCoordinates).find(
      ([k]) => k.toLowerCase() === trimmed.toLowerCase()
    )?.[1] ||
    countryCoordinates["Other"]
  );
}

export default function Dashboard() {
  const { token, user } = useAuth();
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });
  const [activeTab, setActiveTab] = useState<"Stats" | "Trips" | "AddFlight" | "Admin">("Stats");

  const { data: flights = [], refetch } = useQuery<Flight[]>({
    queryKey: ["user-flights", token],
    enabled: !!token,
    queryFn: async () => {
      if (!token) return [];
      const res = await apiRequest("GET", "/api/flights", null, token);
      if (!res.ok) throw new Error("Failed to fetch flights");
      return res.json();
    },
  });

  useEffect(() => {
    if (activeTab === "Stats") {
      refetch();
      if (globeRef.current && user) {
        const coords = getCoords(user.country);
        globeRef.current.pointOfView(
          { lat: coords.lat, lng: coords.lon, altitude: 2.0 },
          1500
        );
      }
    }
  }, [activeTab, refetch, user]);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const arcsData = useMemo(() => {
    return flights
      .filter(
        (f) =>
          f.departure_latitude &&
          f.departure_longitude &&
          f.arrival_latitude &&
          f.arrival_longitude
      )
      .map((f) => {
        const R = 6371;
        const dLat = ((f.arrival_latitude! - f.departure_latitude!) * Math.PI) / 180;
        const dLon = ((f.arrival_longitude! - f.departure_longitude!) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((f.departure_latitude! * Math.PI) / 180) *
            Math.cos((f.arrival_latitude! * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        const arcAltitude = Math.min(0.25, Math.max(0.05, distance / 20000));

        return {
          startLat: f.departure_latitude!,
          startLng: f.departure_longitude!,
          endLat: f.arrival_latitude!,
          endLng: f.arrival_longitude!,
          startLabel: (f.departure || "").toUpperCase(),
          endLabel: (f.arrival || "").toUpperCase(),
          color: "#22c55e",
          altitude: arcAltitude,
        };
      });
  }, [flights]);

  const tabs: { id: "Stats" | "Trips" | "AddFlight" | "Admin"; label: string }[] = [
    { id: "Stats", label: "Stats" },
    { id: "Trips", label: "Trips" },
    { id: "AddFlight", label: "Add Flight" },
  ];

  if (user?.is_admin) tabs.push({ id: "Admin", label: "Admin" });

  return (
    <div className="min-h-screen w-screen bg-black text-white flex flex-col">
      {/* Globe */}
      <div ref={containerRef} className="w-full h-[60vh] relative z-10">
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          arcsData={arcsData}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor={() => "#22c55e"}
          arcAltitude={(d: any) => d.altitude}
          arcStroke={0.4}
          atmosphereColor="#22c55e"
          atmosphereAltitude={0.25}
          htmlElementsData={arcsData.flatMap((arc) => [
            { lat: arc.startLat, lng: arc.startLng, label: arc.startLabel },
            { lat: arc.endLat, lng: arc.endLng, label: arc.endLabel },
          ])}
          htmlElement={(d: any) => {
            const el = document.createElement("div");
            el.innerText = d.label;
            el.style.color = "white";
            el.style.fontSize = "9px";
            el.style.fontWeight = "bold";
            el.style.textShadow = "0 0 2px black";
            el.style.transform = "translateY(-8px)";
            el.style.borderRadius = "50%";
            el.style.width = "6px";
            el.style.height = "6px";
            el.style.background = "white";
            el.style.display = "flex";
            el.style.justifyContent = "center";
            el.style.alignItems = "center";
            el.style.padding = "2px";
            return el;
          }}
        />
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-4 py-4 mt-[-2.2rem] z-20 relative">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-1.5 rounded-full font-semibold text-base transition-all duration-200
              ${
                activeTab === tab.id
                  ? "bg-green-500/20 text-green-400 border border-green-500/40 shadow-sm"
                  : "text-white"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8 mt-[-0.5rem]">
        {activeTab === "Stats" && (
          <StatsDashboard
            flights={flights}
            totalFlights={flights.length}
            uniqueAirlines={new Set(flights.map((f) => f.airline_name?.trim() || "")).size}
          />
        )}

        {activeTab === "Trips" && <TripHistory flights={flights} />}

        {activeTab === "AddFlight" && user && (
          <div className="space-y-6">
            
            <ManualAddFlight userId={user.id} />
          </div>
        )}

        {activeTab === "Admin" && user?.is_admin && <Admin />}
      </div>
    </div>
  );
}
