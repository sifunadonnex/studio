
'use server';

import { z } from 'zod';
import { getUserSession, UserProfile } from '@/actions/auth'; // To verify user
import { db, auth as firebaseAuthInstance } from '@/lib/firebase/config'; // Firebase db
import { doc, updateDoc, setDoc, deleteDoc, getDocs, collection, query, where, serverTimestamp, getDoc } from 'firebase/firestore';
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
    ), // Added serviceHistory
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
    vehicles?: VehicleInput[];
}

// --- Server Actions ---

/**
 * Updates user profile information (name, phone) in Firestore.
 * Requires user to be authenticated.
 */
export async function updateProfileAction(data: UpdateProfileInput): Promise<ProfileResponse> {
    const session = await getUserSession();
    if (!session?.id) { // Check for session.id (Firebase UID)
        return { success: false, message: "Authentication required." };
    }

    try {
        const validatedData = UpdateProfileSchema.parse(data);
        console.log(`Server Action (updateProfile): Updating profile for user ${session.id}`, validatedData);

        const userDocRef = doc(db, 'users', session.id);
        await updateDoc(userDocRef, {
            name: validatedData.name,
            phone: validatedData.phone || null, // Store null if undefined
            updatedAt: serverTimestamp(),
        });

        // Optional: Update session cookie if name/phone is stored there and changed
        // For simplicity, client can refresh session or rely on next fetch after update
        // If you need to update cookie, re-fetch profile & call setSessionCookie (from auth.ts - not exported directly)

        return { success: true, message: "Profile updated successfully." };

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
 * This action simulates the process but a full server-side implementation is complex without Admin SDK.
 */
export async function changePasswordAction(data: ChangePasswordInput): Promise<ProfileResponse> {
     const session = await getUserSession();
     if (!session?.id || !session.email) {
         return { success: false, message: "Authentication required." };
     }

     try {
         const validatedData = ChangePasswordSchema.parse(data);
         console.log(`Server Action (changePassword): Attempting password change for user ${session.id}`);

         // --- Firebase Password Change (Conceptual - Requires Admin SDK or Client-Side Re-auth) ---
         // To do this securely on the server *without* Admin SDK, you'd need to:
         // 1. Get the current Firebase user instance (not directly available in server actions like this).
         // 2. Re-authenticate the user: `reauthenticateWithCredential(currentUser, EmailAuthProvider.credential(session.email, validatedData.currentPassword))`
         // 3. If re-authentication is successful, then: `firebaseUpdatePassword(currentUser, validatedData.newPassword)`
         // This is complex in a server action environment as `firebaseAuthInstance.currentUser` is client-side.
         // A Firebase Admin SDK approach `admin.auth().updateUser(uid, { password: newPassword })` is cleaner for server-side.

         // Simulation:
         // We'll simulate checking the current password against a dummy value for now.
         // In a real app, this step is critical and involves Firebase's re-authentication.
         if (validatedData.currentPassword !== "password") { // DUMMY CHECK - REPLACE
             console.warn(`Server Action (changePassword): Simulated incorrect current password for user ${session.id}`);
             return { success: false, message: "Incorrect current password. (Simulation)" };
         }
         
         console.log(`Server Action (changePassword): Simulating password update for user ${session.id}. Real implementation needs Firebase Admin SDK or client-side re-auth flow.`);
         // --- End Simulation ---
         
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
            const newVehicleDocRef = doc(vehiclesCollectionRef); // Auto-generate ID
            vehicleId = newVehicleDocRef.id;
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

        // Fetch and return the updated list of vehicles
        const updatedVehiclesSnap = await getDocs(vehiclesCollectionRef);
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
         const vehicles = vehiclesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VehicleInput));

         return { success: true, message: "Vehicles fetched successfully.", vehicles };

     } catch (error: any) {
         console.error('Server Action Error (fetchVehicles Firestore):', error);
         return { success: false, message: 'An unexpected error occurred while fetching vehicles.' };
     }
 }

 /**
 * Fetches a single user profile from Firestore.
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) return null;
    try {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            return { id: userDocSnap.id, ...userDocSnap.data() } as UserProfile;
        }
        return null;
    } catch (error) {
        console.error("Error fetching user profile from Firestore:", error);
        return null;
    }
}
