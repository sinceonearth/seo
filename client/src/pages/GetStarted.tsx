"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Globe,
  Plane,
  Ruler,
  Building2,
  TowerControl,
  Apple,
} from "lucide-react";

const slides = [
  {
    id: 1,
    title: "Track Your Adventures",
    text: "Log every journey you take across cities, countries, and continents — with an interactive world view.",
  },
  {
    id: 2,
    title: (
      <>
        Earn as you <br /> Explore
      </>
    ),
    text: "Collect country stamps, explore your flight stats, and watch your travel story unfold beautifully.",
  },
  {
    id: 3,
    title: "Visualize Your Journey",
    text: "See your total flights, kilometers, and destinations all in one place like your own cosmic travel log.",
  },
];

const icons = [
  { icon: Globe, color: "#a855f7" },
  { icon: Plane, color: "#22c55e" },
  { icon: Ruler, color: "#eab308" },
  { icon: TowerControl, color: "#6366f1" },
  { icon: Building2, color: "#38bdf8" },
];

export default function GetStarted() {
  const [, navigate] = useLocation();
  const [index, setIndex] = useState(0);
  const [iconIndex, setIconIndex] = useState(0);

  useEffect(() => {
    const textInterval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4500);

    const iconInterval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % icons.length);
    }, 1000);

    return () => {
      clearInterval(textInterval);
      clearInterval(iconInterval);
    };
  }, []);

  const slide = slides[index];
  const CurrentIcon = icons[iconIndex].icon;
  const iconColor = icons[iconIndex].color;

  return (
    <motion.div
      className="min-h-screen w-full flex flex-col items-center justify-between bg-black text-white px-6 pt-24 pb-10 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
      }}
    >
      {/* Slide Text */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-md mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-br from-green-400 to-green-600 bg-clip-text text-transparent whitespace-pre-line">
            {slide.title}
          </h1>
          <p className="text-neutral-400 text-lg leading-relaxed">{slide.text}</p>
        </motion.div>
      </AnimatePresence>

      {/* Icon Container with fixed height to prevent jumping */}
      <div className="mb-16 h-36 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={iconIndex}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <CurrentIcon
              className="w-28 h-28 md:w-28 md:h-28"
              style={{ color: iconColor }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-md bg-white text-black p-6 space-y-5 shadow-xl rounded-3xl border border-gray-200"
      >
        <button
          onClick={() => navigate("/register")}
          className="w-full bg-black text-white text-lg font-semibold py-4 rounded-full"
        >
          Create new account
        </button>

        <div
          onClick={() => navigate("/login")}
          className="text-center text-sm underline text-gray-600 cursor-pointer select-none"
        >
          I already have an account
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-gray-300" />
          <div className="text-xs text-gray-500">OR</div>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        <button className="w-full border border-green-600 text-black text-md font-medium py-4 rounded-full flex items-center justify-center gap-2">
          Continue as Guest
        </button>
      </motion.div>
    </motion.div>
  );
}
