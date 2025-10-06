export interface AirlineInfo {
  code: string;
  name: string;
  country: string;
}

export const airlineDatabase: Record<string, AirlineInfo> = {
  // Indian Airlines
  '6E': { code: '6E', name: 'IndiGo', country: 'India' },
  'AI': { code: 'AI', name: 'Air India', country: 'India' },
  'UK': { code: 'UK', name: 'Vistara', country: 'India' },
  'G8': { code: 'G8', name: 'Go First', country: 'India' },
  'SG': { code: 'SG', name: 'SpiceJet', country: 'India' },
  'I5': { code: 'I5', name: 'AirAsia India', country: 'India' },
  
  // Middle East Airlines
  'EK': { code: 'EK', name: 'Emirates', country: 'UAE' },
  'EY': { code: 'EY', name: 'Etihad Airways', country: 'UAE' },
  'QR': { code: 'QR', name: 'Qatar Airways', country: 'Qatar' },
  'WY': { code: 'WY', name: 'Oman Air', country: 'Oman' },
  'G9': { code: 'G9', name: 'Air Arabia', country: 'UAE' },
  'FZ': { code: 'FZ', name: 'flydubai', country: 'UAE' },
  'XY': { code: 'XY', name: 'flynas', country: 'Saudi Arabia' },
  'SV': { code: 'SV', name: 'Saudia', country: 'Saudi Arabia' },
  'GF': { code: 'GF', name: 'Gulf Air', country: 'Bahrain' },
  'KU': { code: 'KU', name: 'Kuwait Airways', country: 'Kuwait' },
  
  // Asian Airlines
  'SQ': { code: 'SQ', name: 'Singapore Airlines', country: 'Singapore' },
  'TG': { code: 'TG', name: 'Thai Airways', country: 'Thailand' },
  'MH': { code: 'MH', name: 'Malaysia Airlines', country: 'Malaysia' },
  'CX': { code: 'CX', name: 'Cathay Pacific', country: 'Hong Kong' },
  'JL': { code: 'JL', name: 'Japan Airlines', country: 'Japan' },
  'NH': { code: 'NH', name: 'All Nippon Airways', country: 'Japan' },
  'KE': { code: 'KE', name: 'Korean Air', country: 'South Korea' },
  'OZ': { code: 'OZ', name: 'Asiana Airlines', country: 'South Korea' },
  'BR': { code: 'BR', name: 'EVA Air', country: 'Taiwan' },
  'CI': { code: 'CI', name: 'China Airlines', country: 'Taiwan' },
  'CA': { code: 'CA', name: 'Air China', country: 'China' },
  'CZ': { code: 'CZ', name: 'China Southern Airlines', country: 'China' },
  'MU': { code: 'MU', name: 'China Eastern Airlines', country: 'China' },
  'VN': { code: 'VN', name: 'Vietnam Airlines', country: 'Vietnam' },
  'VJ': { code: 'VJ', name: 'VietJet Air', country: 'Vietnam' },
  'PG': { code: 'PG', name: 'Bangkok Airways', country: 'Thailand' },
  'FD': { code: 'FD', name: 'Thai AirAsia', country: 'Thailand' },
  'SL': { code: 'SL', name: 'Thai Lion Air', country: 'Thailand' },
  'VZ': { code: 'VZ', name: 'Thai Vietjet Air', country: 'Thailand' },
  'UL': { code: 'UL', name: 'SriLankan Airlines', country: 'Sri Lanka' },
  'AK': { code: 'AK', name: 'AirAsia', country: 'Malaysia' },
  'D7': { code: 'D7', name: 'AirAsia X', country: 'Malaysia' },
  'BI': { code: 'BI', name: 'Royal Brunei Airlines', country: 'Brunei' },
  'PK': { code: 'PK', name: 'Pakistan International Airlines', country: 'Pakistan' },
  
  // US Airlines
  'AA': { code: 'AA', name: 'American Airlines', country: 'USA' },
  'UA': { code: 'UA', name: 'United Airlines', country: 'USA' },
  'DL': { code: 'DL', name: 'Delta Air Lines', country: 'USA' },
  'WN': { code: 'WN', name: 'Southwest Airlines', country: 'USA' },
  'B6': { code: 'B6', name: 'JetBlue Airways', country: 'USA' },
  'AS': { code: 'AS', name: 'Alaska Airlines', country: 'USA' },
  'NK': { code: 'NK', name: 'Spirit Airlines', country: 'USA' },
  'F9': { code: 'F9', name: 'Frontier Airlines', country: 'USA' },
  'G4': { code: 'G4', name: 'Allegiant Air', country: 'USA' },
  'HA': { code: 'HA', name: 'Hawaiian Airlines', country: 'USA' },
  
  // European Airlines
  'BA': { code: 'BA', name: 'British Airways', country: 'UK' },
  'LH': { code: 'LH', name: 'Lufthansa', country: 'Germany' },
  'AF': { code: 'AF', name: 'Air France', country: 'France' },
  'KL': { code: 'KL', name: 'KLM Royal Dutch Airlines', country: 'Netherlands' },
  'IB': { code: 'IB', name: 'Iberia', country: 'Spain' },
  'AZ': { code: 'AZ', name: 'Alitalia', country: 'Italy' },
  'LX': { code: 'LX', name: 'Swiss International Air Lines', country: 'Switzerland' },
  'OS': { code: 'OS', name: 'Austrian Airlines', country: 'Austria' },
  'SN': { code: 'SN', name: 'Brussels Airlines', country: 'Belgium' },
  'SK': { code: 'SK', name: 'Scandinavian Airlines', country: 'Sweden' },
  'AY': { code: 'AY', name: 'Finnair', country: 'Finland' },
  'TP': { code: 'TP', name: 'TAP Air Portugal', country: 'Portugal' },
  'EI': { code: 'EI', name: 'Aer Lingus', country: 'Ireland' },
  'FR': { code: 'FR', name: 'Ryanair', country: 'Ireland' },
  'U2': { code: 'U2', name: 'easyJet', country: 'UK' },
  'VY': { code: 'VY', name: 'Vueling', country: 'Spain' },
  'W6': { code: 'W6', name: 'Wizz Air', country: 'Hungary' },
  'LG': { code: 'LG', name: 'Luxair', country: 'Luxembourg' },
  'TK': { code: 'TK', name: 'Turkish Airlines', country: 'Turkey' },
  'SU': { code: 'SU', name: 'Aeroflot', country: 'Russia' },
  'LO': { code: 'LO', name: 'LOT Polish Airlines', country: 'Poland' },
  'OK': { code: 'OK', name: 'Czech Airlines', country: 'Czech Republic' },
  'RO': { code: 'RO', name: 'Tarom', country: 'Romania' },
  
  // Canadian Airlines
  'AC': { code: 'AC', name: 'Air Canada', country: 'Canada' },
  'WS': { code: 'WS', name: 'WestJet', country: 'Canada' },
  
  // Latin American Airlines
  'AM': { code: 'AM', name: 'Aeromexico', country: 'Mexico' },
  'AR': { code: 'AR', name: 'Aerolineas Argentinas', country: 'Argentina' },
  'LA': { code: 'LA', name: 'LATAM Airlines', country: 'Chile' },
  'CM': { code: 'CM', name: 'Copa Airlines', country: 'Panama' },
  'AV': { code: 'AV', name: 'Avianca', country: 'Colombia' },
  'G3': { code: 'G3', name: 'GOL Linhas Aereas', country: 'Brazil' },
  'AD': { code: 'AD', name: 'Azul Brazilian Airlines', country: 'Brazil' },
  
  // Australian/Oceania Airlines
  'QF': { code: 'QF', name: 'Qantas', country: 'Australia' },
  'VA': { code: 'VA', name: 'Virgin Australia', country: 'Australia' },
  'JQ': { code: 'JQ', name: 'Jetstar Airways', country: 'Australia' },
  'NZ': { code: 'NZ', name: 'Air New Zealand', country: 'New Zealand' },
  'FJ': { code: 'FJ', name: 'Fiji Airways', country: 'Fiji' },
  
  // African Airlines
  'ET': { code: 'ET', name: 'Ethiopian Airlines', country: 'Ethiopia' },
  'MS': { code: 'MS', name: 'EgyptAir', country: 'Egypt' },
  'SA': { code: 'SA', name: 'South African Airways', country: 'South Africa' },
  'KQ': { code: 'KQ', name: 'Kenya Airways', country: 'Kenya' },
  'AT': { code: 'AT', name: 'Royal Air Maroc', country: 'Morocco' },
  'TU': { code: 'TU', name: 'Tunisair', country: 'Tunisia' },
};

// Create reverse lookup for airline names to codes
export const getAirlineByCode = (code: string): AirlineInfo | null => {
  return airlineDatabase[code.toUpperCase()] || null;
};

// Get all unique airlines (removing duplicates with same name)
export const getAllAirlines = (): AirlineInfo[] => {
  const seen = new Set<string>();
  const uniqueAirlines: AirlineInfo[] = [];
  
  Object.values(airlineDatabase).forEach(airline => {
    const key = `${airline.name}-${airline.country}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueAirlines.push(airline);
    }
  });
  
  return uniqueAirlines.sort((a, b) => a.name.localeCompare(b.name));
};

// Validate and normalize airline code
export const normalizeAirlineCode = (input: string): { code: string; name: string } | null => {
  const upperInput = input.toUpperCase().trim();
  
  // Direct code lookup
  const airline = airlineDatabase[upperInput];
  if (airline) {
    return { code: airline.code, name: airline.name };
  }
  
  // Search by airline name
  const byName = Object.values(airlineDatabase).find(
    a => a.name.toUpperCase() === upperInput
  );
  if (byName) {
    return { code: byName.code, name: byName.name };
  }
  
  return null;
};
