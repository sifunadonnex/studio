
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Loader2, RefreshCw, CheckCircle, ShieldAlert, User, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchAllSubscriptionsAction,
  updateSubscriptionStatusAction,
  AdminSubscription,
  SubscriptionStatus,
  FetchAllSubscriptionsResponse,
  UpdateSubscriptionStatusResponse
} from '@/actions/subscription'; // New subscription actions
import { format } from 'date-fns';

export default function AdminSubscriptionsPage() {
    const { toast } = useToast();
    const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
    const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
    const [statusUpdateLoading, setStatusUpdateLoading] = useState<Record<string, boolean>>({}); // { subscriptionId: isLoading }
    const [error, setError] = useState<string | null>(null);

    const fetchSubscriptions = useCallback(async () => {
        console.log("[AdminSubscriptionsPage] Fetching all subscriptions...");
        setLoadingSubscriptions(true);
        setError(null);
        try {
            const result: FetchAllSubscriptionsResponse = await fetchAllSubscriptionsAction();
            if (result.success && result.subscriptions) {
                setSubscriptions(result.subscriptions);
            } else {
                setError(result.message);
                setSubscriptions([]);
                toast({ title: "Error Fetching Subscriptions", description: result.message, variant: "destructive" });
            }
        } catch (err) {
            console.error("[AdminSubscriptionsPage] Error in fetchSubscriptions:", err);
            const message = err instanceof Error ? err.message : "An unexpected error occurred.";
            setError(message);
            setSubscriptions([]);
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setLoadingSubscriptions(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchSubscriptions();
    }, [fetchSubscriptions]);

    const handleStatusChange = async (subscriptionId: string, newStatus: SubscriptionStatus) => {
        setStatusUpdateLoading(prev => ({ ...prev, [subscriptionId]: true }));
        try {
            const result: UpdateSubscriptionStatusResponse = await updateSubscriptionStatusAction({ subscriptionId, newStatus });
            if (result.success) {
                toast({
                    title: "Status Updated",
                    description: result.message,
                    action: <CheckCircle className="text-green-500" />,
                });
                // Optimistically update UI or re-fetch
                setSubscriptions(prev => prev.map(sub => sub.id === subscriptionId ? { ...sub, status: newStatus, updatedAt: new Date().toISOString() } : sub));
            } else {
                toast({ title: "Update Failed", description: result.message, variant: "destructive" });
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to update status.";
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setStatusUpdateLoading(prev => ({ ...prev, [subscriptionId]: false }));
        }
    };

    const getStatusBadgeVariant = (status: SubscriptionStatus): "default" | "secondary" | "outline" | "destructive" => {
        switch (status) {
            case 'active': return 'default';
            case 'pending': return 'outline';
            case 'cancelled': return 'secondary';
            case 'expired': return 'outline';
            case 'payment_failed': return 'destructive';
            default: return 'outline';
        }
    };
    
    const formatDateDisplay = (dateString?: string | null) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'MMM d, yyyy');
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                    <Users className="h-7 w-7" /> Manage Subscriptions
                </h1>
                <Button variant="outline" onClick={fetchSubscriptions} disabled={loadingSubscriptions}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loadingSubscriptions ? 'animate-spin' : ''}`} />
                    {loadingSubscriptions ? 'Loading...' : 'Refresh List'}
                </Button>
            </div>

            {error && !loadingSubscriptions && (
                <Card className="bg-destructive/10 border-destructive/30">
                    <CardHeader className="flex flex-row items-center gap-2 text-destructive pb-2">
                        <ShieldAlert className="h-6 w-6" />
                        <CardTitle>Error Loading Subscriptions</CardTitle>
                    </CardHeader>
                    <CardContent className="text-destructive">
                        <p>{error}</p>
                        <p>Please try refreshing the list or contact support if the issue persists.</p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>User Subscriptions</CardTitle>
                    <CardDescription>View and manage all active and past user subscriptions.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingSubscriptions ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="ml-3 text-muted-foreground">Loading subscriptions...</p>
                        </div>
                    ) : subscriptions.length === 0 && !error ? (
                        <p className="text-center text-muted-foreground py-10">No subscriptions found.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="hidden md:table-cell">ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="hidden sm:table-cell">Billing Period</TableHead>
                                    <TableHead className="hidden lg:table-cell">Price</TableHead>
                                    <TableHead>Change Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subscriptions.map((sub) => (
                                    <TableRow key={sub.id}>
                                        <TableCell className="font-medium truncate max-w-[60px] hidden md:table-cell" title={sub.id}>{sub.id.substring(0, 8)}...</TableCell>
                                        <TableCell>
                                            <div>{sub.customerName}</div>
                                            <div className="text-xs text-muted-foreground">{sub.customerEmail}</div>
                                        </TableCell>
                                        <TableCell>{sub.planName}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(sub.status)}>{sub.status}</Badge>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            {formatDateDisplay(sub.startDate)} - {sub.endDate ? formatDateDisplay(sub.endDate) : (sub.nextBillingDate ? `Next: ${formatDateDisplay(sub.nextBillingDate)}` : 'Ongoing')}
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">{sub.currency} {sub.price.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Select
                                                value={sub.status}
                                                onValueChange={(newStatus) => handleStatusChange(sub.id, newStatus as SubscriptionStatus)}
                                                disabled={statusUpdateLoading[sub.id]}
                                            >
                                                <SelectTrigger className="w-[150px] h-9 text-xs">
                                                    <SelectValue placeholder="Change status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(['active', 'pending', 'cancelled', 'expired', 'payment_failed'] as SubscriptionStatus[]).map(s => (
                                                        <SelectItem key={s} value={s} className="text-xs">{s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {statusUpdateLoading[sub.id] && <Loader2 className="inline-block ml-2 h-4 w-4 animate-spin" />}
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

