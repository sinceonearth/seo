// Parse and process flight data from CSV
export interface FlightData {
  id: string;
  date: string;
  airline: string;
  flightNumber: string;
  from: string;
  to: string;
  departureTime?: string;
  arrivalTime?: string;
  aircraftType?: string;
  status: "upcoming" | "completed" | "cancelled";
}

// All flight data from the CSV
export const allFlights: FlightData[] = [
  { id: "1", date: "2016-11-09", airline: "ABY", flightNumber: "484", from: "AMD", to: "SHJ", departureTime: "05:15", arrivalTime: "06:45", aircraftType: "Airbus A320", status: "completed" },
  { id: "2", date: "2016-11-14", airline: "ABY", flightNumber: "483", from: "SHJ", to: "AMD", departureTime: "00:40", arrivalTime: "04:35", aircraftType: "Airbus A320", status: "completed" },
  { id: "3", date: "2017-10-19", airline: "IGO", flightNumber: "488", from: "BDQ", to: "DEL", departureTime: "21:20", arrivalTime: "23:00", aircraftType: "Airbus A320", status: "completed" },
  { id: "4", date: "2017-10-20", airline: "JAI", flightNumber: "2368", from: "DEL", to: "IXL", departureTime: "05:40", arrivalTime: "07:05", aircraftType: "Boeing 737-700", status: "completed" },
  { id: "5", date: "2017-10-25", airline: "IGO", flightNumber: "4064", from: "DEL", to: "BDQ", departureTime: "14:10", arrivalTime: "15:40", aircraftType: "Airbus A320", status: "completed" },
  { id: "6", date: "2018-05-26", airline: "JAI", flightNumber: "687", from: "AMD", to: "DEL", departureTime: "07:00", arrivalTime: "08:40", aircraftType: "Boeing 737-800", status: "completed" },
  { id: "7", date: "2018-05-26", airline: "JAI", flightNumber: "66", from: "DEL", to: "BKK", departureTime: "13:55", arrivalTime: "19:55", aircraftType: "Boeing 737-900ER", status: "completed" },
  { id: "8", date: "2018-05-27", airline: "TLM", flightNumber: "752", from: "DMK", to: "HKT", departureTime: "00:05", arrivalTime: "01:30", aircraftType: "Airbus A330-300", status: "completed" },
  { id: "9", date: "2018-05-30", airline: "TLM", flightNumber: "755", from: "HKT", to: "DMK", departureTime: "09:05", arrivalTime: "10:30", aircraftType: "Airbus A330-300", status: "completed" },
  { id: "10", date: "2018-06-01", airline: "JAI", flightNumber: "63", from: "BKK", to: "DEL", departureTime: "20:10", arrivalTime: "23:15", aircraftType: "Boeing 737-900ER", status: "completed" },
  { id: "11", date: "2018-06-02", airline: "JAI", flightNumber: "690", from: "DEL", to: "AMD", departureTime: "19:10", arrivalTime: "20:40", aircraftType: "Boeing 737-800", status: "completed" },
  { id: "12", date: "2018-12-10", airline: "JAI", flightNumber: "2344", from: "BDQ", to: "BOM", departureTime: "21:30", arrivalTime: "22:40", aircraftType: "Boeing 737-800", status: "completed" },
  { id: "13", date: "2018-12-11", airline: "GOW", flightNumber: "461", from: "BOM", to: "IXZ", departureTime: "04:00", arrivalTime: "07:25", aircraftType: "Airbus A320neo", status: "completed" },
  { id: "14", date: "2018-12-16", airline: "GOW", flightNumber: "465", from: "IXZ", to: "BOM", departureTime: "07:55", arrivalTime: "11:35", aircraftType: "Airbus A320neo", status: "completed" },
  { id: "15", date: "2018-12-16", airline: "IGO", flightNumber: "621", from: "BOM", to: "BDQ", departureTime: "15:30", arrivalTime: "16:40", aircraftType: "Airbus A320neo", status: "completed" },
  { id: "16", date: "2019-05-12", airline: "IGO", flightNumber: "2591", from: "BDQ", to: "DEL", departureTime: "07:00", arrivalTime: "08:35", aircraftType: "Airbus A320", status: "completed" },
  { id: "17", date: "2019-05-12", airline: "IGO", flightNumber: "2263", from: "DEL", to: "IXB", departureTime: "14:05", arrivalTime: "16:05", aircraftType: "Airbus A320neo", status: "completed" },
  { id: "18", date: "2019-05-19", airline: "IGO", flightNumber: "2646", from: "IXB", to: "DEL", departureTime: "12:30", arrivalTime: "14:45", aircraftType: "Airbus A320", status: "completed" },
  { id: "19", date: "2019-05-19", airline: "IGO", flightNumber: "2698", from: "DEL", to: "BDQ", departureTime: "19:10", arrivalTime: "20:40", aircraftType: "Airbus A320", status: "completed" },
  { id: "20", date: "2021-11-07", airline: "IGO", flightNumber: "823", from: "AMD", to: "BLR", departureTime: "06:00", arrivalTime: "08:25", aircraftType: "Airbus A321neo", status: "completed" },
  { id: "21", date: "2021-11-07", airline: "IGO", flightNumber: "379", from: "BLR", to: "IXE", departureTime: "09:40", arrivalTime: "10:50", aircraftType: "Airbus A321", status: "completed" },
  { id: "22", date: "2021-11-12", airline: "IGO", flightNumber: "6204", from: "IXE", to: "BOM", departureTime: "10:00", arrivalTime: "11:35", aircraftType: "Airbus A320", status: "completed" },
  { id: "23", date: "2021-11-12", airline: "IGO", flightNumber: "138", from: "BOM", to: "BDQ", departureTime: "17:05", arrivalTime: "18:10", aircraftType: "Airbus A321", status: "completed" },
  { id: "24", date: "2022-09-24", airline: "IGO", flightNumber: "6246", from: "BDQ", to: "DEL", departureTime: "21:00", arrivalTime: "22:40", aircraftType: "Airbus A320neo", status: "completed" },
  { id: "25", date: "2022-09-25", airline: "FIN", flightNumber: "122", from: "DEL", to: "HEL", departureTime: "07:40", arrivalTime: "14:35", aircraftType: "Airbus A330-300", status: "completed" },
  { id: "26", date: "2022-09-25", airline: "FIN", flightNumber: "1763", from: "HEL", to: "FCO", departureTime: "16:20", arrivalTime: "18:45", aircraftType: "Airbus A320", status: "completed" },
  { id: "27", date: "2022-10-06", airline: "LGL", flightNumber: "8012", from: "CDG", to: "LUX", departureTime: "09:35", arrivalTime: "10:35", aircraftType: "DHC-8-400 Dash 8Q", status: "completed" },
  { id: "28", date: "2022-10-06", airline: "TAP", flightNumber: "691", from: "LUX", to: "LIS", departureTime: "11:40", arrivalTime: "13:35", aircraftType: "Airbus A320", status: "completed" },
  { id: "29", date: "2022-10-09", airline: "FIN", flightNumber: "1740", from: "LIS", to: "HEL", departureTime: "06:50", arrivalTime: "13:30", aircraftType: "Airbus A320", status: "completed" },
  { id: "30", date: "2022-10-09", airline: "FIN", flightNumber: "121", from: "HEL", to: "DEL", departureTime: "18:15", arrivalTime: "05:25", aircraftType: "Airbus A330-300", status: "completed" },
  { id: "31", date: "2022-10-10", airline: "IGO", flightNumber: "184", from: "DEL", to: "AMD", departureTime: "09:50", arrivalTime: "11:20", aircraftType: "Airbus A321neo", status: "completed" },
  { id: "32", date: "2023-09-20", airline: "IGO", flightNumber: "5185", from: "BDQ", to: "BOM", departureTime: "13:45", arrivalTime: "14:55", aircraftType: "Airbus A321neo", status: "completed" },
  { id: "33", date: "2023-09-21", airline: "IGO", flightNumber: "5186", from: "BOM", to: "BDQ", departureTime: "15:40", arrivalTime: "17:00", aircraftType: "Airbus A321neo", status: "completed" },
  { id: "34", date: "2023-10-02", airline: "AIC", flightNumber: "670", from: "BDQ", to: "BOM", departureTime: "07:00", arrivalTime: "08:10", aircraftType: "Airbus A321", status: "completed" },
  { id: "35", date: "2023-10-10", airline: "IGO", flightNumber: "7184", from: "LKO", to: "IDR", departureTime: "10:25", arrivalTime: "12:55", aircraftType: "ATR 72", status: "completed" },
  { id: "36", date: "2023-11-15", airline: "AIC", flightNumber: "670", from: "BDQ", to: "BOM", departureTime: "07:10", arrivalTime: "08:10", aircraftType: "Airbus A321", status: "completed" },
  { id: "37", date: "2023-11-15", airline: "ALK", flightNumber: "144", from: "BOM", to: "CMB", departureTime: "20:45", arrivalTime: "23:10", aircraftType: "Airbus A320", status: "completed" },
  { id: "38", date: "2023-11-16", airline: "ALK", flightNumber: "402", from: "CMB", to: "BKK", departureTime: "01:15", arrivalTime: "06:20", aircraftType: "Airbus A320", status: "completed" },
  { id: "39", date: "2023-11-20", airline: "AIQ", flightNumber: "311", from: "DMK", to: "KUL", departureTime: "06:40", arrivalTime: "09:55", aircraftType: "Airbus A320", status: "completed" },
  { id: "40", date: "2023-11-26", airline: "ALK", flightNumber: "309", from: "SIN", to: "CMB", departureTime: "19:55", arrivalTime: "21:15", aircraftType: "Airbus A330-200", status: "completed" },
  { id: "41", date: "2023-11-26", airline: "ALK", flightNumber: "141", from: "CMB", to: "BOM", departureTime: "23:45", arrivalTime: "02:10", aircraftType: "Airbus A320neo", status: "completed" },
  { id: "42", date: "2023-11-27", airline: "AIC", flightNumber: "669", from: "BOM", to: "BDQ", departureTime: "05:15", arrivalTime: "06:35", aircraftType: "Airbus A321", status: "completed" },
  { id: "43", date: "2024-01-18", airline: "IGO", flightNumber: "5602", from: "BDQ", to: "DEL", departureTime: "08:10", arrivalTime: "09:40", aircraftType: "Airbus A320neo", status: "completed" },
  { id: "44", date: "2024-01-19", airline: "IGO", flightNumber: "6637", from: "DEL", to: "BDQ", departureTime: "18:35", arrivalTime: "20:10", aircraftType: "Airbus A320neo", status: "completed" },
  { id: "45", date: "2024-05-26", airline: "IGO", flightNumber: "2078", from: "STV", to: "DEL", departureTime: "08:30", arrivalTime: "10:15", aircraftType: "Airbus A320neo", status: "completed" },
  { id: "46", date: "2024-05-26", airline: "IGO", flightNumber: "2218", from: "DEL", to: "IXR", departureTime: "12:25", arrivalTime: "14:10", aircraftType: "Airbus A320", status: "completed" },
  { id: "47", date: "2024-05-30", airline: "IGO", flightNumber: "2332", from: "IXR", to: "DEL", departureTime: "09:30", arrivalTime: "11:20", aircraftType: "Airbus A320", status: "completed" },
  { id: "48", date: "2024-05-30", airline: "IGO", flightNumber: "2557", from: "DEL", to: "STV", departureTime: "15:15", arrivalTime: "17:00", aircraftType: "Airbus A321neo", status: "completed" },
  { id: "49", date: "2024-07-15", airline: "VTI", flightNumber: "918", from: "AMD", to: "BOM", departureTime: "04:50", arrivalTime: "06:15", aircraftType: "Airbus A320neo", status: "completed" },
  { id: "50", date: "2024-07-15", airline: "ETD", flightNumber: "197", from: "BOM", to: "AUH", departureTime: "10:55", arrivalTime: "12:30", aircraftType: "Airbus A320", status: "completed" },
  { id: "51", date: "2024-07-15", airline: "ETD", flightNumber: "17", from: "AUH", to: "LHR", departureTime: "14:05", arrivalTime: "18:45", aircraftType: "Airbus A380", status: "completed" },
  { id: "52", date: "2024-07-27", airline: "ETD", flightNumber: "46", from: "DUB", to: "AUH", departureTime: "09:10", arrivalTime: "19:30", aircraftType: "Boeing 777-300 ER", status: "completed" },
  { id: "53", date: "2024-07-27", airline: "ETD", flightNumber: "206", from: "AUH", to: "BOM", departureTime: "21:50", arrivalTime: "02:40", aircraftType: "Boeing 787-9", status: "completed" },
  { id: "54", date: "2024-07-28", airline: "AIC", flightNumber: "669", from: "BOM", to: "BDQ", departureTime: "08:10", arrivalTime: "09:25", aircraftType: "Airbus A320neo", status: "completed" },
  { id: "55", date: "2024-11-14", airline: "IGO", flightNumber: "6678", from: "JLR", to: "BOM", departureTime: "13:05", arrivalTime: "14:55", aircraftType: "Airbus A320neo", status: "completed" },
  { id: "56", date: "2024-11-14", airline: "IGO", flightNumber: "2168", from: "BOM", to: "BDQ", departureTime: "19:25", arrivalTime: "20:30", aircraftType: "Airbus A320neo", status: "completed" },
  { id: "57", date: "2024-12-05", airline: "IGO", flightNumber: "105", from: "BDQ", to: "GOX", departureTime: "17:10", arrivalTime: "18:40", aircraftType: "Airbus A320neo", status: "completed" },
  { id: "58", date: "2024-12-08", airline: "IGO", flightNumber: "104", from: "GOX", to: "BDQ", departureTime: "15:10", arrivalTime: "16:40", aircraftType: "Airbus A320neo", status: "completed" },
  { id: "59", date: "2024-12-22", airline: "IGO", flightNumber: "5187", from: "BDQ", to: "BOM", departureTime: "06:55", arrivalTime: "08:10", aircraftType: "Airbus A320", status: "completed" },
  { id: "60", date: "2025-03-10", airline: "IGO", flightNumber: "635", from: "AMD", to: "AYJ", departureTime: "13:50", arrivalTime: "15:30", aircraftType: "Airbus A320neo", status: "completed" },
  { id: "61", date: "2025-03-14", airline: "IGO", flightNumber: "6414", from: "VNS", to: "AMD", departureTime: "17:00", arrivalTime: "19:05", aircraftType: "Airbus A320neo", status: "completed" },
  { id: "62", date: "2025-05-01", airline: "IGO", flightNumber: "679", from: "BDQ", to: "BOM", departureTime: "21:00", arrivalTime: "22:25", aircraftType: "Airbus A320neo", status: "completed" },
  { id: "63", date: "2025-05-02", airline: "UAE", flightNumber: "501", from: "BOM", to: "DXB", departureTime: "04:25", arrivalTime: "06:00", aircraftType: "Airbus A380-800", status: "completed" },
  { id: "64", date: "2025-05-02", airline: "UAE", flightNumber: "211", from: "DXB", to: "IAH", departureTime: "09:30", arrivalTime: "16:50", aircraftType: "Airbus A380-800", status: "completed" },
  { id: "65", date: "2025-05-17", airline: "NKS", flightNumber: "2170", from: "IAH", to: "ATL", departureTime: "07:05", arrivalTime: "10:09", aircraftType: "Airbus A320neo", status: "completed" },
  { id: "66", date: "2025-05-20", airline: "NKS", flightNumber: "2574", from: "ATL", to: "IAH", departureTime: "07:05", arrivalTime: "08:15", aircraftType: "Airbus A320", status: "completed" },
  { id: "67", date: "2025-06-20", airline: "NKS", flightNumber: "2063", from: "IAH", to: "EWR", departureTime: "06:25", arrivalTime: "11:00", aircraftType: "Airbus A321neo", status: "completed" },
  { id: "68", date: "2025-06-24", airline: "NKS", flightNumber: "2064", from: "EWR", to: "IAH", departureTime: "12:05", arrivalTime: "15:00", aircraftType: "Airbus A321neo", status: "completed" },
  { id: "69", date: "2025-07-06", airline: "UAE", flightNumber: "212", from: "IAH", to: "DXB", departureTime: "19:55", arrivalTime: "19:45", aircraftType: "Airbus A380", status: "completed" },
  { id: "70", date: "2025-07-07", airline: "UAE", flightNumber: "538", from: "DXB", to: "AMD", departureTime: "22:50", arrivalTime: "03:00", aircraftType: "Airbus A350-900", status: "completed" },
  { id: "71", date: "2025-10-22", airline: "TVJ", flightNumber: "763", from: "BOM", to: "HKT", aircraftType: "Airbus A320", status: "upcoming" },
  { id: "72", date: "2025-10-25", airline: "TLM", flightNumber: "759", from: "HKT", to: "DMK", aircraftType: "Boeing 737-800", status: "upcoming" },
  { id: "73", date: "2025-10-27", airline: "FIN", flightNumber: "338", from: "BKK", to: "HEL", aircraftType: "Airbus A350-900", status: "upcoming" },
  { id: "74", date: "2025-10-28", airline: "FIN", flightNumber: "1751", from: "HEL", to: "ARN", aircraftType: "Airbus A320", status: "upcoming" },
  { id: "75", date: "2025-10-28", airline: "OSM", flightNumber: "1463", from: "ARN", to: "CPH", aircraftType: "Airbus A320neo", status: "upcoming" },
  { id: "76", date: "2025-11-01", airline: "IGO", flightNumber: "189", from: "AMD", to: "BDQ", aircraftType: "Airbus A320neo", status: "upcoming" },
];

