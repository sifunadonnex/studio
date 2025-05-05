import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, Oil, Car, BatteryCharging, Thermometer, Settings, Wind, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

// Placeholder data - In a real app, fetch this from MySQL via PHP API/Server Action
const services = [
  {
    id: 1,
    title: 'Standard Oil Change',
    description: 'Includes up to 5 quarts of conventional oil, new oil filter, and lubrication of chassis components.',
    price: 'KES 3,500',
    icon: Oil,
  },
  {
    id: 2,
    title: 'Synthetic Oil Change',
    description: 'Includes up to 5 quarts of full synthetic oil, new premium oil filter, and chassis lubrication.',
    price: 'KES 6,000',
    icon: Oil,
  },
  {
    id: 3,
    title: 'Brake Inspection & Pad Replacement (Front)',
    description: 'Inspect brake system components and replace front brake pads. Rotors resurfacing/replacement extra.',
    price: 'KES 7,000 onwards',
    icon: ShieldCheck,
  },
   {
    id: 4,
    title: 'Tire Rotation & Balancing',
    description: 'Rotate tires to promote even wear and balance all four wheels for a smoother ride.',
    price: 'KES 2,500',
    icon: Settings,
  },
   {
    id: 5,
    title: 'Battery Check & Replacement',
    description: 'Test battery health and charging system. Price varies based on battery type if replacement is needed.',
    price: 'KES 1,500 (Check) / KES 8,000+ (Replacement)',
    icon: BatteryCharging,
  },
   {
    id: 6,
    title: 'Cooling System Flush',
    description: 'Flush old coolant and replace with new coolant to prevent overheating and corrosion.',
    price: 'KES 5,500',
    icon: Thermometer,
  },
  {
    id: 7,
    title: 'Air Conditioning Service',
    description: 'Inspect A/C system performance, check for leaks, and recharge refrigerant if necessary.',
    price: 'KES 4,500 (Inspection) / KES 7,000+ (Recharge)',
    icon: Wind,
  },
  {
    id: 8,
    title: 'Comprehensive Vehicle Inspection',
    description: 'Thorough check of all major vehicle systems, ideal for pre-purchase or long trips.',
    price: 'KES 5,000',
    icon: Car,
  },
  {
    id: 9,
    title: 'Engine Diagnostics',
    description: 'Advanced computer diagnostics to identify engine issues and check engine light causes.',
    price: 'KES 4,000',
    icon: Wrench,
  },
];

export default function ServicesPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-center text-primary mb-4">Our Services</h1>
      <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
        We offer a wide range of automotive services to keep your vehicle in peak condition. All prices are in Kenyan Shillings (KES).
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <Card key={service.id} className="flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex justify-center mb-4">
                   <Icon className="h-10 w-10 text-accent" />
                 </div>
                <CardTitle className="text-center">{service.title}</CardTitle>
                <CardDescription className="text-center h-20 overflow-hidden">{service.description}</CardDescription> {/* Fixed height */}
              </CardHeader>
              <CardContent className="flex flex-col items-center mt-auto pt-4"> {/* mt-auto pushes content down */}
                <p className="text-xl font-semibold text-primary mb-4">{service.price}</p>
                 <Link href={`/book-appointment?service=${service.id}`} passHref className="w-full">
                   <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                        Book This Service
                   </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

       <div className="text-center mt-16">
          <h2 className="text-2xl font-semibold mb-4">Can't Find What You Need?</h2>
          <p className="text-muted-foreground mb-6">
            Contact us for custom requests or more information about our services.
          </p>
          <Link href="/contact" passHref>
             <Button variant="outline" size="lg">
                Get in Touch
            </Button>
          </Link>
       </div>
    </div>
  );
}
