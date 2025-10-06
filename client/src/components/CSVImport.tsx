import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText } from "lucide-react";
import Papa from "papaparse";

export function CSVImport() {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [flightCount, setFlightCount] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        console.log("CSV parsed:", results.data);
        setFlightCount(results.data.length);
        toast({
          title: "CSV Imported Successfully",
          description: `${results.data.length} flights have been imported.`,
        });
      },
      error: (error) => {
        console.error("CSV parse error:", error);
        toast({
          title: "Import Failed",
          description: "There was an error parsing the CSV file.",
          variant: "destructive",
        });
      },
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Import Flight History</h2>
          <p className="text-sm text-muted-foreground">Upload your Flighty CSV export</p>
        </div>
      </div>
      <div
        className={`relative rounded-md border-2 border-dashed p-12 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/20"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        data-testid="csv-dropzone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
          data-testid="input-file"
        />
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-md bg-primary/10">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-lg font-medium text-foreground">
              Drop your CSV file here
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              or click to browse
            </p>
          </div>
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            data-testid="button-browse"
          >
            Browse Files
          </Button>
        </div>
      </div>
      {fileName && (
        <div className="mt-6 rounded-md bg-muted p-4">
          <p className="text-sm font-medium text-foreground" data-testid="text-filename">
            {fileName}
          </p>
          <p className="mt-1 text-xs text-muted-foreground" data-testid="text-flight-count">
            {flightCount} flights imported
          </p>
        </div>
      )}
    </Card>
  );
}
