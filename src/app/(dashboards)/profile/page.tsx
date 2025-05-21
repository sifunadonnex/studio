
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Mail, Phone, Car, Lock, PlusCircle, Edit3, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserSession } from '@/contexts/session-context'; // Import the new context hook
import { Skeleton } from '@/components/ui/skeleton';
import { 
    updateProfileAction, 
    changePasswordAction, 
    manageVehicleAction, 
    fetchVehiclesAction,
    UpdateProfileInput,
    ChangePasswordInput,
    VehicleInput,
    ProfileResponse,
    VehicleResponse
} from '@/actions/profile'; 
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { useRouter } from 'next/navigation';


export default function ProfilePage() {
    const { toast } = useToast();
    const { userProfile } = useUserSession(); 
    const router = useRouter();
    
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState(''); 

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const [vehicles, setVehicles] = useState<VehicleInput[]>([]); 
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [loadingVehicles, setLoadingVehicles] = useState(true); // Start true if userProfile might not be immediately available
    const [vehicleActionLoading, setVehicleActionLoading] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<VehicleInput | null>(null);
    const [vehicleForm, setVehicleForm] = useState<Omit<VehicleInput, 'id' | 'serviceHistory'> & { serviceHistory?: string }>({ 
        make: '', model: '', year: '', nickname: '', serviceHistory: '' 
    });

    const fetchUserVehicles = useCallback(async () => {
        if (!userProfile) { 
            setLoadingVehicles(false);
            return;
        }
        setLoadingVehicles(true);
        try {
            const result: VehicleResponse = await fetchVehiclesAction();
            if (result.success && result.vehicles) {
                setVehicles(result.vehicles);
            } else {
                toast({ title: "Error Fetching Vehicles", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Could not fetch vehicles.", variant: "destructive" });
        } finally {
            setLoadingVehicles(false);
        }
    }, [userProfile, toast]);

    useEffect(() => {
        if (userProfile) {
            setName(userProfile.name || '');
            setEmail(userProfile.email || '');
            setPhone(userProfile.phone || '');
            fetchUserVehicles(); 
        } else {
             // userProfile is null, SessionContext might still be loading or no session.
             // If layout redirects for no session, this path might not be hit often when unauth.
             // Setting loadingVehicles to false ensures skeletons don't show indefinitely if userProfile never arrives.
             setLoadingVehicles(false); 
        }
    }, [userProfile, fetchUserVehicles]);


    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile) {
            toast({ title: "Authentication Error", description: "User session not found.", variant: "destructive" });
            return;
        }

        setLoadingProfile(true);
        setProfileError('');
        const profileData: UpdateProfileInput = { name, phone: phone || undefined };

        try {
            const result: ProfileResponse = await updateProfileAction(profileData);
            if (result.success) {
                toast({ title: "Profile Updated", description: result.message });
                // router.refresh() re-runs Server Components for the current route (including layouts),
                // which will update the SessionContext with the new profile data from the updated cookie.
                router.refresh(); 
            } else {
                setProfileError(result.message || "Failed to update profile.");
                toast({ title: "Update Failed", description: result.message, variant: "destructive" });
            }
        } catch (error) {
             const message = error instanceof Error ? error.message : "An unexpected error occurred.";
             setProfileError(message);
             toast({ title: "Update Error", description: message, variant: "destructive" });
        } finally {
             setLoadingProfile(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile) return;

        setPasswordError('');
        if (newPassword !== confirmNewPassword) {
            setPasswordError("New passwords do not match."); return;
        }
        if (!currentPassword || !newPassword || newPassword.length < 6) {
            setPasswordError("Provide current password and a new password (min. 6 characters)."); return;
        }

        setLoadingPassword(true);
        const passwordData: ChangePasswordInput = { currentPassword, newPassword };
        try {
            const result: ProfileResponse = await changePasswordAction(passwordData);
            if (result.success) {
                toast({ title: "Password Changed", description: result.message });
                setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
            } else {
                setPasswordError(result.message || "Failed to change password.");
                toast({ title: "Password Change Failed", description: result.message, variant: "destructive" });
            }
        } catch (error) {
             const message = error instanceof Error ? error.message : "An unexpected error occurred.";
             setPasswordError(message);
             toast({ title: "Password Change Error", description: message, variant: "destructive" });
        } finally {
            setLoadingPassword(false);
        }
    };
    
    const openVehicleDialog = (vehicle: VehicleInput | null = null) => {
        if (vehicle) {
            setEditingVehicle(vehicle);
            setVehicleForm({ make: vehicle.make, model: vehicle.model, year: vehicle.year, nickname: vehicle.nickname, serviceHistory: vehicle.serviceHistory || '' });
        } else {
            setEditingVehicle(null);
            setVehicleForm({ make: '', model: '', year: '', nickname: '', serviceHistory: '' });
        }
        setIsVehicleDialogOpen(true);
    };

    const handleVehicleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setVehicleForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveVehicle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile) return;

        const action = editingVehicle ? 'update' : 'add';
        const vehicleData: VehicleInput = {
            ...vehicleForm,
            id: editingVehicle?.id, 
            serviceHistory: vehicleForm.serviceHistory || undefined,
        };
        
        setVehicleActionLoading(true); 
        try {
            const result: VehicleResponse = await manageVehicleAction({ action, vehicle: vehicleData });
            if (result.success) {
                toast({ title: `Vehicle ${action === 'add' ? 'Added' : 'Updated'}`, description: result.message });
                if(result.vehicles) setVehicles(result.vehicles);
                setIsVehicleDialogOpen(false);
            } else {
                toast({ title: "Vehicle Operation Failed", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Could not save vehicle.", variant: "destructive" });
        } finally {
            setVehicleActionLoading(false);
        }
    };

    const handleDeleteVehicle = async (vehicleId: string) => {
        if (!userProfile || !vehicleId) return;
        setVehicleActionLoading(true);
        try {
            const result: VehicleResponse = await manageVehicleAction({ 
                action: 'delete', 
                vehicle: { id: vehicleId, make: '', model: '', year: '', nickname: '' } // Only ID is needed for delete action
            });
            if (result.success) {
                toast({ title: "Vehicle Deleted", description: result.message });
                 if(result.vehicles) setVehicles(result.vehicles);
            } else {
                toast({ title: "Deletion Failed", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Could not delete vehicle.", variant: "destructive" });
        } finally {
            setVehicleActionLoading(false);
        }
    };

    // Show loading skeletons if userProfile from context isn't available yet OR vehicles are actively loading
    if (!userProfile || loadingVehicles) {
        return (
             <div className="space-y-8 p-4 md:p-6 lg:p-8">
                <Skeleton className="h-8 w-48 mb-8" />
                 <Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></CardContent><CardFooter><Skeleton className="h-10 w-24" /></CardFooter></Card>
                 <Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></CardContent><CardFooter><Skeleton className="h-10 w-32" /></CardFooter></Card>
                 <Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent><Skeleton className="h-16 w-full" /></CardContent><CardFooter><Button disabled><PlusCircle className="mr-2 h-4 w-4" />Add Vehicle</Button></CardFooter></Card>
             </div>
        );
    }
    // This explicit check might be redundant if layout handles redirect, but good as a fallback.
     if (!userProfile) {
         return (
             <div className="p-8 text-center">
                 <p>Please log in to view your profile.</p>
                 <Link href="/login" passHref><Button variant="link">Login</Button></Link>
             </div>
         );
     }


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary">Profile Settings</h1>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Profile Information</CardTitle><CardDescription>Update your personal details.</CardDescription></CardHeader>
        <form onSubmit={handleUpdateProfile}>
           <CardContent className="space-y-4">
                <div className="space-y-2 relative"><Label htmlFor="name">Full Name</Label><User className="absolute left-2.5 top-[2.3rem] transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"/><Input id="name" value={name} onChange={e => setName(e.target.value)} required disabled={loadingProfile} className="pl-8"/></div>
                <div className="space-y-2 relative"><Label htmlFor="email">Email</Label><Mail className="absolute left-2.5 top-[2.3rem] transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"/><Input id="email" type="email" value={email} disabled title="Email cannot be changed" className="pl-8 bg-muted/50 cursor-not-allowed"/><p className="text-xs text-muted-foreground">Email cannot be changed after registration.</p></div>
                <div className="space-y-2 relative"><Label htmlFor="phone">Phone Number</Label><Phone className="absolute left-2.5 top-[2.3rem] transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"/><Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} disabled={loadingProfile} className="pl-8"/></div>
                {profileError && <p className="text-sm text-destructive">{profileError}</p>}
           </CardContent>
           <CardFooter><Button type="submit" disabled={loadingProfile}>{loadingProfile ? 'Saving...' : 'Save Profile Changes'}</Button></CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Change Password</CardTitle><CardDescription>Update your account password. (Simulated - real Firebase password changes require re-authentication by the user for security, typically handled client-side, or Admin SDK for server-side changes without re-auth).</CardDescription></CardHeader>
         <form onSubmit={handleChangePassword}>
            <CardContent className="space-y-4">
                <div className="space-y-2"><Label htmlFor="current-password">Current Password</Label><Input id="current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required disabled={loadingPassword} autoComplete="current-password"/></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="new-password">New Password</Label><Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required disabled={loadingPassword} minLength={6} autoComplete="new-password"/></div>
                    <div className="space-y-2"><Label htmlFor="confirm-new-password">Confirm New Password</Label><Input id="confirm-new-password" type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} required disabled={loadingPassword} minLength={6} autoComplete="new-password"/></div>
                </div>
                <p className="text-xs text-muted-foreground sm:col-span-2">Password must be at least 6 characters long.</p>
                {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            </CardContent>
            <CardFooter><Button type="submit" disabled={loadingPassword}>{loadingPassword ? 'Changing...' : 'Change Password'}</Button></CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
           <div><CardTitle className="flex items-center gap-2"><Car className="h-5 w-5" /> My Vehicles</CardTitle><CardDescription>Manage vehicles associated with your account for predictive maintenance and easier booking.</CardDescription></div>
           <Button variant="outline" size="sm" onClick={() => openVehicleDialog()} disabled={vehicleActionLoading}><PlusCircle className="mr-2 h-4 w-4"/>Add Vehicle</Button>
        </CardHeader>
        <CardContent>
           {loadingVehicles && vehicles.length === 0 ? ( 
                <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
           ) : vehicles.length > 0 ? (
                <ul className="space-y-3">
                    {vehicles.map(v => (
                         <li key={v.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center border p-3 rounded-md gap-2">
                             <div><p className="font-medium">{v.nickname} ({v.make} {v.model}, {v.year})</p>{v.id && <p className="text-xs text-muted-foreground">ID: {v.id}</p>}</div>
                             <div className="space-x-2 shrink-0 mt-2 sm:mt-0">
                                <Button variant="ghost" size="sm" onClick={() => openVehicleDialog(v)} disabled={vehicleActionLoading}><Edit3 className="mr-1 h-4 w-4"/>Edit</Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={vehicleActionLoading}><Trash2 className="mr-1 h-4 w-4"/>Delete</Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the vehicle "{v.nickname}".</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel disabled={vehicleActionLoading}>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => v.id && handleDeleteVehicle(v.id)} disabled={vehicleActionLoading || !v.id} className="bg-destructive hover:bg-destructive/90">Delete Vehicle</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </li>
                    ))}
                </ul>
           ) : (
             <p className="text-muted-foreground text-center py-4">No vehicles added yet. Add a vehicle to enable features like predictive maintenance.</p>
           )}
        </CardContent>
      </Card>

        <Dialog open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
                    <DialogDescription>
                        {editingVehicle ? 'Update the details of your vehicle.' : 'Add a new vehicle to your profile for easier booking and predictive maintenance.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveVehicle} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="nickname" className="text-right">Nickname</Label>
                        <Input id="nickname" name="nickname" value={vehicleForm.nickname} onChange={handleVehicleFormChange} className="col-span-3" required disabled={vehicleActionLoading} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="make" className="text-right">Make</Label>
                        <Input id="make" name="make" value={vehicleForm.make} onChange={handleVehicleFormChange} className="col-span-3" required disabled={vehicleActionLoading}/>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="model" className="text-right">Model</Label>
                        <Input id="model" name="model" value={vehicleForm.model} onChange={handleVehicleFormChange} className="col-span-3" required disabled={vehicleActionLoading}/>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="year" className="text-right">Year</Label>
                        <Input id="year" name="year" type="number" pattern="\d{4}" title="Enter a 4-digit year" value={vehicleForm.year} onChange={handleVehicleFormChange} className="col-span-3" required disabled={vehicleActionLoading}/>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="serviceHistory" className="text-right">Service History</Label>
                        <Textarea id="serviceHistory" name="serviceHistory" value={vehicleForm.serviceHistory || ''} onChange={handleVehicleFormChange} className="col-span-3" placeholder="e.g., 2024-01-15: Oil Change; 2023-11-20: Brake Pads. This helps with predictive maintenance." disabled={vehicleActionLoading}/>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline" disabled={vehicleActionLoading}>Cancel</Button></DialogClose>
                        <Button type="submit" disabled={vehicleActionLoading}>{vehicleActionLoading ? 'Saving...' : 'Save Vehicle'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  );
}

