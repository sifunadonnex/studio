
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
import { useRouter } from 'next/navigation'; 
import { useSession } from '@/hooks/use-session'; 
import { bookAppointmentAction, BookAppointmentInput, BookingResponse } from '@/actions/booking'; 

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
    const { session, loading: sessionLoading } = useSession(); 
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

     useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const serviceId = params.get('service');
        if (serviceId && availableServices.some(s => s.id === serviceId)) {
            setSelectedService(serviceId);
        }
        const vehicleIdParam = params.get('vehicle');
         if(vehicleIdParam) console.log("Vehicle ID from param:", vehicleIdParam); // TODO: Fetch vehicle details
     }, []);

    useEffect(() => {
        if (session?.isLoggedIn && session.user) {
            setCustomerName(session.user.name || '');
            setCustomerEmail(session.user.email || '');
            setCustomerPhone(session.user.phone || ''); 
        }
    }, [session]);


    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingBooking(true);
        setError('');

        const userId = session?.isLoggedIn ? session.user?.id : null;
        const currentName = userId ? session.user?.name : customerName;
        const currentEmail = userId ? session.user?.email : customerEmail;
        const currentPhone = userId ? session.user?.phone : customerPhone;

        const serviceDetails = availableServices.find(s => s.id === selectedService);

        if (!selectedService || !serviceDetails || !date || !selectedTime || !vehicleMake || (!userId && (!currentName || !currentEmail || !currentPhone))) {
            setError('Please fill in all required fields (Service, Date, Time, Vehicle Make, and Name/Email/Phone if not logged in).');
            setLoadingBooking(false);
             toast({ title: "Missing Information", description: "Please fill all required fields.", variant: "destructive" });
            return;
        }

        const bookingData: BookAppointmentInput = {
            userId: userId ?? undefined,
            serviceId: selectedService,
            serviceName: serviceDetails.name, // Pass service name
            date: format(date, 'yyyy-MM-dd'),
            time: selectedTime,
            vehicleMake,
            vehicleModel: vehicleModel || null,
            vehicleYear: vehicleYear || null,
            customerName: userId ? undefined : currentName,
            customerEmail: userId ? undefined : currentEmail,
            customerPhone: userId ? undefined : currentPhone,
            additionalInfo: additionalInfo || null,
        };

        console.log('Attempting booking with:', bookingData);

        try {
            const result: BookingResponse = await bookAppointmentAction(bookingData); 

            if (result.success) {
                 toast({
                     title: "Booking Successful!",
                     description: `Your appointment for ${serviceDetails.name} on ${bookingData.date} at ${bookingData.time} is confirmed. Appointment ID: ${result.appointmentId}`,
                 })
                 setSelectedService(undefined);
                 setDate(undefined);
                 setSelectedTime(undefined);
                 setVehicleMake('');
                 setVehicleModel('');
                 setVehicleYear('');
                 setAdditionalInfo('');
                 if (!userId) {
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

             {!session?.isLoggedIn && !sessionLoading && ( 
                  <fieldset className="space-y-4 border p-4 rounded-md">
                     <legend className="text-sm font-medium px-1">Contact Information</legend>
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
                {isLoading ? 'Scheduling Appointment...' : 'Book Appointment'}
             </Button>

           </form>
        </CardContent>
       </Card>
    </div>
  );
}
