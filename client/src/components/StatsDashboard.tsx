import { StatCard } from "./StatCard";
import { Plane, MapPin, Building, Ruler } from "lucide-react";

interface StatsData {
  totalFlights: number;
  uniqueAirlines: number;
  uniqueAirports: number;
  totalDistance: string;
}

interface StatsDashboardProps {
  stats: StatsData;
}

export function StatsDashboard({ stats }: StatsDashboardProps) {
  const statsData = [
    { icon: Plane, value: stats.totalFlights, title: "Total Flights" },
    { icon: Building, value: stats.uniqueAirlines, title: "Airlines" },
    { icon: MapPin, value: stats.uniqueAirports, title: "Airports" },
    { icon: Ruler, value: stats.totalDistance, title: "Distance" },
  ];

  return (
    <>
      {/* Mobile: Compact horizontal layout */}
      <div className="flex justify-around gap-2 md:hidden">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="flex items-center gap-2" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, "-")}`}>
              <Icon className="h-4 w-4 text-green-500" />
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Desktop: Card layout */}
      <div className="hidden md:grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Flights"
          value={stats.totalFlights}
          icon={Plane}
          subtitle="All time"
        />
        <StatCard
          title="Airlines"
          value={stats.uniqueAirlines}
          icon={Building}
          subtitle="Different carriers"
        />
        <StatCard
          title="Airports"
          value={stats.uniqueAirports}
          icon={MapPin}
          subtitle="Unique locations"
        />
        <StatCard
          title="Distance"
          value={stats.totalDistance}
          icon={Ruler}
          subtitle="Approximate"
        />
      </div>
    </>
  );
}
