import { useQuery } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt: string;
}

export default function Admin() {
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading admin data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-full bg-primary/10 p-2">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold" data-testid="heading-admin">Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground">
          Manage users and view platform statistics
        </p>
      </div>

      {/* Users Table */}
      <Card data-testid="card-users-table">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            View and manage all registered users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Username</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Role</th>
                  <th className="text-left py-3 px-4 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user) => (
                  <tr 
                    key={user.id} 
                    className="border-b hover-elevate"
                    data-testid={`row-user-${user.id}`}
                  >
                    <td className="py-3 px-4" data-testid={`text-name-${user.id}`}>
                      {user.name}
                    </td>
                    <td className="py-3 px-4" data-testid={`text-username-${user.id}`}>
                      {user.username}
                    </td>
                    <td className="py-3 px-4" data-testid={`text-email-${user.id}`}>
                      {user.email}
                    </td>
                    <td className="py-3 px-4" data-testid={`text-role-${user.id}`}>
                      {user.isAdmin ? (
                        <span className="inline-flex items-center gap-1 text-primary">
                          <Shield className="h-3 w-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="text-muted-foreground">User</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground" data-testid={`text-date-${user.id}`}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
