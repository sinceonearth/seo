"use client";

import { useState, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
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

  // 🗑️ Delete flight mutation
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

  /* ------------------- Swipe handlers ------------------- */
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    if (diff < 0) setTranslateX(Math.max(diff, -100));
  };
  const handleTouchEnd = () => {
    setIsSwiping(false);
    setTranslateX(translateX < -50 ? -80 : 0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    setIsSwiping(true);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSwiping) return;
    currentX.current = e.clientX;
    const diff = currentX.current - startX.current;
    if (diff < 0) setTranslateX(Math.max(diff, -100));
  };
  const handleMouseUp = () => {
    setIsSwiping(false);
    setTranslateX(translateX < -50 ? -80 : 0);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMutation.mutate(props.id);
  };

  // Close swipe when clicking outside
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

  /* ------------------- Render ------------------- */
  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* 🗑️ Delete button background */}
      <div className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center bg-red-950/30">
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="h-full w-full flex items-center justify-center hover:bg-red-900/30 transition"
        >
          <Trash2 className="h-6 w-6 text-red-500" />
        </button>
      </div>

      {/* ✈️ Swipeable flight card */}
      <div
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isSwiping ? "none" : "transform 0.25s ease-out",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Card className="p-4 bg-background border border-border cursor-pointer">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {props.from} → {props.to}
              </h3>
              <p className="text-sm text-muted-foreground">
                {props.airlineName || props.airline} {props.flightNumber}
              </p>
              <p className="text-xs text-muted-foreground">{props.date}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm">
                {props.departureTime || "--:--"} → {props.arrivalTime || "--:--"}
              </p>
              <p
                className={`text-xs font-medium capitalize ${
                  props.status === "completed"
                    ? "text-green-400"
                    : props.status === "upcoming"
                    ? "text-blue-400"
                    : "text-red-400"
                }`}
              >
                {props.status}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
