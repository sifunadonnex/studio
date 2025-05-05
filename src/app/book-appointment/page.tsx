'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CalendarIcon, User, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation'; // Import router for potential redirect
import { useSession } from '@/hooks/use-session'; // Assume this hook exists
import { bookAppointmentAction, BookAppointmentInput, BookingResponse } from '@/actions/booking'; // Import server action

// Placeholder data - In a real app, fetch services and available slots from MySQL via PHP
const availableServices = [
  { id: '1', name: 'Standard Oil Change' },
  { id: '2', name: 'Synthetic Oil Change' },
  { id: '3', name: 'Brake Inspection & Pad Replacement (Front)' },
  { id: '4', name: 'Tire Rotation & Balancing' },
  { id: '5', name: 'Battery Check & Replacement' },
  { id: '6', name: 'Cooling System Flush' },
  { id: '7', name: 'Air Conditioning Service' },
  { id: '8', name: 'Comprehensive Vehicle Inspection' },
  { id: '9', name: 'Engine Diagnostics' },
  { id: 'other', name: 'Other (Specify below)' },
];

// Placeholder for available time slots - fetch dynamically based on selected date
const availableTimeSlots = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
];


export default function BookAppointmentPage() {
    const { toast } = useToast()
    const router = useRouter(); // Initialize router
    const { session, loading: sessionLoading } = useSession(); // Use the session hook
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

     // Handle pre-selected service from query params
     useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const serviceId = params.get('service');
        if (serviceId && availableServices.some(s => s.id === serviceId)) {
            setSelectedService(serviceId);
        }
        const vehicleIdParam = params.get('vehicle');
        // TODO: Fetch vehicle details based on vehicleIdParam if present and prefill make/model/year
         if(vehicleIdParam) console.log("Vehicle ID from param:", vehicleIdParam);

     }, []);

     // Pre-fill user details when session loads
    useEffect(() => {
        if (session?.isLoggedIn && session.user) {
            setCustomerName(session.user.name || '');
            setCustomerEmail(session.user.email || '');
            // Assuming phone number is part of user session/profile data fetched by useSession
             setCustomerPhone(session.user.phone || ''); // Add phone to useSession hook's data
        }
    }, [session]);


    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingBooking(true);
        setError('');

        // Get user ID from session if logged in
        const userId = session?.isLoggedIn ? session.user?.id : null;

        // Use details from session if logged in, otherwise from form state
        const currentName = session?.isLoggedIn ? session.user?.name : customerName;
        const currentEmail = session?.isLoggedIn ? session.user?.email : customerEmail;
        const currentPhone = session?.isLoggedIn ? session.user?.phone : customerPhone;


        if (!selectedService || !date || !selectedTime || !vehicleMake || (!userId && (!currentEmail || !currentPhone))) {
            setError('Please fill in all required fields (Service, Date, Time, Vehicle Make, and Email/Phone if not logged in).');
            setLoadingBooking(false);
             toast({ title: "Missing Information", description: "Please fill all required fields.", variant: "destructive" });
            return;
        }

        const bookingData: BookAppointmentInput = {
            userId: userId ?? undefined, // Pass userId or undefined
            serviceId: selectedService,
            date: format(date, 'yyyy-MM-dd'),
            time: selectedTime,
            vehicleMake,
            vehicleModel: vehicleModel || null, // Pass null if empty
            vehicleYear: vehicleYear || null, // Pass null if empty
            customerName: userId ? undefined : currentName, // Only send if not logged in
            customerEmail: userId ? undefined : currentEmail, // Only send if not logged in
            customerPhone: userId ? undefined : currentPhone, // Only send if not logged in
            additionalInfo: additionalInfo || null, // Pass null if empty
        };

        console.log('Attempting booking with:', bookingData);

        try {
            const result: BookingResponse = await bookAppointmentAction(bookingData); // Call Server Action

            if (result.success) {
                 toast({
                     title: "Booking Successful!",
                     description: `Your appointment for ${availableServices.find(s => s.id === selectedService)?.name} on ${bookingData.date} at ${bookingData.time} is confirmed. Appointment ID: ${result.appointmentId}`,
                     variant: "default",
                 })
                // Clear form or redirect
                 setSelectedService(undefined);
                 setDate(undefined);
                 setSelectedTime(undefined);
                 setVehicleMake('');
                 setVehicleModel('');
                 setVehicleYear('');
                 setAdditionalInfo('');
                 // Don't clear name/email/phone if logged in
                 if (!userId) {
                    setCustomerName('');
                    setCustomerEmail('');
                    setCustomerPhone('');
                 }
                 // Redirect to appointments page after successful booking
                  router.push('/appointments');
            } else {
                setError(result.message || 'Failed to book appointment. Please try again later.');
                 toast({
                     title: "Booking Failed",
                     description: result.message || "Could not schedule your appointment. Please try again.",
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

    const isLoading = loadingBooking || sessionLoading;

  return (
    <div className="container mx-auto px-4 py-16">
       <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Book Your Service</CardTitle>
          <CardDescription>Select your service, preferred date and time, and provide your vehicle details.</CardDescription>
           {session?.isLoggedIn && (
               <p className="text-sm text-green-600 pt-2">Booking as: {session.user?.name} ({session.user?.email})</p>
           )}
        </CardHeader>
        <CardContent>
           <form onSubmit={handleBooking} className="space-y-6">
              {/* Service Selection */}
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

             {/* Date Selection */}
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
                         disabled={(day) => day < new Date(new Date().setHours(0,0,0,0)) || day.getDay() === 0 } // Disable past dates and Sundays
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
            </div>

            {/* Time Selection */}
            <div className="space-y-2">
                <Label htmlFor="time">Preferred Time <span className="text-destructive">*</span></Label>
                <Select value={selectedTime} onValueChange={setSelectedTime} disabled={isLoading || !date}>
                    <SelectTrigger id="time">
                    <SelectValue placeholder={date ? "Select a time slot" : "Select date first"} />
                    </SelectTrigger>
                    <SelectContent>
                    {/* TODO: Fetch available slots based on selected date */}
                    {availableTimeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Vehicle Information */}
            <fieldset className="space-y-4 border p-4 rounded-md">
                <legend className="text-sm font-medium px-1">Vehicle Information</legend>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="make">Vehicle Make <span className="text-destructive">*</span></Label>
                        <Input id="make" placeholder="e.g., Toyota" required value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} disabled={isLoading} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="model">Vehicle Model</Label>
                        <Input id="model" placeholder="e.g., Corolla" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} disabled={isLoading}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="year">Year</Label>
                        <Input id="year" type="number" placeholder="e.g., 2018" value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} disabled={isLoading}/>
                    </div>
                </div>
             </fieldset>


             {/* Customer Information - Show only if NOT logged in */}
             {!session?.isLoggedIn && !sessionLoading && ( // Also check sessionLoading to avoid flicker
                  <fieldset className="space-y-4 border p-4 rounded-md">
                     <legend className="text-sm font-medium px-1">Contact Information</legend>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2 relative">
                            <Label htmlFor="name">Your Name</Label>
                             <User className="absolute left-2.5 top-[2.3rem] transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                            <Input
                                 id="name"
                                 placeholder="Full Name"
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

             {/* Additional Information */}
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
                {isLoading ? 'Scheduling Appointment...' : 'Book Appointment'}
             </Button>

           </form>
        </CardContent>
       </Card>
    </div>
  );
}
