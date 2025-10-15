"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { NormalizedFlight } from "@/types";

import airlinesData from "@/airlines.json";
import airportsData from "@/airports.json";

interface AddFlightModalProps {
  userId: string;
  isPage?: boolean;
}

interface Airline {
  name?: string;
  iata?: string;
}

interface Airport {
  iata?: string;
  ident?: string;
  name?: string;
}

const airlines: Airline[] = (airlinesData as unknown as Airline[]) || [];
const airports: Airport[] = (airportsData as unknown as Airport[]) || [];

const formatDate = (d?: string) => {
  if (!d) return "N/A";
  const dateObj = new Date(d);
  return isNaN(dateObj.getTime()) ? "N/A" : dateObj.toLocaleDateString();
};

const formatTime = (t?: string) => {
  if (!t) return "N/A";
  const dateObj = new Date(t);
  return isNaN(dateObj.getTime())
    ? "N/A"
    : dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function AddFlightModal({ userId }: AddFlightModalProps) {
  const [step, setStep] = useState<1 | 2>(1);

  const [airline, setAirline] = useState("");
  const [flightNumber, setFlightNumber] = useState("");

  const [departureInput, setDepartureInput] = useState("");
  const [departureIata, setDepartureIata] = useState("");

  const [arrivalInput, setArrivalInput] = useState("");
  const [arrivalIata, setArrivalIata] = useState("");

  const [date, setDate] = useState("");

  const [suggestedAirlines, setSuggestedAirlines] = useState<Airline[]>([]);
  const [suggestedDepAirports, setSuggestedDepAirports] = useState<Airport[]>([]);
  const [suggestedArrAirports, setSuggestedArrAirports] = useState<Airport[]>([]);

  const [loading, setLoading] = useState(false);
  const [flights, setFlights] = useState<NormalizedFlight[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<NormalizedFlight | null>(null);
  const [error, setError] = useState("");

  const [airlineSelected, setAirlineSelected] = useState(false);
  const [depSelected, setDepSelected] = useState(false);
  const [arrSelected, setArrSelected] = useState(false);

  const debounce = <T extends (...args: any[]) => void>(func: T, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const handleAirlineInput = useMemo(
    () =>
      debounce((val: string) => {
        if (!val || airlineSelected) return setSuggestedAirlines([]);
        const filtered = airlines.filter(
          (a) =>
            a.name?.toLowerCase().includes(val.toLowerCase()) ||
            a.iata?.toLowerCase().includes(val.toLowerCase())
        );
        setSuggestedAirlines(filtered.slice(0, 8));
      }, 200),
    [airlineSelected]
  );

  const handleDepartureInput = useMemo(
    () =>
      debounce((val: string) => {
        if (!val || depSelected) return setSuggestedDepAirports([]);
        const filtered = airports.filter(
          (a) =>
            a.name?.toLowerCase().includes(val.toLowerCase()) ||
            a.iata?.toLowerCase().includes(val.toLowerCase()) ||
            a.ident?.toLowerCase().includes(val.toLowerCase())
        );
        setSuggestedDepAirports(filtered.slice(0, 8));
      }, 200),
    [depSelected]
  );

  const handleArrivalInput = useMemo(
    () =>
      debounce((val: string) => {
        if (!val || arrSelected) return setSuggestedArrAirports([]);
        const filtered = airports.filter(
          (a) =>
            a.name?.toLowerCase().includes(val.toLowerCase()) ||
            a.iata?.toLowerCase().includes(val.toLowerCase()) ||
            a.ident?.toLowerCase().includes(val.toLowerCase())
        );
        setSuggestedArrAirports(filtered.slice(0, 8));
      }, 200),
    [arrSelected]
  );

  useEffect(() => handleAirlineInput(airline), [airline, handleAirlineInput]);
  useEffect(() => handleDepartureInput(departureInput), [departureInput, handleDepartureInput]);
  useEffect(() => handleArrivalInput(arrivalInput), [arrivalInput, handleArrivalInput]);

  const handleAirlineSelect = (selected: Airline) => {
    setAirline(`${selected.name || ""} ${selected.iata ? `(${selected.iata})` : ""}`);
    if (selected.iata) setFlightNumber(selected.iata);
    setSuggestedAirlines([]);
    setAirlineSelected(true);
  };

  const handleDepSelect = (selected: Airport) => {
    setDepartureInput(`${selected.name || ""} (${selected.iata || selected.ident || ""})`);
    setDepartureIata(selected.iata || selected.ident || "");
    setSuggestedDepAirports([]);
    setDepSelected(true);
  };

  const handleArrSelect = (selected: Airport) => {
    setArrivalInput(`${selected.name || ""} (${selected.iata || selected.ident || ""})`);
    setArrivalIata(selected.iata || selected.ident || "");
    setSuggestedArrAirports([]);
    setArrSelected(true);
  };

  const searchFlights = async () => {
    if (!date) return setError("Please select a date.");
    setLoading(true);
    setError("");
    setFlights([]);

    try {
      const params = new URLSearchParams();
      if (flightNumber) params.append("flight_number", flightNumber);
      if (airline) params.append("airline_name", airline);
      if (departureIata) params.append("dep_iata", departureIata);
      if (arrivalIata) params.append("arr_iata", arrivalIata);
      params.append("date", date);

      const res = await fetch(`/api/flights/search?${params.toString()}`);
      if (!res.ok) throw new Error("Request failed");

      const data: any[] = await res.json();

      const normalized: NormalizedFlight[] = data.map((f) => ({
        date: f.date || f.flight_date || "",
        status: f.status || f.flight_status || "scheduled",
        dep_iata: f.dep_iata || f.departure?.iata || "N/A",
        dep_airport: f.dep_airport || f.departure?.airport || "N/A",
        dep_time: f.dep_time || f.departure?.scheduled || null,
        arr_iata: f.arr_iata || f.arrival?.iata || "N/A",
        arr_airport: f.arr_airport || f.arrival?.airport || "N/A",
        arr_time: f.arr_time || f.arrival?.scheduled || null,
        airline_name: f.airline_name || f.airline?.name || "N/A",
        flight_number: f.flight_number || f.flight?.number || f.flight?.iata || "N/A",
      }));

      const filtered = normalized.filter((f) => {
        const matchDate = f.date?.startsWith(date);
        const matchDep = !departureIata || f.dep_iata?.toUpperCase() === departureIata.toUpperCase();
        const matchArr = !arrivalIata || f.arr_iata?.toUpperCase() === arrivalIata.toUpperCase();
        const matchAirline = !airline || f.airline_name?.toLowerCase().includes(airline.toLowerCase());
        return matchDate && matchDep && matchArr && matchAirline;
      });

      setFlights(filtered);
      if (filtered.length === 0) setError("No flights found for selected filters.");
    } catch (err) {
      console.error(err);
      setError("Unable to fetch flight data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFlight = async () => {
    if (!selectedFlight) return;

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        alert("You must be logged in to add a flight.");
        return;
      }

      const flightData = {
        date: selectedFlight.date,
        flight_number: selectedFlight.flight_number,
        departure: selectedFlight.dep_iata,
        arrival: selectedFlight.arr_iata,
        status: selectedFlight.status ?? "scheduled",
        airline_name: selectedFlight.airline_name ?? null,
      };

      const res = await fetch("/api/flights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(flightData),
      });

      if (res.ok) {
        alert("Flight added successfully!");
        setStep(1);
        setSelectedFlight(null);
        setDepartureInput("");
        setDepartureIata("");
        setArrivalInput("");
        setArrivalIata("");
        setAirline("");
        setFlightNumber("");
        setDate("");
        setAirlineSelected(false);
        setDepSelected(false);
        setArrSelected(false);
      } else {
        const err = await res.json();
        alert("Error adding flight: " + (err.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error adding flight. Please try again.");
    }
  };

  const FlightCard = ({ f, showStatus }: { f: NormalizedFlight; showStatus?: boolean }) => {
    const dateStr = formatDate(f.date);

    return (
      <div className="p-4 bg-neutral-900 border border-green-700 rounded-xl hover:shadow-lg transition-shadow">
        <div className="flex justify-between mb-2 items-center">
          <div className="font-semibold text-lg text-white">
            {f.airline_name || "N/A"} {f.flight_number || "N/A"}
          </div>
          <div className="text-green-400 text-sm flex items-center gap-2">
            <span>{dateStr}</span>
            {showStatus && f.status && (
              <span className="px-2 py-0.5 bg-green-700 rounded-full text-xs">
                {f.status}
              </span>
            )}
          </div>
        </div>
        <div className="text-sm text-green-300">
          {f.dep_iata || "???"} ({f.dep_airport || "N/A"}) → {f.arr_iata || "???"} ({f.arr_airport || "N/A"})
        </div>
        <div className="text-xs text-green-500 mt-1">
          Departure: {formatTime(f.dep_time)} • Arrival: {formatTime(f.arr_time)}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-6">
      {step === 1 && (
        <>
          {/* Flight Search Form */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Search Flight</h2>
            {/* Flight Number */}
            <div>
              <Label>Flight Number (optional)</Label>
              <Input placeholder="e.g. 6E6289" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} />
            </div>
            {/* Airline */}
            <div className="relative">
              <Label>Airline</Label>
              <Input
                placeholder="e.g. IndiGo"
                value={airline}
                onChange={(e) => {
                  setAirline(e.target.value);
                  setAirlineSelected(false);
                }}
              />
              {!airlineSelected && suggestedAirlines.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border rounded shadow mt-1 max-h-40 overflow-auto text-black">
                  {suggestedAirlines.map((a, idx) => (
                    <li key={idx} className="p-2 hover:bg-gray-100 cursor-pointer text-black" onClick={() => handleAirlineSelect(a)}>
                      {a.name} {a.iata ? `(${a.iata})` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Departure */}
            <div className="relative">
              <Label>Departure Airport</Label>
              <Input
                placeholder="e.g. DEL"
                value={departureInput}
                onChange={(e) => {
                  setDepartureInput(e.target.value);
                  setDepSelected(false);
                }}
              />
              {!depSelected && suggestedDepAirports.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border rounded shadow mt-1 max-h-40 overflow-auto text-black">
                  {suggestedDepAirports.map((a, idx) => (
                    <li key={idx} className="p-2 hover:bg-gray-100 cursor-pointer text-black" onClick={() => handleDepSelect(a)}>
                      {a.name} {a.iata || a.ident ? `(${a.iata || a.ident})` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Arrival */}
            <div className="relative">
              <Label>Arrival Airport</Label>
              <Input
                placeholder="e.g. BOM"
                value={arrivalInput}
                onChange={(e) => {
                  setArrivalInput(e.target.value);
                  setArrSelected(false);
                }}
              />
              {!arrSelected && suggestedArrAirports.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border rounded shadow mt-1 max-h-40 overflow-auto text-black">
                  {suggestedArrAirports.map((a, idx) => (
                    <li key={idx} className="p-2 hover:bg-gray-100 cursor-pointer text-black" onClick={() => handleArrSelect(a)}>
                      {a.name} {a.iata || a.ident ? `(${a.iata || a.ident})` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Date */}
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <Button className="w-full mt-4" onClick={searchFlights} disabled={loading}>
              {loading ? "Searching..." : "Search Flights"}
            </Button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>

          {/* Flights Results */}
          {flights.length > 0 && (
            <>
              <div className="border-b border-green-800/40 my-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {flights.map((f, i) => (
                  <FlightCard key={i} f={f} showStatus={true} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
