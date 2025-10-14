"use client";

import React, { useState, useMemo } from "react";
import type { Flight } from "@shared/schema";

interface TripHistoryProps {
  flights: Flight[];
}

const PAGE_SIZE = 12;

export default function TripHistory({ flights }: TripHistoryProps) {
  const [selectedTab, setSelectedTab] = useState<string>("All");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // --- Safe date parser ---
  const safeParseDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  // --- Prepare years & tabs ---
  const years = useMemo(() => {
    const setYears = new Set<number>();
    flights.forEach((f) => {
      const d = safeParseDate(f.date ?? f.departure_time);
      if (d) setYears.add(d.getFullYear());
    });
    return [...setYears].sort((a, b) => b - a);
  }, [flights]);

  const tabs = ["All", ...years.map(String)];

  const flightsToShow = useMemo(() => {
    if (selectedTab === "All") return flights;
    const year = Number(selectedTab);
    return flights.filter((f) => {
      const d = safeParseDate(f.date ?? f.departure_time);
      return d !== null && d.getFullYear() === year;
    });
  }, [flights, selectedTab]);

  const handleLoadMore = () => setVisibleCount((c) => c + PAGE_SIZE);

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col relative px-4 md:px-8">
      {/* Tabs */}
      {tabs.length > 0 && (
        <div className="w-full overflow-x-auto scrollbar-hide relative bg-black my-0">
          <div className="flex gap-1 py-2 min-w-[max-content] pl-1 pr-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setSelectedTab(tab);
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`px-5 py-2 transition-all whitespace-nowrap focus:outline-none ${
                  tab === selectedTab
                    ? "bg-green-500 text-black font-semibold rounded-full"
                    : "text-green-400 hover:text-green-300 bg-transparent"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-b border-green-800/40 my-3" />

      <div className="text-green-400 text-lg font-medium mb-4">
        ✈️ {flightsToShow.length}{" "}
        {flightsToShow.length === 1 ? "flight" : "flights"}{" "}
        {selectedTab !== "All" && `in ${selectedTab}`}
      </div>

      <div className="flex-1 w-full pb-8">
        {flightsToShow.length === 0 ? (
          <div className="text-center text-green-300 mt-8">
            No flights for {selectedTab}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {flightsToShow.slice(0, visibleCount).map((f) => (
                <div
                  key={f.id}
                  className="p-4 bg-neutral-900 border border-green-700 rounded-xl hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between mb-2">
                    <div className="font-semibold text-lg text-white">
                      {f.airline_name} {f.flight_number}
                    </div>
                    <div className="text-green-400 text-sm">
                      {(() => {
                        const d = safeParseDate(f.date ?? f.departure_time);
                        return d ? d.toLocaleDateString() : "";
                      })()}
                    </div>
                  </div>
                  <div className="text-sm text-green-300">
                    {f.departure} → {f.arrival}
                  </div>
                </div>
              ))}
            </div>

            {visibleCount < flightsToShow.length && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-2 rounded-full bg-green-500 hover:bg-green-600 text-black font-semibold"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
