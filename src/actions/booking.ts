'use server';

import { z } from 'zod';
import { getUserSession } from '@/actions/auth'; // To get logged-in user ID

// --- Input Schema ---
const BookAppointmentSchema = z.object({
    userId: z.string().nullable().optional(), // User ID if logged in
    serviceId: z.string().min(1, { message: "Service selection is required." }),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Invalid date format (YYYY-MM-DD)." }),
    time: z.string().min(1, { message: "Time selection is required." }),
    vehicleMake: z.string().min(1, { message: "Vehicle make is required." }),
    vehicleModel: z.string().nullable().optional(),
    vehicleYear: z.string().nullable().optional(),
    // Customer details are optional if userId is present (server should fetch from DB)
    customerName: z.string().optional(),
    customerEmail: z.string().email({ message: "Invalid email format." }).optional(),
    customerPhone: z.string().optional(),
    additionalInfo: z.string().nullable().optional(),
}).refine(data => data.userId || (data.customerEmail && data.customerPhone), {
    // Require email and phone if user is not logged in
    message: "Email and Phone are required if not logged in.",
    path: ["customerEmail"], // Attach error to a relevant field path
});


// --- Type ---
export type BookAppointmentInput = z.infer<typeof BookAppointmentSchema>;

export interface BookingResponse {
  success: boolean;
  message: string;
  appointmentId?: string; // Return ID on success
}

/**
 * Simulates booking an appointment.
 * In a real app, this would:
 * 1. Validate the input.
 * 2. Get user details from session if userId is present.
 * 3. Check for time slot availability in the database.
 * 4. Create the appointment record in the database (PHP/MySQL backend).
 * 5. Potentially send confirmation email/SMS.
 */
export async function bookAppointmentAction(data: BookAppointmentInput): Promise<BookingResponse> {
    try {
        // 1. Validate Input Schema
        const validatedData = BookAppointmentSchema.parse(data);
        console.log('Server Action (bookAppointmentAction): Validated Data:', validatedData);

        // 2. Get User Details (if logged in)
        let finalCustomerDetails = {
            name: validatedData.customerName,
            email: validatedData.customerEmail,
            phone: validatedData.customerPhone,
        };

        if (validatedData.userId) {
            const session = await getUserSession(); // Re-check session server-side
            if (!session || session.userId !== validatedData.userId) {
                 // This should ideally not happen if client sends correct userId
                console.error("Booking Error: Session mismatch or user not found for ID:", validatedData.userId);
                return { success: false, message: "Authentication error. Please log in again." };
            }
             // Use confirmed details from session
             finalCustomerDetails = {
                name: session.name,
                email: session.email,
                phone: session.phone, // Assuming phone is in session
            };
            console.log('Booking for logged-in user:', finalCustomerDetails.email);
        } else {
             console.log('Booking for guest user:', finalCustomerDetails.email);
             // Ensure guest provided necessary details (already checked by refine, but double-check)
             if (!finalCustomerDetails.email || !finalCustomerDetails.phone) {
                  return { success: false, message: "Email and Phone are required for guest bookings." };
             }
        }


        // 3. Simulate Backend Call (Check Availability & Create Booking)
        // Replace with actual API call to PHP/MySQL
        console.log('Simulating backend booking creation for:', validatedData.date, validatedData.time);
        await new Promise(resolve => setTimeout(resolve, 1200));

        // Simulate availability check failure (example)
        // if (validatedData.date === '2024-12-25') {
        //     return { success: false, message: `Time slot ${validatedData.time} on ${validatedData.date} is no longer available.` };
        // }

        // Simulate successful booking creation
        const newAppointmentId = `APP-${Date.now().toString().slice(-6)}`;
        console.log('Server Action: Booking successful. Appointment ID:', newAppointmentId);

        // 4. TODO: Trigger confirmation email/SMS via backend API

        return {
            success: true,
            message: 'Appointment booked successfully!',
            appointmentId: newAppointmentId,
        };
        // --- End Simulate Backend Call ---

    } catch (error) {
        if (error instanceof z.ZodError) {
            const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
            console.error('Server Action Validation Error (bookAppointmentAction):', messages);
            return { success: false, message: `Validation failed: ${messages}` };
        }
        console.error('Server Action Error (bookAppointmentAction):', error);
        return { success: false, message: 'An unexpected error occurred while booking.' };
    }
}