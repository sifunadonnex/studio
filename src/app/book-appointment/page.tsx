
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CalendarIcon, User, Mail, Phone, Car as CarIcon, RefreshCcw, Loader2 } from 'lucide-react'; // Added CarIcon, RefreshCcw, Loader2
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from 'next/navigation'; // Added useSearchParams
import { useUserSession } from '@/contexts/session-context';
import { bookAppointmentAction, BookAppointmentInput, BookingResponse } from '@/actions/booking';
import { fetchVehiclesAction, VehicleInput } from '@/actions/profile'; // Import vehicle actions and types

// Placeholder data - In a real app, fetch services and available slots from Firestore or backend
const availableServices = [
  { id: 'std_oil_change', name: 'Standard Oil Change' },
  { id: 'syn_oil_change', name: 'Synthetic Oil Change' },
  { id: 'brake_inspect_front', name: 'Brake Inspection & Pad Replacement (Front)' },
  { id: 'tire_rotation', name: 'Tire Rotation & Balancing' },
  { id: 'battery_check', name: 'Battery Check & Replacement' },
  { id: 'cooling_flush', name: 'Cooling System Flush' },
  { id: 'ac_service', name: 'Air Conditioning Service' },
  { id: 'comprehensive_inspect', name: 'Comprehensive Vehicle Inspection' },
  { id: 'engine_diag', name: 'Engine Diagnostics' },
  { id: 'other', name: 'Other (Specify below)' },
];

const availableTimeSlots = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
];


