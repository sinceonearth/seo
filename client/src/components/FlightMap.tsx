import { useMemo, useRef, useEffect, useState } from 'react';
import Globe from 'react-globe.gl';
import { airportCoordinates } from '@/lib/airportCoordinates';
import { countryCoordinates } from '@/lib/countryCoordinates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Route {
  from: string;
  to: string;
  count: number;
}

interface FlightMapProps {
  routes: Route[];
  fullscreen?: boolean;
}

export function FlightMap({ routes, fullscreen = false }: FlightMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const { user } = useAuth();

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (globeRef.current && user?.country) {
      const normalizedCountry = user.country
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      const countryCoords = countryCoordinates[normalizedCountry] || { lat: 20, lon: 0 };
      
      if (!countryCoordinates[normalizedCountry]) {
        console.warn(`Country coordinates not found for: "${user.country}" (normalized: "${normalizedCountry}"). Using fallback position.`);
      }
      
      // Zoom in closer on mobile devices
      const isMobile = window.innerWidth < 768;
      const altitude = isMobile ? 1.0 : 2.5;
      
      globeRef.current.pointOfView({
        lat: countryCoords.lat,
        lng: countryCoords.lon,
        altitude
      }, 1000);
    }
  }, [user?.country]);

  const arcsData = useMemo(() => {
    return routes
      .filter(route => airportCoordinates[route.from] && airportCoordinates[route.to])
      .map(route => {
        const from = airportCoordinates[route.from];
        const to = airportCoordinates[route.to];
        
        // Fix arcs that cross the antimeridian or span >180° longitude
        const lngDiff = to.lon - from.lon;
        const adjustedEndLng = Math.abs(lngDiff) > 180
          ? to.lon + (lngDiff > 0 ? -360 : 360)
          : to.lon;
        
        // Calculate distance and set altitude based on route length
        // Shorter routes = lower arcs, longer routes = higher arcs
        const latDiff = to.lat - from.lat;
        const lonDiff = adjustedEndLng - from.lon;
        const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
        
        // Check if route involves USA airports
        const isUSARoute = from.country === 'USA' || to.country === 'USA';
        
        // Scale altitude: min 0.01 for short routes, up to 0.1 for very long routes
        // Increase altitude by 50% for USA routes
        const baseAltitude = Math.max(0.01, Math.min(0.1, distance / 200));
        const altitude = isUSARoute ? baseAltitude * 1.5 : baseAltitude;
        
        return {
          startLat: from.lat,
          startLng: from.lon,
          endLat: to.lat,
          endLng: adjustedEndLng,
          color: '#22c55e',
          altitude,
          from: route.from,
          to: route.to,
          fromCity: from.city,
          toCity: to.city,
        };
      });
  }, [routes]);

  const pointsData = useMemo(() => {
    const airports = new Map<string, { lat: number; lng: number; city: string; code: string }>();
    routes.forEach(route => {
      if (airportCoordinates[route.from]) {
        airports.set(route.from, {
          lat: airportCoordinates[route.from].lat,
          lng: airportCoordinates[route.from].lon,
          city: airportCoordinates[route.from].city,
          code: route.from,
        });
      }
      if (airportCoordinates[route.to]) {
        airports.set(route.to, {
          lat: airportCoordinates[route.to].lat,
          lng: airportCoordinates[route.to].lon,
          city: airportCoordinates[route.to].city,
          code: route.to,
        });
      }
    });
    return Array.from(airports.values());
  }, [routes]);

  const labelsData = useMemo(() => {
    return pointsData.map(point => ({
      lat: point.lat,
      lng: point.lng,
      text: point.code,
      size: 0.8,
    }));
  }, [pointsData]);

  if (fullscreen) {
    const scrollToContent = () => {
      const statsSection = document.getElementById('stats-section');
      if (statsSection) {
        statsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    return (
      <div ref={containerRef} className="w-full h-[30vh] md:aspect-auto md:absolute md:inset-x-0 md:top-0 md:h-[calc(100vh-4rem)] bg-black overflow-hidden z-10 flex items-center justify-center">
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          
          arcsData={arcsData}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor="color"
          arcStroke={0.5}
          arcAltitude="altitude"
          arcDashLength={1}
          arcDashGap={0}
          arcDashAnimateTime={0}
          arcsTransitionDuration={0}
          arcCurveResolution={64}
          
          pointsData={pointsData}
          pointLat="lat"
          pointLng="lng"
          pointColor={() => '#22c55e'}
          pointAltitude={0.01}
          pointRadius={0.15}
          
          labelsData={labelsData}
          labelLat="lat"
          labelLng="lng"
          labelText="text"
          labelSize="size"
          labelColor={() => '#ffffff'}
          labelAltitude={0.02}
          
          width={dimensions.width}
          height={dimensions.height}
          
          atmosphereColor="#22c55e"
          atmosphereAltitude={0.15}
        />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle data-testid="text-map-title">Flight Routes Globe</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={containerRef} className="w-full h-[400px] md:h-[500px] bg-black overflow-hidden">
          <Globe
            ref={globeRef}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
            
            arcsData={arcsData}
            arcStartLat="startLat"
            arcStartLng="startLng"
            arcEndLat="endLat"
            arcEndLng="endLng"
            arcColor="color"
            arcStroke={0.5}
            arcAltitude="altitude"
            arcDashLength={1}
            arcDashGap={0}
            arcDashAnimateTime={0}
            arcsTransitionDuration={0}
            arcCurveResolution={64}
            
            pointsData={pointsData}
            pointLat="lat"
            pointLng="lng"
            pointColor={() => '#22c55e'}
            pointAltitude={0.01}
            pointRadius={0.15}
            
            labelsData={labelsData}
            labelLat="lat"
            labelLng="lng"
            labelText="text"
            labelSize="size"
            labelColor={() => '#ffffff'}
            labelAltitude={0.02}
            
            width={dimensions.width}
            height={dimensions.height}
            
            atmosphereColor="#22c55e"
            atmosphereAltitude={0.15}
          />
        </div>
        
        <div className="p-4 border-t bg-background/50">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-green-500"></div>
              <span>Flight Route</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-white border-2 border-black"></div>
              <span>Airport</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
