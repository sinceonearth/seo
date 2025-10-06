import { useState, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { FlightCard } from "./FlightCard";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SwipeableFlightCardProps {
  id: string;
  flightNumber: string;
  airline: string;
  airlineName?: string;
  from: string;
  to: string;
  date: string;
  departureTime?: string;
  arrivalTime?: string;
  aircraftType?: string;
  status: "completed" | "upcoming" | "cancelled";
}

export function SwipeableFlightCard(props: SwipeableFlightCardProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/flights/${id}`);
      if (!res.ok) throw new Error("Failed to delete flight");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flights"] });
      toast({
        title: "Flight deleted",
        description: "The flight has been removed from your history.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete flight. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    // Only allow left swipe (negative diff)
    if (diff < 0) {
      setTranslateX(Math.max(diff, -100));
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    
    // If swiped more than 50px, keep it open at -80px, otherwise reset
    if (translateX < -50) {
      setTranslateX(-80);
    } else {
      setTranslateX(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    setIsSwiping(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSwiping) return;
    
    currentX.current = e.clientX;
    const diff = currentX.current - startX.current;
    
    // Only allow left swipe (negative diff)
    if (diff < 0) {
      setTranslateX(Math.max(diff, -100));
    }
  };

  const handleMouseUp = () => {
    setIsSwiping(false);
    
    // If swiped more than 50px, keep it open at -80px, otherwise reset
    if (translateX < -50) {
      setTranslateX(-80);
    } else {
      setTranslateX(0);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMutation.mutate(props.id);
  };

  // Close swipe on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setTranslateX(0);
      }
    };

    if (translateX < 0) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [translateX]);

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden"
      data-testid={`swipeable-flight-card-${props.flightNumber}`}
    >
      {/* Delete button */}
      <div className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center">
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="h-full w-full flex items-center justify-center"
          data-testid={`button-delete-${props.flightNumber}`}
        >
          <Trash2 className="h-6 w-6 text-muted-foreground" />
        </button>
      </div>

      {/* Swipeable card */}
      <div
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isSwiping ? "none" : "transform 0.3s ease-out",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <FlightCard {...props} />
      </div>
    </div>
  );
}
