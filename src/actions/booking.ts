
'use server';

import { z } from 'zod';
import { getUserSession, UserProfile } from '@/actions/auth'; // To get logged-in user ID and profile type
import { db } from '@/lib/firebase/config'; // Firebase db
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
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
            status: 'Pending', // Initial status
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        // Add to 'appointments' collection in Firestore
        const appointmentsCollectionRef = collection(db, 'appointments');
        const docRef = await addDoc(appointmentsCollectionRef, appointmentData);
        
        console.log('Server Action: Booking successful. Firestore Appointment ID:', docRef.id);

        // TODO: Trigger confirmation email/SMS (e.g., via a Firebase Function or third-party service)

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
