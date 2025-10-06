import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { airportCoordinates } from "@/lib/airportCoordinates";
import { useLocation } from "wouter";

interface FlightCardProps {
  id: string;
  flightNumber: string;
  airline: string;
  airlineName?: string;
  from: string;
  to: string;
  date: string;
  departureTime?: string;
  arrivalTime?: string;
  departureTerminal?: string;
  arrivalTerminal?: string;
  aircraftType?: string;
  status?: "upcoming" | "completed" | "cancelled";
}

export function FlightCard({
  id,
  flightNumber,
  airline,
  airlineName,
  from,
  to,
  date,
  departureTime,
  arrivalTime,
  departureTerminal,
  arrivalTerminal,
  aircraftType,
  status = "completed",
}: FlightCardProps) {
  const [, setLocation] = useLocation();

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

  const fromCity = airportCoordinates[from]?.city || from;
  const toCity = airportCoordinates[to]?.city || to;

  return (
    <Card 
      className="overflow-hidden border-0 cursor-pointer hover-elevate active-elevate-2" 
      onClick={() => setLocation(`/flight/${id}`)}
      data-testid={`flight-card-${flightNumber}`}
    >
      {/* Main flight info with dark background */}
      <div className="bg-black text-white p-3 md:p-4 space-y-2 md:space-y-3">
        {/* Header with cities and times */}
        <div className="flex items-start justify-between gap-2 md:gap-4">
          <div className="flex-1">
            <div className="text-[10px] md:text-xs text-gray-400">{fromCity}</div>
            <div className="text-xl md:text-2xl font-bold font-mono">
              {from} <span className="font-normal text-sm md:text-lg">{departureTime || "--:--"}</span>
            </div>
            {departureTerminal && (
              <div className="text-[10px] md:text-xs text-gray-500 mt-0.5">Terminal {departureTerminal}</div>
            )}
          </div>
          <div className="text-center flex items-center justify-center pt-2 md:pt-3">
            <div className="text-green-500 text-lg md:text-xl">→</div>
          </div>
          <div className="flex-1 text-right">
            <div className="text-[10px] md:text-xs text-gray-400">{toCity}</div>
            <div className="text-xl md:text-2xl font-bold font-mono">
              <span className="font-normal text-sm md:text-lg">{arrivalTime || "--:--"}</span> {to}
            </div>
            {arrivalTerminal && (
              <div className="text-[10px] md:text-xs text-gray-500 mt-0.5">Terminal {arrivalTerminal}</div>
            )}
          </div>
        </div>

        {/* Flight details grid - always 4 columns */}
        <div className="grid grid-cols-4 gap-2 md:gap-3 text-[10px] md:text-xs">
          <div>
            <div className="text-gray-400">Flight</div>
            <div className="font-medium font-mono">{airline}{flightNumber}</div>
          </div>
          <div>
            <div className="text-gray-400">Airline</div>
            <div className="font-medium truncate">{airlineName || airline}</div>
          </div>
          <div className="col-span-2">
            <div className="text-gray-400">Aircraft</div>
            <div className="font-medium">{aircraftType || "N/A"}</div>
          </div>
        </div>
      </div>

      {/* Bottom section with date and status */}
      <div className="bg-card px-3 md:px-4 py-1.5 md:py-2 flex items-center justify-between text-xs md:text-sm">
        <span className="text-muted-foreground">
          {format(new Date(date), "d MMM yyyy")}
        </span>
        <Badge variant="outline" className={statusColors[status]}>
          {statusText[status]}
        </Badge>
      </div>
    </Card>
  );
}
