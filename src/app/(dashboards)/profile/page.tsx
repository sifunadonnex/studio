'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Car, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Placeholder data - Fetch from MySQL via PHP
const mockUserProfile = {
  name: 'Jane Doe',
  email: 'jane.doe@example.com',
  phone: '+254 712 345 678',
};

const mockUserVehicles = [
   { id: 'V1', make: 'Toyota', model: 'Corolla', year: '2018', nickname: 'My Sedan' },
   { id: 'V2', make: 'Nissan', model: 'X-Trail', year: '2020', nickname: 'Family SUV' },
];


export default function ProfilePage() {
    const { toast } = useToast();
    const [profile, setProfile] = useState(mockUserProfile);
    const [vehicles, setVehicles] = useState(mockUserVehicles);
    const [name, setName] = useState(profile.name);
    const [email, setEmail] = useState(profile.email); // Usually not editable, but included for completeness
    const [phone, setPhone] = useState(profile.phone);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const [loadingProfile, setLoadingProfile] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [passwordError, setPasswordError] = useState('');

     // TODO: Implement API calls
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingProfile(true);
        setProfileError('');
         console.log("Updating profile:", { name, phone }); // Email might not be updatable
         await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API
         const success = true; // Simulate success
         if (success) {
            setProfile(prev => ({ ...prev, name, phone }));
             toast({ title: "Profile Updated", description: "Your profile details have been saved." });
        } else {
             setProfileError("Failed to update profile. Please try again.");
             toast({ title: "Update Failed", variant: "destructive" });
         }
        setLoadingProfile(false);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
         if (newPassword !== confirmNewPassword) {
             setPasswordError("New passwords do not match.");
            return;
        }
        if (!currentPassword || !newPassword) {
             setPasswordError("All password fields are required.");
            return;
        }

        setLoadingPassword(true);
        console.log("Changing password...");
         await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API
         const success = true; // Simulate password change success (check current password first)
         if (success) {
             toast({ title: "Password Changed", description: "Your password has been updated successfully." });
             setCurrentPassword('');
             setNewPassword('');
            setConfirmNewPassword('');
         } else {
             setPasswordError("Failed to change password. Check your current password.");
            toast({ title: "Password Change Failed", variant: "destructive" });
        }
        setLoadingPassword(false);
    };

     // TODO: Add vehicle management functions (add, edit, delete)
     const handleAddVehicle = () => { console.log("Add vehicle"); alert("Add vehicle functionality not implemented.") };
     const handleEditVehicle = (id: string) => { console.log("Edit vehicle:", id); alert(`Edit vehicle ${id} functionality not implemented.`) };
     const handleDeleteVehicle = (id: string) => { console.log("Delete vehicle:", id); alert(`Delete vehicle ${id} functionality not implemented.`) };


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary">Profile Settings</h1>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Profile Information</CardTitle>
           <CardDescription>Update your personal details.</CardDescription>
        </CardHeader>
        <form onSubmit={handleUpdateProfile}>
           <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} required disabled={loadingProfile}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} disabled title="Email cannot be changed"/>
                    <p className="text-xs text-muted-foreground">Email cannot be changed after registration.</p>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required disabled={loadingProfile}/>
                 </div>
                {profileError && <p className="text-sm text-destructive">{profileError}</p>}
           </CardContent>
           <CardFooter>
                <Button type="submit" disabled={loadingProfile}>
                    {loadingProfile ? 'Saving...' : 'Save Profile Changes'}
                </Button>
            </CardFooter>
        </form>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Change Password</CardTitle>
           <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
         <form onSubmit={handleChangePassword}>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required disabled={loadingPassword}/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required disabled={loadingPassword}/>
                    </div>
                    <div className="space-y-2">
                         <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                         <Input id="confirm-new-password" type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} required disabled={loadingPassword}/>
                    </div>
                </div>
                {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            </CardContent>
            <CardFooter>
                 <Button type="submit" disabled={loadingPassword}>
                    {loadingPassword ? 'Changing...' : 'Change Password'}
                </Button>
            </CardFooter>
        </form>
      </Card>

       {/* My Vehicles */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
           <div>
             <CardTitle className="flex items-center gap-2"><Car className="h-5 w-5" /> My Vehicles</CardTitle>
              <CardDescription>Manage the vehicles associated with your account.</CardDescription>
           </div>
           <Button variant="outline" size="sm" onClick={handleAddVehicle}>Add New Vehicle</Button>
        </CardHeader>
        <CardContent>
           {vehicles.length > 0 ? (
                <ul className="space-y-3">
                    {vehicles.map(v => (
                         <li key={v.id} className="flex justify-between items-center border p-3 rounded-md">
                             <div>
                                <p className="font-medium">{v.nickname} ({v.make} {v.model} {v.year})</p>
                                <p className="text-xs text-muted-foreground">ID: {v.id}</p>
                             </div>
                             <div className="space-x-2">
                                 <Button variant="ghost" size="sm" onClick={() => handleEditVehicle(v.id)}>Edit</Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteVehicle(v.id)}>Delete</Button>
                            </div>
                        </li>
                    ))}
                </ul>
           ) : (
             <p className="text-muted-foreground text-center py-4">No vehicles added yet.</p>
           )}
        </CardContent>
      </Card>

    </div>
  );
}
