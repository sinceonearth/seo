import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plane, Search, Check, ArrowLeft, ChevronsUpDown } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { airportCoordinates } from "@/lib/airportCoordinates";
import { getAllAirlines, getAirlineByCode } from "@/lib/airlineDatabase";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface AddFlightFormProps {
  onSuccess?: () => void;
}

const allAirlines = getAllAirlines();
const airports = Object.entries(airportCoordinates).map(([code, data]) => ({
  code,
  city: data.city,
  country: data.country,
}));

export function AddFlightForm({ onSuccess }: AddFlightFormProps = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedAirline, setSelectedAirline] = useState("");
  const [selectedAirport, setSelectedAirport] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [flightDate, setFlightDate] = useState("");
  
  const [flightData, setFlightData] = useState<any>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [useManualEntry, setUseManualEntry] = useState(false);
  
  const [manualData, setManualData] = useState({
    from: "",
    to: "",
    departureTime: "",
    arrivalTime: "",
    aircraftType: "",
  });
  
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);

  const createFlightMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/flights", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flights"] });
      toast({
        title: "Flight Added",
        description: `Your flight has been added successfully.`,
      });
      resetForm();
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add flight. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setStep(1);
    setSearchQuery("");
    setSelectedAirline("");
    setSelectedAirport("");
    setFlightNumber("");
    setFlightDate("");
    setFlightData(null);
    setUseManualEntry(false);
    setManualData({
      from: "",
      to: "",
      departureTime: "",
      arrivalTime: "",
      aircraftType: "",
    });
  };

  const handleNext = () => {
    if (step === 1 && (selectedAirline || selectedAirport)) {
      setStep(2);
    }
  };

  const handleLookupFlight = async () => {
    if (!flightNumber) {
      toast({
        title: "Missing Information",
        description: "Please enter flight number.",
        variant: "destructive",
      });
      return;
    }

    if (!flightDate) {
      toast({
        title: "Missing Information",
        description: "Please select flight date.",
        variant: "destructive",
      });
      return;
    }

    const fullFlightNumber = selectedAirline 
      ? `${selectedAirline}${flightNumber}`
      : flightNumber;

    setIsLookingUp(true);
    try {
      const res = await apiRequest("GET", `/api/flights/lookup?flightNumber=${fullFlightNumber}`);
      
      if (res.ok) {
        const data = await res.json();
        setFlightData(data);
        setStep(3);
        setUseManualEntry(false);
        toast({
          title: "Flight Found!",
          description: `${data.airlineName || data.airline} ${data.flightNumber}`,
        });
      } else {
        const error = await res.json();
        toast({
          title: "Flight Not Found",
          description: error.message || "Would you like to enter flight details manually?",
          variant: "destructive",
        });
        setUseManualEntry(true);
      }
    } catch (error) {
      toast({
        title: "Lookup Failed",
        description: "Could not fetch flight data. You can enter details manually below.",
        variant: "destructive",
      });
      setUseManualEntry(true);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSkipLookup = () => {
    if (!flightDate) {
      toast({
        title: "Missing Information",
        description: "Please select flight date before continuing.",
        variant: "destructive",
      });
      return;
    }
    setUseManualEntry(true);
  };

  const handleManualContinue = () => {
    if (!manualData.from || !manualData.to) {
      toast({
        title: "Missing Information",
        description: "Please enter at least departure and arrival airports.",
        variant: "destructive",
      });
      return;
    }
    
    const airlineInfo = getAirlineByCode(selectedAirline);
    setFlightData({
      airline: selectedAirline || "XX",
      airlineName: airlineInfo?.name || "",
      flightNumber: selectedAirline ? `${selectedAirline}${flightNumber}` : flightNumber,
      from: manualData.from,
      to: manualData.to,
      departureTime: manualData.departureTime || "",
      arrivalTime: manualData.arrivalTime || "",
      aircraftType: manualData.aircraftType || "",
    });
    setStep(3);
  };

  const handleAddFlight = () => {
    if (!flightData || !flightDate) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(flightDate);
    selectedDate.setHours(0, 0, 0, 0);
    const status = selectedDate >= today ? "upcoming" : "completed";

    const airline = flightData.airline || selectedAirline || "XX";
    const airlineInfo = getAirlineByCode(airline);
    
    const flightNum = flightData.flightNumber 
      ? flightData.flightNumber.replace(airline, '').trim()
      : flightNumber;

    createFlightMutation.mutate({
      airline,
      airlineName: flightData.airlineName || airlineInfo?.name || null,
      flightNumber: flightNum,
      from: flightData.from || "",
      to: flightData.to || "",
      date: flightDate,
      departureTime: flightData.departureTime || null,
      arrivalTime: flightData.arrivalTime || null,
      departureTerminal: null,
      arrivalTerminal: null,
      aircraftType: flightData.aircraftType || null,
      status,
    });
  };

  const filteredAirlines = allAirlines.filter(airline =>
    airline.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    airline.code.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  const filteredAirports = airports.filter(airport =>
    airport.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    airport.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    airport.country.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  const hasResults = filteredAirlines.length > 0 || filteredAirports.length > 0;
  
  const airportOptions = airports.map(airport => ({
    value: airport.code,
    label: `${airport.code} - ${airport.city}, ${airport.country}`,
  }));

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium",
            step >= 1 ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
          )}>
            {step > 1 ? <Check className="h-4 w-4" /> : "1"}
          </div>
          <div className="h-px flex-1 bg-border" />
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium",
            step >= 2 ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
          )}>
            {step > 2 ? <Check className="h-4 w-4" /> : "2"}
          </div>
          <div className="h-px flex-1 bg-border" />
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium",
            step >= 3 ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
          )}>
            3
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Search</span>
          <span>Flight Details</span>
          <span>Confirm</span>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Search for your flight</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Search by airline or airport
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search airlines or airports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>

            {searchQuery && hasResults && (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {filteredAirlines.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground px-2">AIRLINES</div>
                    {filteredAirlines.map((airline) => (
                      <button
                        key={airline.code}
                        onClick={() => {
                          setSelectedAirline(airline.code);
                          setSelectedAirport("");
                        }}
                        className={cn(
                          "w-full p-3 text-left rounded-md border hover-elevate active-elevate-2 transition-colors",
                          selectedAirline === airline.code
                            ? "bg-green-500/10 border-green-500"
                            : "bg-card border-border"
                        )}
                        data-testid={`airline-${airline.code}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Plane className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{airline.name}</div>
                              <div className="text-sm text-muted-foreground font-mono">{airline.code}</div>
                            </div>
                          </div>
                          {selectedAirline === airline.code && (
                            <Check className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {filteredAirports.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground px-2">AIRPORTS</div>
                    {filteredAirports.map((airport) => (
                      <button
                        key={airport.code}
                        onClick={() => {
                          setSelectedAirport(airport.code);
                          setSelectedAirline("");
                        }}
                        className={cn(
                          "w-full p-3 text-left rounded-md border hover-elevate active-elevate-2 transition-colors",
                          selectedAirport === airport.code
                            ? "bg-green-500/10 border-green-500"
                            : "bg-card border-border"
                        )}
                        data-testid={`airport-${airport.code}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Search className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="font-medium font-mono">{airport.code}</div>
                              <div className="text-sm text-muted-foreground">
                                {airport.city}, {airport.country}
                              </div>
                            </div>
                          </div>
                          {selectedAirport === airport.code && (
                            <Check className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {searchQuery && !hasResults && (
              <div className="text-center py-8 text-muted-foreground">
                No airlines or airports found
              </div>
            )}

            {!searchQuery && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Start typing to search</p>
              </div>
            )}
          </div>

          <Button
            onClick={handleNext}
            disabled={!selectedAirline && !selectedAirport}
            className="w-full bg-green-500 hover:bg-green-600"
            data-testid="button-next-step1"
          >
            Continue
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setStep(1)}
              data-testid="button-back-step2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold">Enter Flight Details</h3>
          </div>

          {selectedAirline && (
            <div className="p-3 bg-muted/50 rounded-md">
              <div className="text-sm text-muted-foreground">Selected Airline</div>
              <div className="font-medium">
                {allAirlines.find(a => a.code === selectedAirline)?.name} ({selectedAirline})
              </div>
            </div>
          )}

          {selectedAirport && (
            <div className="p-3 bg-muted/50 rounded-md">
              <div className="text-sm text-muted-foreground">Selected Airport</div>
              <div className="font-medium font-mono">
                {selectedAirport} - {airports.find(a => a.code === selectedAirport)?.city}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="flightNumber">
                Flight Number {selectedAirline && <span className="text-muted-foreground text-xs">(numbers only)</span>}
              </Label>
              <div className="flex gap-2">
                {selectedAirline && (
                  <div className="flex items-center px-3 py-2 bg-muted rounded-md border font-mono font-medium">
                    {selectedAirline}
                  </div>
                )}
                <Input
                  id="flightNumber"
                  placeholder={selectedAirline ? "123" : "e.g., EK225, AI123"}
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                  className="font-mono"
                  data-testid="input-flight-number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="flightDate">Flight Date</Label>
              <Input
                id="flightDate"
                type="date"
                value={flightDate}
                onChange={(e) => setFlightDate(e.target.value)}
                data-testid="input-flight-date"
              />
            </div>
          </div>

          {!useManualEntry && (
            <div className="space-y-3">
              <Button
                onClick={handleLookupFlight}
                disabled={!flightNumber || !flightDate || isLookingUp}
                className="w-full bg-green-500 hover:bg-green-600"
                data-testid="button-lookup-flight"
              >
                {isLookingUp ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Looking up flight...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Lookup Flight
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleSkipLookup}
                disabled={!flightDate}
                className="w-full"
                data-testid="button-skip-lookup"
              >
                Skip & Enter Manually
              </Button>
            </div>
          )}

          {useManualEntry && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Manual Entry</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUseManualEntry(false)}
                  data-testid="button-cancel-manual"
                >
                  Cancel
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>From (Airport)</Label>
                  <Popover open={openFrom} onOpenChange={setOpenFrom}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-mono"
                        data-testid="select-from"
                      >
                        {manualData.from
                          ? airportOptions.find((a) => a.value === manualData.from)?.label
                          : "Select airport..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Search airport..." />
                        <CommandList>
                          <CommandEmpty>No airport found.</CommandEmpty>
                          <CommandGroup>
                            {airportOptions.map((airport) => (
                              <CommandItem
                                key={airport.value}
                                value={airport.value}
                                onSelect={(value) => {
                                  setManualData({ ...manualData, from: value.toUpperCase() });
                                  setOpenFrom(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    manualData.from === airport.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="font-mono">{airport.label}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>To (Airport)</Label>
                  <Popover open={openTo} onOpenChange={setOpenTo}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-mono"
                        data-testid="select-to"
                      >
                        {manualData.to
                          ? airportOptions.find((a) => a.value === manualData.to)?.label
                          : "Select airport..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Search airport..." />
                        <CommandList>
                          <CommandEmpty>No airport found.</CommandEmpty>
                          <CommandGroup>
                            {airportOptions.map((airport) => (
                              <CommandItem
                                key={airport.value}
                                value={airport.value}
                                onSelect={(value) => {
                                  setManualData({ ...manualData, to: value.toUpperCase() });
                                  setOpenTo(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    manualData.to === airport.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="font-mono">{airport.label}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="departureTime">Departure (Optional)</Label>
                    <Input
                      id="departureTime"
                      type="time"
                      value={manualData.departureTime}
                      onChange={(e) => setManualData({ ...manualData, departureTime: e.target.value })}
                      className="font-mono"
                      data-testid="input-departure-time"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="arrivalTime">Arrival (Optional)</Label>
                    <Input
                      id="arrivalTime"
                      type="time"
                      value={manualData.arrivalTime}
                      onChange={(e) => setManualData({ ...manualData, arrivalTime: e.target.value })}
                      className="font-mono"
                      data-testid="input-arrival-time"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aircraftType">Aircraft Type (Optional)</Label>
                  <Input
                    id="aircraftType"
                    placeholder="e.g., Airbus A320"
                    value={manualData.aircraftType}
                    onChange={(e) => setManualData({ ...manualData, aircraftType: e.target.value })}
                    data-testid="input-aircraft-type"
                  />
                </div>
              </div>

              <Button
                onClick={handleManualContinue}
                disabled={!manualData.from || !manualData.to}
                className="w-full"
                data-testid="button-manual-continue"
              >
                Continue
              </Button>
            </div>
          )}
        </div>
      )}

      {step === 3 && flightData && flightDate && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setStep(2)}
              data-testid="button-back-step3"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold">Confirm Flight Details</h3>
          </div>

          <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <div className="text-sm text-muted-foreground">Airline</div>
                <div className="font-semibold text-lg">{flightData.airlineName || flightData.airline || 'Unknown'}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Flight Number</div>
                <div className="font-mono font-semibold text-lg">{flightData.flightNumber || `${selectedAirline}${flightNumber}`}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-center">
              <div>
                <div className="text-sm text-muted-foreground">From</div>
                <div className="font-mono font-bold text-2xl">{flightData.from || 'N/A'}</div>
                {flightData.fromAirport && (
                  <div className="text-xs text-muted-foreground">{flightData.fromAirport}</div>
                )}
                {flightData.departureTime && (
                  <div className="text-sm font-medium mt-1">{flightData.departureTime}</div>
                )}
              </div>

              <div className="flex justify-center">
                <Plane className="h-6 w-6 text-green-500 rotate-90" />
              </div>

              <div className="text-right">
                <div className="text-sm text-muted-foreground">To</div>
                <div className="font-mono font-bold text-2xl">{flightData.to || 'N/A'}</div>
                {flightData.toAirport && (
                  <div className="text-xs text-muted-foreground">{flightData.toAirport}</div>
                )}
                {flightData.arrivalTime && (
                  <div className="text-sm font-medium mt-1">{flightData.arrivalTime}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t">
              <div>
                <div className="text-sm text-muted-foreground">Date</div>
                <div className="font-medium">{new Date(flightDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}</div>
              </div>
              {flightData.aircraftType && (
                <div>
                  <div className="text-sm text-muted-foreground">Aircraft</div>
                  <div className="font-medium">{flightData.aircraftType}</div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              className="flex-1"
              data-testid="button-edit-flight"
            >
              Edit Details
            </Button>
            <Button
              onClick={handleAddFlight}
              disabled={createFlightMutation.isPending}
              className="flex-1 bg-green-500 hover:bg-green-600"
              data-testid="button-add-trip"
            >
              {createFlightMutation.isPending ? "Adding..." : "Add Trip"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
