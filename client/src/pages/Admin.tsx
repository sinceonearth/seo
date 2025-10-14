"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { Edit3, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";

interface User {
  id: string;
  username: string;
  email: string;
  alien: string | null;
  name: string;
  is_admin: boolean;
  created_at: string;
}

export default function Admin() {
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(false);

  // ✅ Fetch users
  const { data: users, isLoading, isError } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  // ✅ Responsive check
  useState(() => setIsMobile(window.innerWidth < 768));

  // ✅ Delete user
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${id}`);
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deleted", description: "User removed successfully." });
    },
    onError: () =>
      toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive",
      }),
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(id);
    }
  };

  // ✅ Update user (toggle admin)
  const updateUserMutation = useMutation({
    mutationFn: async (updatedUser: Partial<User>) => {
      if (!updatedUser.id) throw new Error("User ID missing");
      const res = await apiRequest(
        "PATCH",
        `/api/admin/users/${updatedUser.id}`,
        updatedUser
      );
      if (!res.ok) throw new Error("Failed to update user");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User updated", description: "Changes saved successfully." });
    },
    onError: () =>
      toast({
        title: "Error",
        description: "Failed to update user.",
        variant: "destructive",
      }),
  });

  const handleEdit = (user: User) => {
    const newStatus = !user.is_admin;
    updateUserMutation.mutate({ id: user.id, is_admin: newStatus });
  };

  if (isLoading) return <p className="text-gray-400">Loading users...</p>;
  if (isError) return <p className="text-red-400">Failed to load users.</p>;

  return (
    <div className="w-full flex flex-col gap-4">
      {isMobile ? (
        <div className="space-y-4">
          {users?.map((user) => (
            <Card
              key={user.id}
              className="bg-neutral-900 border border-green-700/40 shadow-lg rounded-2xl p-5 w-full"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    {user.name}
                    {user.alien && <span className="text-gray-400 text-sm">({user.alien})</span>}
                  </h2>
                  <p className="text-sm text-gray-400">@{user.username}</p>
                  <p className="text-sm text-gray-400">{user.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      user.is_admin
                        ? "bg-green-600/20 text-green-300 border border-green-600/40"
                        : "bg-zinc-800/60 text-gray-300 border border-zinc-700/40"
                    }`}
                  >
                    {user.is_admin ? "Admin" : "User"}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(user)}
                      size="sm"
                      className="rounded-full bg-green-700/30 border border-green-600/40 hover:bg-green-600/40 text-green-300 text-xs px-2 py-1 flex items-center gap-1"
                    >
                      <Edit3 className="h-3 w-3" /> Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(user.id)}
                      size="sm"
                      className="rounded-full bg-red-800/20 border border-red-600/30 hover:bg-red-700/40 text-red-300 text-xs px-2 py-1 flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-neutral-900 border border-green-800/40 shadow-xl rounded-2xl w-full overflow-hidden">
          <CardHeader className="border-b border-green-800/30 pb-4">
            <CardTitle className="text-green-400 text-xl font-bold">User Registry</CardTitle>
            <CardDescription className="text-gray-400">
              All registered users and their credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="bg-green-950/30 border-b border-green-800/40">
                <tr>
                  <th className="py-3 px-4 text-left text-xs text-gray-400 uppercase">Name</th>
                  <th className="py-3 px-4 text-left text-xs text-gray-400 uppercase">Username</th>
                  <th className="py-3 px-4 text-left text-xs text-gray-400 uppercase">Email</th>
                  <th className="py-3 px-4 text-right text-xs text-gray-400 uppercase">Role / Actions</th>
                  <th className="py-3 px-4 text-right text-xs text-gray-400 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user) => (
                  <tr key={user.id} className="border-b border-zinc-800/60 hover:bg-green-950/20 transition-all">
                    <td className="py-3 px-4 text-white font-medium">
                      {user.name} {user.alien && <span className="text-gray-400 text-sm">({user.alien})</span>}
                    </td>
                    <td className="py-3 px-4 text-green-400">@{user.username}</td>
                    <td className="py-3 px-4 text-gray-300">{user.email}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Badge
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            user.is_admin
                              ? "bg-green-600/20 text-green-300 border border-green-600/40"
                              : "bg-zinc-800/60 text-gray-300 border border-zinc-700/40"
                          }`}
                        >
                          {user.is_admin ? "Admin" : "User"}
                        </Badge>
                        <Button
                          onClick={() => handleEdit(user)}
                          size="sm"
                          className="rounded-full bg-green-700/30 border border-green-600/40 hover:bg-green-600/40 text-green-300 text-xs px-2 py-1 flex items-center gap-1"
                        >
                          <Edit3 className="h-3 w-3" /> Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(user.id)}
                          size="sm"
                          className="rounded-full bg-red-800/20 border border-red-600/30 hover:bg-red-700/40 text-red-300 text-xs px-2 py-1 flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </Button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-right">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
