import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, Wrench, MessageSquare, User, FileText, Bell, LogOut } from "lucide-react";

// TODO: Implement role-based logic to show correct dashboard content
// Fetch user role from session (via PHP/MySQL)

export default function DashboardPage() {
  // Placeholder: Determine user role (customer, staff, admin)
  const userRole = "customer"; // Change this based on actual session data

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
         {/* TODO: Add Logout functionality */}
        <Button variant="outline" size="sm">
             <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>

      {/* Content will vary based on role */}
      {userRole === "customer" && <CustomerDashboard />}
      {userRole === "staff" && <StaffDashboard />}
      {userRole === "admin" && <AdminDashboard />}

      {/* Fallback for unknown role */}
      {userRole !== "customer" && userRole !== "staff" && userRole !== "admin" && (
          <Card>
              <CardHeader>
                  <CardTitle>Access Denied</CardTitle>
              </CardHeader>
              <CardContent>
                 <p>Your role could not be determined. Please log in again or contact support.</p>
                  <Link href="/login" passHref>
                      <Button variant="link" className="mt-4">Go to Login</Button>
                   </Link>
              </CardContent>
          </Card>
      )}
    </div>
  );
}


// --- Placeholder Dashboard Components ---

function CustomerDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Upcoming Appointment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Upcoming Appointment</CardTitle>
          <CardDescription>Your next scheduled service.</CardDescription>
        </CardHeader>
        <CardContent>
          <p><strong>Service:</strong> Standard Oil Change</p>
          <p><strong>Date:</strong> October 26, 2024</p>
          <p><strong>Time:</strong> 10:00 AM</p>
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
          <p>Next recommended service: <strong>Brake Inspection</strong></p>
          <p>Estimated Date: <strong>November 15, 2024</strong></p>
           <p className="text-xs text-muted-foreground mt-2">Based on your service history.</p>
           <Link href="/book-appointment?service=3" passHref> {/* Link to book brake service */}
               <Button variant="secondary" size="sm" className="mt-4 w-full">Book Now</Button>
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
            <p><strong>Plan:</strong> Monthly Care Plan</p>
            <p><strong>Status:</strong> Active</p>
             <p><strong>Next Billing Date:</strong> November 1, 2024</p>
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
                {/* TODO: Fetch and display recent messages */}
                 <p className="text-muted-foreground text-sm p-4 border rounded-md">
                    <strong>Staff:</strong> Hi [Customer Name], your vehicle is ready for pickup.
                     <span className="block text-xs mt-1">October 25, 2024, 3:30 PM</span>
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
       {/* Today's Appointments */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
           <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Today's Schedule</CardTitle>
           <CardDescription>Appointments assigned to you or needing attention.</CardDescription>
        </CardHeader>
         <CardContent>
           {/* TODO: Fetch and display appointments (Table or List) */}
            <p className="text-muted-foreground">10:00 AM - John Doe - Standard Oil Change (Toyota Corolla)</p>
           <p className="text-muted-foreground">11:00 AM - Jane Smith - Brake Inspection (Nissan X-Trail)</p>
            <p className="text-muted-foreground">02:00 PM - Alex Kiprop - Engine Diagnostics (Subaru Forester)</p>
           <Link href="/appointments/manage" passHref>
                <Button variant="outline" size="sm" className="mt-4">View Full Schedule</Button>
            </Link>
        </CardContent>
      </Card>

       {/* Customer Chats */}
       <Card>
         <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Customer Chats</CardTitle>
            <CardDescription>Unread or ongoing conversations.</CardDescription>
         </CardHeader>
          <CardContent>
             {/* TODO: Fetch and display active chats */}
             <p className="text-muted-foreground text-sm p-2 border rounded-md mb-2">
                 <strong>Customer: Alex K.</strong> - "Is my car ready yet?" <span className="block text-xs mt-1">2 mins ago</span>
            </p>
            <p className="text-muted-foreground text-sm p-2 border rounded-md">
                 <strong>Customer: Mary W.</strong> - "Can I reschedule my appointment?" <span className="block text-xs mt-1">1 hour ago</span>
            </p>
            <Link href="/chat/staff" passHref>
                 <Button variant="link" size="sm" className="mt-2">Open Chat Interface</Button>
            </Link>
         </CardContent>
       </Card>

      {/* Predictive Maintenance Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-accent" /> Maintenance Alerts</CardTitle>
          <CardDescription>Vehicles flagged for upcoming service.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* TODO: Fetch and display alerts */}
          <p className="text-sm"><strong>Vehicle:</strong> KDA 123X (Toyota Prado) - Est. Battery Check Needed</p>
          <p className="text-sm"><strong>Vehicle:</strong> KDB 456Y (Honda CRV) - Est. Tire Rotation Due</p>
           <Link href="/maintenance/predictive" passHref>
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
        {/* Key Metrics */}
        <Card>
             <CardHeader>
                 <CardTitle className="text-lg">Today's Bookings</CardTitle>
             </CardHeader>
            <CardContent>
                 <p className="text-3xl font-bold">15</p>
                 <p className="text-xs text-muted-foreground">+2 from yesterday</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                 <CardTitle className="text-lg">Active Subscriptions</CardTitle>
             </CardHeader>
             <CardContent>
                <p className="text-3xl font-bold">128</p>
                <p className="text-xs text-muted-foreground">Monthly: 95, Yearly: 33</p>
             </CardContent>
        </Card>
       <Card>
            <CardHeader>
                <CardTitle className="text-lg">Pending Chats</CardTitle>
             </CardHeader>
            <CardContent>
                 <p className="text-3xl font-bold">3</p>
                <p className="text-xs text-muted-foreground">Avg. response time: 15min</p>
             </CardContent>
       </Card>
        <Card>
             <CardHeader>
                 <CardTitle className="text-lg">Est. Monthly Revenue</CardTitle>
             </CardHeader>
            <CardContent>
                 <p className="text-3xl font-bold">KES 450K</p>
                 <p className="text-xs text-muted-foreground">Based on current bookings & subs</p>
             </CardContent>
       </Card>


       {/* Admin Actions */}
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Management</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
                <Link href="/admin/users" passHref><Button variant="outline" className="w-full"><User className="mr-2 h-4 w-4" /> Manage Users</Button></Link>
                <Link href="/admin/appointments" passHref><Button variant="outline" className="w-full"><Calendar className="mr-2 h-4 w-4" /> Manage Appointments</Button></Link>
                <Link href="/admin/subscriptions" passHref><Button variant="outline" className="w-full"><FileText className="mr-2 h-4 w-4" /> Manage Subscriptions</Button></Link>
                 <Link href="/admin/services" passHref><Button variant="outline" className="w-full"><Wrench className="mr-2 h-4 w-4" /> Manage Services</Button></Link>
           </CardContent>
        </Card>

        {/* Reports */}
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Reports</CardTitle>
                 <CardDescription>Generate insights from garage data.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 text-sm">
                {/* List some key reports, link to a dedicated reports page */}
                <Link href="/admin/reports?type=daily_appointments" className="text-primary hover:underline">Daily Appointments</Link>
                <Link href="/admin/reports?type=monthly_revenue" className="text-primary hover:underline">Monthly Revenue</Link>
                <Link href="/admin/reports?type=active_subscriptions" className="text-primary hover:underline">Active Subscriptions</Link>
                <Link href="/admin/reports?type=service_usage" className="text-primary hover:underline">Service Usage</Link>
                <Link href="/admin/reports?type=staff_response" className="text-primary hover:underline">Staff Response Times</Link>
                <Link href="/admin/reports?type=most_booked" className="text-primary hover:underline">Most Booked Services</Link>
                {/* ... Add more report links */}
                 <Link href="/admin/reports" passHref className="col-span-2 mt-2">
                     <Button variant="secondary" size="sm" className="w-full">View All Reports (12)</Button>
                </Link>
            </CardContent>
        </Card>

     </div>
  );
}
