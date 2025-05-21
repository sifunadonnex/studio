
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
import { useUserSession } from '@/contexts/session-context'; 
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

interface Appointment {
  id: string; 
  serviceId: string;
  serviceName: string;
  date: string; // Stored as 'YYYY-MM-DD' string
  time: string;
  vehicleMake: string;
  vehicleModel?: string | null;
  status: AppointmentStatus;
  createdAt: Timestamp; // Firestore Timestamp
  // Customer details are part of the document but not always needed for this specific view if logged in as user
  // customerName?: string; 
  // customerEmail?: string;
}

type AppointmentStatus = 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';


export default function MyAppointmentsPage() {
    const { toast } = useToast();
    const { userProfile, loading: sessionLoading } = useUserSession(); // Use context
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loadingAppointments, setLoadingAppointments] = useState(true);
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({}); // For cancel button loading state

    const fetchAppointments = useCallback(async () => {
        if (!userProfile?.id) {
            // If userProfile is not available yet (e.g. session context loading),
            // or if definitively not logged in, don't attempt to fetch.
            // setLoadingAppointments will be false if sessionLoading is also false.
            setAppointments([]); 
            setLoadingAppointments(false); // No user, no appointments to load
            return;
        }
        
        console.log(`[MyAppointmentsPage] Fetching appointments for user ID: ${userProfile.id}`);
        setLoadingAppointments(true);
        try {
            const q = query(
                collection(db, "appointments"), 
                where("userId", "==", userProfile.id), 
                orderBy("createdAt", "desc") // Or orderBy("date", "desc") if preferred
            );
            const querySnapshot = await getDocs(q);
            const userAppointments = querySnapshot.docs.map(docSnap => {
                 const data = docSnap.data();
                 return {
                     id: docSnap.id,
                     // Ensure all fields from Firestore are correctly cast to Appointment type
                     serviceId: data.serviceId,
                     serviceName: data.serviceName,
                     date: data.date, // Assuming 'date' is stored as 'YYYY-MM-DD' string
                     time: data.time,
                     vehicleMake: data.vehicleMake,
                     vehicleModel: data.vehicleModel || null,
                     status: data.status as AppointmentStatus,
                     createdAt: data.createdAt as Timestamp, 
                 } as Appointment; // Explicit cast after mapping
            });
            setAppointments(userAppointments);
            console.log(`[MyAppointmentsPage] Fetched ${userAppointments.length} appointments.`);
        } catch (error) {
            console.error("[MyAppointmentsPage] Error fetching appointments:", error);
            toast({ title: "Error Fetching Appointments", description: "Could not fetch your appointments. Please try again.", variant: "destructive" });
            setAppointments([]);
        } finally {
            setLoadingAppointments(false);
        }
    }, [userProfile, toast]);

    useEffect(() => {
        // Only fetch appointments if the session is not loading and userProfile is available
        if (!sessionLoading && userProfile) { 
            fetchAppointments();
        } else if (!sessionLoading && !userProfile) {
            // Session loaded, but no user profile (not logged in)
            setAppointments([]);
            setLoadingAppointments(false);
        }
        // If sessionLoading is true, we wait for it to resolve.
        // fetchAppointments has userProfile in its dependency array, so it will run when userProfile is available.
    }, [sessionLoading, userProfile, fetchAppointments]);


    const handleReschedule = (id: string) => {
        // For rescheduling, we might want to pass appointment details to the booking page
        // This part can be enhanced later if needed
        const appointmentToReschedule = appointments.find(app => app.id === id);
        if (appointmentToReschedule) {
             toast({ title: "Reschedule Initiated", description: `Redirecting to book a new slot for ${appointmentToReschedule.serviceName}...` });
             // Example: router.push(`/book-appointment?rescheduleId=${id}&service=${appointmentToReschedule.serviceId}`);
             // For now, simple redirect
             window.location.href = `/book-appointment?rescheduleId=${id}`; 
        } else {
            toast({ title: "Error", description: "Could not find appointment to reschedule.", variant: "destructive" });
        }
    };

    const handleCancel = async (id: string) => {
        setActionLoading(prev => ({...prev, [id]: true}));
        try {
            const appointmentDocRef = doc(db, "appointments", id);
            await updateDoc(appointmentDocRef, {
                status: "Cancelled" as AppointmentStatus,
                updatedAt: Timestamp.now(), // Firestore server timestamp
            });
            // Re-fetch appointments to update the list
            await fetchAppointments(); 
            toast({ title: "Appointment Cancelled", description: `Your appointment has been successfully cancelled.` });
        } catch (error) {
            console.error("[MyAppointmentsPage] Error cancelling appointment:", error);
            toast({ title: "Cancellation Failed", description: "Could not cancel the appointment. Please try again.", variant: "destructive" });
        } finally {
             setActionLoading(prev => ({...prev, [id]: false}));
        }
    };

    const getStatusBadgeVariant = (status: AppointmentStatus): "default" | "secondary" | "outline" | "destructive" => {
        switch (status) {
        case 'Confirmed': return 'default'; // Often green or blue
        case 'Completed': return 'secondary'; // Often gray or a muted color
        case 'Pending': return 'outline'; // Often yellow or orange (using outline for now)
        case 'Cancelled': return 'destructive'; // Red
        default: return 'outline';
        }
    };

    const formatDateDisplay = (dateInput: string | Date | Timestamp) => {
        if (!dateInput) return 'N/A';
        try {
            if (dateInput instanceof Timestamp) return format(dateInput.toDate(), 'PPP'); // E.g., Jan 1, 2024
            if (typeof dateInput === 'string') return format(new Date(dateInput), 'PPP'); // Handles 'YYYY-MM-DD'
            if (dateInput instanceof Date) return format(dateInput, 'PPP');
        } catch (e) {
            console.warn("Error formatting date:", dateInput, e);
            return String(dateInput); // Fallback
        }
        return String(dateInput);
    };
    
    // If session is still loading, show a global loading indicator for the page
    if (sessionLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground text-lg">Loading your session...</p>
            </div>
        );
    }

    // If session has loaded but there's no user profile (not logged in)
    // This should ideally be caught by middleware/layout, but as a fallback:
     if (!userProfile) {
         return (
            <div className="text-center py-10">
                 <p className="text-muted-foreground mb-4">
                     Please <Link href="/login" className="text-primary hover:underline font-semibold">log in</Link> to view your appointments.
                 </p>
                 <Link href="/book-appointment" passHref>
                    <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        <CalendarPlus className="mr-2 h-4 w-4" /> Book an Appointment
                    </Button>
                </Link>
            </div>
         );
     }


  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-primary">My Appointments</h1>
        <Link href="/book-appointment" passHref>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto">
            <CalendarPlus className="mr-2 h-4 w-4" /> Book New Appointment
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Scheduled Services</CardTitle>
           <CardDescription>View your past, present, and future appointments. To make changes, please contact us or use the reschedule option.</CardDescription>
        </CardHeader>
        <CardContent>
           {loadingAppointments ? (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="ml-2 text-muted-foreground">Fetching your appointments...</p>
                </div>
           ) : (
             <Table>
               <TableHeader>
                  <TableRow>
                      <TableHead className="hidden md:table-cell">ID</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="hidden sm:table-cell">Vehicle</TableHead>
                      <TableHead>Status</TableHead>
                       <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
               </TableHeader>
                <TableBody>
                   {appointments.length > 0 ? appointments.map((app) => (
                       <TableRow key={app.id}>
                          <TableCell className="font-medium truncate max-w-[80px] hidden md:table-cell" title={app.id}>{app.id.substring(0,8)}...</TableCell>
                           <TableCell>{app.serviceName}</TableCell>
                          <TableCell>{formatDateDisplay(app.date)}</TableCell>
                          <TableCell>{app.time}</TableCell>
                          <TableCell className="hidden sm:table-cell">{app.vehicleMake} {app.vehicleModel || ''}</TableCell>
                           <TableCell>
                               <Badge variant={getStatusBadgeVariant(app.status)} className="whitespace-nowrap">{app.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-1 sm:space-x-2">
                              { (app.status === 'Confirmed' || app.status === 'Pending') && (
                                  <>
                                       <Button 
                                          variant="outline" 
                                          size="sm" 
                                          onClick={() => handleReschedule(app.id)} 
                                          disabled={actionLoading[app.id]}
                                          className="px-2 py-1 h-auto text-xs sm:px-3 sm:py-2 sm:h-9 sm:text-sm"
                                        >
                                          <RefreshCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                                          <span className="hidden sm:inline sm:ml-1">Reschedule</span>
                                      </Button>

                                      <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                               <Button 
                                                  variant="destructive" 
                                                  size="sm" 
                                                  disabled={actionLoading[app.id] || app.status === 'Cancelled'}
                                                  className="px-2 py-1 h-auto text-xs sm:px-3 sm:py-2 sm:h-9 sm:text-sm"
                                                >
                                                   {actionLoading[app.id] && app.status !== 'Cancelled' ? <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> : <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />}
                                                    <span className="hidden sm:inline sm:ml-1">Cancel</span>
                                               </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                               <AlertDialogHeader>
                                                  <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
                                                  <AlertDialogDescription>
                                                     This action cannot be undone. This will cancel your appointment for {app.serviceName} on {formatDateDisplay(app.date)} at {app.time}.
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
                                   <span className="text-xs text-muted-foreground italic whitespace-nowrap">{app.status}</span>
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

