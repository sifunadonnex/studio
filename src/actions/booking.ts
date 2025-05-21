
'use server';

import { z } from 'zod';
import { getUserSession, UserProfile } from '@/actions/auth'; // To get logged-in user ID and profile type
import { db } from '@/lib/firebase/config'; // Firebase db
import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query, orderBy, updateDoc, Timestamp } from 'firebase/firestore';
import { fetchUserProfile } from './profile'; // To fetch user profile details

// --- Input Schema ---
const BookAppointmentSchema = z.object({
    userId: z.string().nullable().optional(), // Firebase User ID if logged in
    serviceId: z.string().min(1, { message: "Service selection is required." }), // Corresponds to service name/identifier
    serviceName: z.string().min(1, { message: "Service name is required."}), // For display/record
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Invalid date format (YYYY-MM-DD)." }),
    time: z.string().min(1, { message: "Time selection is required." }),
    vehicleMake: z.string().min(1, { message: "Vehicle make is required." }),
    vehicleModel: z.string().nullable().optional(),
    vehicleYear: z.string().nullable().optional(),
    // Customer details are optional if userId is present
    customerName: z.string().optional(),
    customerEmail: z.string().email({ message: "Invalid email format." }).optional(),
    customerPhone: z.string().optional(),
    additionalInfo: z.string().nullable().optional(),
}).refine(data => data.userId || (data.customerName && data.customerEmail && data.customerPhone), {
    message: "Name, Email, and Phone are required for guest bookings.",
    path: ["customerName"],
});


// --- Type ---
export type BookAppointmentInput = z.infer<typeof BookAppointmentSchema>;
export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';


export interface BookingResponse {
  success: boolean;
  message: string;
  appointmentId?: string; // Firestore document ID
}

/**
 * Books an appointment and saves it to Firestore.
 * If user is logged in, links to their UID. Otherwise, stores guest details.
 */
export async function bookAppointmentAction(data: BookAppointmentInput): Promise<BookingResponse> {
    try {
        const validatedData = BookAppointmentSchema.parse(data);
        console.log('Server Action (bookAppointmentAction Firestore): Validated Data:', validatedData);

        let customerDetailsToStore: { name: string; email: string; phone?: string | null; userId?: string | null } = {
            name: '',
            email: '',
            phone: null,
            userId: null,
        };

        if (validatedData.userId) {
            const userProfile = await fetchUserProfile(validatedData.userId); // Re-fetch fresh profile
            if (!userProfile) {
                console.error("Booking Error: User profile not found for ID:", validatedData.userId);
                return { success: false, message: "Authentication error. User profile not found." };
            }
            customerDetailsToStore = {
                userId: userProfile.id,
                name: userProfile.name,
                email: userProfile.email,
                phone: userProfile.phone || null,
            };
            console.log('Booking for logged-in user:', customerDetailsToStore.email);
        } else {
            if (!validatedData.customerName || !validatedData.customerEmail || !validatedData.customerPhone) {
                 return { success: false, message: "Name, Email, and Phone are required for guest bookings." };
            }
            customerDetailsToStore = {
                name: validatedData.customerName,
                email: validatedData.customerEmail,
                phone: validatedData.customerPhone || null,
                userId: null, // Guest booking
            };
            console.log('Booking for guest user:', customerDetailsToStore.email);
        }

        // Prepare data for Firestore
        const appointmentData = {
            ...customerDetailsToStore, // Includes userId, name, email, phone
            serviceId: validatedData.serviceId,
            serviceName: validatedData.serviceName,
            date: validatedData.date,
            time: validatedData.time,
            vehicleMake: validatedData.vehicleMake,
            vehicleModel: validatedData.vehicleModel || null,
            vehicleYear: validatedData.vehicleYear || null,
            additionalInfo: validatedData.additionalInfo || null,
            status: 'Pending' as AppointmentStatus, // Initial status
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        // Add to 'appointments' collection in Firestore
        const appointmentsCollectionRef = collection(db, 'appointments');
        const docRef = await addDoc(appointmentsCollectionRef, appointmentData);

        console.log('Server Action: Booking successful. Firestore Appointment ID:', docRef.id);

        return {
            success: true,
            message: 'Appointment booked successfully!',
            appointmentId: docRef.id,
        };

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
            console.error('Server Action Validation Error (bookAppointmentAction Firestore):', messages);
            return { success: false, message: `Validation failed: ${messages}` };
        }
        console.error('Server Action Error (bookAppointmentAction Firestore):', error);
        return { success: false, message: 'An unexpected error occurred while booking.' };
    }
}


