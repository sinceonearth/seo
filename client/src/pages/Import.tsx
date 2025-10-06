import { FlightMap } from "@/components/FlightMap";
import { getUniqueRoutes } from "@/lib/flightData";

export default function Import() {
  const routes = getUniqueRoutes();
  
  return (
    <div className="container mx-auto space-y-8 px-6 py-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground">Flight Map</h1>
        <p className="mt-2 text-muted-foreground">
          Visualize your travel routes across the globe
        </p>
      </div>
      <FlightMap routes={routes} />
    </div>
  );
}
