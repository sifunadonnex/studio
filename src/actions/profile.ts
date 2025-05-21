
'use server';

import { z } from 'zod';
import { getUserSession, UserProfile, setSessionCookie } from '@/actions/auth'; // To verify user and update cookie
import { db, auth as firebaseAuthInstance } from '@/lib/firebase/config'; // Firebase db
import { doc, updateDoc, setDoc, deleteDoc, getDocs, collection, query, where, serverTimestamp, getDoc, Timestamp, orderBy } from 'firebase/firestore';
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
    createdAt: z.string().optional(), // Serialized Timestamp
    updatedAt: z.string().optional(), // Serialized Timestamp
});

// --- Types ---
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type VehicleInput = z.infer<typeof VehicleSchema>;

export interface ProfileResponse {
  success: boolean;
  message: string;
  user?: UserProfile; 
}
export interface VehicleResponse extends ProfileResponse {
    vehicles?: VehicleInput[];
}

// --- Helper Function to serialize Vehicle Timestamps ---
const serializeVehicleTimestamps = (vehicleData: any): VehicleInput => {
    const serializedData = { ...vehicleData };
    const vehicleId = vehicleData.id || 'Unknown ID';

    if (vehicleData.createdAt) {
        if (vehicleData.createdAt instanceof Timestamp) {
            serializedData.createdAt = vehicleData.createdAt.toDate().toISOString();
        } else if (typeof vehicleData.createdAt !== 'string') {
            console.warn(`[serializeVehicleTimestamps] Vehicle ${vehicleId}: 'createdAt' field is present but not a Firestore Timestamp or string. Value:`, vehicleData.createdAt, "Type:", typeof vehicleData.createdAt);
            // Fallback: attempt to convert to Date and then ISO string if it's a recognizable date format, otherwise might need specific handling or will be passed as is.
            // For now, we assume if it's not a Timestamp, it should ideally already be a string or be handled by Zod validation later.
            // If VehicleInput expects a string, and this isn't one, Zod will catch it.
        }
    }

    if (vehicleData.updatedAt) {
        if (vehicleData.updatedAt instanceof Timestamp) {
            serializedData.updatedAt = vehicleData.updatedAt.toDate().toISOString();
        } else if (typeof vehicleData.updatedAt !== 'string') {
            console.warn(`[serializeVehicleTimestamps] Vehicle ${vehicleId}: 'updatedAt' field is present but not a Firestore Timestamp or string. Value:`, vehicleData.updatedAt, "Type:", typeof vehicleData.updatedAt);
        }
    }
    return serializedData as VehicleInput;
};


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

        const updatedProfile = await fetchUserProfile(session.id);
        if (updatedProfile) {
            await setSessionCookie(updatedProfile); 
            return { success: true, message: "Profile updated successfully.", user: updatedProfile };
        } else {
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
 */
export async function changePasswordAction(data: ChangePasswordInput): Promise<ProfileResponse> {
     const session = await getUserSession();
     if (!session?.id || !session.email) {
         return { success: false, message: "Authentication required." };
     }

     try {
         const validatedData = ChangePasswordSchema.parse(data);
         console.log(`Server Action (changePassword): Attempting password change for user ${session.id}`);
         
         if (validatedData.currentPassword !== "password") { 
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
        const coreVehicleSchema = VehicleSchema.omit({ createdAt: true, updatedAt: true });
        const validatedVehicleData = coreVehicleSchema.parse(input.vehicle);

        const vehiclesCollectionRef = collection(db, 'users', userId, 'vehicles');
        let vehicleId = input.vehicle.id; 

        if (input.action === 'add') {
            const newVehicleDocRef = doc(vehiclesCollectionRef); 
            vehicleId = newVehicleDocRef.id;
            await setDoc(newVehicleDocRef, { 
                ...validatedVehicleData, 
                id: vehicleId, 
                createdAt: serverTimestamp(), 
                updatedAt: serverTimestamp() 
            });
            console.log(`Firestore: Added vehicle ${vehicleId} for user ${userId}`);
        } else if (input.action === 'update') {
            if (!vehicleId) return { success: false, message: "Vehicle ID is required for update." };
            const vehicleDocRef = doc(vehiclesCollectionRef, vehicleId);
            await updateDoc(vehicleDocRef, { 
                ...validatedVehicleData, 
                updatedAt: serverTimestamp() 
            });
            console.log(`Firestore: Updated vehicle ${vehicleId} for user ${userId}`);
        } else if (input.action === 'delete') {
            if (!vehicleId) return { success: false, message: "Vehicle ID is required for delete." };
            const vehicleDocRef = doc(vehiclesCollectionRef, vehicleId);
            await deleteDoc(vehicleDocRef);
            console.log(`Firestore: Deleted vehicle ${vehicleId} for user ${userId}`);
        } else {
            return { success: false, message: "Invalid vehicle action specified." };
        }

        const updatedVehiclesSnap = await getDocs(query(vehiclesCollectionRef, orderBy("createdAt", "desc")));
        const updatedVehicles = updatedVehiclesSnap.docs.map(docSnap => 
            serializeVehicleTimestamps({ id: docSnap.id, ...docSnap.data() })
        );

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
        console.warn('[fetchVehiclesAction] No session or session ID found. User must be logged in.');
        return { success: false, message: "Authentication required to fetch vehicles." };
     }
     const userId = session.id;
     console.log(`[fetchVehiclesAction] Fetching vehicles for user ${userId}`);

     try {
         const vehiclesCollectionRef = collection(db, 'users', userId, 'vehicles');
         const q = query(vehiclesCollectionRef, orderBy("createdAt", "desc"));
         console.log(`[fetchVehiclesAction] Executing Firestore query for user ${userId}'s vehicles.`);
         
         const vehiclesSnap = await getDocs(q);
         console.log(`[fetchVehiclesAction] Found ${vehiclesSnap.docs.length} vehicles for user ${userId}.`);
         
         const vehicles = vehiclesSnap.docs.map(docSnap => {
            const data = docSnap.data();
            // console.log(`[fetchVehiclesAction] Raw data for vehicle ${docSnap.id}:`, data); // Log raw data for debugging
            return serializeVehicleTimestamps({ id: docSnap.id, ...data });
         });

         return { success: true, message: "Vehicles fetched successfully.", vehicles };

     } catch (error: any) {
         console.error('[fetchVehiclesAction] Server Action Error (fetchVehicles Firestore):', error);
         //  If 'error' is a FirebaseError, error.code and error.message might be useful.
         //  Example: If index is missing, FirebaseError.code is 'failed-precondition'
         //  and message contains a link to create the index.
         let detailedMessage = 'An unexpected error occurred while fetching vehicles.';
         if (error.code && error.message) { // Attempt to get more specific Firebase error info
            detailedMessage = `Error fetching vehicles: ${error.message} (Code: ${error.code}). Check server logs for details, including any links to create Firestore indexes if needed.`;
            console.error(`[fetchVehiclesAction] Firebase Error Code: ${error.code}, Message: ${error.message}`);
         }
         return { success: false, message: detailedMessage };
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
            
            const userProfile: UserProfile = {
                id: userDocSnap.id, 
                name: data.name,
                email: data.email,
                role: data.role,
                phone: data.phone || null, 
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : (data.createdAt || undefined),
                updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : (data.updatedAt || undefined),
            };
             if (!userProfile.role) {
                console.warn(`[fetchUserProfile] User ${userId} is missing a role in Firestore.`);
            }
            return userProfile;
        }
        console.warn(`[fetchUserProfile] User document not found for ID: ${userId}`);
        return null;
    } catch (error) {
        console.error("[fetchUserProfile] Error fetching user profile from Firestore:", error);
        return null;
    }
}
