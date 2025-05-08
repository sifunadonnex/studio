
'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { auth, db } from '@/lib/firebase/config'; // Firebase auth and db instances
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// --- Schemas ---
const LoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const RegisterSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    email: z.string().email({ message: 'Invalid email address.' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
});

// --- Types ---
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export interface UserProfile {
    id: string; // Firebase UID
    name: string;
    email: string;
    role: 'customer' | 'staff' | 'admin';
    phone?: string;
    createdAt?: any; // Firestore Timestamp
    updatedAt?: any; // Firestore Timestamp
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: UserProfile;
  redirectTo?: string;
}

// --- Helper to set session cookie ---
async function setSessionCookie(userData: UserProfile) {
    const sessionData = {
        userId: userData.id, // Firebase UID
        name: userData.name,
        email: userData.email,
        role: userData.role,
        phone: userData.phone,
        loggedInAt: Date.now(),
    };
    cookies().set('session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
        sameSite: 'lax',
    });
}


// --- Server Actions ---

/**
 * Logs in a user using Firebase Authentication.
 * On success, fetches user profile from Firestore and sets a session cookie.
 */
export async function loginUser(data: LoginInput): Promise<AuthResponse> {
  try {
    const validatedData = LoginSchema.parse(data);
    console.log('Server Action: Attempting Firebase login for:', validatedData.email);

    const userCredential = await signInWithEmailAndPassword(auth, validatedData.email, validatedData.password);
    const firebaseUser = userCredential.user;

    if (firebaseUser) {
        // Fetch user profile from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userProfile = userDocSnap.data() as UserProfile;
            userProfile.id = firebaseUser.uid; // Ensure ID is set

            await setSessionCookie(userProfile);
            console.log('Server Action: Firebase Login successful, session set for:', userProfile.email);
            return {
                success: true,
                message: 'Login successful!',
                user: userProfile,
                redirectTo: userProfile.role === 'admin' ? '/admin/reports' : '/dashboard', // Adjust redirect based on role
            };
        } else {
             // This case should ideally not happen if user registered correctly
             // Optionally, create a profile if it's missing for an existing auth user
            console.error('Server Action: Firestore profile not found for user:', firebaseUser.uid);
             // For now, treat as error
            await firebaseSignOut(auth); // Sign out the Firebase user
            return { success: false, message: 'User profile not found. Please contact support.' };
        }
    } else {
      // Should not happen if signInWithEmailAndPassword resolves
      return { success: false, message: 'Firebase login failed unexpectedly.' };
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      return { success: false, message: `Validation failed: ${messages}` };
    }
    console.error('Server Action Error (loginUser Firebase):', error);
    // Map Firebase auth errors to user-friendly messages
    let message = 'An unexpected error occurred during login.';
    if (error.code) {
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                message = 'Invalid email or password.';
                break;
            case 'auth/invalid-email':
                message = 'Invalid email format.';
                break;
            default:
                message = 'Login failed. Please try again.';
        }
    }
    return { success: false, message };
  }
}

/**
 * Registers a new user using Firebase Authentication and creates a user profile in Firestore.
 * On success, sets a session cookie.
 */
export async function registerUser(data: RegisterInput): Promise<AuthResponse> {
    try {
        const validatedData = RegisterSchema.parse(data);
        console.log('Server Action: Attempting Firebase registration for:', validatedData.email);

        const userCredential = await createUserWithEmailAndPassword(auth, validatedData.email, validatedData.password);
        const firebaseUser = userCredential.user;

        if (firebaseUser) {
            // Create user profile in Firestore
            const newUserProfile: UserProfile = {
                id: firebaseUser.uid,
                name: validatedData.name,
                email: firebaseUser.email!,
                role: 'customer', // Default role
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUserProfile);

            await setSessionCookie(newUserProfile);
            console.log('Server Action: Firebase Registration successful, session set for:', newUserProfile.email);
            return {
                 success: true,
                 message: 'Registration successful! Welcome!',
                 user: newUserProfile,
                 redirectTo: '/dashboard',
            };
        } else {
             return { success: false, message: 'Firebase registration failed unexpectedly.' };
        }
    } catch (error: any) {
         if (error instanceof z.ZodError) {
            const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
            return { success: false, message: `Validation failed: ${messages}` };
        }
        console.error('Server Action Error (registerUser Firebase):', error);
        let message = 'An unexpected error occurred during registration.';
        if (error.code) {
            switch (error.code) {
                case 'auth/email-already-in-use':
                    message = 'An account with this email already exists.';
                    break;
                case 'auth/invalid-email':
                    message = 'Invalid email format.';
                    break;
                case 'auth/weak-password':
                    message = 'Password is too weak. Please choose a stronger password.';
                    break;
                default:
                    message = 'Registration failed. Please try again.';
            }
        }
        return { success: false, message };
    }
}

/**
 * Sends a password reset link using Firebase Authentication.
 */
export async function sendPasswordResetLink(data: ForgotPasswordInput): Promise<AuthResponse> {
    try {
        const validatedData = ForgotPasswordSchema.parse(data);
        console.log('Server Action: Requesting Firebase password reset for:', validatedData.email);

        await sendPasswordResetEmail(auth, validatedData.email);
        
        console.log('Server Action: Firebase password reset link request processed for:', validatedData.email);
        // Always return a generic success message for security
        return { success: true, message: 'If an account exists for this email, a password reset link has been sent.' };

    } catch (error: any) {
         if (error instanceof z.ZodError) {
            const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
            return { success: false, message: `Validation failed: ${messages}` };
        }
        console.error('Server Action Error (sendPasswordResetLink Firebase):', error);
        // Still return generic success to avoid leaking info, but log specific errors
        if (error.code === 'auth/invalid-email') {
             return { success: false, message: 'Invalid email format.' };
        }
        return { success: true, message: 'If an account exists for this email, a password reset link has been sent.' };
    }
}

/**
 * Logs the user out by signing out from Firebase and clearing the session cookie.
 */
export async function logoutUser(): Promise<{ success: boolean }> {
    try {
        console.log('Server Action: Logging out user (Firebase and cookie)');
        // Firebase sign out is client-side, but for server actions context, we mainly clear our cookie.
        // If Firebase client SDK was used for login, it should also sign out there.
        // Here, we primarily ensure our app's session state is cleared.
        // await firebaseSignOut(auth); // This would error if auth state not available server-side like this.
                                 // Actual Firebase logout typically happens on the client.
                                 // The cookie deletion effectively ends the server-recognized session.

        cookies().delete('session');
        return { success: true };
    } catch (error) {
        console.error('Server Action Error (logoutUser):', error);
        return { success: false };
    }
}

/**
 * Retrieves the current user session from the cookie.
 * This data is derived from Firebase user info after login/registration.
 */
export async function getUserSession(): Promise<UserProfile | null> {
    const sessionCookie = cookies().get('session');
    if (!sessionCookie) {
        return null;
    }

    try {
        const sessionData = JSON.parse(sessionCookie.value);
        // Basic validation of session data structure
        if (sessionData && sessionData.userId && sessionData.email && sessionData.role) {
             // The 'id' field in UserProfile corresponds to 'userId' in cookie
            return { 
                id: sessionData.userId, 
                name: sessionData.name, 
                email: sessionData.email, 
                role: sessionData.role,
                phone: sessionData.phone 
            } as UserProfile;
        }
        return null;
    } catch (error) {
        console.error('Error parsing session cookie:', error);
        cookies().delete('session'); // Clear invalid cookie
        return null;
    }
}
