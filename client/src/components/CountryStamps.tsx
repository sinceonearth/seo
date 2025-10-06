import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { airportCoordinates } from "@/lib/airportCoordinates";
import { Award, ChevronDown, ChevronUp, Globe } from "lucide-react";
import type { Flight } from "@shared/schema";
import { useState } from "react";

// Country monuments/landmarks as stickers
const countryMonuments: Record<string, string> = {
  'India': '🕌', // Taj Mahal
  'UAE': '🏙️', // Burj Khalifa / Dubai skyline
  'Thailand': '🛕', // Thai temples
  'Sri Lanka': '🏛️', // Ancient temples
  'Singapore': '🦁', // Merlion
  'Malaysia': '🏢', // Petronas Towers
  'Finland': '⛪', // Helsinki Cathedral
  'Italy': '🏛️', // Colosseum
  'France': '🗼', // Eiffel Tower
  'Luxembourg': '🏰', // Castle
  'Portugal': '🏰', // Portuguese castles
  'UK': '🏰', // Big Ben / Tower
  'Ireland': '🍀', // Irish landmark
  'Sweden': '🏛️', // Royal Palace
  'Denmark': '🧜‍♀️', // Little Mermaid
  'USA': '🗽', // Statue of Liberty
};

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

interface CountryStampsProps {
  flights: Flight[];
}

export function CountryStamps({ flights }: CountryStampsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const INITIAL_DISPLAY_COUNT = 8;
  
  // Get unique countries from all flights (completed and upcoming)
  const visitedCountries = new Set<string>();
  
  flights.forEach(flight => {
    const fromAirport = airportCoordinates[flight.from];
    const toAirport = airportCoordinates[flight.to];
    
    if (fromAirport) visitedCountries.add(fromAirport.country);
    if (toAirport) visitedCountries.add(toAirport.country);
  });

  const countries = Array.from(visitedCountries).sort();
  const displayedCountries = isExpanded ? countries : countries.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMore = countries.length > INITIAL_DISPLAY_COUNT;

  return (
    <Card className="w-full" data-testid="card-country-count">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <Globe className="h-5 w-5 text-green-500" />
            <p className="text-xs text-muted-foreground whitespace-nowrap hidden md:block">
              {countries.length === 1 ? 'Country' : 'Countries'}
            </p>
          </div>
          <h3 className="text-xl font-bold text-foreground shrink-0" data-testid="text-country-count">
            {countries.length}
          </h3>
          <div className="flex flex-wrap gap-1 flex-1">
            {displayedCountries.map((country) => (
              <div
                key={country}
                className="text-lg"
                role="img"
                aria-label={`${country} flag`}
                data-testid={`flag-${country.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {countryFlags[country] || '🌍'}
              </div>
            ))}
          </div>
        </div>
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 w-full h-7 text-xs"
            data-testid="button-toggle-countries"
          >
            {isExpanded ? (
              <>
                Show Less <ChevronUp className="ml-1 h-3 w-3" />
              </>
            ) : (
              <>
                Show More ({countries.length - INITIAL_DISPLAY_COUNT} more) <ChevronDown className="ml-1 h-3 w-3" />
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
