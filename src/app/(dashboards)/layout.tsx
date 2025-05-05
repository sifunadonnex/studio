'use client'; // Make this a client component to potentially manage sidebar state

import React from 'react';
import Link from 'next/link';
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
} from '@/components/ui/sidebar'; // Assuming sidebar component exists
import { Button } from '@/components/ui/button';
import { Home, Calendar, Wrench, MessageSquare, FileText, Users, Settings, Bell, BarChart2, LogOut, Car } from 'lucide-react';

// TODO: Fetch user role dynamically from session/auth context
const getUserRole = () => {
  // Placeholder: Replace with actual logic to get role (e.g., from context or session)
  if (typeof window !== 'undefined') {
     // Simple example using localStorage, replace with proper session handling
     return localStorage.getItem('userRole') || 'customer';
  }
  return 'customer';
};


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const userRole = getUserRole(); // Get the user role


    // Define navigation items based on role
    const getNavItems = (role: string) => {
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
            { href: '/appointments/manage', label: 'Manage Schedule', icon: Calendar },
             { href: '/maintenance/predictive', label: 'Maintenance Alerts', icon: Bell },
             // Staff might need a different chat link?
              { href: '/chat/staff', label: 'Customer Chats', icon: MessageSquare },
        ];

         const adminItems = [
             { href: '/admin/users', label: 'Manage Users', icon: Users },
             { href: '/admin/appointments', label: 'Manage Appointments', icon: Calendar },
             { href: '/admin/subscriptions', label: 'Manage Subscriptions', icon: FileText },
             { href: '/admin/services', label: 'Manage Services', icon: Wrench },
             { href: '/admin/reports', label: 'Generate Reports', icon: BarChart2 },
        ];


        switch (role) {
            case 'customer':
                return [...commonItems.slice(0, 1), ...customerItems, ...commonItems.slice(1)]; // Insert customer items
            case 'staff':
                 return [...commonItems.slice(0, 1), ...staffItems, ...commonItems.slice(1)];
            case 'admin':
                 return [...commonItems.slice(0, 1), ...adminItems, ...commonItems.slice(1)];
            default:
                return commonItems; // Default or for unauthenticated/error state
        }
    };

    const navItems = getNavItems(userRole);


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
               {/* TODO: Implement Logout */}
               <SidebarMenuButton onClick={() => { console.log("Logout clicked"); window.location.href='/login'; localStorage.removeItem('userRole'); }} tooltip="Logout">
                 <LogOut />
                 <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        {/* Mobile Header with Trigger */}
         <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
             <SidebarTrigger/>
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