// Calculate statistics
export function calculateStats() {
  const uniqueAirlines = new Set(allFlights.map(f => f.airline)).size;
  const airports = new Set([...allFlights.map(f => f.from), ...allFlights.map(f => f.to)]);
  const uniqueAirports = airports.size;
  
  // Estimate countries based on airport codes (simplified)
  const countries = new Set<string>();
  airports.forEach(code => {
    // This is a simplified mapping - in a real app, you'd have a proper airport database
    if (code.startsWith('I')) countries.add('India');
    else if (['HEL', 'FCO', 'CDG', 'LUX', 'LIS', 'DUB', 'ARN', 'CPH'].includes(code)) countries.add('Europe');
    else if (['BKK', 'DMK', 'HKT', 'CMB', 'SIN', 'KUL'].includes(code)) countries.add('Southeast Asia');
    else if (['IAH', 'ATL', 'EWR'].includes(code)) countries.add('USA');
    else if (['DXB', 'AUH', 'SHJ'].includes(code)) countries.add('UAE');
    else if (['LHR'].includes(code)) countries.add('UK');
  });

  // Approximate distance (very rough estimate based on flight count)
  const avgDistance = 1200; // km per flight average
  const totalDistance = allFlights.filter(f => f.status === 'completed').length * avgDistance;

  return {
    totalFlights: allFlights.length,
    uniqueAirlines,
    uniqueAirports,
    totalDistance: `${Math.round(totalDistance / 1000)}k km`,
    countries: countries.size,
  };
}

// Get unique routes for map visualization
export function getUniqueRoutes() {
  const routes = new Set<string>();
  const routeData: Array<{ from: string; to: string; count: number }> = [];
  
  allFlights.forEach(flight => {
    const routeKey = `${flight.from}-${flight.to}`;
    routes.add(routeKey);
  });

  routes.forEach(routeKey => {
    const [from, to] = routeKey.split('-');
    const count = allFlights.filter(f => f.from === from && f.to === to).length;
    routeData.push({ from, to, count });
  });

  return routeData;
}
