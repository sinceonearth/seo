import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, MapPin, Clock, Calendar, Plane } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { airportCoordinates } from "@/lib/airportCoordinates";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
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

// Country emoji flags mapping
const countryFlags: Record<string, string> = {
  'India': '🇮🇳',
  'UAE': '🇦🇪',
  'Thailand': '🇹🇭',
  'Sri Lanka': '🇱🇰',
  'Singapore': '🇸🇬',
  'Malaysia': '🇲🇾',
  'Finland': '🇫🇮',
  'Italy': '🇮🇹',
  'France': '🇫🇷',
  'Luxembourg': '🇱🇺',
  'Portugal': '🇵🇹',
  'UK': '🇬🇧',
  'Ireland': '🇮🇪',
  'Sweden': '🇸🇪',
  'Denmark': '🇩🇰',
  'USA': '🇺🇸',
};

export default function FlightDetail() {
  const [, params] = useRoute("/flight/:id");
  const [, setLocation] = useLocation();
  const flightId = params?.id;

  const { data: flights = [] } = useQuery<Flight[]>({
    queryKey: ["/api/flights"],
  });

  const flight = flights.find(f => f.id === flightId);

  const { data: liveData, isLoading, error } = useQuery({
    queryKey: ["/api/flights/lookup", flight?.airline, flight?.flightNumber],
    queryFn: async () => {
      if (!flight) return null;
      const fullFlightNumber = `${flight.airline}${flight.flightNumber}`;
      const res = await apiRequest("GET", `/api/flights/lookup?flightNumber=${fullFlightNumber}`);
      if (!res.ok) throw new Error("Failed to fetch live data");
      return res.json();
    },
    enabled: !!flight,
    retry: false,
  });

  if (!flight) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Flight not found</div>
        </div>
      </div>
    );
  }

  const statusColors = {
    upcoming: "bg-primary/20 text-primary border-primary/30",
    completed: "bg-muted/50 text-muted-foreground border-muted",
    cancelled: "bg-destructive/10 text-destructive border-destructive/30",
  };

  const statusText = {
    upcoming: "Upcoming",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  const fromCity = airportCoordinates[flight.from]?.city || flight.from;
  const toCity = airportCoordinates[flight.to]?.city || flight.to;
  const fromCountry = airportCoordinates[flight.from]?.country;
  const toCountry = airportCoordinates[flight.to]?.country;

  // Calculate flight distance
  const flightDistance = airportCoordinates[flight.from] && airportCoordinates[flight.to]
    ? calculateDistance(
        airportCoordinates[flight.from].lat,
        airportCoordinates[flight.from].lon,
        airportCoordinates[flight.to].lat,
        airportCoordinates[flight.to].lon
      )
    : null;

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      <Button
        variant="ghost"
        onClick={() => setLocation("/trips")}
        className="mb-4"
        data-testid="button-back"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Trips
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Flight Details</h1>
          <p className="text-muted-foreground mt-1">
            {flight.airline} {flight.flightNumber}
          </p>
        </div>

        {/* Main Flight Card */}
        <Card className="overflow-hidden border-0">
          <div className="bg-black text-white p-3 md:p-4 space-y-2 md:space-y-3">
            {/* Header with cities and times */}
            <div className="flex items-start justify-between gap-2 md:gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-400">
                  {fromCountry && countryFlags[fromCountry] && (
                    <span className="text-sm md:text-base">{countryFlags[fromCountry]}</span>
                  )}
                  <span>{fromCity}{fromCountry && `, ${fromCountry}`}</span>
                </div>
                <div className="text-xl md:text-2xl font-bold font-mono">
                  {flight.from} <span className="font-normal text-sm md:text-lg">{flight.departureTime || "--:--"}</span>
                </div>
                {flight.departureTerminal && (
                  <div className="text-[10px] md:text-xs text-gray-500 mt-0.5">Terminal {flight.departureTerminal}</div>
                )}
              </div>
              <div className="text-center flex items-center justify-center pt-2 md:pt-3">
                <div className="text-green-500 text-lg md:text-xl">→</div>
              </div>
              <div className="flex-1 text-right">
                <div className="flex items-center justify-end gap-1 text-[10px] md:text-xs text-gray-400">
                  <span>{toCity}{toCountry && `, ${toCountry}`}</span>
                  {toCountry && countryFlags[toCountry] && (
                    <span className="text-sm md:text-base">{countryFlags[toCountry]}</span>
                  )}
                </div>
                <div className="text-xl md:text-2xl font-bold font-mono">
                  <span className="font-normal text-sm md:text-lg">{flight.arrivalTime || "--:--"}</span> {flight.to}
                </div>
                {flight.arrivalTerminal && (
                  <div className="text-[10px] md:text-xs text-gray-500 mt-0.5">Terminal {flight.arrivalTerminal}</div>
                )}
              </div>
            </div>

            {/* Flight details grid - always 4 columns */}
            <div className="grid grid-cols-4 gap-2 md:gap-3 text-[10px] md:text-xs">
              <div>
                <div className="text-gray-400">Flight</div>
                <div className="font-medium font-mono">{flight.airline}{flight.flightNumber}</div>
              </div>
              <div>
                <div className="text-gray-400">Airline</div>
                <div className="font-medium truncate">{flight.airlineName || flight.airline}</div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-400">Aircraft</div>
                <div className="font-medium">{flight.aircraftType || "N/A"}</div>
              </div>
            </div>
          </div>

          {/* Bottom section with date and status */}
          <div className="bg-card px-3 md:px-4 py-1.5 md:py-2 flex items-center justify-between text-xs md:text-sm">
            <span className="text-muted-foreground">
              {format(new Date(flight.date), "d MMM yyyy")}
            </span>
            <Badge variant="outline" className={statusColors[flight.status as keyof typeof statusColors]}>
              {statusText[flight.status as keyof typeof statusText]}
            </Badge>
          </div>
        </Card>

        {/* Live Data Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Live Flight Information</h2>
            {liveData && liveData.liveStatus && (
              <Badge className="bg-green-500/20 text-green-600 border-green-500/30 capitalize">
                {liveData.liveStatus}
              </Badge>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Fetching live data...</span>
            </div>
          ) : error ? (
            <div className="text-muted-foreground text-center py-8">
              Live data not available for this flight
            </div>
          ) : liveData ? (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>Departure</span>
                  </div>
                  <div className="pl-6">
                    <div className="font-mono font-semibold text-lg">
                      {liveData.from}
                    </div>
                    {liveData.fromAirport && (
                      <div className="text-sm text-muted-foreground">{liveData.fromAirport}</div>
                    )}
                    <div className="text-sm text-muted-foreground mt-1">
                      {liveData.departureTime || "Time N/A"}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>Arrival</span>
                  </div>
                  <div className="pl-6">
                    <div className="font-mono font-semibold text-lg">
                      {liveData.to}
                    </div>
                    {liveData.toAirport && (
                      <div className="text-sm text-muted-foreground">{liveData.toAirport}</div>
                    )}
                    <div className="text-sm text-muted-foreground mt-1">
                      {liveData.arrivalTime || "Time N/A"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>Flight Date</span>
                  </div>
                  <div className="pl-6 font-semibold">
                    {format(new Date(flight.date), "d MMMM yyyy")}
                  </div>
                </div>

                {flightDistance && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>Distance</span>
                    </div>
                    <div className="pl-6 font-semibold">
                      {Math.round(flightDistance).toLocaleString()} km
                    </div>
                  </div>
                )}

                {liveData.airlineName && (
                  <div className="space-y-2">
                    <div className="text-muted-foreground text-sm">Airline</div>
                    <div className="pl-6 font-semibold">
                      {liveData.airlineName} ({liveData.airline})
                    </div>
                  </div>
                )}

                {liveData.aircraftType && (
                  <div className="space-y-2">
                    <div className="text-muted-foreground text-sm">Aircraft</div>
                    <div className="pl-6 font-mono font-semibold">{liveData.aircraftType}</div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
