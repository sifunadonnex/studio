'use server';

import { z } from 'zod';
import { getUserSession } from '@/actions/auth'; // To verify user

// --- Schemas ---

const UpdateProfileSchema = z.object({
  // userId is implicitly taken from session on the server
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  phone: z.string().optional(), // Make phone optional or add specific validation if needed
});

const ChangePasswordSchema = z.object({
   // userId is implicit
   currentPassword: z.string().min(1, { message: 'Current password is required.' }),
   newPassword: z.string().min(6, { message: 'New password must be at least 6 characters.' }),
});

// Basic vehicle schema for simulation
const VehicleSchema = z.object({
    id: z.string().optional(), // ID needed for update/delete
    make: z.string().min(1, { message: 'Make is required.'}),
    model: z.string().min(1, { message: 'Model is required.'}),
    year: z.string().regex(/^\d{4}$/, { message: 'Invalid year format (YYYY).'}),
    nickname: z.string().min(1, { message: 'Nickname is required.'}),
});

// --- Types ---

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type VehicleInput = z.infer<typeof VehicleSchema>;

export interface ProfileResponse {
  success: boolean;
  message: string;
}
export interface VehicleResponse extends ProfileResponse {
    vehicles?: VehicleInput[]; // Return updated list on success
}


// --- Server Actions ---

/**
 * Simulates updating user profile information (name, phone).
 * Requires user to be authenticated.
 */
export async function updateProfileAction(data: UpdateProfileInput): Promise<ProfileResponse> {
    const session = await getUserSession();
    if (!session) {
        return { success: false, message: "Authentication required." };
    }

    try {
        const validatedData = UpdateProfileSchema.parse(data);
        console.log(`Server Action (updateProfile): Updating profile for user ${session.userId}`, validatedData);

        // --- Simulate Backend Call (Update User in DB) ---
        // Replace with actual API call to PHP/MySQL
        await new Promise(resolve => setTimeout(resolve, 800));
        console.log(`Server Action (updateProfile): Simulating update for user ${session.userId}`);
        // --- End Simulation ---

        // Optional: Update session cookie if name/phone is stored there and changed?
        // Be cautious about storing too much in the cookie. Fetching fresh data might be better.
        // if (session.name !== validatedData.name || session.phone !== validatedData.phone) {
        //    const updatedSessionData = { ...session, name: validatedData.name, phone: validatedData.phone };
        //    cookies().set('session', JSON.stringify(updatedSessionData), { ... }); // Set with same options
        // }


        return { success: true, message: "Profile updated successfully." };

    } catch (error) {
        if (error instanceof z.ZodError) {
            const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
            return { success: false, message: `Validation failed: ${messages}` };
        }
        console.error('Server Action Error (updateProfile):', error);
        return { success: false, message: 'An unexpected error occurred while updating profile.' };
    }
}

/**
 * Simulates changing a user's password.
 * Requires user to be authenticated.
 */
export async function changePasswordAction(data: ChangePasswordInput): Promise<ProfileResponse> {
     const session = await getUserSession();
     if (!session) {
         return { success: false, message: "Authentication required." };
     }

     try {
         const validatedData = ChangePasswordSchema.parse(data);
         console.log(`Server Action (changePassword): Attempting password change for user ${session.userId}`);

         // --- Simulate Backend Call (Verify old pass, update new pass) ---
         // Replace with actual API call to PHP/MySQL
         await new Promise(resolve => setTimeout(resolve, 1200));

         // Simulate checking current password (replace with DB check)
         const isCurrentPasswordCorrect = validatedData.currentPassword === 'password'; // DUMMY CHECK

         if (!isCurrentPasswordCorrect) {
              console.log(`Server Action (changePassword): Incorrect current password for user ${session.userId}`);
              return { success: false, message: "Incorrect current password." };
         }

         // Simulate updating password in DB (hash the new password first!)
         console.log(`Server Action (changePassword): Simulating password update for user ${session.userId}`);
         // --- End Simulation ---

         return { success: true, message: "Password changed successfully." };

     } catch (error) {
          if (error instanceof z.ZodError) {
             const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
             return { success: false, message: `Validation failed: ${messages}` };
         }
         console.error('Server Action Error (changePassword):', error);
         return { success: false, message: 'An unexpected error occurred while changing password.' };
     }
}


