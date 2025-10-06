import { useQuery } from "@tanstack/react-query";
import { StatsDashboard } from "@/components/StatsDashboard";
import { FlightCard } from "@/components/FlightCard";
import { FlightMap } from "@/components/FlightMap";
import { CountryStamps } from "@/components/CountryStamps";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { airportCoordinates } from "@/lib/airportCoordinates";
import type { Flight } from "@shared/schema";

// Haversine formula to calculate great-circle distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateStatsFromFlights(flights: Flight[]) {
  const uniqueAirlines = new Set(flights.map(f => f.airline)).size;
  const uniqueAirports = new Set([
    ...flights.map(f => f.from),
    ...flights.map(f => f.to)
  ]).size;
  
  // Calculate actual distance using airport coordinates for all flights
  let totalDistance = 0;
  flights.forEach(flight => {
    const fromAirport = airportCoordinates[flight.from];
    const toAirport = airportCoordinates[flight.to];
    
    if (fromAirport && toAirport) {
      const distance = calculateDistance(
        fromAirport.lat,
        fromAirport.lon,
        toAirport.lat,
        toAirport.lon
      );
      totalDistance += distance;
    }
  });
  
  return {
    totalFlights: flights.length,
    uniqueAirlines,
    uniqueAirports,
    totalDistance: `${Math.round(totalDistance).toLocaleString()} km`,
  };
}

function getUniqueRoutesFromFlights(flights: Flight[]) {
  const routeMap = new Map<string, number>();
  
  flights.forEach(flight => {
    const routeKey = `${flight.from}-${flight.to}`;
    routeMap.set(routeKey, (routeMap.get(routeKey) || 0) + 1);
  });
  
  return Array.from(routeMap.entries()).map(([key, count]) => {
    const [from, to] = key.split('-');
    return { from, to, count };
  });
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: flights = [], isLoading } = useQuery<Flight[]>({
    queryKey: ["/api/flights"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading your flights...</div>
        </div>
      </div>
    );
  }

  const stats = calculateStatsFromFlights(flights);
  const routes = getUniqueRoutesFromFlights(flights);
  const recentFlights = flights
    .filter(f => f.status === "upcoming")
    .slice(0, 5);

  return (
    <>
      <FlightMap routes={routes} fullscreen />
      
      <div className="relative bg-background z-0 mt-6 md:mt-[calc(100vh-8rem)] rounded-t-3xl">
        <div className="container mx-auto space-y-8 px-6 pt-2 pb-8 md:pt-8 bg-background" id="stats-section">
          {user && (
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.profileImageUrl || undefined} alt={user.name} />
                <AvatarFallback className="bg-green-500/10 text-green-500 text-xl">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold text-foreground" data-testid="text-user-name">{user.name}</h2>
                <p className="text-muted-foreground" data-testid="text-user-country">{user.country}</p>
              </div>
            </div>
          )}
          
          <StatsDashboard stats={stats} />
          
          <CountryStamps flights={flights} />
          
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">Upcoming Flights</h2>
            </div>
            <div className="space-y-4">
              {recentFlights.map((flight) => (
                <FlightCard
                  key={flight.id}
                  id={flight.id}
                  flightNumber={flight.flightNumber}
                  airline={flight.airline}
                  airlineName={flight.airlineName ?? undefined}
                  from={flight.from}
                  to={flight.to}
                  date={flight.date}
                  departureTime={flight.departureTime ?? undefined}
                  arrivalTime={flight.arrivalTime ?? undefined}
                  aircraftType={flight.aircraftType ?? undefined}
                  status={(["completed", "upcoming", "cancelled"].includes(flight.status) ? flight.status : "completed") as "completed" | "upcoming" | "cancelled"}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
