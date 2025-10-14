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
  isPage?: boolean; // ✅ Add this optional prop
}


export default function AddFlightModal({ userId }: AddFlightModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [airline, setAirline] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [departure, setDeparture] = useState("");
  const [date, setDate] = useState("");
  const [suggestedAirlines, setSuggestedAirlines] = useState<any[]>([]);
  const [suggestedAirports, setSuggestedAirports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [flights, setFlights] = useState<NormalizedFlight[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<NormalizedFlight | null>(null);
  const [error, setError] = useState("");

  // 🔸 Debounce helper
  const debounce = <T extends (...args: any[]) => void>(func: T, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // 🔹 Airline suggestions
  const handleAirlineInput = useMemo(
    () =>
      debounce((val: string) => {
        if (!val) return setSuggestedAirlines([]);
        const filtered = (airlinesData as any[]).filter(
          (a) =>
            a.name.toLowerCase().includes(val.toLowerCase()) ||
            a.iata.toLowerCase().includes(val.toLowerCase())
        );
        setSuggestedAirlines(filtered.slice(0, 5));
      }, 200),
    []
  );

  // 🔹 Airport suggestions
  const handleAirportInput = useMemo(
    () =>
      debounce((val: string) => {
        if (!val) return setSuggestedAirports([]);
        const filtered = (airportsData as any[]).filter(
          (a) =>
            a.name.toLowerCase().includes(val.toLowerCase()) ||
            a.iata.toLowerCase().includes(val.toLowerCase())
        );
        setSuggestedAirports(filtered.slice(0, 5));
      }, 200),
    []
  );

  useEffect(() => handleAirlineInput(airline), [airline, handleAirlineInput]);
  useEffect(() => handleAirportInput(departure), [departure, handleAirportInput]);

  // 🔍 Search flights
  const searchFlights = async () => {
    if (!date) return setError("Please select a date.");
    setLoading(true);
    setError("");
    setFlights([]);

    try {
      const params = new URLSearchParams();
      if (flightNumber) params.append("flight_number", flightNumber);
      if (airline) params.append("airline_name", airline);
      if (departure) params.append("dep_iata", departure);
      params.append("date", date);

      const res = await fetch(`/api/flights/search?${params.toString()}`);
      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const filtered = data.filter(
          (f: NormalizedFlight) =>
            f.date?.startsWith(date) &&
            (!departure || f.dep_iata?.toLowerCase() === departure.toLowerCase()) &&
            (!airline || f.airline_name?.toLowerCase().includes(airline.toLowerCase()))
        );
        setFlights(filtered);
        if (filtered.length === 0) setError("No flights found for selected date or filters.");
      } else {
        setError("No flight data found. Please check your input.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to fetch flight data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

// 🛫 Add flight
const handleAddFlight = async () => {
  if (!selectedFlight) return;

  try {
    // ✅ Get token from localStorage
    const token = localStorage.getItem("auth_token");
    if (!token) {
      alert("You must be logged in to add a flight.");
      return;
    }

    // Prepare flight data (flattened for backend)
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
        Authorization: `Bearer ${token}`, // ✅ pass token to backend
      },
      body: JSON.stringify(flightData),
    });

    if (res.ok) {
      alert("Flight added successfully!");
      setStep(1);
      setSelectedFlight(null);
    } else {
      const err = await res.json();
      alert("Error adding flight: " + (err.message || "Unknown error"));
    }
  } catch (err) {
    console.error(err);
    alert("Error adding flight. Please try again.");
  }
};


  const formatDate = (d?: string) => {
    if (!d) return "N/A";
    const dateObj = new Date(d);
    return isNaN(dateObj.getTime()) ? "N/A" : dateObj.toLocaleDateString();
  };

  return (
    <div className="p-4 space-y-6">
      {/* Step 1: Search */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Search Flight</h2>

          <div>
            <Label>Flight Number (optional)</Label>
            <Input
              placeholder="e.g. 6E6289"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
            />
          </div>

          <div>
            <Label>Airline</Label>
            <Input
              placeholder="e.g. IndiGo"
              value={airline}
              onChange={(e) => setAirline(e.target.value)}
              list="airline-suggestions"
            />
            <datalist id="airline-suggestions">
              {suggestedAirlines.map((a, idx) => (
                <option key={idx} value={a.name || a.iata} />
              ))}
            </datalist>
          </div>

          <div>
            <Label>Departure Airport</Label>
            <Input
              placeholder="e.g. DEL"
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              list="airport-suggestions"
            />
            <datalist id="airport-suggestions">
              {suggestedAirports.map((a, idx) => (
                <option key={idx} value={a.name || a.iata} />
              ))}
            </datalist>
          </div>

          <div>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <Button className="w-full mt-4" onClick={searchFlights} disabled={loading}>
            {loading ? "Searching..." : "Search Flights"}
          </Button>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      )}

      {/* Step 1b: Flight Results */}
      {step === 1 && flights.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Select a Flight</h3>
          {flights.map((f, i) => (
            <Card
              key={i}
              onClick={() => {
                setSelectedFlight(f);
                setStep(2);
              }}
              className="cursor-pointer hover:bg-accent transition-all border rounded-xl shadow-sm"
            >
              <CardContent className="p-3">
                <p className="font-medium">
                  {f.airline_name || "Unknown Airline"} — {f.flight_number || "N/A"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {f.dep_iata || "???"} → {f.arr_iata || "???"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {f.dep_airport || "Unknown"} → {f.arr_airport || "Unknown"}
                </p>
                <p className="text-xs mt-1 text-muted-foreground">
                  {formatDate(f.date)} • {f.status || "N/A"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Step 2: Confirm Flight */}
      {step === 2 && selectedFlight && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Confirm Flight Details</h2>

          <Card className="border rounded-xl shadow-sm">
            <CardContent className="p-3 space-y-2">
              <p>
                <strong>Airline:</strong> {selectedFlight.airline_name || "N/A"}
              </p>
              <p>
                <strong>Flight:</strong> {selectedFlight.flight_number || "N/A"}
              </p>
              <p>
                <strong>From:</strong> {selectedFlight.dep_airport || "N/A"} (
                {selectedFlight.dep_iata})
              </p>
              <p>
                <strong>To:</strong> {selectedFlight.arr_airport || "N/A"} (
                {selectedFlight.arr_iata})
              </p>
              <p>
                <strong>Date:</strong> {formatDate(selectedFlight.date)}
              </p>
              <p>
                <strong>Status:</strong> {selectedFlight.status || "N/A"}
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={handleAddFlight}>Add Flight</Button>
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
