import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'; // Added SheetHeader and SheetTitle
import { Menu, Car } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'; // Import VisuallyHidden

export function Header() {
  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/services', label: 'Services' },
    { href: '/book-appointment', label: 'Book Appointment' },
    { href: '/subscriptions', label: 'Subscription' },
    { href: '/contact', label: 'Contact Us' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
           <Car className="h-6 w-6" />
          Top Autocorrect
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6 items-center">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/login" passHref>
             <Button variant="outline" size="sm">Login</Button>
          </Link>
           <Link href="/register" passHref>
             <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">Register</Button>
          </Link>
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
               {/* Add SheetHeader and visually hidden SheetTitle for accessibility */}
               <SheetHeader className="sr-only">
                   <SheetTitle>Mobile Navigation Menu</SheetTitle>
               </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                 <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary mb-4">
                    <Car className="h-6 w-6" />
                    Top Autocorrect
                  </Link>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-lg font-medium hover:text-primary"
                  >
                    {item.label}
                  </Link>
                ))}
                 <div className="mt-4 space-y-2">
                    <Link href="/login" passHref>
                       <Button variant="outline" className="w-full">Login</Button>
                    </Link>
                     <Link href="/register" passHref>
                       <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">Register</Button>
                    </Link>
                 </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
