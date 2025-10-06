import { SwipeableFlightCard } from "./SwipeableFlightCard";
import type { Flight } from "@shared/schema";

interface FlightTimelineProps {
  flights: Flight[];
}

export function FlightTimeline({ flights }: FlightTimelineProps) {
  // Group flights by year
  const flightsByYear = flights.reduce((acc, flight) => {
    const year = new Date(flight.date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(flight);
    return acc;
  }, {} as Record<number, Flight[]>);

  const years = Object.keys(flightsByYear).sort((a, b) => Number(b) - Number(a));

  if (flights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </div>
        <p className="mt-4 text-lg font-medium text-foreground">No flights yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Add your first flight or import your flight history
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {years.map((year) => (
        <div key={year}>
          <div className="sticky top-16 z-10 mb-4 bg-background py-2">
            <h3 className="text-lg font-bold text-foreground">{year}</h3>
          </div>
          <div className="space-y-4">
            {flightsByYear[Number(year)].map((flight) => (
              <SwipeableFlightCard
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
      ))}
    </div>
  );
}