// --- Admin Appointment Actions ---

export interface AdminAppointment {
  id: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  customerName: string;
  customerEmail: string;
  userId?: string | null;
  vehicleMake: string;
  vehicleModel?: string | null;
  vehicleYear?: string | null;
  additionalInfo?: string | null;
  status: AppointmentStatus;
  createdAt: string; // Serialized Timestamp
  updatedAt: string; // Serialized Timestamp
}

export interface FetchAllAppointmentsResponse {
  success: boolean;
  message: string;
  appointments?: AdminAppointment[];
}

export async function fetchAllAppointmentsAction(): Promise<FetchAllAppointmentsResponse> {
    const session = await getUserSession();
    if (!session?.id || !['admin', 'staff'].includes(session.role)) {
        console.warn('[fetchAllAppointmentsAction] Unauthorized attempt.');
        return { success: false, message: "Unauthorized: Admin or Staff privileges required." };
    }
    console.log(`[fetchAllAppointmentsAction] User ${session.email} (Role: ${session.role}) fetching all appointments.`);

    try {
        const appointmentsCollectionRef = collection(db, 'appointments');
        // Order by date first (descending for recent), then by time (ascending within the date)
        const q = query(appointmentsCollectionRef, orderBy("date", "desc"), orderBy("time", "asc"));
        const querySnapshot = await getDocs(q);

        const allAppointments = querySnapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                serviceId: data.serviceId,
                serviceName: data.serviceName,
                date: data.date,
                time: data.time,
                customerName: data.name, 
                customerEmail: data.email, 
                userId: data.userId || null,
                vehicleMake: data.vehicleMake,
                vehicleModel: data.vehicleModel || null,
                vehicleYear: data.vehicleYear || null,
                additionalInfo: data.additionalInfo || null,
                status: data.status as AppointmentStatus,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date(0).toISOString()),
                updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : (data.updatedAt || new Date(0).toISOString()),
            } as AdminAppointment;
        });
        
        console.log(`[fetchAllAppointmentsAction] Fetched ${allAppointments.length} appointments for admin/staff view.`);
        return { success: true, message: "Appointments fetched successfully.", appointments: allAppointments };

    } catch (error: any) {
        console.error('[fetchAllAppointmentsAction] Error fetching all appointments:', error);
        let detailedMessage = 'An unexpected error occurred while fetching appointments.';
         if (error.code && error.message) {
            detailedMessage = `Error fetching appointments: ${error.message} (Code: ${error.code}). Check server logs for details, including any links to create Firestore indexes if needed.`;
            console.error(`[fetchAllAppointmentsAction] Firebase Error Code: ${error.code}, Message: ${error.message}`);
         }
        return { success: false, message: detailedMessage, appointments: [] };
    }
}

export interface UpdateAppointmentStatusInput {
    appointmentId: string;
    newStatus: AppointmentStatus;
}
export interface UpdateAppointmentStatusResponse {
    success: boolean;
    message: string;
}

export async function updateAppointmentStatusAction(data: UpdateAppointmentStatusInput): Promise<UpdateAppointmentStatusResponse> {
    const session = await getUserSession();
    if (!session?.id || !['admin', 'staff'].includes(session.role)) {
        console.warn('[updateAppointmentStatusAction] Unauthorized attempt.');
        return { success: false, message: "Unauthorized: Admin or Staff privileges required." };
    }
    console.log(`[updateAppointmentStatusAction] User ${session.email} (Role: ${session.role}) updating appointment status.`);

    try {
        const { appointmentId, newStatus } = data;
        if (!appointmentId || !newStatus) {
            return { success: false, message: "Appointment ID and new status are required." };
        }

        const appointmentDocRef = doc(db, "appointments", appointmentId);
        await updateDoc(appointmentDocRef, {
            status: newStatus,
            updatedAt: serverTimestamp(),
        });

        console.log(`[updateAppointmentStatusAction] Updated status for appointment ${appointmentId} to ${newStatus}`);
        return { success: true, message: `Appointment status updated to ${newStatus}.` };

    } catch (error: any) {
        console.error('[updateAppointmentStatusAction] Error updating appointment status:', error);
        return { success: false, message: 'An unexpected error occurred while updating status.' };
    }
}
