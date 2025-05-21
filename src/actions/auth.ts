
'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation'; // Import redirect
import { auth, db } from '@/lib/firebase/config'; // Firebase auth and db instances
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

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
    createdAt?: string;
    updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: UserProfile;
}

// --- Helper to set session cookie ---
export async function setSessionCookie(userData: UserProfile) {
    const sessionData = {
        userId: userData.id, 
        name: userData.name,
        email: userData.email,
        role: userData.role,
        phone: userData.phone,
        loggedInAt: Date.now(),
    };
    const cookieStore = await cookies();
    cookieStore.set('session', JSON.stringify(sessionData), {
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
 * On success, fetches user profile, sets session cookie, and redirects.
 * Returns AuthResponse only on failure.
 */
export async function loginUser(data: LoginInput): Promise<AuthResponse> {
  try {
    const validatedData = LoginSchema.parse(data);
    console.log('Server Action: Attempting Firebase login for:', validatedData.email);

    const userCredential = await signInWithEmailAndPassword(auth, validatedData.email, validatedData.password);
    const firebaseUser = userCredential.user;

    if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const firestoreData = userDocSnap.data();
            const userProfile: UserProfile = {
                id: firebaseUser.uid,
                name: firestoreData.name,
                email: firestoreData.email,
                role: firestoreData.role,
                phone: firestoreData.phone,
                createdAt: (firestoreData.createdAt instanceof Timestamp ? firestoreData.createdAt.toDate() : firestoreData.createdAt)?.toISOString(),
                updatedAt: (firestoreData.updatedAt instanceof Timestamp ? firestoreData.updatedAt.toDate() : firestoreData.updatedAt)?.toISOString(),
            };

            await setSessionCookie(userProfile); 
            console.log('Server Action: Firebase Login successful, session set for:', userProfile.email);
            
            const redirectToPath = userProfile.role === 'admin' ? '/admin/reports' : '/dashboard';
            redirect(redirectToPath); // Perform server-side redirect

        } else {
            console.error('Server Action: Firestore profile not found for user:', firebaseUser.uid);
            await firebaseSignOut(auth); 
            return { success: false, message: 'User profile not found. Please contact support.' };
        }
    } else {
      return { success: false, message: 'Firebase login failed unexpectedly.' };
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      return { success: false, message: `Validation failed: ${messages}` };
    }
    // Check if error is due to redirect()
    if (error.message === 'NEXT_REDIRECT' || (typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT'))) {
      throw error; // Re-throw to let Next.js handle the redirect
    }
    console.error('Server Action Error (loginUser Firebase):', error);
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
 * On success, sets a session cookie and redirects.
 * Returns AuthResponse only on failure.
 */
export async function registerUser(data: RegisterInput): Promise<AuthResponse> {
    try {
        const validatedData = RegisterSchema.parse(data);
        console.log('Server Action: Attempting Firebase registration for:', validatedData.email);

        const userCredential = await createUserWithEmailAndPassword(auth, validatedData.email, validatedData.password);
        const firebaseUser = userCredential.user;

        if (firebaseUser) {
            const now = new Date();
            const firestoreDocumentData = {
                name: validatedData.name,
                email: firebaseUser.email!,
                role: 'customer' as 'customer' | 'staff' | 'admin',
                phone: undefined, 
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), firestoreDocumentData);

            const userProfileForSession: UserProfile = {
                id: firebaseUser.uid,
                name: validatedData.name,
                email: firebaseUser.email!,
                role: 'customer',
                phone: undefined,
                createdAt: now.toISOString(), 
                updatedAt: now.toISOString(), 
            };

            await setSessionCookie(userProfileForSession);
            console.log('Server Action: Firebase Registration successful, session set for:', userProfileForSession.email);
            
            redirect('/dashboard'); // Perform server-side redirect

        } else {
             return { success: false, message: 'Firebase registration failed unexpectedly.' };
        }
    } catch (error: any) {
         if (error instanceof z.ZodError) {
            const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
            return { success: false, message: `Validation failed: ${messages}` };
        }
        // Check if error is due to redirect()
        if (error.message === 'NEXT_REDIRECT' || (typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT'))) {
            throw error; // Re-throw to let Next.js handle the redirect
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
        return { success: true, message: 'If an account exists for this email, a password reset link has been sent.' };

    } catch (error: any) {
         if (error instanceof z.ZodError) {
            const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
            return { success: false, message: `Validation failed: ${messages}` };
        }
        console.error('Server Action Error (sendPasswordResetLink Firebase):', error);
        if (error.code === 'auth/invalid-email') {
             return { success: false, message: 'Invalid email format.' };
        }
        // For security reasons, even on error (like user not found), present a generic success message.
        return { success: true, message: 'If an account exists for this email, a password reset link has been sent.' };
    }
}

/**
 * Logs the user out by signing out from Firebase and clearing the session cookie.
 */
export async function logoutUser(): Promise<{ success: boolean }> {
    try {
        console.log('Server Action: Logging out user (Firebase and cookie)');
        const cookieStore = await cookies(); 
        cookieStore.delete('session'); 
        // No need to call firebaseSignOut(auth) here if we primarily rely on our own session cookie
        // and Firebase auth state is managed client-side or not strictly necessary for this app's auth flow once logged out.
        // If Firebase sessions were being managed on the server with Admin SDK, then server-side signout would be relevant.
        return { success: true };
    } catch (error) {
        console.error('Server Action Error (logoutUser):', error);
        return { success: false };
    }
}

/**
 * Retrieves the current user session from the cookie.
 */
export async function getUserSession(): Promise<UserProfile | null> {
    console.log('[getUserSession] Attempting to get session cookie...');
    const cookieStore = await cookies(); 
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
        console.log('[getUserSession] No session cookie found.');
        return null;
    }

    console.log('[getUserSession] Session cookie found. Value:', sessionCookie.value);

    try {
        const sessionData = JSON.parse(sessionCookie.value);
        console.log('[getUserSession] Parsed session data:', sessionData);

        if (sessionData && sessionData.userId && sessionData.email && sessionData.role && sessionData.loggedInAt) {
            const userProfile: UserProfile = { 
                id: sessionData.userId, 
                name: sessionData.name || 'User', // Provide a fallback for name
                email: sessionData.email, 
                role: sessionData.role,
                phone: sessionData.phone || undefined, // Ensure phone is optional
            };
            console.log('[getUserSession] Session valid. Returning user profile:', userProfile);
            return userProfile;
        }
        console.warn('[getUserSession] Parsed session data is malformed or missing required fields.');
        // Do not delete cookie here; let middleware handle redirection if session is deemed invalid.
        return null;
    } catch (error) {
        console.error('[getUserSession] Error parsing session cookie:', error);
        // Do not delete cookie here.
        return null;
    }
}

