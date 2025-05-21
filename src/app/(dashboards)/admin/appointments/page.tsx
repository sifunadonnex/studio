
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Loader2, RefreshCw, CheckCircle, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchAllAppointmentsAction, updateAppointmentStatusAction, AdminAppointment, AppointmentStatus, FetchAllAppointmentsResponse, UpdateAppointmentStatusResponse } from '@/actions/booking';
import { format } from 'date-fns';

export default function AdminAppointmentsPage() {
    const { toast } = useToast();
    const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
    const [loadingAppointments, setLoadingAppointments] = useState(true);
    const [statusUpdateLoading, setStatusUpdateLoading] = useState<Record<string, boolean>>({}); // { appointmentId: isLoading }
    const [error, setError] = useState<string | null>(null);

    const fetchAppointments = useCallback(async () => {
        console.log("[AdminAppointmentsPage] Fetching all appointments...");
        setLoadingAppointments(true);
        setError(null);
        try {
            const result: FetchAllAppointmentsResponse = await fetchAllAppointmentsAction();
            if (result.success && result.appointments) {
                setAppointments(result.appointments);
            } else {
                setError(result.message);
                setAppointments([]);
                toast({ title: "Error Fetching Appointments", description: result.message, variant: "destructive" });
            }
        } catch (err) {
            console.error("[AdminAppointmentsPage] Error in fetchAppointments:", err);
            const message = err instanceof Error ? err.message : "An unexpected error occurred.";
            setError(message);
            setAppointments([]);
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setLoadingAppointments(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus) => {
        setStatusUpdateLoading(prev => ({ ...prev, [appointmentId]: true }));
        try {
            const result: UpdateAppointmentStatusResponse = await updateAppointmentStatusAction({ appointmentId, newStatus });
            if (result.success) {
                toast({
                    title: "Status Updated",
                    description: result.message,
                    action: <CheckCircle className="text-green-500" />,
                });
                // Optimistically update UI or re-fetch
                setAppointments(prev => prev.map(app => app.id === appointmentId ? { ...app, status: newStatus, updatedAt: new Date().toISOString() } : app));
            } else {
                toast({ title: "Update Failed", description: result.message, variant: "destructive" });
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to update status.";
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setStatusUpdateLoading(prev => ({ ...prev, [appointmentId]: false }));
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

    const formatDateDisplay = (dateInput: string | Date) => {
        if (!dateInput) return 'N/A';
        try {
            return format(new Date(dateInput), 'PPP, hh:mm a'); // e.g., Jan 1, 2024, 09:00 AM
        } catch (e) {
            console.warn("Error formatting date:", dateInput, e);
            return String(dateInput);
        }
    };
    
    const formatSimpleDate = (dateString: string) => {
      try {
        return format(new Date(dateString), 'MMM d, yyyy'); // e.g. Oct 26, 2024
      } catch (e) {
        return dateString;
      }
    };


    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                    <CalendarDays className="h-7 w-7" /> All Appointments
                </h1>
                <Button variant="outline" onClick={fetchAppointments} disabled={loadingAppointments}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loadingAppointments ? 'animate-spin' : ''}`} />
                    {loadingAppointments ? 'Loading...' : 'Refresh List'}
                </Button>
            </div>

            {error && !loadingAppointments && (
                <Card className="bg-destructive/10 border-destructive/30">
                    <CardHeader className="flex flex-row items-center gap-2 text-destructive pb-2">
                        <ShieldAlert className="h-6 w-6" />
                        <CardTitle>Error Loading Appointments</CardTitle>
                    </CardHeader>
                    <CardContent className="text-destructive">
                        <p>{error}</p>
                        <p>Please try refreshing the list or contact support if the issue persists.</p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Appointment Queue</CardTitle>
                    <CardDescription>View and manage all scheduled customer appointments.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingAppointments ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="ml-3 text-muted-foreground">Loading all appointments...</p>
                        </div>
                    ) : appointments.length === 0 && !error ? (
                        <p className="text-center text-muted-foreground py-10">No appointments found.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="hidden md:table-cell">ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead className="hidden sm:table-cell">Vehicle</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Change Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {appointments.map((app) => (
                                    <TableRow key={app.id}>
                                        <TableCell className="font-medium truncate max-w-[60px] hidden md:table-cell" title={app.id}>{app.id.substring(0, 6)}...</TableCell>
                                        <TableCell>
                                            <div>{app.customerName}</div>
                                            <div className="text-xs text-muted-foreground">{app.customerEmail}</div>
                                        </TableCell>
                                        <TableCell>{app.serviceName}</TableCell>
                                        <TableCell>{formatSimpleDate(app.date)} at {app.time}</TableCell>
                                        <TableCell className="hidden sm:table-cell">{app.vehicleMake} {app.vehicleModel || ''}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(app.status)}>{app.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Select
                                                value={app.status}
                                                onValueChange={(newStatus) => handleStatusChange(app.id, newStatus as AppointmentStatus)}
                                                disabled={statusUpdateLoading[app.id]}
                                            >
                                                <SelectTrigger className="w-[150px] h-9 text-xs">
                                                    <SelectValue placeholder="Change status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(['Pending', 'Confirmed', 'Completed', 'Cancelled'] as AppointmentStatus[]).map(s => (
                                                        <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {statusUpdateLoading[app.id] && <Loader2 className="inline-block ml-2 h-4 w-4 animate-spin" />}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

