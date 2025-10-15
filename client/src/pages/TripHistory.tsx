"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { Flight } from "@shared/schema";

interface TripHistoryProps {
  flights: Flight[];
}

const PAGE_SIZE = 12;

export default function TripHistory({ flights }: TripHistoryProps) {
  const [selectedPastTab, setSelectedPastTab] = useState<string>("All");
  const [visiblePastCount, setVisiblePastCount] = useState(PAGE_SIZE);
  const [visibleUpcomingCount, setVisibleUpcomingCount] = useState(PAGE_SIZE);

  const [upcomingFlightsState, setUpcomingFlightsState] = useState<Flight[]>([]);
  const [pastFlightsState, setPastFlightsState] = useState<Flight[]>([]);

  const now = new Date();

  const safeParseDate = (dateStr?: string | null): Date | null => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  // Initialize upcoming & past flights
  useEffect(() => {
    const upcoming: Flight[] = [];
    const past: Flight[] = [];

    flights.forEach((f) => {
      const d = safeParseDate(f.date ?? f.departure_time);
      if (!d) return;
      if (d > now) upcoming.push(f);
      else past.push(f);
    });

    setUpcomingFlightsState(upcoming);
    setPastFlightsState(past);
  }, [flights]);

  // Auto move flights from upcoming → past after date has passed
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = new Date();
      const newlyPast: Flight[] = [];
      const stillUpcoming: Flight[] = [];

      upcomingFlightsState.forEach((f) => {
        const d = safeParseDate(f.date ?? f.departure_time);
        if (d && d <= now) {
          // Update status to Landed in UI
          newlyPast.push({ ...f, status: "Landed" });

          // Update status in database
          fetch(`/api/flights/${f.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "Landed" }),
          });
        } else stillUpcoming.push(f);
      });

      if (newlyPast.length > 0) {
        setPastFlightsState((prev) => [...prev, ...newlyPast]);
        setUpcomingFlightsState(stillUpcoming);
      }
    }, 60 * 1000); // check every minute

    return () => clearInterval(interval);
  }, [upcomingFlightsState]);

  // Past years tabs
  const years = useMemo(() => {
    const setYears = new Set<number>();
    pastFlightsState.forEach((f) => {
      const d = safeParseDate(f.date ?? f.departure_time);
      if (d) setYears.add(d.getFullYear());
    });
    return [...setYears].sort((a, b) => b - a);
  }, [pastFlightsState]);

  const pastTabs = ["All", ...years.map(String)];

  const pastToShow = useMemo(() => {
    if (selectedPastTab === "All") return pastFlightsState;
    const year = Number(selectedPastTab);
    return pastFlightsState.filter((f) => {
      const d = safeParseDate(f.date ?? f.departure_time);
      return d !== null && d.getFullYear() === year;
    });
  }, [pastFlightsState, selectedPastTab]);

  const handleLoadMorePast = () => setVisiblePastCount((c) => c + PAGE_SIZE);
  const handleLoadMoreUpcoming = () => setVisibleUpcomingCount((c) => c + PAGE_SIZE);

  // Flight card
  const FlightCard = ({
    f,
    showStatus,
    isUpcoming,
  }: {
    f: Flight;
    showStatus?: boolean;
    isUpcoming?: boolean;
  }) => {
    const d = safeParseDate(f.date ?? f.departure_time);
    const dateStr = d ? d.toLocaleDateString() : "N/A";

    const statusColor = isUpcoming
      ? "bg-green-500 text-black"
      : "bg-red-600 text-white";

    return (
      <div className="p-4 bg-neutral-900 border border-gray-700 rounded-xl hover:shadow-lg transition-shadow">
        <div className="flex justify-between mb-2 items-center">
          <div className="font-semibold text-lg text-white">
            {f.airline_name || "Unknown Airline"} {f.flight_number || "N/A"}
          </div>
          <div className="text-sm flex items-center gap-2">
            <span className="text-gray-300">{dateStr}</span>
            {showStatus && f.status && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${statusColor}`}
              >
                {isUpcoming && <span className="w-2 h-2 rounded-full animate-pulse bg-white" />}
                {f.status}
              </span>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-300 mb-1">
          {f.departure || "???"} → {f.arrival || "???"}
        </div>
        {isUpcoming && f.departure_terminal && (
          <div className="text-xs text-gray-400">Dep Terminal: {f.departure_terminal}</div>
        )}
        {isUpcoming && f.arrival_terminal && (
          <div className="text-xs text-gray-400">Arr Terminal: {f.arrival_terminal}</div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col relative px-4 md:px-8">
      {/* Upcoming Flights */}
      <div className="mb-6">
        <div className="text-green-400 text-xl font-semibold mb-3">Upcoming Flights</div>
        {upcomingFlightsState.length === 0 ? (
          <div className="text-gray-400 text-center">No upcoming flights</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingFlightsState.slice(0, visibleUpcomingCount).map((f) => (
                <FlightCard key={f.id} f={f} showStatus={true} isUpcoming />
              ))}
            </div>
            {visibleUpcomingCount < upcomingFlightsState.length && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={handleLoadMoreUpcoming}
                  className="px-6 py-2 rounded-full bg-green-500 hover:bg-green-600 text-black font-semibold"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="border-b border-gray-600/40 my-6" />

      {/* Past Flights */}
      <div>
        <div className="text-red-400 text-xl font-semibold mb-3">Past Flights</div>

        {/* Tabs */}
        {pastTabs.length > 0 && (
          <div className="w-full overflow-x-auto scrollbar-hide relative bg-black my-0">
            <div className="flex gap-1 py-2 min-w-[max-content] pl-1 pr-4">
              {pastTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setSelectedPastTab(tab);
                    setVisiblePastCount(PAGE_SIZE);
                  }}
                  className={`px-5 py-2 transition-all whitespace-nowrap focus:outline-none ${
                    tab === selectedPastTab
                      ? "bg-red-500 text-black font-semibold rounded-full"
                      : "text-red-400 hover:text-red-300 bg-transparent"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-b border-gray-600/40 my-3" />

        {/* Total past flights */}
        <div className="text-red-400 font-medium mb-4">
          ✈️ Total flights: {pastToShow.length}
        </div>

        {pastToShow.length === 0 ? (
          <div className="text-center text-gray-400 mt-4">
            No flights for {selectedPastTab}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastToShow.slice(0, visiblePastCount).map((f) => (
                <FlightCard key={f.id} f={f} showStatus={true} />
              ))}
            </div>
            {visiblePastCount < pastToShow.length && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={handleLoadMorePast}
                  className="px-6 py-2 rounded-full bg-red-500 hover:bg-red-600 text-black font-semibold"
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
