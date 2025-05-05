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
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast" // Import useToast


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
    const { toast } = useToast() // Initialize useToast
    const [selectedService, setSelectedService] = useState<string | undefined>(undefined);
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
    const [vehicleMake, setVehicleMake] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');
    const [vehicleYear, setVehicleYear] = useState('');
    const [customerName, setCustomerName] = useState(''); // Assuming user might not be logged in
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [additionalInfo, setAdditionalInfo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Handle pre-selected service from query params
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const serviceId = params.get('service');
        if (serviceId && availableServices.some(s => s.id === serviceId)) {
            setSelectedService(serviceId);
        }
    }, []);


    // TODO: Replace with actual PHP/MySQL booking logic via Server Action or API route
    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!selectedService || !date || !selectedTime || !vehicleMake || !customerEmail || !customerPhone) {
            setError('Please fill in all required fields.');
            setLoading(false);
            return;
        }

        const bookingData = {
            serviceId: selectedService,
            serviceName: availableServices.find(s => s.id === selectedService)?.name,
            date: format(date, 'yyyy-MM-dd'),
            time: selectedTime,
            vehicleMake,
            vehicleModel,
            vehicleYear,
            customerName,
            customerEmail,
            customerPhone,
            additionalInfo,
        };

        console.log('Attempting booking with:', bookingData);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Placeholder logic - replace with actual booking creation in DB
        const bookingSuccessful = true; // Simulate success

        if (bookingSuccessful) {
             toast({
                 title: "Booking Successful!",
                 description: `Your appointment for ${bookingData.serviceName} on ${bookingData.date} at ${bookingData.time} is confirmed.`,
                 variant: "default", // Use default style (can be 'destructive' for errors)
             })
            // Clear form or redirect
             setSelectedService(undefined);
             setDate(undefined);
             setSelectedTime(undefined);
             setVehicleMake('');
             setVehicleModel('');
             setVehicleYear('');
             setCustomerName('');
             setCustomerEmail('');
             setCustomerPhone('');
             setAdditionalInfo('');
        } else {
            setError('Failed to book appointment. Please try again later.');
             toast({
                 title: "Booking Failed",
                 description: "Could not schedule your appointment. Please try again.",
                 variant: "destructive",
             })
        }

        setLoading(false);
    };

  return (
    <div className="container mx-auto px-4 py-16">
       <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Book Your Service</CardTitle>
          <CardDescription>Select your service, preferred date and time, and provide your vehicle details.</CardDescription>
        </CardHeader>
        <CardContent>
           <form onSubmit={handleBooking} className="space-y-6">
              {/* Service Selection */}
             <div className="space-y-2">
                <Label htmlFor="service">Service Type <span className="text-destructive">*</span></Label>
                 <Select value={selectedService} onValueChange={setSelectedService} disabled={loading}>
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
                        disabled={loading}
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
                <Select value={selectedTime} onValueChange={setSelectedTime} disabled={loading || !date}>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="make">Vehicle Make <span className="text-destructive">*</span></Label>
                    <Input id="make" placeholder="e.g., Toyota" required value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} disabled={loading} />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="model">Vehicle Model</Label>
                    <Input id="model" placeholder="e.g., Corolla" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} disabled={loading}/>
                 </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input id="year" type="number" placeholder="e.g., 2018" value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} disabled={loading}/>
                  </div>
            </div>

            {/* Customer Information */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input id="name" placeholder="Full Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} disabled={loading}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                    <Input id="email" type="email" placeholder="you@example.com" required value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} disabled={loading}/>
                </div>
             </div>
              <div className="space-y-2">
                 <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
                 <Input id="phone" type="tel" placeholder="+254 7XX XXX XXX" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} disabled={loading}/>
              </div>

             {/* Additional Information */}
              <div className="space-y-2">
                <Label htmlFor="additional-info">Additional Information</Label>
                <Textarea
                    id="additional-info"
                    placeholder="Any specific requests or details about the issue? (Optional)"
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    disabled={loading}
                />
             </div>

             {error && <p className="text-sm text-destructive text-center">{error}</p>}

             <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? 'Scheduling Appointment...' : 'Book Appointment'}
             </Button>

           </form>
        </CardContent>
       </Card>
    </div>
  );
}
