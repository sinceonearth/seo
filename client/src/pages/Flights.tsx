import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Upload, RefreshCw } from "lucide-react";
import { FlightTimeline } from "@/components/FlightTimeline";
import { AddFlightForm } from "@/components/AddFlightForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Papa from "papaparse";
import type { Flight, Airline } from "@shared/schema";

export default function Flights() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const { toast } = useToast();
  
  const { data: flights = [], isLoading, refetch } = useQuery<Flight[]>({
    queryKey: ["/api/flights"],
  });

  const { data: airlines = [] } = useQuery<Airline[]>({
    queryKey: ["/api/airlines"],
  });

  const importMutation = useMutation({
    mutationFn: async (flights: any[]) => {
      const res = await apiRequest("POST", "/api/flights/bulk", { flights });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/flights"] });
      const flightCount = Array.isArray(data) ? data.length : 0;
      toast({
        title: "Import Successful",
        description: `${flightCount} flights have been imported successfully.`,
      });
      setShowImportDialog(false);
    },
    onError: () => {
      toast({
        title: "Import Failed",
        description: "There was an error importing your flights. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const parsedFlights = results.data
          .filter((row: any) => row.Date && row.From && row.To)
          .map((row: any) => {
            const flightDate = new Date(row.Date);
            flightDate.setHours(0, 0, 0, 0);
            const status = flightDate >= today ? "upcoming" : "completed";
            
            // Handle both Flighty CSV format and generic format
            const csvAirlineCode = row["Airline"] || "";
            const flightNum = row["Flight Number"] || row["Flight"] || "";
            
            // Lookup airline info from database (Flighty uses ICAO codes, we need IATA)
            const airlineInfo = airlines.find(a => 
              a.code === csvAirlineCode || a.icao === csvAirlineCode
            );
            const airlineCode = airlineInfo?.code || csvAirlineCode || "XX";
            const airlineName = airlineInfo?.name || null;
            
            // Extract times from scheduled fields (Flighty format uses ISO timestamps)
            let departureTime = row["Departure Time"] || null;
            let arrivalTime = row["Arrival Time"] || null;
            
            // Flighty CSV: Extract time from "Gate Departure (Scheduled)" or "Gate Arrival (Scheduled)"
            if (!departureTime && row["Gate Departure (Scheduled)"]) {
              const depTime = new Date(row["Gate Departure (Scheduled)"]);
              if (!isNaN(depTime.getTime())) {
                departureTime = `${String(depTime.getHours()).padStart(2, '0')}:${String(depTime.getMinutes()).padStart(2, '0')}`;
              }
            }
            
            if (!arrivalTime && row["Gate Arrival (Scheduled)"]) {
              const arrTime = new Date(row["Gate Arrival (Scheduled)"]);
              if (!isNaN(arrTime.getTime())) {
                arrivalTime = `${String(arrTime.getHours()).padStart(2, '0')}:${String(arrTime.getMinutes()).padStart(2, '0')}`;
              }
            }
            
            // Aircraft type from either "Aircraft" or "Aircraft Type Name"
            const aircraftType = row["Aircraft"] || row["Aircraft Type Name"] || null;
            
            // Terminal information
            const departureTerminal = row["Dep Terminal"] || row["Departure Terminal"] || null;
            const arrivalTerminal = row["Arr Terminal"] || row["Arrival Terminal"] || null;
            
            return {
              date: row.Date,
              airline: airlineCode || "XX",
              airlineName,
              flightNumber: flightNum,
              from: row.From,
              to: row.To,
              departureTime,
              arrivalTime,
              departureTerminal,
              arrivalTerminal,
              aircraftType,
              status,
            };
          });

        if (parsedFlights.length === 0) {
          toast({
            title: "No Flights Found",
            description: "The CSV file contains no valid flight data.",
            variant: "destructive",
          });
          return;
        }

        importMutation.mutate(parsedFlights);
      },
      error: (error) => {
        console.error("CSV parse error:", error);
        toast({
          title: "Parse Error",
          description: "There was an error parsing the CSV file.",
          variant: "destructive",
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading your flights...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 px-6 py-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Trip History</h1>
          <p className="mt-2 text-muted-foreground">
            All your trips in chronological order
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowImportDialog(true)}
            data-testid="button-import-csv"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button
            className="bg-green-100 text-black border-2 border-green-500 hover:bg-green-200"
            onClick={() => setShowAddDialog(true)}
            data-testid="button-add-flight"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Flight
          </Button>
        </div>
      </div>

      <FlightTimeline flights={flights} />

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Flight</DialogTitle>
            <DialogDescription>
              Manually add a flight to your history
            </DialogDescription>
          </DialogHeader>
          <AddFlightForm onSuccess={() => setShowAddDialog(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Flights from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with your flight history
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop your CSV file here, or click to browse
              </p>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                id="csv-upload"
                data-testid="input-csv-file"
                onChange={handleCSVUpload}
              />
              <label htmlFor="csv-upload">
                <Button variant="outline" asChild>
                  <span>Choose File</span>
                </Button>
              </label>
            </div>
            <div className="text-xs text-muted-foreground">
              <p className="font-semibold mb-1">CSV Format:</p>
              <p>Date, Airline, Flight Number, From, To, Departure Time, Arrival Time, Aircraft</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
