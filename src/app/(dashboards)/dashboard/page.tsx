
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, Wrench, MessageSquare, User, FileText, Bell, Car, BarChart2, Users, Settings, Info, UserCheck } from "lucide-react";
import { getUserSession } from "@/actions/auth";
import { redirect } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, Timestamp, limit, getCountFromServer } from 'firebase/firestore';
import type { UserProfile } from '@/actions/auth';
// Assuming Appointment type is exported from appointments/page.tsx or a shared types file
// For simplicity, let's define a local version or assume it exists
// import type { Appointment } from '@/app/(dashboards)/appointments/page';
import type { AdminSubscription } from '@/actions/subscription';
import { predictMaintenanceDate, PredictMaintenanceInput, PredictMaintenanceOutput } from '@/ai/flows/predictive-maintenance';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  serviceId: string;
  serviceName: string;
  date: string; // Stored as 'YYYY-MM-DD' string
  time: string;
  vehicleMake: string;
  vehicleModel?: string | null;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  createdAt: Timestamp;
}


interface CustomerData {
    upcomingAppointment: Appointment | null;
    maintenancePrediction: (PredictMaintenanceOutput & { vehicleNickname: string }) | null;
    activeSubscription: AdminSubscription | null;
    lastChatMessage: { text: string; senderType: 'user' | 'staff' } | null;
}

interface AdminData {
    todaysBookingsCount: number;
    activeSubscriptionsCount: number;
    totalChatsCount: number;
    totalUsersCount: number;
}

interface StaffData {
    todaysPendingOrConfirmedAppointmentsCount: number;
    activeCustomerChatsCount: number;
}


