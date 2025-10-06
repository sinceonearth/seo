import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { getQueryFn, clearAuthToken, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useAuth() {
  const [, navigate] = useLocation();
  
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const logout = () => {
    clearAuthToken();
    queryClient.setQueryData(["/api/auth/user"], null);
    navigate("/");
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}
