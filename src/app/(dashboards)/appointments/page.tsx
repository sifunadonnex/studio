
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarPlus, RefreshCcw, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useUserSession } from '@/contexts/session-context'; // Import the new context hook
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

interface Appointment {
  id: string; 
  serviceId: string;
  serviceName: string;
  date: string; 
  time: string;
  vehicleMake: string;
  vehicleModel?: string | null;
  status: AppointmentStatus;
  createdAt: Timestamp; 
  customerName?: string; 
  customerEmail?: string;
}

type AppointmentStatus = 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';


export default function MyAppointmentsPage() {
    const { toast } = useToast();
    const { userProfile } = useUserSession(); // Use new context hook
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loadingAppointments, setLoadingAppointments] = useState(true);
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

    const fetchAppointments = useCallback(async () => {
        if (!userProfile?.id) {
            setAppointments([]); 
            setLoadingAppointments(false);
            return;
        }
        
        setLoadingAppointments(true);
        try {
            const q = query(
                collection(db, "appointments"), 
                where("userId", "==", userProfile.id), 
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const userAppointments = querySnapshot.docs.map(doc => {
                 const data = doc.data();
                 return {
                     id: doc.id,
                     ...data,
                     createdAt: data.createdAt as Timestamp, 
                 } as Appointment;
            });
            setAppointments(userAppointments);
        } catch (error) {
            console.error("Error fetching appointments:", error);
            toast({ title: "Error", description: "Could not fetch appointments.", variant: "destructive" });
            setAppointments([]);
        } finally {
            setLoadingAppointments(false);
        }
    }, [userProfile, toast]);

    useEffect(() => {
        if (userProfile) { // Session context has provided the user profile
            fetchAppointments();
        } else {
            // userProfile is null, which means context might still be loading or no session
            // If layout redirects, this state might not be hit often for unauthenticated.
            // But good to handle if context is loading.
            setAppointments([]);
            setLoadingAppointments(false); // Or true if we want to show a generic loading spinner until context resolves
        }
    }, [userProfile, fetchAppointments]);


    const handleReschedule = (id: string) => {
        console.log("Reschedule appointment:", id);
        toast({ title: "Reschedule Initiated", description: "Redirecting to booking page..." });
        window.location.href = `/book-appointment?rescheduleId=${id}`; 
    };

    const handleCancel = async (id: string) => {
        setActionLoading(prev => ({...prev, [id]: true}));
        try {
            const appointmentDocRef = doc(db, "appointments", id);
            await updateDoc(appointmentDocRef, {
                status: "Cancelled" as AppointmentStatus,
                updatedAt: Timestamp.now(),
            });
            fetchAppointments(); 
            toast({ title: "Appointment Cancelled", description: `Appointment ${id.substring(0,8)}... has been cancelled.` });
        } catch (error) {
            console.error("Error cancelling appointment:", error);
            toast({ title: "Cancellation Failed", description: "Could not cancel the appointment.", variant: "destructive" });
        } finally {
             setActionLoading(prev => ({...prev, [id]: false}));
        }
    };

    const getStatusBadgeVariant = (status: AppointmentStatus): "default" | "secondary" | "outline" | "destructive" => {
        switch (status) {
        case 'Confirmed': return 'default';
        case 'Completed': return 'secondary';
        case 'Pending': return 'outline'; 
        case 'Cancelled': return 'destructive';
        default: return 'outline';
        }
    };

    const formatDateDisplay = (dateInput: string | Timestamp) => {
        if (typeof dateInput === 'string') {
             try {
                return format(new Date(dateInput), 'PPP');
             } catch (e) {
                return dateInput; 
             }
        }
        if (dateInput instanceof Timestamp) return format(dateInput.toDate(), 'PPP');
        return 'N/A';
    };

    // Initial loading state while userProfile (from context) might be loading
    if (!userProfile && loadingAppointments) { // Check loadingAppointments as well
        return (
            <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Loading session...</p>
            </div>
        );
    }
    // If userProfile is definitively null after context has loaded (should be caught by layout)
     if (!userProfile) {
         return (
             <p className="text-center text-muted-foreground py-8">
                 Please <Link href="/login" className="text-primary hover:underline">log in</Link> to see your appointments.
             </p>
         );
     }


  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">My Appointments</h1>
        <Link href="/book-appointment" passHref>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <CalendarPlus className="mr-2 h-4 w-4" /> Book New Appointment
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Scheduled Services</CardTitle>
           <CardDescription>View your past, present, and future appointments.</CardDescription>
        </CardHeader>
        <CardContent>
           {loadingAppointments ? ( // This loading is specific to fetching appointments data
                <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2 text-muted-foreground">Fetching appointments...</p>
                </div>
           ) : (
             <Table>
               <TableHeader>
                  <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Status</TableHead>
                       <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
               </TableHeader>
                <TableBody>
                   {appointments.length > 0 ? appointments.map((app) => (
                       <TableRow key={app.id}>
                          <TableCell className="font-medium truncate max-w-[80px]" title={app.id}>{app.id.substring(0,8)}...</TableCell>
                           <TableCell>{app.serviceName}</TableCell>
                          <TableCell>{formatDateDisplay(app.date)}</TableCell>
                          <TableCell>{app.time}</TableCell>
                          <TableCell>{app.vehicleMake} {app.vehicleModel || ''}</TableCell>
                           <TableCell>
                               <Badge variant={getStatusBadgeVariant(app.status)}>{app.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                              { (app.status === 'Confirmed' || app.status === 'Pending') && (
                                  <>
                                       <Button variant="outline" size="sm" onClick={() => handleReschedule(app.id)} disabled={actionLoading[app.id]}>
                                          <RefreshCcw className="h-4 w-4" />
                                          <span className="sr-only md:not-sr-only md:ml-1">Reschedule</span>
                                      </Button>

                                      <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                               <Button variant="destructive" size="sm" disabled={actionLoading[app.id] || app.status === 'Cancelled'}>
                                                   {actionLoading[app.id] && app.status !== 'Cancelled' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                                    <span className="sr-only md:not-sr-only md:ml-1">Cancel</span>
                                               </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                               <AlertDialogHeader>
                                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                  <AlertDialogDescription>
                                                     This action cannot be undone. This will cancel your appointment for {app.serviceName} on {formatDateDisplay(app.date)}.
                                                  </AlertDialogDescription>
                                               </AlertDialogHeader>
                                               <AlertDialogFooter>
                                                  <AlertDialogCancel disabled={actionLoading[app.id]}>Keep Appointment</AlertDialogCancel>
                                                  <AlertDialogAction onClick={() => handleCancel(app.id)} disabled={actionLoading[app.id]} className="bg-destructive hover:bg-destructive/90">
                                                      {actionLoading[app.id] ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                      Confirm Cancellation
                                                  </AlertDialogAction>
                                              </AlertDialogFooter>
                                          </AlertDialogContent>
                                      </AlertDialog>
                                  </>
                              )}
                               {(app.status === 'Completed' || app.status === 'Cancelled') && (
                                   <span className="text-xs text-muted-foreground italic">{app.status}</span>
                               )}
                          </TableCell>
                      </TableRow>
                   )) : (
                      <TableRow>
                           <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                               You have no appointments scheduled.
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
