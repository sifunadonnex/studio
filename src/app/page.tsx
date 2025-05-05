import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarCheck, Car, Wrench, Users, Clock, MessageSquare, Star } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-secondary py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Welcome to Top Autocorrect Garage</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your trusted partner for reliable vehicle maintenance and repairs in Ngong, Kajiado County. Experience top-notch service with our predictive maintenance and easy online booking.
          </p>
          <Link href="/book-appointment" passHref>
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <CalendarCheck className="mr-2 h-5 w-5" /> Book Appointment
            </Button>
          </Link>
        </div>
      </section>

      {/* Services Overview Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Core Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <Car className="h-10 w-10 text-accent mb-4 mx-auto" />
                <CardTitle className="text-center">General Maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">Oil changes, tire rotation, fluid checks, and more to keep your car running smoothly.</p>
              </CardContent>
            </Card>
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <Wrench className="h-10 w-10 text-accent mb-4 mx-auto" />
                <CardTitle className="text-center">Repair Services</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">Expert diagnostics and repairs for brakes, engines, transmissions, and electrical systems.</p>
              </CardContent>
            </Card>
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                 <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-10 w-10 text-accent mb-4 mx-auto" // Adjusted class
                >
                  <path d="M12 2v4" />
                  <path d="M12 18v4" />
                  <path d="M4.93 4.93l2.83 2.83" />
                  <path d="M16.24 16.24l2.83 2.83" />
                  <path d="M2 12h4" />
                  <path d="M18 12h4" />
                  <path d="M4.93 19.07l2.83-2.83" />
                  <path d="M16.24 7.76l2.83-2.83" />
                   <circle cx="12" cy="12" r="2" />
                   <path d="M12 12a5 5 0 1 0 5 5" />
                </svg>
                <CardTitle className="text-center">Predictive Maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">Stay ahead of issues with our AI-powered system that predicts your next service needs.</p>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-12">
            <Link href="/services" passHref>
              <Button variant="outline">
                View All Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-secondary py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Top Autocorrect Garage?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Expert Technicians</h3>
              <p className="text-muted-foreground">Highly skilled and certified mechanics.</p>
            </div>
            <div>
              <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Convenient Booking</h3>
              <p className="text-muted-foreground">Easy online scheduling 24/7.</p>
            </div>
            <div>
               <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                   className="h-12 w-12 text-primary mx-auto mb-4"
                >
                 <path d="M12 12a5 5 0 1 0 5 5" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m4.93 19.07 1.41-1.41" />
                 <path d="m17.66 6.34 1.41-1.41" />
               </svg>
              <h3 className="text-xl font-semibold mb-2">Predictive Insights</h3>
              <p className="text-muted-foreground">AI-driven maintenance alerts.</p>
            </div>
            <div>
              <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Direct Communication</h3>
              <p className="text-muted-foreground">Integrated chat with our team.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section (Placeholder) */}
       <section className="py-16">
         <div className="container mx-auto px-4">
           <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             <Card className="bg-secondary border-none">
               <CardContent className="pt-6">
                 <div className="flex items-center mb-4">
                   {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />)}
                 </div>
                 <p className="text-muted-foreground mb-4 italic">"Excellent service! The predictive maintenance feature is a lifesaver. Highly recommend Top Autocorrect."</p>
                 <p className="font-semibold">- John Doe</p>
               </CardContent>
             </Card>
             <Card className="bg-secondary border-none">
               <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />)}
                 </div>
                 <p className="text-muted-foreground mb-4 italic">"Booking online was so easy, and the staff were very professional. My car runs perfectly now."</p>
                 <p className="font-semibold">- Jane Smith</p>
               </CardContent>
             </Card>
             <Card className="bg-secondary border-none">
               <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    {[...Array(4)].map((_, i) => <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />)}
                    <Star className="h-5 w-5 text-gray-300 fill-current" />
                 </div>
                 <p className="text-muted-foreground mb-4 italic">"Good service overall. The chat system was helpful for asking quick questions."</p>
                 <p className="font-semibold">- Alex Kiprop</p>
               </CardContent>
             </Card>
           </div>
         </div>
       </section>


      {/* Call to Action Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready for Hassle-Free Car Care?</h2>
          <p className="text-lg mb-8 max-w-xl mx-auto">
            Join our subscription plan for exclusive benefits or book your next service today.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <Link href="/book-appointment" passHref>
              <Button size="lg" variant="secondary" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                Book Now
              </Button>
            </Link>
            <Link href="/subscriptions" passHref>
              <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Explore Subscriptions
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
