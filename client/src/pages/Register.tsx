import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { registerUserSchema, type RegisterUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { countries } from "@/lib/countries";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [error, setError] = useState("");

  const form = useForm<RegisterUser>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      name: "",
      country: "",
    },
  });

  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterUser) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return res.json();
    },
    onSuccess: () => {
      setRegistrationSuccess(true);
      toast({
        title: "Account created successfully!",
        description: "You can now log in to the app.",
      });
    },
    onError: (err: Error) => {
      setError(err.message || "Registration failed");
    },
  });

  const onSubmit = (data: RegisterUser) => {
    setError("");
    registerMutation.mutate(data);
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center justify-center mb-6">
            <div className="rounded-2xl bg-white dark:bg-black p-3">
              <img src="/globe2.png" alt="SinceOnEarth" className="h-12 w-12" />
            </div>
          </div>

          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold" data-testid="text-success-title">
              Registration Successful!
            </h1>
            <p className="text-sm text-muted-foreground" data-testid="text-success-message">
              Your account has been created successfully. You can now log in to the app.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/login">
              <Button 
                className="w-full h-12 bg-green-100 text-black border-2 border-green-500 hover:bg-green-200"
                data-testid="button-login-now"
              >
                Log In Now
              </Button>
            </Link>
            <Link href="/">
              <Button 
                variant="outline"
                className="w-full h-12" 
                data-testid="button-back-to-home"
              >
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center mb-6">
          <div className="rounded-2xl bg-white dark:bg-black p-3">
            <img src="/globe2.png" alt="SinceOnEarth" className="h-12 w-12" />
          </div>
        </div>

        <div className="text-center space-y-2 mb-8">
          <h1 className="text-2xl font-semibold" data-testid="text-register-title">
            Sign up
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your details to get started with SinceOnEarth
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              placeholder="Full Name"
              className="h-12"
              data-testid="input-name"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Input
              placeholder="Username"
              className="h-12"
              data-testid="input-username"
              {...form.register("username")}
            />
            {form.formState.errors.username && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.username.message}
              </p>
            )}
          </div>

          <div>
            <Input
              type="email"
              placeholder="Email"
              className="h-12"
              data-testid="input-email"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Select 
              onValueChange={(value) => form.setValue("country", value)}
              value={form.watch("country")}
            >
              <SelectTrigger className="h-12" data-testid="select-country">
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.country && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.country.message}
              </p>
            )}
          </div>

          <div>
            <Input
              type="password"
              placeholder="Password"
              className="h-12"
              data-testid="input-password"
              {...form.register("password")}
            />
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
            disabled={registerMutation.isPending}
            data-testid="button-submit"
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Sign up"
            )}
          </Button>
        </form>

        <div className="space-y-4 text-center text-sm">
          <div>
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login">
              <span className="text-foreground hover:underline cursor-pointer" data-testid="link-login">
                Log in
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
