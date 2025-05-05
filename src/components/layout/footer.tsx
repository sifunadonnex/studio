import Link from 'next/link';
import { Car, MapPin, Phone, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-secondary border-t mt-auto">
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary mb-4">
               <Car className="h-6 w-6" />
              Top Autocorrect Garage
            </Link>
            <p className="text-sm text-muted-foreground">
              Providing reliable auto care in Ngong, Kajiado County since [Year Established - Placeholder]. Your trusted partner for all vehicle needs.
            </p>
          </div>

          {/* Quick Links Section */}
          <div>
            <h3 className="text-md font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/services" className="text-muted-foreground hover:text-foreground">Services</Link></li>
              <li><Link href="/book-appointment" className="text-muted-foreground hover:text-foreground">Book Appointment</Link></li>
              <li><Link href="/subscriptions" className="text-muted-foreground hover:text-foreground">Subscription Plans</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact Us</Link></li>
               <li><Link href="/dashboard" className="text-muted-foreground hover:text-foreground">My Account</Link></li>
            </ul>
          </div>

          {/* Contact Info Section */}
          <div>
            <h3 className="text-md font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 shrink-0 text-primary" />
                <span>Ngong Town, Kajiado County, Kenya</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <a href="tel:+254700000000" className="hover:text-foreground">+254 700 000 000</a> {/* Placeholder */}
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a href="mailto:info@topautocorrect.co.ke" className="hover:text-foreground">info@topautocorrect.co.ke</a> {/* Placeholder */}
              </li>
            </ul>
          </div>

           {/* Operating Hours */}
          <div>
            <h3 className="text-md font-semibold mb-4">Operating Hours</h3>
             <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Mon - Fri: 8:00 AM - 6:00 PM</li>
                <li>Saturday: 9:00 AM - 4:00 PM</li>
                <li>Sunday & Public Holidays: Closed</li>
            </ul>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Top Autocorrect Garage. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
