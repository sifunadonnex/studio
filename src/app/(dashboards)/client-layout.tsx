
'use client';

import React, { useState, useEffect } from 'react';
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
import { Home, Calendar, Wrench, MessageSquare, FileText, Users, Settings, Bell, BarChart2, LogOut, Car, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/actions/auth'; // Import UserProfile type

type UserRole = 'customer' | 'staff' | 'admin';

// Define navigation items based on role
const getNavItems = (role: UserRole | undefined) => { // Allow role to be undefined initially
    const commonItems = [
        { href: '/dashboard', label: 'Overview', icon: Home },
        { href: '/chat', label: 'Chat', icon: MessageSquare }, // Common for customer, staff might use /staff/chats
        { href: '/profile', label: 'Profile Settings', icon: Settings },
    ];

    const customerItems = [
        { href: '/appointments', label: 'My Appointments', icon: Calendar },
        { href: '/service-history', label: 'Service History', icon: Wrench },
        { href: '/subscriptions/manage', label: 'My Subscription', icon: FileText },
        { href: '/maintenance/predictive', label: 'Maintenance Alerts', icon: Bell },
    ];

    const staffItems = [
        { href: '/admin/appointments', label: 'Manage Appointments', icon: Calendar },
        { href: '/admin/users', label: 'View Users', icon: UserCog }, // Changed icon
        { href: '/staff/chats', label: 'Customer Chats', icon: MessageSquare },
        { href: '/maintenance/predictive', label: 'Maintenance Alerts', icon: Bell }, // Staff might also want this
    ];

     const adminItems = [
         { href: '/admin/users', label: 'Manage Users', icon: UserCog },
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
            // Remove /chat if it's covered by staff/chats for staff
            navItems = navItems.filter(item => role === 'customer' || item.href !== '/chat' || item.href === '/chat' && role === 'customer');
            break;
        case 'staff':
             navItems.splice(1, 0, ...staffItems); // Insert staff items after Overview
             // Staff specific chat link is in staffItems, remove generic /chat if present and not needed.
             navItems = navItems.filter(item => item.href !== '/chat' || item.href === '/staff/chats');
            break;
        case 'admin':
             navItems.splice(1, 0, ...adminItems); // Insert admin items after Overview
             // Admins might use /staff/chats or a dedicated admin chat view later. For now, keep their /chat or ensure it points to staff/chats if they use that.
             // Or if admin uses the global /chat for their own support, it can stay.
             // If admin should use staff chat:
             // navItems = navItems.filter(item => item.href !== '/chat' || item.href === '/staff/chats');
            break;
        default:
             console.warn("[ClientLayout] Unknown user role for sidebar:", role);
            // Optionally, provide a very basic set of nav items or just commonItems
            break;
    }
    return navItems;
};


interface DashboardClientLayoutProps {
  children: React.ReactNode;
  userProfile: UserProfile; // Expect the full UserProfile object
  logoutAction: () => Promise<{ success: boolean }>;
}

export default function DashboardClientLayout({ children, userProfile, logoutAction }: DashboardClientLayoutProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    
    useEffect(() => {
        console.log("[ClientLayout] Received userProfile:", userProfile);
    }, [userProfile]);

    const role = userProfile?.role; 
    const navItems = getNavItems(role);


    const handleLogout = async () => {
         setIsLoggingOut(true);
         try {
            const result = await logoutAction();
            if (result.success) {
                toast({ title: "Logged Out", description: "You have been successfully logged out." });
                router.push('/login');
                router.refresh();
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
         <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
             <SidebarTrigger/>
             <h1 className="flex-1 text-lg font-semibold text-primary">Dashboard</h1>
         </header>
        <div className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
