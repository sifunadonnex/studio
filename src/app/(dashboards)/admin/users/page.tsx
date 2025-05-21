
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

// Placeholder user data - in a real app, fetch from Firestore
interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'staff' | 'admin';
  createdAt: string; // Or Date object
}

const mockUsers: User[] = [
  { id: 'usr_001', name: 'Alice Wonderland', email: 'alice@example.com', role: 'customer', createdAt: '2024-01-15' },
  { id: 'usr_002', name: 'Bob The Builder', email: 'bob@example.com', role: 'staff', createdAt: '2024-02-20' },
  { id: 'usr_003', name: 'Charlie Admin', email: 'charlie@topautocorrect.co.ke', role: 'admin', createdAt: '2023-12-01' },
  { id: 'usr_004', name: 'Diana Prince', email: 'diana@example.com', role: 'customer', createdAt: '2024-03-10' },
];

export default function AdminManageUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [loading, setLoading] = useState(false);

  // TODO: Implement actual user fetching from Firestore

  const handleAddUser = () => {
    // TODO: Implement add user modal/form
    toast({ title: "Add User", description: "Add user functionality not implemented yet." });
  };

  const handleEditUser = (userId: string) => {
    // TODO: Implement edit user modal/form
    toast({ title: "Edit User", description: `Edit user ${userId} functionality not implemented.` });
  };

  const handleDeleteUser = (userId: string) => {
    // TODO: Implement delete user logic
    // setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    toast({ title: "Delete User", description: `Delete user ${userId} functionality not implemented.`, variant: 'destructive' });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <UserCog className="h-7 w-7" /> Manage Users
        </h1>
        <Button onClick={handleAddUser} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Accounts</CardTitle>
          <CardDescription>View, edit, and manage all user accounts in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading users...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
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
                            'bg-green-100 text-green-700'
                        }`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                    </TableCell>
                    <TableCell>{user.createdAt}</TableCell>
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
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
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
