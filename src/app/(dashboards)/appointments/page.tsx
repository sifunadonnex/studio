'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarPlus, RefreshCcw, XCircle } from "lucide-react";
import Link from "next/link";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

// Placeholder data - Fetch from MySQL via PHP
const mockAppointments = [
  { id: 'APP123', service: 'Standard Oil Change', date: '2024-10-26', time: '10:00 AM', status: 'Confirmed' },
  { id: 'APP124', service: 'Brake Inspection', date: '2024-11-15', time: '02:00 PM', status: 'Pending' },
  { id: 'APP120', service: 'Tire Rotation', date: '2024-09-10', time: '09:00 AM', status: 'Completed' },
    { id: 'APP119', service: 'AC Service', date: '2024-08-05', time: '01:00 PM', status: 'Completed' },
     { id: 'APP118', service: 'Cooling System Flush', date: '2024-07-20', time: '11:00 AM', status: 'Cancelled' },
];

type AppointmentStatus = 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';


export default function MyAppointmentsPage() {
    const { toast } = useToast();
    const [appointments, setAppointments] = useState(mockAppointments); // Use state to manage appointments
    const [loading, setLoading] = useState(false); // For simulating actions


    // TODO: Implement API calls to reschedule/cancel
    const handleReschedule = (id: string) => {
        console.log("Reschedule appointment:", id);
        // Redirect to booking page with prefilled data or open a modal
         toast({ title: "Reschedule Initiated", description: "Redirecting to booking page..." });
         window.location.href = `/book-appointment?reschedule=${id}`;
    };

    const handleCancel = async (id: string) => {
        console.log("Cancel appointment:", id);
        setLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        const success = true; // Simulate success

        if (success) {
             setAppointments(prev => prev.map(app => app.id === id ? { ...app, status: 'Cancelled' } : app));
             toast({ title: "Appointment Cancelled", description: `Appointment ${id} has been cancelled.` });
        } else {
             toast({ title: "Cancellation Failed", description: "Could not cancel the appointment. Please contact support.", variant: "destructive" });
        }
        setLoading(false);
    };


    const getStatusBadgeVariant = (status: AppointmentStatus): "default" | "secondary" | "outline" | "destructive" => {
        switch (status) {
        case 'Confirmed': return 'default'; // Blueish/Primary
        case 'Completed': return 'secondary'; // Grayish
        case 'Pending': return 'outline'; // Outline
        case 'Cancelled': return 'destructive'; // Reddish
        default: return 'outline';
        }
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
           {/* TODO: Add filtering/sorting options */}
           <Table>
             <TableHeader>
                <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                </TableRow>
             </TableHeader>
              <TableBody>
                 {appointments.length > 0 ? appointments.map((app) => (
                     <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.id}</TableCell>
                         <TableCell>{app.service}</TableCell>
                        <TableCell>{app.date}</TableCell>
                        <TableCell>{app.time}</TableCell>
                         <TableCell>
                             <Badge variant={getStatusBadgeVariant(app.status as AppointmentStatus)}>{app.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                            { (app.status === 'Confirmed' || app.status === 'Pending') && (
                                <>
                                     <Button variant="outline" size="sm" onClick={() => handleReschedule(app.id)} disabled={loading}>
                                        <RefreshCcw className="h-4 w-4" />
                                        <span className="sr-only md:not-sr-only md:ml-1">Reschedule</span>
                                    </Button>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                             <Button variant="destructive" size="sm" disabled={loading}>
                                                 <XCircle className="h-4 w-4" />
                                                  <span className="sr-only md:not-sr-only md:ml-1">Cancel</span>
                                             </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                             <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                   This action cannot be undone. This will permanently cancel your appointment for {app.service} on {app.date}.
                                                </AlertDialogDescription>
                                             </AlertDialogHeader>
                                             <AlertDialogFooter>
                                                <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleCancel(app.id)} className="bg-destructive hover:bg-destructive/90">
                                                    Confirm Cancellation
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </>
                            )}
                             {app.status === 'Completed' && (
                                 <span className="text-xs text-muted-foreground italic">Completed</span>
                             )}
                             {app.status === 'Cancelled' && (
                                <span className="text-xs text-muted-foreground italic">Cancelled</span>
                            )}
                        </TableCell>
                    </TableRow>
                 )) : (
                    <TableRow>
                         <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                            You have no appointments scheduled.
                        </TableCell>
                    </TableRow>
                 )}
              </TableBody>
           </Table>
        </CardContent>
      </Card>
    </div>
  );
}
