
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, Wrench, MessageSquare, User, FileText, Bell, Car, BarChart2, Users, Settings, Info } from "lucide-react";
import { getUserSession } from "@/actions/auth"; // Import session utility
import { redirect } from 'next/navigation';

// This is now a Server Component

export default async function DashboardPage() {
    const session = await getUserSession();

    if (!session) {
        // This should ideally be caught by middleware, but serves as a backup
        redirect('/login?redirect=/dashboard');
    }

    const userRole = session.role;

    return (
        <div className="container mx-auto px-4 py-12">
             <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
                 {/* Logout button is now in the Sidebar */}
             </div>

            {/* Welcome Message */}
             <Card className="mb-8 bg-secondary border-none">
                 <CardHeader>
                     <CardTitle>Welcome back, {session.name || 'User'}!</CardTitle>
                     <CardDescription>Here's a quick overview of your account.</CardDescription>
                </CardHeader>
             </Card>


            {/* Content varies based on role */}
            {userRole === "customer" && <CustomerDashboard />}
            {userRole === "staff" && <StaffDashboard />}
            {userRole === "admin" && <AdminDashboard />}

            {/* Fallback for unknown role - Should not happen if session is valid */}
            {userRole !== "customer" && userRole !== "staff" && userRole !== "admin" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Could not determine user role. Please contact support.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}


// --- Role-Specific Dashboard Components ---

function CustomerDashboard() {
  // TODO: Fetch real data (upcoming appointment, prediction, messages) server-side and pass as props
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Upcoming Appointment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Upcoming Appointment</CardTitle>
          <CardDescription>Your next scheduled service.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No upcoming appointments.</p>
          {/* <p><strong>Service:</strong> Standard Oil Change</p>
          <p><strong>Date:</strong> October 26, 2024</p>
          <p><strong>Time:</strong> 10:00 AM</p> */}
          <Link href="/appointments" passHref>
            <Button variant="outline" size="sm" className="mt-4 w-full">Manage Appointments</Button>
          </Link>
        </CardContent>
      </Card>

      {/* Predictive Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-accent" /> Predictive Maintenance</CardTitle>
          <CardDescription>Estimated next service needed.</CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-muted-foreground">No maintenance predictions available yet.</p>
           <p className="text-xs text-muted-foreground mt-1">Add a vehicle and service history in your profile to enable predictions.</p>
           {/* <p>Next recommended service: <strong>Brake Inspection</strong></p>
           <p>Estimated Date: <strong>November 15, 2024</strong></p> */}
           <Link href="/maintenance/predictive" passHref>
               <Button variant="secondary" size="sm" className="mt-4 w-full">View Details</Button>
           </Link>
        </CardContent>
      </Card>

      {/* My Subscription */}
       <Card>
        <CardHeader>
           <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> My Subscription</CardTitle>
            <CardDescription>Your current plan details.</CardDescription>
        </CardHeader>
         <CardContent>
            <p className="text-muted-foreground">No active subscription found.</p>
            {/* <p><strong>Plan:</strong> Monthly Care Plan</p>
            <p><strong>Status:</strong> Active</p>
             <p><strong>Next Billing Date:</strong> November 1, 2024</p> */}
           <Link href="/subscriptions/manage" passHref>
                <Button variant="outline" size="sm" className="mt-4 w-full">Manage Subscription</Button>
            </Link>
        </CardContent>
       </Card>

       {/* Quick Actions */}
       <Card className="md:col-span-2 lg:col-span-1">
         <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
         </CardHeader>
         <CardContent className="space-y-3">
             <Link href="/book-appointment" passHref className="block">
                <Button className="w-full" variant="default"><Calendar className="mr-2 h-4 w-4" /> Book New Service</Button>
            </Link>
             <Link href="/service-history" passHref className="block">
                <Button className="w-full" variant="outline"><Wrench className="mr-2 h-4 w-4" /> View Service History</Button>
            </Link>
            <Link href="/chat" passHref className="block">
                 <Button className="w-full" variant="outline"><MessageSquare className="mr-2 h-4 w-4" /> Chat With Staff</Button>
            </Link>
             <Link href="/profile" passHref className="block">
                 <Button className="w-full" variant="outline"><User className="mr-2 h-4 w-4" /> Update Profile</Button>
             </Link>
         </CardContent>
       </Card>

        {/* Recent Messages (Placeholder) */}
         <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Recent Messages</CardTitle>
                 <CardDescription>Latest communications with our team.</CardDescription>
            </CardHeader>
            <CardContent>
                 <p className="text-muted-foreground text-sm p-4 border rounded-md">
                    No recent messages.
                 </p>
                 <Link href="/chat" passHref>
                     <Button variant="link" size="sm" className="mt-2">View All Messages</Button>
                </Link>
            </CardContent>
         </Card>

    </div>
  );
}

function StaffDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
           <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Today's Schedule</CardTitle>
           <CardDescription>Appointments assigned or needing attention.</CardDescription>
        </CardHeader>
         <CardContent>
           <p className="text-muted-foreground">No appointments scheduled for today.</p>
           <Link href="/staff/schedule" passHref> {/* Adjust link as needed */}
                <Button variant="outline" size="sm" className="mt-4">View Full Schedule</Button>
            </Link>
        </CardContent>
      </Card>

       <Card>
         <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Customer Chats</CardTitle>
            <CardDescription>Unread or ongoing conversations.</CardDescription>
         </CardHeader>
          <CardContent>
             <p className="text-muted-foreground text-sm p-2 border rounded-md mb-2">
                 No active customer chats.
            </p>
            <Link href="/staff/chats" passHref> {/* Adjust link as needed */}
                 <Button variant="link" size="sm" className="mt-2">Open Chat Interface</Button>
            </Link>
         </CardContent>
       </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-accent" /> Maintenance Alerts</CardTitle>
          <CardDescription>Vehicles flagged for upcoming service.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No maintenance alerts at this time.</p>
           <Link href="/maintenance/predictive" passHref> {/* Adjust link as needed */}
              <Button variant="outline" size="sm" className="mt-4 w-full">View All Alerts</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard() {
  return (
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
             <CardHeader>
                 <CardTitle className="text-lg">Today's Bookings</CardTitle>
             </CardHeader>
            <CardContent>
                 <p className="text-3xl font-bold">0</p>
                 <p className="text-xs text-muted-foreground">N/A</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                 <CardTitle className="text-lg">Active Subscriptions</CardTitle>
             </CardHeader>
             <CardContent>
                <p className="text-3xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">N/A</p>
             </CardContent>
        </Card>
       <Card>
            <CardHeader>
                <CardTitle className="text-lg">Pending Chats</CardTitle>
             </CardHeader>
            <CardContent>
                 <p className="text-3xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">N/A</p>
             </CardContent>
       </Card>
        <Card>
             <CardHeader>
                 <CardTitle className="text-lg">Est. Monthly Revenue</CardTitle>
             </CardHeader>
            <CardContent>
                 <p className="text-3xl font-bold">KES 0</p>
                 <p className="text-xs text-muted-foreground">N/A</p>
             </CardContent>
       </Card>

        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Management</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
                <Link href="/admin/users" passHref><Button variant="outline" className="w-full"><Users className="mr-2 h-4 w-4" /> Manage Users</Button></Link>
                <Link href="/admin/appointments" passHref><Button variant="outline" className="w-full"><Calendar className="mr-2 h-4 w-4" /> Manage Appointments</Button></Link>
                <Link href="/admin/subscriptions" passHref><Button variant="outline" className="w-full"><FileText className="mr-2 h-4 w-4" /> Manage Subscriptions</Button></Link>
                 <Link href="/admin/services" passHref><Button variant="outline" className="w-full"><Wrench className="mr-2 h-4 w-4" /> Manage Services</Button></Link>
           </CardContent>
        </Card>

        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Reports</CardTitle>
                 <CardDescription>Generate insights from garage data.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2 text-sm">
                 <Link href="/admin/reports" passHref className="mt-2">
                     <Button variant="secondary" size="sm" className="w-full"><BarChart2 className="mr-2 h-4 w-4"/> View All Reports</Button>
                </Link>
                 <div className="p-4 border rounded-md bg-muted/50 mt-2">
                    <div className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-muted-foreground"/>
                        <p className="text-sm text-muted-foreground">Reporting features are under development. </p>
                    </div>
                </div>
            </CardContent>
        </Card>
     </div>
  );
}
