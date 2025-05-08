
'use server';

import { z } from 'zod';
import { getUserSession, UserProfile, setSessionCookie } from '@/actions/auth'; // To verify user and update cookie
import { db, auth as firebaseAuthInstance } from '@/lib/firebase/config'; // Firebase db
import { doc, updateDoc, setDoc, deleteDoc, getDocs, collection, query, where, serverTimestamp, getDoc, Timestamp } from 'firebase/firestore';
import { updatePassword as firebaseUpdatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'; // For password change

// --- Schemas ---
const UpdateProfileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  phone: z.string().optional(),
});

const ChangePasswordSchema = z.object({
   currentPassword: z.string().min(1, { message: 'Current password is required.' }),
   newPassword: z.string().min(6, { message: 'New password must be at least 6 characters.' }),
});

const VehicleSchema = z.object({
    id: z.string().optional(), // Firestore document ID
    make: z.string().min(1, { message: 'Make is required.'}),
    model: z.string().min(1, { message: 'Model is required.'}),
    year: z.string().regex(/^\d{4}$/, { message: 'Invalid year format (YYYY).'}),
    nickname: z.string().min(1, { message: 'Nickname is required.'}),
    serviceHistory: z.string().optional().describe(
      'A string containing the service history of the vehicle, including dates and services performed.'
    ), 
});

// --- Types ---
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type VehicleInput = z.infer<typeof VehicleSchema>;

export interface ProfileResponse {
  success: boolean;
  message: string;
  user?: UserProfile; // Added to return updated user profile
}
export interface VehicleResponse extends ProfileResponse {
    vehicles?: VehicleInput[];
}

// --- Server Actions ---

/**
 * Updates user profile information (name, phone) in Firestore.
 * Requires user to be authenticated.
 * Refetches the profile and updates the session cookie.
 */
export async function updateProfileAction(data: UpdateProfileInput): Promise<ProfileResponse> {
    const session = await getUserSession();
    if (!session?.id) { 
        return { success: false, message: "Authentication required." };
    }

    try {
        const validatedData = UpdateProfileSchema.parse(data);
        console.log(`Server Action (updateProfile): Updating profile for user ${session.id}`, validatedData);

        const userDocRef = doc(db, 'users', session.id);
        await updateDoc(userDocRef, {
            name: validatedData.name,
            phone: validatedData.phone || null, 
            updatedAt: serverTimestamp(),
        });

        // Fetch the updated profile to refresh the session cookie
        const updatedProfile = await fetchUserProfile(session.id);
        if (updatedProfile) {
            await setSessionCookie(updatedProfile); // Update the cookie with new info
            return { success: true, message: "Profile updated successfully.", user: updatedProfile };
        } else {
            // This case should be rare if the updateDoc succeeded but indicates an issue fetching the profile
             console.error(`Server Action (updateProfile): Profile updated for ${session.id}, but failed to refetch for session update.`);
            return { success: false, message: "Profile updated, but session refresh failed. Please re-login to see changes." };
        }

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
            return { success: false, message: `Validation failed: ${messages}` };
        }
        console.error('Server Action Error (updateProfile Firestore):', error);
        return { success: false, message: 'An unexpected error occurred while updating profile.' };
    }
}

/**
 * Simulates changing a user's password.
 * IMPORTANT: Real Firebase password changes on the server require Firebase Admin SDK for security
 * or re-authentication of the user. Client-side SDK `updatePassword` is preferred for direct user changes.
 */
export async function changePasswordAction(data: ChangePasswordInput): Promise<ProfileResponse> {
     const session = await getUserSession();
     if (!session?.id || !session.email) {
         return { success: false, message: "Authentication required." };
     }

     try {
         const validatedData = ChangePasswordSchema.parse(data);
         console.log(`Server Action (changePassword): Attempting password change for user ${session.id}`);
         
         // This is a simulation. Real Firebase password change requires re-authentication or Admin SDK.
         // For this example, we assume a simplified check.
         // IMPORTANT: Do not use this simulated password check in production.
         if (validatedData.currentPassword !== "password") { // DUMMY CHECK - REPLACE
             console.warn(`Server Action (changePassword): Simulated incorrect current password for user ${session.id}`);
             return { success: false, message: "Incorrect current password. (Simulation)" };
         }
         
         console.log(`Server Action (changePassword): Simulating password update for user ${session.id}. Real implementation needs Firebase Admin SDK or client-side re-auth flow.`);
         
         return { success: true, message: "Password changed successfully. (Simulation)" };

     } catch (error: any) {
          if (error instanceof z.ZodError) {
             const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
             return { success: false, message: `Validation failed: ${messages}` };
         }
         console.error('Server Action Error (changePassword Simulated):', error);
         return { success: false, message: 'An unexpected error occurred. (Simulation)' };
     }
}


