"use client";

import { useEffect, useMemo, useState } from "react";
import type { UIStamp } from "@/types";

interface Airport {
  id: number;
  ident: string;
  iata?: string;
  iso_country?: string;
  country?: string;
}

interface AchievementsInlineProps {
  allStamps: UIStamp[];
  visitedAirportIds: Set<number>;
  airports: Airport[];
  showStamps: boolean;
}

export default function AchievementsInline({
  allStamps,
  visitedAirportIds,
  airports,
  showStamps,
}: AchievementsInlineProps) {
  const [validStamps, setValidStamps] = useState<UIStamp[]>([]);

  const countryToISO: Record<string, string> = {
    Japan: "jp",
    Brazil: "br",
    "United States": "us",
    France: "fr",
    Germany: "de",
    Italy: "it",
    Switzerland: "ch",
    Belgium: "be",
    Netherlands: "nl",
    Portugal: "pt",
    Thailand: "th",
    Malaysia: "my",
    Singapore: "sg",
    "United Arab Emirates": "ae",
    "Vatican City": "va",
    "United Kingdom": "gb",
    India: "in",
  };

  // Compute earned ISO codes
  const earnedISOCodes = useMemo(() => {
    const codes = new Set<string>();
    airports.forEach((airport) => {
      if (visitedAirportIds.has(airport.id)) {
        const country = airport.country || airport.iso_country;
        if (!country) return;
        const iso = countryToISO[country] || country.toLowerCase();
        codes.add(iso.toLowerCase());
      }
    });
    return codes;
  }, [visitedAirportIds, airports]);

  // Validate images and filter out missing ones
  useEffect(() => {
    const loadImages = async () => {
      const checked: UIStamp[] = [];
      await Promise.all(
        allStamps.map(
          (stamp) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.src = stamp.imageUrl;
              img.onload = () => {
                checked.push(stamp); // only include stamps that exist
                resolve();
              };
              img.onerror = () => resolve(); // ignore missing images
            })
        )
      );
      setValidStamps(checked);
    };
    loadImages();
  }, [allStamps]);

  // Add achieved status
  const stampsWithStatus = useMemo(
    () =>
      validStamps.map((stamp) => ({
        ...stamp,
        achieved: earnedISOCodes.has(stamp.isoCode.toLowerCase()),
      })),
    [validStamps, earnedISOCodes]
  );

  if (!showStamps || stampsWithStatus.length === 0) return null;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mt-4 w-full place-items-center">
      {stampsWithStatus.map((stamp) => (
        <div key={stamp.id} className="flex flex-col items-center">
          <img
            src={stamp.imageUrl}
            alt={stamp.name}
            className={`object-contain transition-all duration-300 ${
              stamp.achieved ? "opacity-100 drop-shadow-md" : "opacity-30 grayscale"
            }`}
            style={{ width: 80, height: 80 }}
          />
        </div>
      ))}
    </div>
  );
}