export default async function DashboardPage() {
    const session = await getUserSession();

    if (!session) {
        redirect('/login?redirect=/dashboard');
    }

    const userRole = session.role;
    let customerData: CustomerData | null = null;
    let adminData: AdminData | null = null;
    let staffData: StaffData | null = null;

    if (userRole === "customer" && session.id) {
        // Fetch Upcoming Appointment
        let upcomingAppointment: Appointment | null = null;
        try {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const appointmentsQuery = query(
                collection(db, "appointments"),
                where("userId", "==", session.id),
                where("date", ">=", todayStr), // Appointments from today onwards
                where("status", "in", ["Pending", "Confirmed"]),
                orderBy("date", "asc"),
                orderBy("time", "asc"),
                limit(1)
            );
            const appointmentSnapshot = await getDocs(appointmentsQuery);
            if (!appointmentSnapshot.empty) {
                const docData = appointmentSnapshot.docs[0].data();
                upcomingAppointment = {
                    id: appointmentSnapshot.docs[0].id,
                    serviceId: docData.serviceId,
                    serviceName: docData.serviceName,
                    date: docData.date,
                    time: docData.time,
                    vehicleMake: docData.vehicleMake,
                    vehicleModel: docData.vehicleModel || null,
                    status: docData.status as 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled',
                    createdAt: docData.createdAt as Timestamp,
                } as Appointment;
            }
        } catch (e) {
            console.error("Error fetching upcoming appointment for customer dashboard:", e);
        }

        // Fetch Maintenance Prediction for the first vehicle
        let maintenancePrediction: (PredictMaintenanceOutput & { vehicleNickname: string }) | null = null;
        try {
            const vehiclesQuery = query(collection(db, `users/${session.id}/vehicles`), limit(1));
            const vehicleSnapshot = await getDocs(vehiclesQuery);
            if (!vehicleSnapshot.empty) {
                const vehicle = vehicleSnapshot.docs[0].data();
                if (vehicle.serviceHistory) {
                    const predictionInput: PredictMaintenanceInput = {
                        vehicleId: vehicleSnapshot.docs[0].id,
                        serviceHistory: vehicle.serviceHistory,
                    };
                    const predictionOutput = await predictMaintenanceDate(predictionInput);
                    maintenancePrediction = { ...predictionOutput, vehicleNickname: vehicle.nickname || 'Your Vehicle' };
                }
            }
        } catch (e) {
            console.error("Error fetching maintenance prediction for customer dashboard:", e);
        }

        // Fetch Active Subscription
        let activeSubscription: AdminSubscription | null = null;
        try {
            const subsQuery = query(
                collection(db, "subscriptions"),
                where("userId", "==", session.id),
                where("status", "==", "active"),
                limit(1)
            );
            const subsSnapshot = await getDocs(subsQuery);
            if (!subsSnapshot.empty) {
                const subData = subsSnapshot.docs[0].data();
                activeSubscription = {
                    id: subsSnapshot.docs[0].id,
                    userId: subData.userId,
                    customerName: session.name, 
                    customerEmail: session.email, 
                    planId: subData.planId,
                    planName: subData.planName,
                    status: subData.status as 'active' | 'cancelled' | 'expired' | 'payment_failed' | 'pending',
                    startDate: subData.startDate instanceof Timestamp ? subData.startDate.toDate().toISOString() : subData.startDate,
                    endDate: subData.endDate instanceof Timestamp ? subData.endDate.toDate().toISOString() : subData.endDate,
                    nextBillingDate: subData.nextBillingDate instanceof Timestamp ? subData.nextBillingDate.toDate().toISOString() : subData.nextBillingDate,
                    price: subData.price,
                    currency: subData.currency,
                    createdAt: subData.createdAt instanceof Timestamp ? subData.createdAt.toDate().toISOString() : subData.createdAt,
                    updatedAt: subData.updatedAt instanceof Timestamp ? subData.updatedAt.toDate().toISOString() : subData.updatedAt,
                };
            }
        } catch (e) {
            console.error("Error fetching active subscription for customer dashboard:", e);
        }

        // Fetch Last Chat Message
        let lastChatMessage: { text: string; senderType: 'user' | 'staff' } | null = null;
        try {
            const chatMessagesQuery = query(
                collection(db, `chats/${session.id}/messages`),
                orderBy("timestamp", "desc"),
                limit(1)
            );
            const chatSnapshot = await getDocs(chatMessagesQuery);
            if (!chatSnapshot.empty) {
                const msgData = chatSnapshot.docs[0].data();
                lastChatMessage = {
                    text: msgData.text.substring(0, 100) + (msgData.text.length > 100 ? "..." : ""), 
                    senderType: msgData.senderType,
                };
            }
        } catch (e) {
            console.error("Error fetching last chat message for customer dashboard:", e);
        }
        customerData = { upcomingAppointment, maintenancePrediction, activeSubscription, lastChatMessage };

    } else if (userRole === "admin") {
        let todaysBookingsCount = 0;
        let activeSubscriptionsCount = 0;
        let totalChatsCount = 0;
        let totalUsersCount = 0;

        try {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const bookingsQuery = query(collection(db, "appointments"), where("date", "==", todayStr));
            const bookingsSnapshot = await getCountFromServer(bookingsQuery);
            todaysBookingsCount = bookingsSnapshot.data().count;

            const activeSubsQuery = query(collection(db, "subscriptions"), where("status", "==", "active"));
            const activeSubsSnapshot = await getCountFromServer(activeSubsQuery);
            activeSubscriptionsCount = activeSubsSnapshot.data().count;

            const chatsQuery = collection(db, "chats"); 
            const chatsSnapshot = await getCountFromServer(chatsQuery);
            totalChatsCount = chatsSnapshot.data().count;

            const usersQuery = collection(db, "users");
            const usersSnapshot = await getCountFromServer(usersQuery);
            totalUsersCount = usersSnapshot.data().count;

        } catch (e) {
            console.error("Error fetching admin dashboard data:", e);
        }
        adminData = { todaysBookingsCount, activeSubscriptionsCount, totalChatsCount, totalUsersCount };
    } else if (userRole === "staff") {
        let todaysPendingOrConfirmedAppointmentsCount = 0;
        let activeCustomerChatsCount = 0;
        try {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const appointmentsQuery = query(
                collection(db, "appointments"), 
                where("date", "==", todayStr),
                where("status", "in", ["Pending", "Confirmed"])
            );
            const appointmentsSnapshot = await getCountFromServer(appointmentsQuery);
            todaysPendingOrConfirmedAppointmentsCount = appointmentsSnapshot.data().count;

            const chatsQuery = collection(db, "chats");
            const chatsSnapshot = await getCountFromServer(chatsQuery);
            activeCustomerChatsCount = chatsSnapshot.data().count;
        } catch (e) {
            console.error("Error fetching staff dashboard data:", e);
        }
        staffData = { todaysPendingOrConfirmedAppointmentsCount, activeCustomerChatsCount };
    }


    return (
        <div className="container mx-auto px-4 py-12">
             <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
             </div>

             <Card className="mb-8 bg-secondary border-none">
                 <CardHeader>
                     <CardTitle>Welcome back, {session.name || 'User'}!</CardTitle>
                     <CardDescription>Here's a quick overview of your account and relevant tasks.</CardDescription>
                </CardHeader>
             </Card>

            {userRole === "customer" && <CustomerDashboard initialData={customerData} />}
            {userRole === "staff" && <StaffDashboard initialData={staffData} />}
            {userRole === "admin" && <AdminDashboard initialData={adminData} />}

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
interface CustomerDashboardProps {
  initialData: CustomerData | null;
}

function CustomerDashboard({ initialData }: CustomerDashboardProps) {
  const { upcomingAppointment, maintenancePrediction, activeSubscription, lastChatMessage } = initialData || {};

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      // Assuming dateString is 'YYYY-MM-DD' from Firestore or ISO string
      return format(new Date(dateString.replace(/-/g, '/')), 'PPP'); // Replace to avoid timezone issues with YYYY-MM-DD
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Upcoming Appointment</CardTitle>
          <CardDescription>Your next scheduled service.</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingAppointment ? (
            <>
              <p><strong>Service:</strong> {upcomingAppointment.serviceName}</p>
              <p><strong>Date:</strong> {formatDate(upcomingAppointment.date)}</p>
              <p><strong>Time:</strong> {upcomingAppointment.time}</p>
            </>
          ) : (
            <p className="text-muted-foreground">No upcoming appointments.</p>
          )}
          <Link href="/appointments" passHref>
            <Button variant="outline" size="sm" className="mt-4 w-full">Manage Appointments</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-accent" /> Predictive Maintenance</CardTitle>
          <CardDescription>Estimated next service needed for {maintenancePrediction?.vehicleNickname || 'your vehicle'}.</CardDescription>
        </CardHeader>
        <CardContent>
           {maintenancePrediction ? (
             <>
                <p>Next recommended service: <strong>{maintenancePrediction.reasoning.split(':')[0] || 'Check Required'}</strong></p>
                <p>Estimated Date: <strong>{formatDate(maintenancePrediction.predictedMaintenanceDate)}</strong></p>
                <p className="text-xs text-muted-foreground mt-1">{maintenancePrediction.reasoning}</p>
             </>
           ) : (
             <>
                <p className="text-muted-foreground">No maintenance predictions available yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Add a vehicle and its service history in your profile to enable predictions.</p>
             </>
           )}
           <Link href="/maintenance/predictive" passHref>
               <Button variant="secondary" size="sm" className="mt-4 w-full">View Details</Button>
           </Link>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
           <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> My Subscription</CardTitle>
            <CardDescription>Your current plan details.</CardDescription>
        </CardHeader>
         <CardContent>
            {activeSubscription ? (
                <>
                    <p><strong>Plan:</strong> {activeSubscription.planName}</p>
                    <p><strong>Status:</strong> <span className="capitalize">{activeSubscription.status.replace('_', ' ')}</span></p>
                    <p><strong>Next Billing:</strong> {formatDate(activeSubscription.nextBillingDate || undefined)}</p>
                </>
            ) : (
                <p className="text-muted-foreground">No active subscription found.</p>
            )}
           <Link href="/subscriptions/manage" passHref>
                <Button variant="outline" size="sm" className="mt-4 w-full">Manage Subscription</Button>
            </Link>
        </CardContent>
       </Card>

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

         <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Recent Messages</CardTitle>
                 <CardDescription>Latest communications with our team.</CardDescription>
            </CardHeader>
            <CardContent>
                {lastChatMessage ? (
                    <p className="text-muted-foreground text-sm p-4 border rounded-md">
                        <strong>{lastChatMessage.senderType === 'user' ? 'You' : 'Support'}:</strong> {lastChatMessage.text}
                    </p>
                ) : (
                    <p className="text-muted-foreground text-sm p-4 border rounded-md">
                        No recent messages.
                    </p>
                )}
                 <Link href="/chat" passHref>
                     <Button variant="link" size="sm" className="mt-2">View All Messages</Button>
                </Link>
            </CardContent>
         </Card>
    </div>
  );
}

