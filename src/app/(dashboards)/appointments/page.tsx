
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
import { useSession } from '@/hooks/use-session';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

interface Appointment {
  id: string; // Firestore document ID
  serviceId: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  time: string;
  vehicleMake: string;
  vehicleModel?: string | null;
  status: AppointmentStatus;
  createdAt: Timestamp; // Firestore Timestamp
  // Customer details - might be denormalized or fetched if needed
  customerName?: string; 
  customerEmail?: string;
}

type AppointmentStatus = 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';


export default function MyAppointmentsPage() {
    const { toast } = useToast();
    const { session, loading: sessionLoading } = useSession();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loadingAppointments, setLoadingAppointments] = useState(true);
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});


    const fetchAppointments = useCallback(async () => {
        if (!session?.isLoggedIn || !session.user?.id) {
            setLoadingAppointments(false);
            return;
        }
        setLoadingAppointments(true);
        try {
            const q = query(
                collection(db, "appointments"), 
                where("userId", "==", session.user.id),
                orderBy("createdAt", "desc") // Or orderBy("date", "desc")
            );
            const querySnapshot = await getDocs(q);
            const userAppointments = querySnapshot.docs.map(doc => ({
                 id: doc.id, 
                 ...doc.data() 
            } as Appointment));
            setAppointments(userAppointments);
        } catch (error) {
            console.error("Error fetching appointments:", error);
            toast({ title: "Error", description: "Could not fetch appointments.", variant: "destructive" });
        } finally {
            setLoadingAppointments(false);
        }
    }, [session, toast]);

    useEffect(() => {
        if (!sessionLoading && session?.isLoggedIn) {
            fetchAppointments();
        } else if (!sessionLoading && !session?.isLoggedIn) {
            setLoadingAppointments(false); // Stop loading if user is not logged in
        }
    }, [sessionLoading, session, fetchAppointments]);


    const handleReschedule = (id: string) => {
        console.log("Reschedule appointment:", id);
        toast({ title: "Reschedule Initiated", description: "Redirecting to booking page..." });
        // For a real reschedule, you might pass appointment ID to prefill some details
        window.location.href = `/book-appointment?rescheduleId=${id}`; 
    };

    const handleCancel = async (id: string) => {
        setActionLoading(prev => ({...prev, [id]: true}));
        try {
            const appointmentDocRef = doc(db, "appointments", id);
            await updateDoc(appointmentDocRef, {
                status: "Cancelled",
                updatedAt: Timestamp.now(),
            });
            setAppointments(prev => prev.map(app => app.id === id ? { ...app, status: 'Cancelled' } : app));
            toast({ title: "Appointment Cancelled", description: `Appointment ${id} has been cancelled.` });
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

    // Format Firestore Timestamp to readable date, or handle string date
    const formatDateDisplay = (dateInput: string | Timestamp) => {
        if (typeof dateInput === 'string') return dateInput; // Already formatted as YYYY-MM-DD
        if (dateInput instanceof Timestamp) return format(dateInput.toDate(), 'yyyy-MM-dd');
        return 'N/A';
    };


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
           {loadingAppointments ? (
                <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                                               <Button variant="destructive" size="sm" disabled={actionLoading[app.id]}>
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
                              {session?.isLoggedIn ? "You have no appointments scheduled." : "Please log in to see your appointments."}
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
