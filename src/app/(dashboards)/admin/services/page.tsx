
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Wrench, PlusCircle, Edit3, Trash2, Loader2, RefreshCw, ShieldAlert, PackageSearch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchAllServicesAction,
  addServiceAction,
  updateServiceAction,
  deleteServiceAction,
  ServiceSchema,
  AdminService,
  AdminServiceInput,
  FetchServicesResponse,
  ManageServiceResponse
} from '@/actions/service';
import { format } from 'date-fns';

export default function AdminServicesPage() {
    const { toast } = useToast();
    const [services, setServices] = useState<AdminService[]>([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
    const [editingService, setEditingService] = useState<AdminService | null>(null);
    const [serviceForm, setServiceForm] = useState<AdminServiceInput>({
        name: '', description: '', price: 0, category: '', duration: 30, isActive: true
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [actionLoading, setActionLoading] = useState(false);

    const fetchServices = useCallback(async () => {
        setLoadingServices(true);
        setError(null);
        try {
            const result: FetchServicesResponse = await fetchAllServicesAction();
            if (result.success && result.services) {
                setServices(result.services);
            } else {
                setError(result.message);
                toast({ title: "Error Fetching Services", description: result.message, variant: "destructive" });
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "An unexpected error occurred.";
            setError(message);
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setLoadingServices(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    const openServiceDialog = (service: AdminService | null = null) => {
        setFormErrors({});
        if (service) {
            setEditingService(service);
            setServiceForm({
                name: service.name,
                description: service.description,
                price: service.price,
                category: service.category,
                duration: service.duration,
                isActive: service.isActive,
            });
        } else {
            setEditingService(null);
            setServiceForm({ name: '', description: '', price: 0, category: '', duration: 30, isActive: true });
        }
        setIsServiceDialogOpen(true);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'number' ? parseFloat(value) : (type === 'checkbox' ? (e.target as HTMLInputElement).checked : value);
        setServiceForm(prev => ({ ...prev, [name]: val }));
    };
    
    const handleSwitchChange = (checked: boolean) => {
        setServiceForm(prev => ({ ...prev, isActive: checked }));
    };

    const handleSaveService = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({});
        setActionLoading(true);

        const validationResult = ServiceSchema.safeParse(serviceForm);
        if (!validationResult.success) {
            const errors: Record<string, string> = {};
            validationResult.error.errors.forEach(err => {
                if (err.path[0]) errors[err.path[0] as string] = err.message;
            });
            setFormErrors(errors);
            setActionLoading(false);
            return;
        }
        
        const action = editingService ? updateServiceAction(editingService.id, validationResult.data) : addServiceAction(validationResult.data);
        
        try {
            const result: ManageServiceResponse = await action;
            if (result.success) {
                toast({ title: `Service ${editingService ? 'Updated' : 'Added'}`, description: result.message });
                setIsServiceDialogOpen(false);
                fetchServices(); // Refresh the list
            } else {
                toast({ title: "Operation Failed", description: result.message, variant: "destructive" });
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Could not save service.";
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteService = async (serviceId: string) => {
        setActionLoading(true);
        try {
            const result: ManageServiceResponse = await deleteServiceAction(serviceId);
            if (result.success) {
                toast({ title: "Service Deleted", description: result.message });
                fetchServices(); // Refresh list
            } else {
                toast({ title: "Deletion Failed", description: result.message, variant: "destructive" });
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Could not delete service.";
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setActionLoading(false);
        }
    };
    
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
          return format(new Date(dateString), 'PPp');
        } catch (e) {
          return dateString;
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                    <Wrench className="h-7 w-7" /> Manage Services
                </h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchServices} disabled={loadingServices}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loadingServices ? 'animate-spin' : ''}`} />
                        {loadingServices ? 'Refreshing...' : 'Refresh List'}
                    </Button>
                    <Button onClick={() => openServiceDialog()} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Service
                    </Button>
                </div>
            </div>

            {error && !loadingServices && (
                <Card className="bg-destructive/10 border-destructive/30">
                    <CardHeader className="flex flex-row items-center gap-2 text-destructive pb-2">
                        <ShieldAlert className="h-6 w-6" />
                        <CardTitle>Error Loading Services</CardTitle>
                    </CardHeader>
                    <CardContent className="text-destructive"><p>{error}</p></CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Service Catalog</CardTitle>
                    <CardDescription>View, add, edit, or delete services offered by the garage.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingServices ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="ml-3 text-muted-foreground">Loading services...</p>
                        </div>
                    ) : services.length === 0 && !error ? (
                         <div className="text-center py-10 text-muted-foreground">
                            <PackageSearch className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <p className="mb-2">No services found.</p>
                            <Button variant="outline" onClick={() => openServiceDialog()}>Add Your First Service</Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="hidden md:table-cell">Category</TableHead>
                                    <TableHead>Price (KES)</TableHead>
                                    <TableHead className="hidden lg:table-cell">Duration</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {services.map((service) => (
                                    <TableRow key={service.id}>
                                        <TableCell className="font-medium">{service.name}</TableCell>
                                        <TableCell className="hidden md:table-cell">{service.category}</TableCell>
                                        <TableCell>{service.price.toLocaleString()}</TableCell>
                                        <TableCell className="hidden lg:table-cell">{service.duration} min</TableCell>
                                        <TableCell>
                                            <Badge variant={service.isActive ? "default" : "outline"}>
                                                {service.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="sm" onClick={() => openServiceDialog(service)} disabled={actionLoading}>
                                                <Edit3 className="h-4 w-4" /> <span className="sr-only">Edit</span>
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleDeleteService(service.id)} disabled={actionLoading}>
                                                <Trash2 className="h-4 w-4" /> <span className="sr-only">Delete</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
                        <DialogDescription>
                            {editingService ? 'Update the details for this service.' : 'Fill in the details for the new service.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveService} className="grid gap-4 py-4">
                        <div className="space-y-1">
                            <Label htmlFor="name">Service Name</Label>
                            <Input id="name" name="name" value={serviceForm.name} onChange={handleFormChange} disabled={actionLoading} />
                            {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" value={serviceForm.description} onChange={handleFormChange} disabled={actionLoading} />
                            {formErrors.description && <p className="text-xs text-destructive">{formErrors.description}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="price">Price (KES)</Label>
                                <Input id="price" name="price" type="number" value={serviceForm.price} onChange={handleFormChange} disabled={actionLoading} />
                                {formErrors.price && <p className="text-xs text-destructive">{formErrors.price}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="category">Category</Label>
                                <Input id="category" name="category" value={serviceForm.category} onChange={handleFormChange} disabled={actionLoading} placeholder="e.g., Maintenance" />
                                {formErrors.category && <p className="text-xs text-destructive">{formErrors.category}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-end">
                             <div className="space-y-1">
                                <Label htmlFor="duration">Duration (minutes)</Label>
                                <Input id="duration" name="duration" type="number" value={serviceForm.duration} onChange={handleFormChange} disabled={actionLoading} />
                                {formErrors.duration && <p className="text-xs text-destructive">{formErrors.duration}</p>}
                            </div>
                            <div className="flex items-center space-x-2 mb-1">
                                <Switch id="isActive" name="isActive" checked={serviceForm.isActive} onCheckedChange={handleSwitchChange} disabled={actionLoading} />
                                <Label htmlFor="isActive">Active</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline" disabled={actionLoading}>Cancel</Button></DialogClose>
                            <Button type="submit" disabled={actionLoading}>
                                {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {editingService ? 'Save Changes' : 'Add Service'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

