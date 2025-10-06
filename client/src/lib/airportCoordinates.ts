// Airport coordinates for map visualization
// Coordinates are in [longitude, latitude] format
export const airportCoordinates: Record<string, { lat: number; lon: number; city: string; country: string }> = {
  // India
  'AMD': { lat: 23.0772, lon: 72.6347, city: 'Ahmedabad', country: 'India' },
  'BDQ': { lat: 22.3364, lon: 73.2263, city: 'Vadodara', country: 'India' },
  'DEL': { lat: 28.5562, lon: 77.1000, city: 'New Delhi', country: 'India' },
  'BOM': { lat: 19.0896, lon: 72.8656, city: 'Mumbai', country: 'India' },
  'BLR': { lat: 12.9499, lon: 77.6680, city: 'Bengaluru', country: 'India' },
  'IXL': { lat: 34.1359, lon: 77.5465, city: 'Leh', country: 'India' },
  'IXB': { lat: 26.6812, lon: 88.3286, city: 'Bagdogra', country: 'India' },
  'IXE': { lat: 12.9611, lon: 74.8904, city: 'Mangalore', country: 'India' },
  'IXZ': { lat: 11.6410, lon: 92.7296, city: 'Port Blair', country: 'India' },
  'IXR': { lat: 23.3144, lon: 85.3218, city: 'Ranchi', country: 'India' },
  'LKO': { lat: 26.7606, lon: 80.8893, city: 'Lucknow', country: 'India' },
  'IDR': { lat: 22.7216, lon: 75.8011, city: 'Indore', country: 'India' },
  'JLR': { lat: 23.1778, lon: 80.0524, city: 'Jabalpur', country: 'India' },
  'GOX': { lat: 15.3808, lon: 73.8314, city: 'Goa', country: 'India' },
  'STV': { lat: 21.1142, lon: 72.7419, city: 'Surat', country: 'India' },
  'AYJ': { lat: 26.7517, lon: 82.1503, city: 'Ayodhya', country: 'India' },
  'VNS': { lat: 25.4524, lon: 82.8592, city: 'Varanasi', country: 'India' },
  
  // UAE & Middle East
  'SHJ': { lat: 25.3286, lon: 55.5172, city: 'Sharjah', country: 'UAE' },
  'DXB': { lat: 25.2532, lon: 55.3657, city: 'Dubai', country: 'UAE' },
  'AUH': { lat: 24.4330, lon: 54.6511, city: 'Abu Dhabi', country: 'UAE' },
  
  // Southeast Asia
  'BKK': { lat: 13.6900, lon: 100.7501, city: 'Bangkok', country: 'Thailand' },
  'DMK': { lat: 13.9126, lon: 100.6067, city: 'Bangkok DMK', country: 'Thailand' },
  'HKT': { lat: 8.1132, lon: 98.3169, city: 'Phuket', country: 'Thailand' },
  'CMB': { lat: 7.1808, lon: 79.8841, city: 'Colombo', country: 'Sri Lanka' },
  'SIN': { lat: 1.3644, lon: 103.9915, city: 'Singapore', country: 'Singapore' },
  'KUL': { lat: 2.7456, lon: 101.7099, city: 'Kuala Lumpur', country: 'Malaysia' },
  
  // Europe
  'HEL': { lat: 60.3172, lon: 24.9633, city: 'Helsinki', country: 'Finland' },
  'FCO': { lat: 41.8003, lon: 12.2389, city: 'Rome', country: 'Italy' },
  'CDG': { lat: 49.0097, lon: 2.5479, city: 'Paris', country: 'France' },
  'LUX': { lat: 49.6233, lon: 6.2044, city: 'Luxembourg', country: 'Luxembourg' },
  'LIS': { lat: 38.7813, lon: -9.1359, city: 'Lisbon', country: 'Portugal' },
  'LHR': { lat: 51.4700, lon: -0.4543, city: 'London', country: 'UK' },
  'DUB': { lat: 53.4213, lon: -6.2701, city: 'Dublin', country: 'Ireland' },
  'ARN': { lat: 59.6519, lon: 17.9186, city: 'Stockholm', country: 'Sweden' },
  'CPH': { lat: 55.6181, lon: 12.6561, city: 'Copenhagen', country: 'Denmark' },
  
  // USA
  'IAH': { lat: 29.9902, lon: -95.3368, city: 'Houston', country: 'USA' },
  'ATL': { lat: 33.6407, lon: -84.4277, city: 'Atlanta', country: 'USA' },
  'EWR': { lat: 40.6895, lon: -74.1745, city: 'Newark', country: 'USA' },
};

// Convert lat/lon to SVG coordinates (Mercator projection simplified)
export function projectToMap(lat: number, lon: number, width: number, height: number): { x: number; y: number } {
  const x = (lon + 180) * (width / 360);
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = height / 2 - (width * mercN) / (2 * Math.PI);
  
  return { x, y };
}
