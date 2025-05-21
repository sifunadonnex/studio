
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, UserCog, RefreshCw, Loader2, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback } from "react";
import { fetchAllUsersAction, AllUsersResponse, updateUserByAdminAction, UpdateUserByAdminInput, ProfileResponse } from '@/actions/profile';
import type { UserProfile } from '@/actions/auth';
import { format } from 'date-fns';


export default function AdminManageUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userForm, setUserForm] = useState<Omit<UpdateUserByAdminInput, 'userId'>>({ name: '', role: 'customer', phone: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);


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

  const openUserDialog = (user: UserProfile | null = null) => {
    setFormErrors({});
    if (user) {
        setEditingUser(user);
        setUserForm({
            name: user.name || '',
            role: user.role || 'customer',
            phone: user.phone || null, // Ensure null if empty
        });
    } else {
        setEditingUser(null);
        // For "Add User", you might want different defaults or a separate form
        // This dialog is currently focused on editing
        setUserForm({ name: '', role: 'customer', phone: null });
        toast({ title: "Add User", description: "Add user functionality not fully implemented yet. This dialog is for editing." });
        return; // Or open a specific "Add User" dialog
    }
    setIsUserDialogOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: 'customer' | 'staff' | 'admin') => {
    setUserForm(prev => ({ ...prev, role: value }));
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return; // Should not happen if dialog is for editing

    setFormErrors({});
    setActionLoading(true);

    const userData: UpdateUserByAdminInput = {
        userId: editingUser.id,
        name: userForm.name,
        role: userForm.role,
        phone: userForm.phone || null, // Ensure null for empty string
    };
    
    // Zod schema for UpdateUserByAdminInput is in `profile.ts`
    // Client-side validation can be added here too if desired, using the schema

    try {
        const result: ProfileResponse = await updateUserByAdminAction(userData);
        if (result.success) {
            toast({ title: "User Updated", description: result.message });
            setIsUserDialogOpen(false);
            fetchUsers(); // Refresh the list
        } else {
            // If server-side validation fails, it might return specific field errors
            // For simplicity, showing a general message here.
            toast({ title: "Update Failed", description: result.message, variant: "destructive" });
            if (result.message && result.message.startsWith("Validation failed:")) {
                // Basic error parsing, can be improved
                setFormErrors({ general: result.message });
            }
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : "Could not update user.";
        toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
        setActionLoading(false);
    }
  };


  const handleDeleteUser = (userId: string) => {
    // Implement optimistic update or re-fetch after server action
    toast({ title: "Delete User", description: `Delete user ${userId} functionality not fully implemented.`, variant: 'destructive' });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PP');
    } catch (e) {
      return dateString;
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
            <Button onClick={() => openUserDialog(null)} className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New User (Disabled)
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
                  <TableHead className="hidden lg:table-cell">Joined On</TableHead>
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
                            'bg-gray-100 text-gray-700'
                        }`}>
                            {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Unknown'}
                        </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{user.phone || 'N/A'}</TableCell>
                    <TableCell className="hidden lg:table-cell">{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openUserDialog(user)} disabled={actionLoading}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id)} disabled> {/* Delete disabled for now */}
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

      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Edit User: {editingUser?.name}</DialogTitle>
                <DialogDescription>
                    Update the user's details. Email cannot be changed.
                </DialogDescription>
            </DialogHeader>
            {editingUser && (
                <form onSubmit={handleSaveUser} className="grid gap-4 py-4">
                    <div className="space-y-1">
                        <Label htmlFor="edit-name">Full Name</Label>
                        <Input id="edit-name" name="name" value={userForm.name} onChange={handleFormChange} disabled={actionLoading} />
                        {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="edit-email">Email (Read-only)</Label>
                        <Input id="edit-email" name="email" value={editingUser.email} disabled readOnly />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="edit-phone">Phone Number</Label>
                        <Input id="edit-phone" name="phone" type="tel" value={userForm.phone || ''} onChange={handleFormChange} disabled={actionLoading} placeholder="e.g., +2547XX XXX XXX"/>
                        {formErrors.phone && <p className="text-xs text-destructive">{formErrors.phone}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="edit-role">Role</Label>
                        <Select value={userForm.role} onValueChange={handleRoleChange} disabled={actionLoading}>
                            <SelectTrigger id="edit-role">
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="customer">Customer</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        {formErrors.role && <p className="text-xs text-destructive">{formErrors.role}</p>}
                    </div>
                    {formErrors.general && <p className="text-sm text-destructive">{formErrors.general}</p>}
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline" disabled={actionLoading}>Cancel</Button></DialogClose>
                        <Button type="submit" disabled={actionLoading}>
                            {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
