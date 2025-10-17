"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import airlinesData from "@/airlines.json";
import airportsData from "@/airports.json";
import { motion, AnimatePresence } from "framer-motion";
import { createLucideIcon, ScanText } from "lucide-react";
import { faceAlien } from "@lucide/lab";
import Tesseract from "tesseract.js";

// Wrap icons
const FaceAlienIcon = createLucideIcon("FaceAlienIcon", faceAlien);

interface Airline {
  name: string;
  airline_code?: string;
}

interface Airport {
  name: string;
  iata?: string;
  ident?: string;
  latitude?: number;
  longitude?: number;
}

interface ManualAddFlightProps {
  userId: string;
}

export default function ManualAddFlight({ userId }: ManualAddFlightProps) {
  const [airline, setAirline] = useState("");
  const [airlineCode, setAirlineCode] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [departureInput, setDepartureInput] = useState("");
  const [arrivalInput, setArrivalInput] = useState("");
  const [date, setDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [status, setStatus] = useState("scheduled");

  const [departureAirport, setDepartureAirport] = useState<Airport | null>(null);
  const [arrivalAirport, setArrivalAirport] = useState<Airport | null>(null);

  const [suggestedAirlines, setSuggestedAirlines] = useState<Airline[]>([]);
  const [suggestedDepAirports, setSuggestedDepAirports] = useState<Airport[]>([]);
  const [suggestedArrAirports, setSuggestedArrAirports] = useState<Airport[]>([]);

  const [isAdding, setIsAdding] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const airlines: Airline[] = (airlinesData as any[]).map((a) => ({
    name: a.airline_name ?? "",
    airline_code: a.airline_code ?? "",
  }));

  const airports: Airport[] = (airportsData as any[]).map((a) => ({
    name: a.name ?? "",
    iata: a.iata ?? "",
    ident: a.ident ?? "",
    latitude: a.latitude ?? 0,
    longitude: a.longitude ?? 0,
  }));

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
        if (!val) return setSuggestedAirlines([]);
        setSuggestedAirlines(
          airlines
            .filter(
              (a) =>
                a.name.toLowerCase().includes(val.toLowerCase()) ||
                a.airline_code?.toLowerCase().includes(val.toLowerCase())
            )
            .slice(0, 8)
        );
      }, 200),
    []
  );

  const handleDepInput = useMemo(
    () =>
      debounce((val: string) => {
        if (!val) return setSuggestedDepAirports([]);
        setSuggestedDepAirports(
          airports
            .filter(
              (a) =>
                a.name.toLowerCase().includes(val.toLowerCase()) ||
                a.iata?.toLowerCase().includes(val.toLowerCase()) ||
                a.ident?.toLowerCase().includes(val.toLowerCase())
            )
            .slice(0, 8)
        );
      }, 200),
    []
  );

  const handleArrInput = useMemo(
    () =>
      debounce((val: string) => {
        if (!val) return setSuggestedArrAirports([]);
        setSuggestedArrAirports(
          airports
            .filter(
              (a) =>
                a.name.toLowerCase().includes(val.toLowerCase()) ||
                a.iata?.toLowerCase().includes(val.toLowerCase()) ||
                a.ident?.toLowerCase().includes(val.toLowerCase())
            )
            .slice(0, 8)
        );
      }, 200),
    []
  );

  useEffect(() => handleAirlineInput(airline), [airline, handleAirlineInput]);
  useEffect(() => handleDepInput(departureInput), [departureInput, handleDepInput]);
  useEffect(() => handleArrInput(arrivalInput), [arrivalInput, handleArrInput]);

  const handleAirlineSelect = (a: Airline) => {
    setAirline(`${a.name} (${a.airline_code})`);
    setAirlineCode(a.airline_code || "");
    setFlightNumber(a.airline_code ? `${a.airline_code}-` : "");
    setSuggestedAirlines([]);
  };

  const handleDepSelect = (a: Airport) => {
    setDepartureInput(`${a.name} (${a.iata || a.ident})`);
    setDepartureAirport(a);
    setSuggestedDepAirports([]);
  };

  const handleArrSelect = (a: Airport) => {
    setArrivalInput(`${a.name} (${a.iata || a.ident})`);
    setArrivalAirport(a);
    setSuggestedArrAirports([]);
  };

  const handleReset = () => {
    setAirline("");
    setAirlineCode("");
    setFlightNumber("");
    setDepartureInput("");
    setArrivalInput("");
    setDate("");
    setDepartureTime("");
    setArrivalTime("");
    setDepartureAirport(null);
    setArrivalAirport(null);
    setStatus("scheduled");
  };

  const handleBoardingPassUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanProgress(0);

    try {
      const imageUrl = URL.createObjectURL(file);
      const result = await Tesseract.recognize(imageUrl, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text" && m.progress) {
            setScanProgress(Math.round(m.progress * 100));
          }
        },
      });
      parseBoardingPassText(result.data.text);
    } catch (err) {
      console.error("OCR error:", err);
      alert("Couldn't read the boarding pass image. Try again.");
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  const parseBoardingPassText = (text: string) => {
    const clean = text.replace(/\s+/g, " ").toUpperCase();
    const flightRegex = /([A-Z0-9]{2,3})[-\s]?(\d{2,5})/;
    const iataRegex = /\b[A-Z]{3}\b/g;
    const dateRegex = /(\d{2}\s?[A-Z]{3}|\d{4}-\d{2}-\d{2})/;

    const flight = clean.match(flightRegex);
    const airportsMatch = clean.match(iataRegex);
    const dateMatch = clean.match(dateRegex);

    if (flight) {
      const [_, code, num] = flight;
      setAirlineCode(code);
      setFlightNumber(`${code}-${num}`);
      setAirline(airlines.find((a) => a.airline_code === code)?.name || `Airline ${code}`);
    }

    if (airportsMatch && airportsMatch.length >= 2) {
      setDepartureInput(airportsMatch[0]);
      setArrivalInput(airportsMatch[1]);
    }

    if (dateMatch) setDate(convertToISODate(dateMatch[0]));

    alert("✅ Boarding pass scanned and fields auto-filled!");
  };

  const convertToISODate = (raw: string) => {
    try {
      if (raw.includes("-")) return raw;
      const months: Record<string, string> = {
        JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
        JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
      };
      const [d, m] = raw.split(/\s/);
      const day = d.padStart(2, "0");
      const month = months[m];
      const year = new Date().getFullYear();
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  const handleAddFlight = async () => {
    if (!date || !departureAirport || !arrivalAirport) {
      alert("Please fill all required fields.");
      return;
    }
    setIsAdding(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return alert("You must be logged in to add a flight.");

      const body = {
        date,
        flight_number: flightNumber || "MANUAL",
        airline_name: airline || "Manual Entry",
        airline_code: airlineCode || null,
        departure: departureAirport.ident || departureAirport.iata || "N/A",
        arrival: arrivalAirport.ident || arrivalAirport.iata || "N/A",
        departure_latitude: departureAirport.latitude ?? 0,
        departure_longitude: departureAirport.longitude ?? 0,
        arrival_latitude: arrivalAirport.latitude ?? 0,
        arrival_longitude: arrivalAirport.longitude ?? 0,
        departure_time: departureTime || null,
        arrival_time: arrivalTime || null,
        status,
        user_id: userId,
      };

      const res = await fetch("/api/flights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) handleReset();
      else {
        const err = await res.json();
        alert("Error: " + (err.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error adding flight. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4 relative">
      {/* Scan Button */}
      <div className="flex justify-center">
        <Button
          className="bg-green-600 border-green-600 hover:bg-green-500 text-black rounded-full px-9 py-4 font-semibold flex items-center gap-2"
          onClick={() => document.getElementById("boardingPassInput")?.click()}
        >
          <ScanText className="w-4 h-4" /> Scan Boarding Pass
        </Button>
        <input
          id="boardingPassInput"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleBoardingPassUpload}
          className="hidden"
        />
      </div>

      {/* Divider */}
      <div className="text-center text-gray-400 font-semibold my-2">-or-</div>
      <div className="text-center text-gray-400 mb-4">Enter details manually</div>

      {/* Airline */}
      <div className="relative">
        <Label className="text-green-400 mb-1">Airline</Label>
        <Input
          value={airline}
          onChange={(e) => setAirline(e.target.value)}
          placeholder="e.g. IndiGo"
          className="bg-gray-800 text-green-100 border-gray-600 rounded-lg focus:ring-2 focus:ring-green-400"
        />
        {suggestedAirlines.length > 0 && (
          <ul className="absolute z-50 bg-gray-800 text-green-100 w-full mt-1 border border-gray-600 rounded-lg max-h-48 overflow-auto shadow-lg">
            {suggestedAirlines.map((a, i) => (
              <li
                key={i}
                className="px-3 py-2 hover:bg-green-700 cursor-pointer"
                onClick={() => handleAirlineSelect(a)}
              >
                {a.name} ({a.airline_code})
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Flight Number */}
      <div>
        <Label className="text-green-400 mb-1">Flight Number</Label>
        <Input
          value={flightNumber}
          onChange={(e) => setFlightNumber(e.target.value)}
          placeholder="e.g. 6E-6289"
          className="bg-gray-800 text-green-100 border-gray-600 rounded-lg focus:ring-2 focus:ring-green-400"
        />
      </div>

      {/* Departure & Arrival */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Label className="text-green-400 mb-1">Departure Airport</Label>
          <Input
            value={departureInput}
            onChange={(e) => setDepartureInput(e.target.value)}
            placeholder="e.g. DEL"
            className="bg-gray-800 text-green-100 border-gray-600 rounded-lg focus:ring-2 focus:ring-green-400"
          />
          {suggestedDepAirports.length > 0 && (
            <ul className="absolute z-50 bg-gray-800 text-green-100 w-full mt-1 border border-gray-600 rounded-lg max-h-48 overflow-auto shadow-lg">
              {suggestedDepAirports.map((a, i) => (
                <li
                  key={i}
                  className="px-3 py-2 hover:bg-green-700 cursor-pointer"
                  onClick={() => handleDepSelect(a)}
                >
                  {a.name} ({a.iata || a.ident})
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative">
          <Label className="text-green-400 mb-1">Arrival Airport</Label>
          <Input
            value={arrivalInput}
            onChange={(e) => setArrivalInput(e.target.value)}
            placeholder="e.g. BOM"
            className="bg-gray-800 text-green-100 border-gray-600 rounded-lg focus:ring-2 focus:ring-green-400"
          />
          {suggestedArrAirports.length > 0 && (
            <ul className="absolute z-50 bg-gray-800 text-green-100 w-full mt-1 border border-gray-600 rounded-lg max-h-48 overflow-auto shadow-lg">
              {suggestedArrAirports.map((a, i) => (
                <li
                  key={i}
                  className="px-3 py-2 hover:bg-green-700 cursor-pointer"
                  onClick={() => handleArrSelect(a)}
                >
                  {a.name} ({a.iata || a.ident})
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Date & Time */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col">
          <Label className="text-green-400 mb-1">Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-gray-800 text-green-100 border-gray-600 rounded-lg focus:ring-2 focus:ring-green-400 w-48"
          />
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col">
            <Label className="text-green-400 mb-1">Departure Time</Label>
            <Input
              type="time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="bg-gray-800 text-green-100 border-gray-600 rounded-lg focus:ring-2 focus:ring-green-400 w-32"
            />
          </div>
          <div className="flex flex-col">
            <Label className="text-green-400 mb-1">Arrival Time</Label>
            <Input
              type="time"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              className="bg-gray-800 text-green-100 border-gray-600 rounded-lg focus:ring-2 focus:ring-green-400 w-32"
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <div>
        <Label className="text-green-400 mb-1">Status</Label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-gray-800 text-green-100 border-gray-600 rounded-lg focus:ring-2 focus:ring-green-400 w-full p-2"
        >
          <option value="scheduled">Scheduled</option>
          <option value="landed">Landed</option>
        </select>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mt-2">
        <Button
          className="bg-green-600 border-green-600 hover:bg-green-500 text-black rounded-full px-6 py-4 font-semibold flex-1"
          onClick={handleAddFlight}
        >
          Add Flight
        </Button>
        <Button
          className="bg-gray-700 border-green-600 hover:bg-gray-600 text-white rounded-full px-6 py-4 font-semibold flex-0"
          onClick={handleReset}
        >
          Reset
        </Button>
      </div>

      {/* Overlay animation */}
      <AnimatePresence>
        {(isAdding || isScanning) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex flex-col justify-center items-center bg-black/70 z-50"
          >
            <FaceAlienIcon className="w-12 h-12 text-green-400 drop-shadow-xl animate-pulse" />
            <span className="text-green-400 font-bold text-lg mt-2">
              {isAdding
                ? "Inserting data..."
                : `Scanning Boarding Pass (${scanProgress}%)`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
