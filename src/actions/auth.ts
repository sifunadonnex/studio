
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
    const nodeEnv = process.env.NODE_ENV;
    const isProduction = nodeEnv === 'production';
    
    console.log(`[setSessionCookie] Preparing to set cookie. UserData role: ${userData.role}. UserData (first 100 chars): ${JSON.stringify(userData).substring(0,100)}...`);
    console.log(`[setSessionCookie] NODE_ENV: ${nodeEnv}, isProduction: ${isProduction}. Secure flag will be: ${isProduction}`);

    const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
        sameSite: 'lax' as 'lax' | 'strict' | 'none' | undefined, // Ensure type matches
    };

    console.log('[setSessionCookie] Attempting to set cookie "session" with options:', JSON.stringify(cookieOptions));
    console.log('[setSessionCookie] Session data to be stringified (first 100 chars):', JSON.stringify(sessionData).substring(0, 100) + "...");

    try {
        cookieStore.set('session', JSON.stringify(sessionData), cookieOptions);
        console.log('[setSessionCookie] Cookie "session" set successfully.');
    } catch (error) {
        console.error('[setSessionCookie] CRITICAL ERROR setting cookie:', error);
    }
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
    console.log('[loginUser] Server Action: Attempting Firebase login for:', validatedData.email);

    const userCredential = await signInWithEmailAndPassword(auth, validatedData.email, validatedData.password);
    const firebaseUser = userCredential.user;

    if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const firestoreData = userDocSnap.data();
            console.log('[loginUser] Firestore data received:', firestoreData);
            console.log('[loginUser] Firestore data role:', firestoreData.role);

            if (!firestoreData.role) {
                console.error('[loginUser] CRITICAL: User role not found in Firestore for user:', firebaseUser.uid);
                await firebaseSignOut(auth); 
                return { success: false, message: 'User profile is incomplete (missing role). Please contact support.' };
            }

            const userProfile: UserProfile = {
                id: firebaseUser.uid,
                name: firestoreData.name,
                email: firestoreData.email,
                role: firestoreData.role as 'customer' | 'staff' | 'admin', 
                phone: firestoreData.phone,
                createdAt: (firestoreData.createdAt instanceof Timestamp ? firestoreData.createdAt.toDate() : firestoreData.createdAt)?.toISOString(),
                updatedAt: (firestoreData.updatedAt instanceof Timestamp ? firestoreData.updatedAt.toDate() : firestoreData.updatedAt)?.toISOString(),
            };
            
            console.log('[loginUser] UserProfile object to be set in cookie:', userProfile);
            await setSessionCookie(userProfile); 
            console.log('[loginUser] Server Action: Firebase Login successful, session set for:', userProfile.email);
            
            const redirectToPath = userProfile.role === 'admin' ? '/admin/reports' : '/dashboard';
            console.log(`[loginUser] Redirecting to ${redirectToPath}`);
            redirect(redirectToPath); 

        } else {
            console.error('[loginUser] Server Action: Firestore profile not found for user:', firebaseUser.uid);
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
    if (error.message === 'NEXT_REDIRECT' || (typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT'))) {
      console.log('[loginUser] Caught redirect error, re-throwing.');
      throw error; 
    }
    console.error('[loginUser] Server Action Error (loginUser Firebase):', error);
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
        console.log('[registerUser] Server Action: Attempting Firebase registration for:', validatedData.email);

        const userCredential = await createUserWithEmailAndPassword(auth, validatedData.email, validatedData.password);
        const firebaseUser = userCredential.user;

        if (!firebaseUser || !firebaseUser.email) {
            console.error('[registerUser] Firebase user created successfully, but user object or email is missing. This should not happen.');
            // Attempt to sign out the partially created user to avoid orphaned accounts if possible.
            if (firebaseUser) await firebaseSignOut(auth);
            return { success: false, message: 'Registration process failed due to incomplete user data from authentication provider.' };
        }
        
        const now = new Date();
        const firestoreDocumentData = {
            name: validatedData.name,
            email: firebaseUser.email, // Safe to use now after the check
            role: 'customer' as 'customer' | 'staff' | 'admin', // Default role
            phone: undefined, 
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        
        console.log('[registerUser] Attempting to write to Firestore for user:', firebaseUser.uid, 'with data:', firestoreDocumentData);
        await setDoc(doc(db, 'users', firebaseUser.uid), firestoreDocumentData);
        console.log('[registerUser] Firestore document created successfully for user:', firebaseUser.uid);

        const userProfileForSession: UserProfile = {
            id: firebaseUser.uid,
            name: validatedData.name,
            email: firebaseUser.email, // Safe to use now
            role: 'customer', 
            phone: undefined,
            createdAt: now.toISOString(), 
            updatedAt: now.toISOString(), 
        };
        
        console.log('[registerUser] UserProfile object to be set in cookie:', userProfileForSession);
        await setSessionCookie(userProfileForSession);
        console.log('[registerUser] Server Action: Firebase Registration successful, session set for:', userProfileForSession.email);
        
        console.log('[registerUser] Redirecting to /dashboard');
        redirect('/dashboard'); 

    } catch (error: any) {
         if (error instanceof z.ZodError) {
            const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
            return { success: false, message: `Validation failed: ${messages}` };
        }
        if (error.message === 'NEXT_REDIRECT' || (typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT'))) {
            console.log('[registerUser] Caught redirect error, re-throwing.');
            throw error; 
        }

        console.error('[registerUser] Server Action Error (registerUser Firebase):', error);
        let message = 'An unexpected error occurred during registration.';
        if (error.code) { // Firebase Auth specific error codes
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
                default: // Other Firebase Auth errors
                    message = `Registration error: ${error.message || 'Please try again.'} (Auth Code: ${error.code})`;
            }
        } else if (error.message) { // For non-Firebase Auth errors (e.g., Firestore, cookie setting)
             message = `Registration process failed: ${error.message}`;
        }
        // If it's a Firestore permission error, error.message might contain "PERMISSION_DENIED"
        // You could add more specific checks here if needed, e.g., if (error.message.includes('PERMISSION_DENIED')) { ... }
        return { success: false, message };
    }
}

/**
 * Sends a password reset link using Firebase Authentication.
 */
export async function sendPasswordResetLink(data: ForgotPasswordInput): Promise<AuthResponse> {
    try {
        const validatedData = ForgotPasswordSchema.parse(data);
        console.log('[sendPasswordResetLink] Server Action: Requesting Firebase password reset for:', validatedData.email);

        await sendPasswordResetEmail(auth, validatedData.email);
        
        console.log('[sendPasswordResetLink] Server Action: Firebase password reset link request processed for:', validatedData.email);
        return { success: true, message: 'If an account exists for this email, a password reset link has been sent.' };

    } catch (error: any) {
         if (error instanceof z.ZodError) {
            const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
            return { success: false, message: `Validation failed: ${messages}` };
        }
        console.error('[sendPasswordResetLink] Server Action Error (sendPasswordResetLink Firebase):', error);
        if (error.code === 'auth/invalid-email') {
             return { success: false, message: 'Invalid email format.' };
        }
        // For security reasons, even if user not found, present a generic success message.
        return { success: true, message: 'If an account exists for this email, a password reset link has been sent.' };
    }
}

/**
 * Logs the user out by signing out from Firebase and clearing the session cookie.
 */
export async function logoutUser(): Promise<{ success: boolean }> {
    try {
        console.log('[logoutUser] Server Action: Logging out user (Firebase and cookie)');
        const cookieStore = await cookies(); 
        console.log('[logoutUser] Deleting "session" cookie.');
        cookieStore.delete('session'); 
        console.log('[logoutUser] Session cookie deleted from store.');
        // No need to call firebaseSignOut(auth) here if we are only relying on the cookie for session state.
        // If you also maintain Firebase client-side auth state and want to clear it, you would do it on the client.
        return { success: true };
    } catch (error) {
        console.error('[logoutUser] Server Action Error (logoutUser):', error);
        return { success: false };
    }
}

/**
 * Retrieves the current user session from the cookie.
 */
export async function getUserSession(): Promise<UserProfile | null> {
    console.log('[getUserSession] Attempting to get session cookie...');
    const cookieStore = await cookies();
    
    const allCookies = cookieStore.getAll();
    console.log('[getUserSession] All cookies available to server on this request:', JSON.stringify(allCookies.map(c => ({ name: c.name, value: c.value.substring(0,30) + "..."}))));

    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
        console.log('[getUserSession] No "session" cookie found in store.');
        return null;
    }

    if (!sessionCookie.value) {
        console.log('[getUserSession] "session" cookie found, but its value is empty or undefined.');
        return null;
    }
    console.log('[getUserSession] "session" cookie found. Value (first 100 chars):', sessionCookie.value.substring(0,100) + "...");

    try {
        const sessionData = JSON.parse(sessionCookie.value);

        if (sessionData && sessionData.userId && sessionData.email && sessionData.role && sessionData.loggedInAt) {
            const userProfile: UserProfile = { 
                id: sessionData.userId, 
                name: sessionData.name || 'User', 
                email: sessionData.email, 
                role: sessionData.role, 
                phone: sessionData.phone || undefined, 
            };
            console.log('[getUserSession] Session valid and parsed. User role from cookie:', userProfile.role, 'Returning user profile for:', userProfile.email);
            return userProfile;
        }
        console.warn('[getUserSession] Parsed session data is malformed or missing required fields (userId, email, role, loggedInAt). Data (first 100 chars):', JSON.stringify(sessionData).substring(0,100) + "...");
        return null;
    } catch (error) {
        console.error('[getUserSession] Error parsing "session" cookie JSON:', error, "Cookie value (first 100 chars):", sessionCookie.value.substring(0,100) + "...");
        return null;
    }
}
    

    

