
// This remains a Server Component to fetch session data securely
import React from 'react';
import { getUserSession, logoutUser, UserProfile } from '@/actions/auth'; // Import UserProfile type
import DashboardClientLayout from './client-layout'; 
import { redirect } from 'next/navigation';
// SessionProvider is no longer imported or used here, as it's in the root layout

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const session: UserProfile | null = await getUserSession();

    if (!session) {
        console.log("Dashboard Layout: No session found, redirecting to login.");
        // Preserve the intended path for redirection after login
        const currentPath = (children as React.ReactElement)?.props?.childProp?.segment ?? 'dashboard'; // Heuristic to get current path
        redirect(`/login?redirect=/${currentPath}`);
    }

    // console.log("Dashboard Layout: Rendering with user profile:", session);

    return (
      // SessionProvider is now handled by the root layout.
      // DashboardClientLayout receives userProfile as a prop.
      // Deeper client components within {children} can use useUserSession() hook
      // which will get its value from the root SessionProvider.
      <DashboardClientLayout userProfile={session} logoutAction={logoutUser}>
          {children}
     </DashboardClientLayout>
    );
}
