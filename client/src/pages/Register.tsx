"use client";

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff, createLucideIcon } from "lucide-react";
import { faceAlien } from "@lucide/lab";

import { registerUserSchema, type RegisterUser } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// Alien icon component
const FaceAlien = createLucideIcon("FaceAlien", faceAlien);

const countries = [
  "Argentina", "Australia", "Austria", "Belgium", "Brazil", "Canada", "China",
  "Denmark", "Egypt", "Finland", "France", "Germany", "Greece", "Hungary",
  "Iceland", "India", "Indonesia", "Ireland", "Israel", "Italy", "Japan",
  "Kenya", "Luxembourg", "Malaysia", "Mexico", "Morocco", "Netherlands",
  "New Zealand", "Nigeria", "Norway", "Pakistan", "Peru", "Philippines",
  "Poland", "Portugal", "Qatar", "Romania", "Russia", "Saudi Arabia",
  "Singapore", "South Africa", "South Korea", "Spain", "Sweden", "Switzerland",
  "Thailand", "Turkey", "UAE", "UK", "USA", "Vietnam"
].sort();

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterUser>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      country: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterUser) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || "Registration failed");
      return result;
    },
    onSuccess: async () => {
      toast({ title: "Account created!", description: "Welcome to ...sinceonearth 👽" });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/login");
    },
    onError: (err: any) => {
      setError(err.message || "Registration failed");
    },
  });

  const onSubmit = (data: RegisterUser) => {
    setError("");
    registerMutation.mutate(data);
  };

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center p-4 bg-background font-sans"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <div className="w-[320px] max-w-md space-y-6">
        {/* Alien Logo */}
        <div className="flex flex-col items-center mb-6 space-y-4">
          <FaceAlien className="h-24 w-24 text-green-600 animate-pulse" />
        </div>

        {/* Headings */}
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-2xl font-semibold text-white">
            Join SinceOnEarth
          </h1>
          <p className="text-xs text-white">
            Create your account to explore the galaxy 🌍
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Input
            placeholder="Full name"
            className="w-full h-14 bg-black text-white border border-white focus:border-green-500 focus:ring focus:ring-green-600"
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
          )}

          <Input
            placeholder="Username"
            className="w-full h-14 bg-black text-white border border-white focus:border-green-500 focus:ring focus:ring-green-600"
            {...form.register("username")}
          />
          {form.formState.errors.username && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.username.message}</p>
          )}

          <Input
            type="email"
            placeholder="Email"
            className="w-full h-14 bg-black text-white border border-white focus:border-green-500 focus:ring focus:ring-green-600"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>
          )}

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full h-14 bg-black text-white border border-white focus:border-green-500 focus:ring focus:ring-green-600 pr-10"
              {...form.register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:text-green-500"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            {form.formState.errors.password && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.password.message}</p>
            )}
          </div>

          <select
            {...form.register("country")}
            className="w-full h-14 rounded-md border border-white bg-black text-white px-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select your country</option>
            {countries.map((c) => (
              <option key={c} value={c} className="bg-black text-white">
                {c}
              </option>
            ))}
          </select>
          {form.formState.errors.country && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.country.message}</p>
          )}

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <Button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full h-14 bg-green-100 text-black border-2 border-green-500 hover:bg-green-200 rounded-full font-semibold"
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing up...
              </>
            ) : (
              "Sign Up"
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center text-sm space-y-4">
          <div>
            <span className="text-white">Already have an account? </span>
            <Link href="/login">
              <span className="text-green-600 hover:underline cursor-pointer">Log in</span>
            </Link>
          </div>

          <span className="inline-block px-4 py-2 rounded-full border border-green-600 text-green-600 font-semibold text-xs">
            Created by व्रज पटेल
          </span>
        </div>
      </div>
    </motion.div>
  );
}