export default function BookAppointmentPage() {
    const { toast } = useToast()
    const router = useRouter();
    const searchParams = useSearchParams();
    const { userProfile,  loading: sessionLoading } = useUserSession(); // Use context

    const [selectedService, setSelectedService] = useState<string | undefined>(undefined);
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
    
    const [vehicleMake, setVehicleMake] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');
    const [vehicleYear, setVehicleYear] = useState('');

    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [additionalInfo, setAdditionalInfo] = useState('');
    
    const [loadingBooking, setLoadingBooking] = useState(false);
    const [error, setError] = useState('');

    const [userVehicles, setUserVehicles] = useState<VehicleInput[]>([]);
    const [loadingVehicles, setLoadingVehicles] = useState(false);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(undefined); // 'addNew' or vehicle.id

     useEffect(() => {
        const serviceIdParam = searchParams.get('service');
        if (serviceIdParam && availableServices.some(s => s.id === serviceIdParam)) {
            setSelectedService(serviceIdParam);
        }
        // TODO: Handle 'vehicle' or 'rescheduleId' params for pre-filling vehicle details
     }, [searchParams]);

    useEffect(() => {
        if (userProfile) {
            setCustomerName(userProfile.name || '');
            setCustomerEmail(userProfile.email || '');
            setCustomerPhone(userProfile.phone || '');
        }
    }, [userProfile]);

    const fetchUserVehicles = useCallback(async () => {
        if (userProfile?.id) {
            setLoadingVehicles(true);
            try {
                const result = await fetchVehiclesAction();
                if (result.success && result.vehicles) {
                    setUserVehicles(result.vehicles);
                    if (result.vehicles.length > 0) {
                        setSelectedVehicleId(result.vehicles[0].id); // Default to first vehicle if any
                    } else {
                        setSelectedVehicleId('addNew'); // Default to add new if no vehicles
                    }
                } else {
                    toast({ title: "Could not fetch vehicles", description: result.message, variant: "destructive" });
                    setSelectedVehicleId('addNew');
                }
            } catch (err) {
                toast({ title: "Error fetching vehicles", description: "An unexpected error occurred.", variant: "destructive" });
                setSelectedVehicleId('addNew');
            } finally {
                setLoadingVehicles(false);
            }
        } else {
            setUserVehicles([]);
            setSelectedVehicleId('addNew'); // Not logged in, must add new
        }
    }, [userProfile, toast]);

    useEffect(() => {
        fetchUserVehicles();
    }, [fetchUserVehicles]);


    useEffect(() => {
        if (selectedVehicleId && selectedVehicleId !== 'addNew') {
            const vehicle = userVehicles.find(v => v.id === selectedVehicleId);
            if (vehicle) {
                setVehicleMake(vehicle.make);
                setVehicleModel(vehicle.model || '');
                setVehicleYear(vehicle.year || '');
            }
        } else if (selectedVehicleId === 'addNew') {
            // Clear fields if user explicitly wants to add new, or if no vehicles/not logged in
            const prefillVehicleId = searchParams.get('vehicle'); // Example: from predictive page
            if (!prefillVehicleId) { // Only clear if not trying to prefill from another source
                setVehicleMake('');
                setVehicleModel('');
                setVehicleYear('');
            }
        }
    }, [selectedVehicleId, userVehicles, searchParams]);


    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingBooking(true);
        setError('');

        const currentUserId = userProfile?.id;
        const serviceDetails = availableServices.find(s => s.id === selectedService);

        if (!selectedService || !serviceDetails || !date || !selectedTime || !vehicleMake ) {
            setError('Please fill in all required fields: Service, Date, Time, and Vehicle Make.');
            setLoadingBooking(false);
             toast({ title: "Missing Information", description: "Please fill all required fields.", variant: "destructive" });
            return;
        }
         if (!currentUserId && (!customerName || !customerEmail || !customerPhone)) {
             setError('Name, Email, and Phone are required for guest bookings.');
             setLoadingBooking(false);
             toast({ title: "Guest Information Missing", description: "Name, Email, and Phone are required for guest bookings.", variant: "destructive" });
             return;
         }


        const bookingData: BookAppointmentInput = {
            userId: currentUserId ?? undefined,
            serviceId: selectedService,
            serviceName: serviceDetails.name,
            date: format(date, 'yyyy-MM-dd'),
            time: selectedTime,
            vehicleMake,
            vehicleModel: vehicleModel || null,
            vehicleYear: vehicleYear || null,
            customerName: currentUserId ? undefined : customerName,
            customerEmail: currentUserId ? undefined : customerEmail,
            customerPhone: currentUserId ? undefined : customerPhone,
            additionalInfo: additionalInfo || null,
        };

        try {
            const result: BookingResponse = await bookAppointmentAction(bookingData); 

            if (result.success) {
                 toast({
                     title: "Booking Successful!",
                     description: `Your appointment for ${serviceDetails.name} on ${bookingData.date} at ${bookingData.time} is confirmed. Appointment ID: ${result.appointmentId}`,
                 })
                 // Reset form partly, keep user details if logged in
                 setSelectedService(undefined);
                 setDate(undefined);
                 setSelectedTime(undefined);
                 if (userVehicles.length > 0 && userProfile) {
                    setSelectedVehicleId(userVehicles[0].id); // Reset to first vehicle
                 } else {
                    setSelectedVehicleId('addNew');
                    setVehicleMake('');
                    setVehicleModel('');
                    setVehicleYear('');
                 }
                 setAdditionalInfo('');
                 if (!currentUserId) { // Clear guest details
                    setCustomerName('');
                    setCustomerEmail('');
                    setCustomerPhone('');
                 }
                  router.push('/appointments');
            } else {
                setError(result.message || 'Failed to book appointment.');
                 toast({
                     title: "Booking Failed",
                     description: result.message || "Could not schedule your appointment.",
                     variant: "destructive",
                 })
            }
        } catch (err) {
             console.error("Booking error:", err);
             const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
             setError(message);
             toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setLoadingBooking(false);
        }
    };

    const isLoading = loadingBooking || sessionLoading || loadingVehicles;
    const canEditVehicleDetails = selectedVehicleId === 'addNew' || !userProfile;

  return (
    <div className="container mx-auto px-4 py-16">
       <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Book Your Service</CardTitle>
          <CardDescription>Select your service, preferred date and time, and provide your vehicle details.</CardDescription>
           {userProfile && (
               <p className="text-sm text-green-600 pt-2">Booking as: {userProfile.name} ({userProfile.email})</p>
           )}
        </CardHeader>
        <CardContent>
           <form onSubmit={handleBooking} className="space-y-6">
             <div className="space-y-2">
                <Label htmlFor="service">Service Type <span className="text-destructive">*</span></Label>
                 <Select value={selectedService} onValueChange={setSelectedService} disabled={isLoading}>
                    <SelectTrigger id="service">
                        <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                    {availableServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                    ))}
                    </SelectContent>
                 </Select>
            </div>

             <div className="space-y-2">
                 <Label htmlFor="date">Preferred Date <span className="text-destructive">*</span></Label>
                 <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                        )}
                        disabled={isLoading}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                         disabled={(day) => day < new Date(new Date().setHours(0,0,0,0)) || day.getDay() === 0 } 
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
            </div>

            <div className="space-y-2">
                <Label htmlFor="time">Preferred Time <span className="text-destructive">*</span></Label>
                <Select value={selectedTime} onValueChange={setSelectedTime} disabled={isLoading || !date}>
                    <SelectTrigger id="time">
                    <SelectValue placeholder={date ? "Select a time slot" : "Select date first"} />
                    </SelectTrigger>
                    <SelectContent>
                    {availableTimeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
            </div>

            <fieldset className="space-y-4 border p-4 rounded-md">
                <legend className="text-sm font-medium px-1 flex items-center gap-2">
                    <CarIcon className="h-4 w-4" />
                    Vehicle Information
                </legend>

                {userProfile && userVehicles.length > 0 && (
                    <div className="space-y-2">
                        <Label htmlFor="select-vehicle">Your Vehicle</Label>
                        <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId} disabled={isLoading}>
                            <SelectTrigger id="select-vehicle">
                                <SelectValue placeholder="Select your vehicle or add new" />
                            </SelectTrigger>
                            <SelectContent>
                                {userVehicles.map((vehicle) => (
                                    <SelectItem key={vehicle.id} value={vehicle.id!}>
                                        {vehicle.nickname} ({vehicle.make} {vehicle.model})
                                    </SelectItem>
                                ))}
                                <SelectItem value="addNew">Enter New Vehicle Details</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
                
                {loadingVehicles && userProfile && <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading your vehicles...</div>}

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="make">Vehicle Make <span className="text-destructive">*</span></Label>
                        <Input id="make" placeholder="e.g., Toyota" required value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} disabled={isLoading || !canEditVehicleDetails} readOnly={!canEditVehicleDetails} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="model">Vehicle Model</Label>
                        <Input id="model" placeholder="e.g., Corolla" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} disabled={isLoading || !canEditVehicleDetails} readOnly={!canEditVehicleDetails}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="year">Year</Label>
                        <Input id="year" type="number" placeholder="e.g., 2018" value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} disabled={isLoading || !canEditVehicleDetails} readOnly={!canEditVehicleDetails}/>
                    </div>
                </div>
                 {!canEditVehicleDetails && (
                     <p className="text-xs text-muted-foreground">To change vehicle details, select "Enter New Vehicle Details" or manage vehicles in your profile.</p>
                 )}
             </fieldset>

             {!userProfile && !sessionLoading && ( 
                  <fieldset className="space-y-4 border p-4 rounded-md">
                     <legend className="text-sm font-medium px-1">Contact Information (Guest)</legend>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2 relative">
                            <Label htmlFor="name">Your Name <span className="text-destructive">*</span></Label>
                             <User className="absolute left-2.5 top-[2.3rem] transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                            <Input
                                 id="name"
                                 placeholder="Full Name"
                                 required
                                 value={customerName}
                                 onChange={(e) => setCustomerName(e.target.value)}
                                 disabled={isLoading}
                                 className="pl-8"
                                 autoComplete="name"
                             />
                         </div>
                         <div className="space-y-2 relative">
                            <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                            <Mail className="absolute left-2.5 top-[2.3rem] transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                            <Input
                                 id="email"
                                 type="email"
                                 placeholder="you@example.com"
                                 required
                                 value={customerEmail}
                                 onChange={(e) => setCustomerEmail(e.target.value)}
                                 disabled={isLoading}
                                 className="pl-8"
                                 autoComplete="email"
                             />
                         </div>
                     </div>
                     <div className="space-y-2 relative">
                        <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
                        <Phone className="absolute left-2.5 top-[2.3rem] transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="+254 7XX XXX XXX"
                            required
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            disabled={isLoading}
                            className="pl-8"
                            autoComplete="tel"
                         />
                     </div>
                 </fieldset>
             )}

              <div className="space-y-2">
                <Label htmlFor="additional-info">Additional Information</Label>
                <Textarea
                    id="additional-info"
                    placeholder="Any specific requests or details about the issue? (e.g., 'Check strange noise from front right wheel')"
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    disabled={isLoading}
                />
             </div>

             {error && <p className="text-sm text-destructive text-center">{error}</p>}

             <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scheduling Appointment...</> : 'Book Appointment'}
             </Button>

           </form>
        </CardContent>
       </Card>
    </div>
  );
}

    