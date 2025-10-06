import { Plane, Globe2, MapPin, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 to-background"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-500/10 p-4">
              <Globe2 className="h-16 w-16 text-green-500" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-6">
            SinceOnEarth
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Track your flight history, visualize your travel routes on an interactive 3D globe, 
            and discover your aviation journey statistics.
          </p>
          <Button
            size="lg"
            className="bg-green-100 text-black border-2 border-green-500 hover:bg-green-200"
            onClick={() => {
              document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' });
            }}
            data-testid="button-get-started"
          >
            <Plane className="mr-2 h-5 w-5" />
            Get Started
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card data-testid="card-feature-globe">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-green-500/10 p-3 mb-4">
                  <Globe2 className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  3D Globe Visualization
                </h3>
                <p className="text-muted-foreground">
                  See all your flight routes displayed on a beautiful interactive 3D globe
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-feature-stats">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-green-500/10 p-3 mb-4">
                  <Award className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Travel Statistics
                </h3>
                <p className="text-muted-foreground">
                  Track your total flights, airlines, airports, and countries visited
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-feature-timeline">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-green-500/10 p-3 mb-4">
                  <MapPin className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Flight Timeline
                </h3>
                <p className="text-muted-foreground">
                  Browse your complete flight history organized chronologically
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div id="cta" className="py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Track Your Flights?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Create your account to start visualizing your aviation journey
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-green-100 text-black border-2 border-green-500 hover:bg-green-200"
                data-testid="button-cta-signup"
              >
                Sign up
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                data-testid="button-cta-login"
              >
                Log in
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} SinceOnEarth. created by व्रज पटेल
          </p>
        </div>
      </footer>
    </div>
  );
}
