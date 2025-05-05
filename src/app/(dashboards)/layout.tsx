// This remains a Server Component to fetch session data securely
import React from 'react';
import { getUserSession, logoutUser } from '@/actions/auth'; // Import session check and logout
import DashboardClientLayout from './client-layout'; // Import the new client component wrapper
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const session = await getUserSession();

    // If no session, redirect to login (redundant due to middleware, but good practice)
    if (!session) {
        console.log("Dashboard Layout: No session found, redirecting to login.");
        redirect('/login?redirect=/dashboard');
    }

    console.log("Dashboard Layout: Rendering with user role:", session.role);


  return (
     // Pass session data (or just the role) to the client component
     // Pass the server action for logout
      <DashboardClientLayout userRole={session.role} logoutAction={logoutUser}>
            {children}
       </DashboardClientLayout>
  );
}