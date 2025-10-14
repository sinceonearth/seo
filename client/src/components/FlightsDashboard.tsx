"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import type { Flight } from "@shared/schema";
import { getAuthToken } from "@/lib/queryClient";
import { Plane, CalendarDays, Clock } from "lucide-react";

export default function FlightsDashboard() {
  const token = getAuthToken();

  const {
    data: flights = [],
    isLoading,
    isError,
    error,
  } = useQuery<Flight[]>({
    queryKey: ["flights", token],
    enabled: !!token,
    queryFn: async () => {
      if (!token) {
        if (process.env.NODE_ENV === "development") {
          console.warn("⚠️ No auth token found in localStorage");
        }
        throw new Error("Unauthorized - Missing token");
      }

      const res = await fetch("/api/flights", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to fetch flights (${res.status})`);
      }

      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Invalid response from API");
      return data as Flight[];
    },
  });

  // 🌀 Loading skeletons
  if (isLoading)
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-1/3 bg-gray-700" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full bg-gray-700" />
        ))}
      </div>
    );

  // ❌ Error state
  if (isError)
    return (
      <p className="text-red-400 text-center mt-10">
        ⚠️ Failed to load flights. {(error as Error)?.message}
      </p>
    );

  // 🕳️ Empty state
  if (!flights.length)
    return (
      <p className="text-gray-400 text-center mt-20">
        No flights added yet. Start by adding your first flight ✈️
      </p>
    );

  // 📅 Group flights by year
  const groupedFlights = flights.reduce<Record<string, Flight[]>>((acc, f) => {
    const year = f.date?.split("-")[0] ?? "Unknown";
    acc[year] = acc[year] || [];
    acc[year].push(f);
    return acc;
  }, {});

  const sortedYears = Object.keys(groupedFlights).sort((a, b) => +b - +a);

  return (
    <div className="flex flex-col gap-8">
      {sortedYears.map((year) => (
        <div key={year}>
          <h2 className="text-xl font-semibold mb-3 text-green-400">{year}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupedFlights[year].map((f) => (
              <Card
                key={f.id}
                className="bg-neutral-900 border border-green-700 hover:border-green-500 transition-all rounded-2xl shadow-md"
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-green-400 text-lg">
                    <span>
                      {f.departure} → {f.arrival}
                    </span>
                    <Plane className="w-4 h-4 text-green-400" />
                  </CardTitle>
                </CardHeader>

                <CardContent className="text-sm text-gray-300 space-y-1.5">
                  <p className="font-medium">
                    {f.airline_name || "Unknown Airline"}{" "}
                    {f.flight_number && (
                      <span className="text-gray-400">• {f.flight_number}</span>
                    )}
                  </p>

                  <p className="flex items-center gap-1">
                    <CalendarDays className="w-4 h-4 text-green-500" />
                    {f.date ? format(new Date(f.date), "dd MMM yyyy") : "N/A"}
                  </p>

                  <p className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-green-500" />
                    {f.distance
                      ? `${f.distance.toFixed(0)} km`
                      : "Unknown distance"}{" "}
                    • {f.duration || "N/A"}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Status:{" "}
                    <span className="text-green-400">
                      {f.status || "Scheduled"}
                    </span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
