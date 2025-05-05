{'use client';

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
// Import a (client-side) hook/utility to get session info if available
// This is a placeholder - implement based on your session management (context, zustand, etc.)
import { useSession } from '@/hooks/use-session'; // Assume this hook exists

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

// Assume a server action exists for booking
// import { bookAppointmentAction } from '@/actions/booking'; // Placeholder

export default function BookAppointmentPage() {
    const { toast } = useToast()
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


    // TODO: Replace with actual PHP/MySQL booking logic via Server Action or API route
    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingBooking(true);
        setError('');

        // Use details from session if logged in, otherwise from form state
        const currentName = session?.isLoggedIn ? session.user?.name : customerName;
        const currentEmail = session?.isLoggedIn ? session.user?.email : customerEmail;
        const currentPhone = session?.isLoggedIn ? session.user?.phone : customerPhone;


        if (!selectedService || !date || !selectedTime || !vehicleMake || !currentEmail || !currentPhone) {
            setError('Please fill in all required fields (Service, Date, Time, Vehicle Make, Email, Phone).');
            setLoadingBooking(false);
             toast({ title: "Missing Information", description: "Please fill all required fields.", variant: "destructive" });
            return;
        }

        const bookingData = {
            userId: session?.isLoggedIn ? session.user?.id : null, // Include userId if logged in
            serviceId: selectedService,
            serviceName: availableServices.find(s => s.id === selectedService)?.name,
            date: format(date, 'yyyy-MM-dd'),
            time: selectedTime,
            vehicleMake,
            vehicleModel,
            vehicleYear,
            customerName: currentName,
            customerEmail: currentEmail,
            customerPhone: currentPhone,
            additionalInfo,
        };

        console.log('Attempting booking with:', bookingData);

        // --- Simulate API Call (Replace with Server Action) ---
        // const result = await bookAppointmentAction(bookingData);
        await new Promise(resolve => setTimeout(resolve, 1500));
        const bookingSuccessful = true; // Simulate success
        const result = { success: bookingSuccessful, message: bookingSuccessful ? `Appointment for ${bookingData.serviceName} confirmed.` : "Failed to book." };
        // --- End Simulation ---


        if (result.success) {
             toast({
                 title: "Booking Successful!",
                 description: `Your appointment for ${bookingData.serviceName} on ${bookingData.date} at ${bookingData.time} is confirmed.`,
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
             if (!session?.isLoggedIn) {
                setCustomerName('');
                setCustomerEmail('');
                setCustomerPhone('');
             }
             // Optionally redirect: router.push('/appointments');
        } else {
            setError(result.message || 'Failed to book appointment. Please try again later.');
             toast({
                 title: "Booking Failed",
                 description: result.message || "Could not schedule your appointment. Please try again.",
                 variant: "destructive",
             })
        }

        setLoadingBooking(false);
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


             {/* Customer Information - Conditionally disable if logged in */}
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
                             disabled={isLoading || session?.isLoggedIn} // Disable if logged in
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
                             disabled={isLoading || session?.isLoggedIn} // Disable if logged in
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
                        disabled={isLoading || session?.isLoggedIn} // Disable if logged in
                        className="pl-8"
                        autoComplete="tel"
                     />
                 </div>
                 {session?.isLoggedIn && (
                    <p className="text-xs text-muted-foreground">Your contact details are pre-filled from your profile.</p>
                 )}
             </fieldset>

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