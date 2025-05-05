'use client';

import { useState, useEffect, useCallback } from 'react';

interface UserInfo {
    id: string;
    name: string;
    email: string;
    role: 'customer' | 'staff' | 'admin';
    phone?: string; // Add optional phone number
}

interface SessionState {
    isLoggedIn: boolean;
    user: UserInfo | null;
}

interface UseSessionReturn {
    session: SessionState | null;
    loading: boolean;
    refreshSession: () => void; // Function to manually re-check session
}

/**
 * Client-side hook to check for the presence and basic validity of the session cookie.
 * **Note:** This hook ONLY checks if the cookie exists on the client.
 * It DOES NOT guarantee the session is still valid on the server.
 * For critical actions or loading sensitive data, always re-validate the session
 * on the server (e.g., in Server Components, Route Handlers, or Server Actions).
 *
 * @returns An object containing the session state (`isLoggedIn`, `user` details if found), a loading indicator, and a refresh function.
 */
export function useSession(): UseSessionReturn {
    const [session, setSession] = useState<SessionState | null>(null);
    const [loading, setLoading] = useState(true);

    const checkSession = useCallback(() => {
        // console.log("useSession: Checking session..."); // Debug log
        setLoading(true);
        try {
            const sessionCookie = document.cookie
                .split('; ')
                .find((row) => row.startsWith('session='));

            if (sessionCookie) {
                const cookieValue = sessionCookie.split('=')[1];
                if (cookieValue) {
                    const decodedValue = decodeURIComponent(cookieValue);
                    const parsedSession: Partial<UserInfo & { userId: string, loggedInAt: number }> = JSON.parse(decodedValue);
                    // console.log("useSession: Parsed cookie data:", parsedSession); // Debug log

                    // Basic validation: check for essential fields
                    if (parsedSession.userId && parsedSession.email && parsedSession.role && parsedSession.loggedInAt) {
                         // Optional: Check if loggedInAt is reasonably recent? (Simple client-side expiry check)
                         // const maxAge = 7 * 24 * 60 * 60 * 1000; // 1 week in ms
                         // if (Date.now() - parsedSession.loggedInAt > maxAge) {
                         //    console.log("useSession: Session cookie expired based on loggedInAt.");
                         //    setSession({ isLoggedIn: false, user: null });
                         //    document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;'; // Clear expired cookie
                         // } else {

                            const userInfo: UserInfo = {
                                id: parsedSession.userId,
                                name: parsedSession.name || 'User',
                                email: parsedSession.email,
                                role: parsedSession.role,
                                phone: parsedSession.phone || undefined, // Include phone if present
                            };
                            // console.log("useSession: Session valid, user:", userInfo); // Debug log
                            setSession({ isLoggedIn: true, user: userInfo });
                         // }
                    } else {
                        // Cookie exists but is malformed or missing data
                        console.warn('useSession: Session cookie found but malformed or missing required fields.');
                        setSession({ isLoggedIn: false, user: null });
                         // Clear the malformed cookie
                         document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
                    }
                } else {
                     // Cookie exists but has no value
                      console.log("useSession: Session cookie found but has no value.");
                     setSession({ isLoggedIn: false, user: null });
                     document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;'; // Clear empty cookie
                }
            } else {
                // No session cookie found
                // console.log("useSession: No session cookie found.");
                setSession({ isLoggedIn: false, user: null });
            }
        } catch (error) {
            console.error("useSession: Error parsing session cookie:", error);
            setSession({ isLoggedIn: false, user: null });
             // Clear the invalid cookie
             document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
        } finally {
            setLoading(false);
             // console.log("useSession: Check finished, loading set to false."); // Debug log
        }
    }, []); // useCallback dependency array is empty as it doesn't depend on external state/props

    useEffect(() => {
        checkSession(); // Check on initial mount

         // Re-check session when window gains focus (e.g., user switches back to the tab)
         // This helps catch logout events from other tabs more quickly.
         window.addEventListener('focus', checkSession);

         // Clean up listener on unmount
         return () => {
             window.removeEventListener('focus', checkSession);
         };

    }, [checkSession]); // Re-run effect if checkSession function identity changes (shouldn't with useCallback)

    return { session, loading, refreshSession: checkSession };
}]]></content>
  </change>
   <change>
    <file>src/app/(dashboards)/profile/page.tsx</file>
    <description>Convert profile page to use `useSession` hook for user data and implement update actions (simulation).</description>
    <content><![CDATA{'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Car, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSession } from '@/hooks/use-session'; // Import session hook
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

// Placeholder: Assume server actions exist for updates
// import { updateProfileAction, changePasswordAction, manageVehicleAction } from '@/actions/profile';

// Mock data for vehicles until fetched
const mockUserVehicles = [
   { id: 'V1', make: 'Toyota', model: 'Corolla', year: '2018', nickname: 'My Sedan' },
   { id: 'V2', make: 'Nissan', model: 'X-Trail', year: '2020', nickname: 'Family SUV' },
];

export default function ProfilePage() {
    const { toast } = useToast();
    const { session, loading: sessionLoading, refreshSession } = useSession();
    const [vehicles, setVehicles] = useState(mockUserVehicles); // TODO: Fetch user vehicles

    // Form state for profile update
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState(''); // Email display only

    // Form state for password change
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    // Loading and error states
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [loadingVehicles, setLoadingVehicles] = useState(false); // Add loading state for vehicles
    const [profileError, setProfileError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // Populate form fields when session data loads
    useEffect(() => {
        if (session?.isLoggedIn && session.user) {
            setName(session.user.name || '');
            setEmail(session.user.email || ''); // Email is usually not editable
            setPhone(session.user.phone || '');
        }
    }, [session]);

    // --- Action Handlers (Simulated) ---

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.isLoggedIn) return; // Should not happen if page is protected

        setLoadingProfile(true);
        setProfileError('');
        console.log("Updating profile:", { userId: session.user?.id, name, phone });

        try {
            // --- Simulate Server Action Call ---
            // const result = await updateProfileAction({ userId: session.user.id, name, phone });
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API
            const success = true; // Simulate success
            const result = { success, message: success ? "Profile updated successfully." : "Failed to update profile." };
            // --- End Simulation ---

            if (result.success) {
                toast({ title: "Profile Updated", description: result.message });
                refreshSession(); // Refresh session data to reflect changes potentially stored in cookie
            } else {
                setProfileError(result.message || "Failed to update profile. Please try again.");
                toast({ title: "Update Failed", description: result.message, variant: "destructive" });
            }
        } catch (error) {
             console.error("Profile update error:", error);
             const message = error instanceof Error ? error.message : "An unexpected error occurred.";
             setProfileError(message);
             toast({ title: "Update Error", description: message, variant: "destructive" });
        } finally {
             setLoadingProfile(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.isLoggedIn) return;

        setPasswordError('');
        if (newPassword !== confirmNewPassword) {
            setPasswordError("New passwords do not match.");
            return;
        }
        if (!currentPassword || !newPassword || newPassword.length < 6) {
            setPasswordError("Please provide current password and a new password (min. 6 characters).");
            return;
        }

        setLoadingPassword(true);
        console.log("Changing password for user:", session.user?.id);

        try {
            // --- Simulate Server Action Call ---
             // const result = await changePasswordAction({ userId: session.user.id, currentPassword, newPassword });
             await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API
             // Simulate success (real action would validate currentPassword)
             const success = currentPassword === 'password'; // Basic simulation
             const result = { success, message: success ? "Password changed successfully." : "Incorrect current password." };
             // --- End Simulation ---

            if (result.success) {
                toast({ title: "Password Changed", description: result.message });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
            } else {
                setPasswordError(result.message || "Failed to change password.");
                toast({ title: "Password Change Failed", description: result.message, variant: "destructive" });
            }
        } catch (error) {
             console.error("Password change error:", error);
             const message = error instanceof Error ? error.message : "An unexpected error occurred.";
             setPasswordError(message);
             toast({ title: "Password Change Error", description: message, variant: "destructive" });
        } finally {
            setLoadingPassword(false);
        }
    };

     // TODO: Implement vehicle management functions (add, edit, delete) using server actions
     const handleAddVehicle = () => { console.log("Add vehicle"); alert("Add vehicle functionality not implemented.") };
     const handleEditVehicle = (id: string) => { console.log("Edit vehicle:", id); alert(`Edit vehicle ${id} functionality not implemented.`) };
     const handleDeleteVehicle = (id: string) => { console.log("Delete vehicle:", id); alert(`Delete vehicle ${id} functionality not implemented.`) };

    // Render loading state for the whole page if session is loading initially
    if (sessionLoading) {
        return (
             <div className="space-y-8 p-4 md:p-6 lg:p-8">
                <Skeleton className="h-8 w-48 mb-8" /> {/* Title Skeleton */}
                 <Card>
                    <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                         <Skeleton className="h-10 w-full" />
                    </CardContent>
                    <CardFooter><Skeleton className="h-10 w-24" /></CardFooter>
                 </Card>
                <Card>
                    <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                         <Skeleton className="h-10 w-full" />
                    </CardContent>
                     <CardFooter><Skeleton className="h-10 w-32" /></CardFooter>
                 </Card>
                 <Card>
                    <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
                     <CardContent><Skeleton className="h-16 w-full" /></CardContent>
                 </Card>
             </div>
        );
    }

     // Handle case where session fails to load or user is not logged in (should be caught by middleware)
     if (!session?.isLoggedIn) {
         return (
             <div className="p-8 text-center">
                 <p>Please log in to view your profile.</p>
                 <Link href="/login"><Button variant="link">Login</Button></Link>
             </div>
         );
     }


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
                <div className="space-y-2 relative">
                    <Label htmlFor="name">Full Name</Label>
                     <User className="absolute left-2.5 top-[2.3rem] transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"/>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} required disabled={loadingProfile} className="pl-8"/>
                </div>
                <div className="space-y-2 relative">
                    <Label htmlFor="email">Email</Label>
                     <Mail className="absolute left-2.5 top-[2.3rem] transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"/>
                    <Input id="email" type="email" value={email} disabled title="Email cannot be changed" className="pl-8 bg-muted/50 cursor-not-allowed"/>
                    <p className="text-xs text-muted-foreground">Email cannot be changed after registration.</p>
                </div>
                 <div className="space-y-2 relative">
                    <Label htmlFor="phone">Phone Number</Label>
                     <Phone className="absolute left-2.5 top-[2.3rem] transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"/>
                    <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required disabled={loadingProfile} className="pl-8"/>
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
                    <Input id="current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required disabled={loadingPassword} autoComplete="current-password"/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required disabled={loadingPassword} minLength={6} autoComplete="new-password"/>
                    </div>
                    <div className="space-y-2">
                         <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                         <Input id="confirm-new-password" type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} required disabled={loadingPassword} minLength={6} autoComplete="new-password"/>
                    </div>
                </div>
                 <p className="text-xs text-muted-foreground sm:col-span-2">Password must be at least 6 characters long.</p>
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
           <Button variant="outline" size="sm" onClick={handleAddVehicle} disabled={loadingVehicles}>Add New Vehicle</Button>
        </CardHeader>
        <CardContent>
           {loadingVehicles ? (
                <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
           ) : vehicles.length > 0 ? (
                <ul className="space-y-3">
                    {vehicles.map(v => (
                         <li key={v.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center border p-3 rounded-md gap-2">
                             <div>
                                <p className="font-medium">{v.nickname} ({v.make} {v.model}, {v.year})</p>
                                <p className="text-xs text-muted-foreground">ID: {v.id}</p>
                             </div>
                             <div className="space-x-2 shrink-0 mt-2 sm:mt-0">
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