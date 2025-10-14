// client/src/types.ts

/* -------------------------------------------------------------------------- */
/* 🏷️ Stamp Type (for Achievements / UI)                                      */
/* -------------------------------------------------------------------------- */
export interface UIStamp {
  id: string;        // unique ID of the stamp (string)
  name: string;      // readable country name, e.g. "Japan"
  isoCode: string;   // ISO country code, e.g. "JP"
  imageUrl: string;  // path to the image, e.g. "/stamps/jp.png"
}

/* -------------------------------------------------------------------------- */
/* ✈️ AviationStack Flight Type (for AddFlightModal)                          */
/* -------------------------------------------------------------------------- */
// Add this line at the top or bottom
// Original raw API structure
export interface AviationStackFlight {
  flight_date?: string;
  flight_status?: string;
  airline?: { name?: string; iata?: string };
  flight?: {
    iata?: string;
    number?: string;
    codeshared?: {
      airline_name?: string;
      airline_iata?: string;
      airline_icao?: string;
      flight_number?: string;
      flight_iata?: string;
      flight_icao?: string;
    };
  };
  departure?: {
    iata?: string;
    airport?: string;
    scheduled?: string;
    terminal?: string;
    latitude?: number;
    longitude?: number;
  };
  arrival?: {
    iata?: string;
    airport?: string;
    scheduled?: string;
    terminal?: string;
    latitude?: number;
    longitude?: number;
  };
  aircraft?: { model?: string };
  flight_time?: string;
  distance?: number;
}

// ✅ Normalized structure your frontend uses
export interface NormalizedFlight {
  date: string;
  status: string;
  dep_iata: string;
  dep_airport: string;
  arr_iata: string;
  arr_airport: string;
  airline_name: string;
  flight_number: string;
}
