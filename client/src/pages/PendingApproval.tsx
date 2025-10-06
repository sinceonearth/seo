import { Link } from "wouter";
import { Clock, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function PendingApproval() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-500/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-orange-500/10 p-3">
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center" data-testid="text-pending-title">
            Account Pending Approval
          </CardTitle>
          <CardDescription className="text-center" data-testid="text-pending-message">
            Your account is currently waiting for admin approval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-orange-500/10 p-4 text-sm">
            <p className="font-medium text-orange-600 dark:text-orange-400 mb-2">
              What does this mean?
            </p>
            <p className="text-muted-foreground">
              An administrator needs to review and approve your account before you can access the SinceOnEarth flight tracker. You'll be able to log in and start tracking your flights once your account is approved.
            </p>
          </div>
          
          <div className="rounded-md bg-muted p-4 text-sm">
            <p className="font-medium mb-2">Next Steps:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Wait for admin approval notification</li>
              <li>Check back later to see if your account is approved</li>
              <li>Contact support if you have questions</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => logout()}
              variant="default"
              className="w-full"
              data-testid="button-logout"
            >
              Log Out
            </Button>
            <Link href="/">
              <Button variant="outline" className="w-full" data-testid="button-back-home">
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