interface StaffDashboardProps {
  initialData: StaffData | null;
}

function StaffDashboard({ initialData }: StaffDashboardProps) {
  const { 
    todaysPendingOrConfirmedAppointmentsCount = 0, 
    activeCustomerChatsCount = 0 
  } = initialData || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
           <CardTitle className="flex items-center gap-2 text-lg"><Calendar className="h-5 w-5" /> Today's Appointments</CardTitle>
           <CardDescription>Pending or Confirmed</CardDescription>
        </CardHeader>
         <CardContent>
            <p className="text-3xl font-bold">{todaysPendingOrConfirmedAppointmentsCount}</p>
            <p className="text-xs text-muted-foreground">
              {todaysPendingOrConfirmedAppointmentsCount > 0 
                ? 'Manage in Appointments section.' 
                : 'No pressing appointments today.'}
            </p>
        </CardContent>
      </Card>

       <Card>
         <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><MessageSquare className="h-5 w-5" /> Customer Chats</CardTitle>
            <CardDescription>Total Active Threads</CardDescription>
         </CardHeader>
          <CardContent>
             <p className="text-3xl font-bold">{activeCustomerChatsCount}</p>
             <p className="text-xs text-muted-foreground">
                {activeCustomerChatsCount > 0 ? 'Respond in Staff Chats.' : 'No active customer chats.'}
             </p>
         </CardContent>
       </Card>
       
       <Card className="md:col-span-2 lg:col-span-1">
         <CardHeader>
            <CardTitle>Quick Links</CardTitle>
         </CardHeader>
         <CardContent className="space-y-3">
             <Link href="/admin/appointments" passHref className="block">
                <Button className="w-full" variant="outline"><Calendar className="mr-2 h-4 w-4" /> Manage All Appointments</Button>
            </Link>
            <Link href="/staff/chats" passHref className="block">
                 <Button className="w-full" variant="outline"><MessageSquare className="mr-2 h-4 w-4" /> Open Customer Chats</Button>
            </Link>
             <Link href="/maintenance/predictive" passHref className="block">
                <Button className="w-full" variant="outline"><Bell className="mr-2 h-4 w-4" /> View Maintenance Alerts</Button>
            </Link>
         </CardContent>
       </Card>
    </div>
  );
}

