'use client'; // Keep as client component for Sheet interaction and session checking

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Car, LogOut, User } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useState, useEffect } from 'react'; // For managing client-side session state
import { logoutUser } from '@/actions/auth'; // Import logout action
import { useRouter } from 'next/navigation';

// Simplified session structure for client-side check
interface ClientSession {
    isLoggedIn: boolean;
}

export function Header() {
  const router = useRouter();
  const [session, setSession] = useState<ClientSession | null>(null); // Start with null state
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Fetch session state on the client side after mount
  useEffect(() => {
    // In a real app, you might fetch this from context or an API route
    // Here, we simulate checking if the session cookie exists (basic check)
    const checkSession = () => {
         // Basic check - does the cookie exist? More robust checks needed for production.
         const hasSessionCookie = document.cookie.includes('session=');
         setSession({ isLoggedIn: hasSessionCookie });
    };
    checkSession();

     // Add event listener for potential session changes (e.g., after login/logout)
     // This is a simple polling mechanism; use context or libraries like SWR/React Query for better state sync.
     const intervalId = setInterval(checkSession, 5000); // Check every 5 seconds
     return () => clearInterval(intervalId);

  }, []);


  const handleLogout = async () => {
    await logoutUser();
    setSession({ isLoggedIn: false }); // Update client state immediately
    setIsSheetOpen(false); // Close sheet on logout
    router.push('/login'); // Redirect to login
    router.refresh(); // Refresh server components
  };


  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/services', label: 'Services' },
    { href: '/book-appointment', label: 'Book Appointment' },
    { href: '/subscriptions', label: 'Subscription' },
    { href: '/contact', label: 'Contact Us' },
  ];

  const renderAuthButtons = (isMobile = false) => {
    if (session === null) {
      // Loading state - Render placeholders or nothing
      return isMobile ? (
          <div className="mt-4 space-y-2">
              <div className="h-10 bg-gray-200 rounded animate-pulse w-full"></div>
              <div className="h-10 bg-gray-300 rounded animate-pulse w-full"></div>
          </div>
      ) : (
          <div className="flex gap-2 items-center">
              <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-9 w-20 bg-gray-300 rounded animate-pulse"></div>
          </div>
      );
    }

    if (session.isLoggedIn) {
      return (
        <>
          <Link href="/dashboard" passHref>
            <Button variant={isMobile ? "outline" : "ghost"} size={isMobile ? "default" : "sm"} className={isMobile ? "w-full" : ""}>
                <User className={isMobile ? "mr-2 h-4 w-4" : "h-4 w-4"}/> {isMobile ? 'Dashboard' : ''}
                <span className="sr-only">Dashboard</span>
            </Button>
          </Link>
          <Button onClick={handleLogout} variant={isMobile ? "destructive" : "outline"} size={isMobile ? "default" : "sm"} className={isMobile ? "w-full" : ""}>
             <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </>
      );
    } else {
      return (
        <>
          <Link href="/login" passHref>
            <Button variant="outline" size={isMobile ? "default" : "sm"} className={isMobile ? "w-full" : ""}>Login</Button>
          </Link>
          <Link href="/register" passHref>
            <Button size={isMobile ? "default" : "sm"} className={`bg-accent hover:bg-accent/90 text-accent-foreground ${isMobile ? "w-full" : ""}`}>Register</Button>
          </Link>
        </>
      );
    }
  };


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
          <div className="flex gap-2 items-center">
             {renderAuthButtons()}
          </div>
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-2">
            {/* Conditionally render a smaller dashboard icon if logged in */}
            {session?.isLoggedIn && (
                 <Link href="/dashboard" passHref>
                    <Button variant="ghost" size="icon">
                         <User className="h-5 w-5"/>
                         <span className="sr-only">Dashboard</span>
                    </Button>
                </Link>
            )}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
               <SheetHeader className="sr-only">
                   <SheetTitle>Mobile Navigation Menu</SheetTitle>
               </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                 <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary mb-4" onClick={() => setIsSheetOpen(false)}>
                    <Car className="h-6 w-6" />
                    Top Autocorrect
                  </Link>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-lg font-medium hover:text-primary"
                    onClick={() => setIsSheetOpen(false)} // Close sheet on link click
                  >
                    {item.label}
                  </Link>
                ))}
                 <div className="mt-4 space-y-2">
                     {renderAuthButtons(true)}
                 </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}