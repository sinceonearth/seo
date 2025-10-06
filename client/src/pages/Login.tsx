import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { loginUserSchema, type LoginUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, setAuthToken } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginUser>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      usernameOrEmail: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginUser) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: async (data: any) => {
      if (data.token) {
        setAuthToken(data.token);
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in",
      });
      setTimeout(() => {
        setLocation("/");
      }, 100);
    },
    onError: (err: Error) => {
      setError(err.message || "Login failed");
    },
  });

  const onSubmit = (data: LoginUser) => {
    setError("");
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center mb-6">
          <div className="rounded-2xl bg-white dark:bg-black p-3">
            <img src="/globe2.png" alt="SinceOnEarth" className="h-12 w-12" />
          </div>
        </div>

        <div className="text-center space-y-2 mb-8">
          <h1 className="text-2xl font-semibold" data-testid="text-login-title">
            Login to SinceOnEarth
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your flights and visualize your aviation journey
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              placeholder="Email or username"
              className="h-12"
              data-testid="input-username-email"
              {...form.register("usernameOrEmail")}
            />
            {form.formState.errors.usernameOrEmail && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.usernameOrEmail.message}
              </p>
            )}
          </div>

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="h-12 pr-10"
              data-testid="input-password"
              {...form.register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              data-testid="button-toggle-password"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
            {form.formState.errors.password && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {error && (
            <div className="text-sm text-destructive text-center" data-testid="error-message">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 bg-green-100 text-black border-2 border-green-500 hover:bg-green-200"
            disabled={loginMutation.isPending}
            data-testid="button-submit"
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Log in"
            )}
          </Button>
        </form>

        <div className="space-y-4 text-center text-sm">
          <Link href="/forgot-password">
            <span className="text-foreground hover:underline cursor-pointer" data-testid="link-forgot-password">
              Forgot password?
            </span>
          </Link>
          
          <div>
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link href="/register">
              <span className="text-foreground hover:underline cursor-pointer" data-testid="link-signup">
                Sign up
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
