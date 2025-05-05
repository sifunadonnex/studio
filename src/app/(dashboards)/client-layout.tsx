'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import useRouter
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Home, Calendar, Wrench, MessageSquare, FileText, Users, Settings, Bell, BarChart2, LogOut, Car } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'customer' | 'staff' | 'admin';

// Define navigation items based on role
const getNavItems = (role: UserRole) => {
    const commonItems = [
        { href: '/dashboard', label: 'Overview', icon: Home },
        { href: '/chat', label: 'Chat', icon: MessageSquare },
        { href: '/profile', label: 'Profile Settings', icon: Settings },
    ];

    const customerItems = [
        { href: '/appointments', label: 'My Appointments', icon: Calendar },
        { href: '/service-history', label: 'Service History', icon: Wrench },
        { href: '/subscriptions/manage', label: 'My Subscription', icon: FileText },
        { href: '/maintenance/predictive', label: 'Maintenance Alerts', icon: Bell },
    ];

    const staffItems = [
        // Example staff routes - adjust as needed
        { href: '/staff/schedule', label: 'My Schedule', icon: Calendar },
        { href: '/staff/tasks', label: 'Assigned Tasks', icon: Wrench },
        { href: '/staff/chats', label: 'Customer Chats', icon: MessageSquare }, // Potentially different chat view
        { href: '/maintenance/predictive', label: 'Maintenance Alerts', icon: Bell }, // Staff might view all alerts
    ];

     const adminItems = [
         { href: '/admin/users', label: 'Manage Users', icon: Users },
         { href: '/admin/appointments', label: 'Manage Appointments', icon: Calendar },
         { href: '/admin/subscriptions', label: 'Manage Subscriptions', icon: FileText },
         { href: '/admin/services', label: 'Manage Services', icon: Wrench },
         { href: '/admin/reports', label: 'Generate Reports', icon: BarChart2 },
    ];

    // Base items visible to all logged-in users
    let navItems = [...commonItems];

    // Add role-specific items
    switch (role) {
        case 'customer':
            navItems.splice(1, 0, ...customerItems); // Insert customer items after Overview
            break;
        case 'staff':
             navItems.splice(1, 0, ...staffItems); // Insert staff items after Overview
             // Staff might not need profile/settings directly? Adjust commonItems if needed.
            break;
        case 'admin':
             navItems.splice(1, 0, ...adminItems); // Insert admin items after Overview
             // Admin might need profile/settings? Keep commonItems.
            break;
        default:
            // Fallback or basic view if role is unknown (should ideally not happen if session is valid)
             console.warn("Unknown user role in sidebar:", role);
            break;
    }
    return navItems;
};


interface DashboardClientLayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
  logoutAction: () => Promise<{ success: boolean }>; // Accept logout server action
}

export default function DashboardClientLayout({ children, userRole, logoutAction }: DashboardClientLayoutProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoggingOut, setIsLoggingOut] = useState(false); // Add loading state for logout
    const navItems = getNavItems(userRole);


    const handleLogout = async () => {
         setIsLoggingOut(true);
         try {
            const result = await logoutAction(); // Call the passed server action
            if (result.success) {
                toast({ title: "Logged Out", description: "You have been successfully logged out." });
                router.push('/login'); // Redirect client-side after logout
                router.refresh(); // Ensure layout re-renders without old session data
            } else {
                 toast({ title: "Logout Failed", description: "Could not log you out. Please try again.", variant: "destructive" });
            }
        } catch (error) {
             console.error("Logout error:", error);
             toast({ title: "Logout Error", description: "An unexpected error occurred during logout.", variant: "destructive" });
        } finally {
            setIsLoggingOut(false);
        }
    };

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar>
        <SidebarHeader>
           <div className="flex items-center gap-2 p-2 font-bold text-lg text-sidebar-primary">
             <Car className="h-6 w-6" />
              <span className="group-data-[collapsible=icon]:hidden">Top Autocorrect</span>
           </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => {
               const Icon = item.icon;
               return (
                <SidebarMenuItem key={item.href}>
                   {/* Use standard Link for client-side navigation */}
                   <Link href={item.href} passHref legacyBehavior>
                     <SidebarMenuButton tooltip={item.label}>
                        <Icon />
                         <span>{item.label}</span>
                     </SidebarMenuButton>
                   </Link>
                 </SidebarMenuItem>
               );
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
               <SidebarMenuButton onClick={handleLogout} tooltip="Logout" disabled={isLoggingOut}>
                 <LogOut />
                 <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        {/* Mobile Header with Trigger */}
         <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
             <SidebarTrigger/>
             {/* TODO: Dynamically set header title based on current page */}
             <h1 className="flex-1 text-lg font-semibold text-primary">Dashboard</h1>
              {/* Optional: Add profile dropdown or other actions for mobile */}
         </header>
        {/* Main Content Area */}
        <div className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}