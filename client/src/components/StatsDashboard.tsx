"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Globe, Plane, Ruler, Building2, TowerControl, Award, Clock } from "lucide-react";
import AchievementsInline from "@/components/AchievementsInline";
import type { Flight } from "@shared/schema";

// Import airports.json
import airportsDataRaw from "@/airports.json";

interface AirportJSON {
  iata: string;
  icao: string;
  name: string;
  city: string;
  country: string;
  iso_country: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  timezone?: string;
  dst?: string;
  tz?: string;
}

// Type expected by AchievementsInline
interface AchievementAirport {
  id: number;
  ident: string;
  iata?: string;
  iso_country?: string;
  country?: string;
}

const airportsData: AirportJSON[] = airportsDataRaw as AirportJSON[];

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

// Helper: get country from flight lat/lon via airports.json
const getCountryFromLatLon = (lat: number, lon: number) => {
  const tolerance = 0.01; // ~1 km tolerance
  const airport = airportsData.find(
    (a) => Math.abs(a.latitude - lat) < tolerance && Math.abs(a.longitude - lon) < tolerance
  );
  return airport?.iso_country || null;
};

export function StatsDashboard({ totalFlights, uniqueAirlines, flights }: StatsDashboardProps) {
  const [allStamps, setAllStamps] = useState<Stamp[]>([]);
  const [showAchievements, setShowAchievements] = useState(false);

  // Transform airportsData to AchievementAirport type for AchievementsInline
  const airportsForAchievements: AchievementAirport[] = useMemo(
    () =>
      airportsData.map((a, idx) => ({
        id: idx + 1,
        ident: a.iata || a.icao || `AIRPORT_${idx + 1}`,
        iata: a.iata,
        iso_country: a.iso_country,
        country: a.country,
      })),
    []
  );

  // Set stamps
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

  // Compute stats
  const { uniqueCountries, totalDistance, totalHours, uniqueAirportCodes, visitedAirportIds } = useMemo(() => {
    const countrySet = new Set<string>();
    const airportSet = new Set<string>();
    const visitedIds = new Set<number>();

    let distanceSum = 0;
    let hoursSum = 0;

    for (const f of flights) {
      // departure
      if (f.departure_latitude && f.departure_longitude) {
        const c = getCountryFromLatLon(f.departure_latitude, f.departure_longitude);
        if (c) countrySet.add(c.toUpperCase());

        // find airport ID for Achievements
        const airport = airportsForAchievements.find(
          (a) =>
            (a.iata && a.iata.toUpperCase() === f.departure.toUpperCase()) ||
            (a.ident && a.ident.toUpperCase() === f.departure.toUpperCase())
        );
        if (airport) visitedIds.add(airport.id);
      }

      // arrival
      if (f.arrival_latitude && f.arrival_longitude) {
        const c = getCountryFromLatLon(f.arrival_latitude, f.arrival_longitude);
        if (c) countrySet.add(c.toUpperCase());

        const airport = airportsForAchievements.find(
          (a) =>
            (a.iata && a.iata.toUpperCase() === f.arrival.toUpperCase()) ||
            (a.ident && a.ident.toUpperCase() === f.arrival.toUpperCase())
        );
        if (airport) visitedIds.add(airport.id);
      }

      // airport codes
      if (f.departure) airportSet.add(f.departure.toUpperCase());
      if (f.arrival) airportSet.add(f.arrival.toUpperCase());

      // distance & hours
      if (f.departure_latitude && f.departure_longitude && f.arrival_latitude && f.arrival_longitude) {
        const R = 6371; // km
        const dLat = ((f.arrival_latitude - f.departure_latitude) * Math.PI) / 180;
        const dLon = ((f.arrival_longitude - f.departure_longitude) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((f.departure_latitude * Math.PI) / 180) *
          Math.cos((f.arrival_latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const dist = R * c;
        distanceSum += dist;
        hoursSum += dist / 800;
      }
    }

    return {
      uniqueCountries: countrySet,
      totalDistance: distanceSum.toFixed(0),
      totalHours: hoursSum.toFixed(1),
      uniqueAirportCodes: airportSet,
      visitedAirportIds: visitedIds,
    };
  }, [flights, airportsForAchievements]);

  const formatNumber = (num: number | string) =>
    isNaN(Number(num)) ? num : new Intl.NumberFormat("en-IN").format(Number(num));

  const statClass =
    "flex flex-col items-center justify-center gap-1 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-xl text-white shadow-md";
  const labelClass = "text-xs sm:text-sm opacity-80 font-medium leading-none";

const StatCard = ({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: any;
  value: string | number;
  label: string;
  color: string;
}) => (
  <div className={statClass}>
    <div className="flex items-center gap-2">
      <Icon className={`h-9 w-9 ${color}`} />
      <div className="flex flex-col items-start">
        <span className="text-2xl sm:text-3xl font-bold">{value}</span>
        <span className={labelClass}>{label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()}</span>
      </div>
    </div>
  </div>
);

  return (
    <div className="flex flex-col items-center w-full mb-6 gap-3 px-2 sm:px-4 select-none">
      <div className="flex flex-wrap justify-center gap-4 w-full max-w-4xl">
        <StatCard icon={Ruler} value={`${formatNumber(totalDistance)}`} label="Km's in Distance" color="text-yellow-400" />
        <StatCard icon={Clock} value={`${formatNumber(totalHours)}`} label="Hours" color="text-orange-400" />
      </div>
      <div className="flex flex-wrap justify-center gap-4 w-full max-w-5xl mt-1">
        <StatCard icon={Globe} value={uniqueCountries.size} label="Countries" color="text-purple-400" />
        <StatCard icon={Plane} value={formatNumber(totalFlights)} label="Flights" color="text-green-400" />
        <StatCard icon={TowerControl} value={uniqueAirportCodes.size} label="Airports" color="text-indigo-400" />
        <StatCard icon={Building2} value={uniqueAirlines} label="Airlines" color="text-sky-400" />
      </div>
      <div className="relative w-full max-w-4xl h-[8px] rounded-full overflow-hidden mt-5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.3, ease: "easeOut" }}
          className="absolute top-0 left-0 h-full w-full"
          style={{
            background: "linear-gradient(to right, #a855f7, #22c55e, #eab308, #6366f1, #38bdf8)",
          }}
        />
      </div>
      <div className="flex justify-center mt-6 w-full max-w-4xl">
        <button
          onClick={() => setShowAchievements((prev) => !prev)}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 transition shadow-lg"
        >
          <Award className="w-7 h-7 text-white" />
        </button>
      </div>
      {showAchievements && (
        <div className="mt-5 w-full max-w-4xl">
          <AchievementsInline
            allStamps={allStamps}
            visitedAirportIds={visitedAirportIds}
            airports={airportsForAchievements}
            showStamps={showAchievements}
          />
        </div>
      )}
    </div>
  );
}
