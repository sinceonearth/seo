"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Globe, Plane, Ruler, Building2, TowerControl, Award } from "lucide-react";
import AchievementsInline from "@/components/AchievementsInline";
import type { Flight } from "@shared/schema";

interface StatsDashboardProps {
  totalFlights: number;
  uniqueAirlines: number;
  flights: Flight[];
}

interface Stamp {
  id: string;
  name: string;
  isoCode: string;
  imageUrl: string;
}

interface Airport {
  id: number;
  ident: string;
  iata?: string;
  iso_country?: string;
  country?: string;
}

export function StatsDashboard({ totalFlights, uniqueAirlines, flights }: StatsDashboardProps) {
  const [airportsMap, setAirportsMap] = useState<Record<string, { id: number; country: string }>>({});
  const [allStamps, setAllStamps] = useState<Stamp[]>([]);
  const [showAchievements, setShowAchievements] = useState(false);

  // Fetch airports
  useEffect(() => {
    fetch("/api/airports")
      .then(res => res.json())
      .then(data => {
        const map: Record<string, { id: number; country: string }> = {};
        data.forEach((a: any) => {
          if (a.iata) map[a.iata.toUpperCase()] = { id: a.id, country: a.iso_country?.toLowerCase() || "" };
          if (a.ident) map[a.ident.toUpperCase()] = { id: a.id, country: a.iso_country?.toLowerCase() || "" };
        });
        setAirportsMap(map);
      })
      .catch(console.error);
  }, []);

  // Initialize stamps
  useEffect(() => {
    const isoCountries = ["in","ae","us","gb","th","sg","de","fr","it","ch","br","jp","pt","nl","be","my","va"];
    setAllStamps(
      isoCountries.map((code, i) => ({
        id: `${i + 1}`,
        name: code.toUpperCase(),
        isoCode: code,
        imageUrl: `/stamps/${code}.png`,
      }))
    );
  }, []);

  const uniqueAirportCodes = useMemo(
    () => new Set(flights.flatMap(f => [f.departure?.toUpperCase(), f.arrival?.toUpperCase()].filter(Boolean))),
    [flights]
  );

  const { visitedAirportIds, visitedCountries, totalDistance } = useMemo(() => {
    const ids = new Set<number>();
    const countries = new Set<string>();
    let distanceSum = 0;

    for (const f of flights) {
      const dep = f.departure?.toUpperCase();
      const arr = f.arrival?.toUpperCase();

      const depAirport = dep ? airportsMap[dep] : null;
      const arrAirport = arr ? airportsMap[arr] : null;

      if (depAirport) { ids.add(depAirport.id); countries.add(depAirport.country); }
      if (arrAirport) { ids.add(arrAirport.id); countries.add(arrAirport.country); }

      if (f.departure_latitude && f.departure_longitude && f.arrival_latitude && f.arrival_longitude) {
        const R = 6371;
        const dLat = ((f.arrival_latitude - f.departure_latitude) * Math.PI) / 180;
        const dLon = ((f.arrival_longitude - f.departure_longitude) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 +
                  Math.cos(f.departure_latitude * Math.PI / 180) *
                  Math.cos(f.arrival_latitude * Math.PI / 180) *
                  Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distanceSum += R * c;
      }
    }

    return {
      visitedAirportIds: ids,
      visitedCountries: countries,
      totalDistance: distanceSum.toFixed(0),
    };
  }, [airportsMap, flights]);

  const stats = [
    { icon: Globe, value: visitedCountries.size, color: "#a855f7" },
    { icon: Plane, value: totalFlights, color: "#22c55e" },
    { icon: Ruler, value: totalDistance, color: "#eab308" },
    { icon: TowerControl, value: uniqueAirportCodes.size, color: "#6366f1" },
    { icon: Building2, value: uniqueAirlines, color: "#38bdf8" },
  ];

  const totalSum = stats.reduce((sum, s) => sum + (Number(s.value) || 0), 0);
  const gradientStops = stats.map((s, i) => {
    const pct = totalSum > 0
      ? (stats.slice(0, i + 1).reduce((sum, x) => sum + (Number(x.value) || 0), 0) / totalSum) * 100
      : 20;
    return `${s.color} ${pct}%`;
  });

  const formatNumber = (num: number | string) =>
    isNaN(Number(num)) ? num : new Intl.NumberFormat("en-IN").format(Number(num));

  return (
    <div className="flex flex-col items-center w-full mb-[1rem] gap-3 px-1 sm:px-4 select-none">
      {/* Stats Row */}
      <div className="flex justify-between items-end w-full max-w-4xl">
        {stats.map(({ icon: Icon, value, color }, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1 flex-1 text-center">
            <Icon className="h-9 w-9" style={{ color }} />
            <span className="text-lg font-semibold text-white">{formatNumber(value)}</span>
          </div>
        ))}
      </div>

      {/* Gradient Bar */}
      <div className="relative w-full max-w-4xl h-[7px] rounded-full overflow-hidden mt-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute top-0 left-0 h-full w-full"
          style={{ background: `linear-gradient(to right, ${gradientStops.join(", ")})` }}
        />
      </div>

      {/* Centered Award Icon */}
      <div className="flex justify-center mt-6 w-full max-w-4xl">
        <button
          onClick={() => setShowAchievements(prev => !prev)}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 transition"
        >
          <Award className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Achievements Inline */}
      {showAchievements && (
        <div className="mt-4 w-full max-w-4xl">
          <AchievementsInline
            allStamps={allStamps}
            visitedAirportIds={visitedAirportIds}
            airports={Object.entries(airportsMap).map(([code, a]) => ({
              id: a.id,
              country: a.country,
              ident: code,
              iata: code,
              iso_country: a.country,
            }))}
            showStamps={showAchievements}
          />
        </div>
      )}
    </div>
  );
}