interface AdminDashboardProps {
  initialData: AdminData | null;
}

function AdminDashboard({ initialData }: AdminDashboardProps) {
  const { 
    todaysBookingsCount = 0, 
    activeSubscriptionsCount = 0, 
    totalChatsCount = 0, 
    totalUsersCount = 0 
  } = initialData || {};

  return (
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
             <CardHeader>
                 <CardTitle className="text-lg">Today's Bookings</CardTitle>
             </CardHeader>
            <CardContent>
                 <p className="text-3xl font-bold">{todaysBookingsCount}</p>
                 <p className="text-xs text-muted-foreground">{todaysBookingsCount > 0 ? 'View in Manage Appointments' : 'No bookings for today'}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                 <CardTitle className="text-lg">Active Subscriptions</CardTitle>
             </CardHeader>
             <CardContent>
                <p className="text-3xl font-bold">{activeSubscriptionsCount}</p>
                <p className="text-xs text-muted-foreground">{activeSubscriptionsCount > 0 ? 'View in Manage Subscriptions' : 'No active subscriptions'}</p>
             </CardContent>
        </Card>
       <Card>
            <CardHeader>
                <CardTitle className="text-lg">Customer Chats</CardTitle>
             </CardHeader>
            <CardContent>
                 <p className="text-3xl font-bold">{totalChatsCount}</p>
                <p className="text-xs text-muted-foreground">{totalChatsCount > 0 ? 'View in Staff Chats' : 'No customer chats yet'}</p>
             </CardContent>
       </Card>
        <Card>
             <CardHeader>
                 <CardTitle className="text-lg">Total Users</CardTitle>
             </CardHeader>
            <CardContent>
                 <p className="text-3xl font-bold">{totalUsersCount}</p>
                 <p className="text-xs text-muted-foreground">{totalUsersCount > 0 ? 'View in Manage Users' : 'No registered users'}</p>
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
                <CardTitle>Reports & Insights</CardTitle>
                 <CardDescription>Generate insights from garage data.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2 text-sm">
                 <Link href="/admin/reports" passHref className="mt-2">
                     <Button variant="secondary" size="sm" className="w-full"><BarChart2 className="mr-2 h-4 w-4"/> View All Reports</Button>
                </Link>
                 <div className="p-4 border rounded-md bg-muted/50 mt-2">
                    <div className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-muted-foreground"/>
                        <p className="text-sm text-muted-foreground">Detailed reporting and AI insights are available in the Reports section.</p>
                    </div>
                </div>
            </CardContent>
        </Card>
     </div>
  );
}
    