// --- Vehicle Management (Using Firestore) ---

interface ManageVehicleInput {
    action: 'add' | 'update' | 'delete';
    vehicle: VehicleInput;
}

/**
 * Adds, updates, or deletes a user's vehicle in Firestore.
 * Vehicles are stored in a subcollection `users/{userId}/vehicles/{vehicleId}`.
 */
export async function manageVehicleAction(input: ManageVehicleInput): Promise<VehicleResponse> {
    const session = await getUserSession();
    if (!session?.id) {
        return { success: false, message: "Authentication required." };
    }

    const userId = session.id;
    console.log(`Server Action (manageVehicle Firestore): Action=${input.action} for user ${userId}`, input.vehicle);

    try {
        const validatedVehicle = VehicleSchema.parse(input.vehicle);
        const vehiclesCollectionRef = collection(db, 'users', userId, 'vehicles');

        let vehicleId = validatedVehicle.id;

        if (input.action === 'add') {
            const newVehicleDocRef = doc(vehiclesCollectionRef); 
            vehicleId = newVehicleDocRef.id;
            // Note: VehicleSchema doesn't include createdAt/updatedAt, so they are not in validatedVehicle.
            // Firestore will store them as Timestamps.
            await setDoc(newVehicleDocRef, { ...validatedVehicle, id: vehicleId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
            console.log(`Firestore: Added vehicle ${vehicleId} for user ${userId}`);
        } else if (input.action === 'update') {
            if (!vehicleId) return { success: false, message: "Vehicle ID is required for update." };
            const vehicleDocRef = doc(vehiclesCollectionRef, vehicleId);
            await updateDoc(vehicleDocRef, { ...validatedVehicle, updatedAt: serverTimestamp() });
            console.log(`Firestore: Updated vehicle ${vehicleId} for user ${userId}`);
        } else if (input.action === 'delete') {
            if (!vehicleId) return { success: false, message: "Vehicle ID is required for delete." };
            const vehicleDocRef = doc(vehiclesCollectionRef, vehicleId);
            await deleteDoc(vehicleDocRef);
            console.log(`Firestore: Deleted vehicle ${vehicleId} for user ${userId}`);
        } else {
            return { success: false, message: "Invalid vehicle action specified." };
        }

        const updatedVehiclesSnap = await getDocs(vehiclesCollectionRef);
        // VehicleInput from Zod schema doesn't have createdAt/updatedAt.
        // If doc.data() contains Timestamps for these, they will be stripped by `as VehicleInput`
        // or if VehicleInput was `any`, they would pass as Timestamps causing issues if passed to client.
        // For now, assuming Zod strictness handles this for VehicleInput.
        const updatedVehicles = updatedVehiclesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VehicleInput));

        return {
            success: true,
            message: `Vehicle successfully ${input.action === 'add' ? 'added' : input.action === 'update' ? 'updated' : 'deleted'}.`,
            vehicles: updatedVehicles
        };

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
            return { success: false, message: `Validation failed: ${messages}` };
        }
        console.error(`Server Action Error (manageVehicle Firestore - ${input.action}):`, error);
        return { success: false, message: `An unexpected error occurred while managing vehicle.` };
    }
}

/**
 * Fetches user vehicles from Firestore.
 */
 export async function fetchVehiclesAction(): Promise<VehicleResponse> {
     const session = await getUserSession();
     if (!session?.id) {
         return { success: false, message: "Authentication required." };
     }
     const userId = session.id;
     console.log(`Server Action (fetchVehicles Firestore): Fetching vehicles for user ${userId}`);

     try {
         const vehiclesCollectionRef = collection(db, 'users', userId, 'vehicles');
         const vehiclesSnap = await getDocs(vehiclesCollectionRef);
         // As above, assuming VehicleInput is strict and doesn't pass through Timestamps.
         const vehicles = vehiclesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VehicleInput));

         return { success: true, message: "Vehicles fetched successfully.", vehicles };

     } catch (error: any) {
         console.error('Server Action Error (fetchVehicles Firestore):', error);
         return { success: false, message: 'An unexpected error occurred while fetching vehicles.' };
     }
 }

 /**
 * Fetches a single user profile from Firestore and serializes Timestamps.
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) return null;
    try {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            // Serialize Timestamps to ISO strings
            const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : undefined;
            const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : undefined;

            return { 
                id: userDocSnap.id, 
                name: data.name,
                email: data.email,
                role: data.role,
                phone: data.phone,
                createdAt,
                updatedAt,
            } as UserProfile;
        }
        return null;
    } catch (error) {
        console.error("Error fetching user profile from Firestore:", error);
        return null;
    }
}