// --- Vehicle Management (Simulated) ---

// This would typically involve separate actions for add, update, delete

interface ManageVehicleInput {
    action: 'add' | 'update' | 'delete';
    vehicle: VehicleInput; // Full vehicle for add/update, just ID needed for delete
}

/**
 * Simulates adding, updating, or deleting a user's vehicle.
 * Requires user to be authenticated.
 */
export async function manageVehicleAction(input: ManageVehicleInput): Promise<VehicleResponse> {
    const session = await getUserSession();
    if (!session) {
        return { success: false, message: "Authentication required." };
    }

     console.log(`Server Action (manageVehicle): Action=${input.action} for user ${session.userId}`, input.vehicle);

     try {
         // Validate vehicle data if adding or updating
         if (input.action === 'add' || input.action === 'update') {
             VehicleSchema.parse(input.vehicle); // Validate incoming vehicle data
         }
         if ((input.action === 'update' || input.action === 'delete') && !input.vehicle.id) {
             return { success: false, message: "Vehicle ID is required for update/delete actions." };
         }

         // --- Simulate Backend Call (DB operation based on action) ---
         await new Promise(resolve => setTimeout(resolve, 900));

         // Simulate DB interaction (replace with API calls)
         let updatedVehicles: VehicleInput[] = []; // This would come from the DB
         const mockDbVehicles: VehicleInput[] = [ // Simulate current vehicles for the user
             { id: 'V1', make: 'Toyota', model: 'Corolla', year: '2018', nickname: 'My Sedan' },
             { id: 'V2', make: 'Nissan', model: 'X-Trail', year: '2020', nickname: 'Family SUV' },
         ];

         if (input.action === 'add') {
             const newVehicle = { ...input.vehicle, id: `V${Date.now()}` };
             updatedVehicles = [...mockDbVehicles, newVehicle];
             console.log(`Simulated adding vehicle: ${newVehicle.id}`);
         } else if (input.action === 'update') {
             updatedVehicles = mockDbVehicles.map(v => v.id === input.vehicle.id ? { ...v, ...input.vehicle } : v);
             console.log(`Simulated updating vehicle: ${input.vehicle.id}`);
         } else if (input.action === 'delete') {
             updatedVehicles = mockDbVehicles.filter(v => v.id !== input.vehicle.id);
             console.log(`Simulated deleting vehicle: ${input.vehicle.id}`);
         } else {
              return { success: false, message: "Invalid vehicle action specified." };
         }
         // --- End Simulation ---


         return {
             success: true,
             message: `Vehicle successfully ${input.action === 'add' ? 'added' : input.action === 'update' ? 'updated' : 'deleted'}.`,
             vehicles: updatedVehicles // Return the (simulated) updated list
         };

     } catch (error) {
         if (error instanceof z.ZodError) {
             const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
             return { success: false, message: `Validation failed: ${messages}` };
         }
         console.error(`Server Action Error (manageVehicle - ${input.action}):`, error);
         return { success: false, message: `An unexpected error occurred while ${input.action}ing vehicle.` };
     }
}

/**
 * Simulates fetching user vehicles.
 */
 export async function fetchVehiclesAction(): Promise<VehicleResponse> {
     const session = await getUserSession();
     if (!session) {
         return { success: false, message: "Authentication required." };
     }

     console.log(`Server Action (fetchVehicles): Fetching vehicles for user ${session.userId}`);

     try {
         // --- Simulate Backend Call (Fetch from DB) ---
         await new Promise(resolve => setTimeout(resolve, 700));
         const mockDbVehicles: VehicleInput[] = [
             { id: 'V1', make: 'Toyota', model: 'Corolla', year: '2018', nickname: 'My Sedan' },
             { id: 'V2', make: 'Nissan', model: 'X-Trail', year: '2020', nickname: 'Family SUV' },
             { id: 'V3', make: 'Subaru', model: 'Forester', year: '2019', nickname: 'Workhorse' },
         ];
         // --- End Simulation ---

         return { success: true, message: "Vehicles fetched successfully.", vehicles: mockDbVehicles };

     } catch (error) {
         console.error('Server Action Error (fetchVehicles):', error);
         return { success: false, message: 'An unexpected error occurred while fetching vehicles.' };
     }
 }