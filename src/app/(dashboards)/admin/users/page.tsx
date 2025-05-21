
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, UserCog, RefreshCw, Loader2, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback } from "react";
import { fetchAllUsersAction, AllUsersResponse } from '@/actions/profile'; // Updated import
import type { UserProfile } from '@/actions/auth'; // Import UserProfile type for state
import { format } from 'date-fns'; // For formatting dates


export default function AdminManageUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result: AllUsersResponse = await fetchAllUsersAction();
      if (result.success && result.users) {
        setUsers(result.users);
      } else {
        setError(result.message);
        toast({ title: "Error Fetching Users", description: result.message, variant: "destructive" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = () => {
    toast({ title: "Add User", description: "Add user functionality not implemented yet." });
  };

  const handleEditUser = (userId: string) => {
    toast({ title: "Edit User", description: `Edit user ${userId} functionality not implemented.` });
  };

  const handleDeleteUser = (userId: string) => {
    toast({ title: "Delete User", description: `Delete user ${userId} functionality not implemented.`, variant: 'destructive' });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PP'); // e.g., Oct 26, 2024
    } catch (e) {
      return dateString; // Fallback if date is not parsable
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <UserCog className="h-7 w-7" /> Manage Users
        </h1>
        <div className="flex gap-2">
            <Button variant="outline" onClick={fetchUsers} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh List'}
            </Button>
            <Button onClick={handleAddUser} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New User
            </Button>
        </div>
      </div>

      {error && !loading && (
        <Card className="bg-destructive/10 border-destructive/30">
          <CardHeader className="flex flex-row items-center gap-2 text-destructive pb-2">
            <ShieldAlert className="h-6 w-6" />
            <CardTitle>Error Loading Users</CardTitle>
          </CardHeader>
          <CardContent className="text-destructive">
            <p>{error}</p>
            <p>Please try refreshing the list or contact support if the issue persists.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>User Accounts</CardTitle>
          <CardDescription>View, edit, and manage all user accounts in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Loading users...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead>Joined On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                            user.role === 'admin' ? 'bg-red-100 text-red-700' :
                            user.role === 'staff' ? 'bg-blue-100 text-blue-700' :
                            user.role === 'customer' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700' // Fallback for undefined/other roles
                        }`}>
                            {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Unknown'}
                        </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{user.phone || 'N/A'}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditUser(user.id)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id)}>
                        <Trash2 className="h-4 w-4" />
                         <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
