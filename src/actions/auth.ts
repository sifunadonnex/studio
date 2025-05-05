'use server';

import { z } from 'zod';
import { cookies } from 'next/headers'; // To manage session cookies

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

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: { // Include basic user info on successful login/register
    id: string;
    name: string;
    email: string;
    role: 'customer' | 'staff' | 'admin';
  };
  redirectTo?: string; // Optional redirect path
}


// --- Server Actions ---

/**
 * Simulates logging in a user by checking credentials against a dummy user.
 * In a real app, this would call a PHP/MySQL backend API.
 * On success, sets a session cookie.
 */
export async function loginUser(data: LoginInput): Promise<AuthResponse> {
  try {
    const validatedData = LoginSchema.parse(data);
    console.log('Server Action: Attempting login for:', validatedData.email);

    // --- Simulate Backend Call ---
    // Replace this with your actual API call (fetch/axios) to PHP/MySQL
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Dummy user check (replace with database lookup)
    const dummyUser = {
        id: '1',
        name: 'John Doe',
        email: 'user@example.com',
        passwordHash: 'password', // In real app, this should be a hash
        role: 'customer' as const,
    };

    if (validatedData.email === dummyUser.email && validatedData.password === dummyUser.passwordHash) {
        console.log('Server Action: Login successful for:', validatedData.email);

        // --- Session Management (Using Secure HTTP-Only Cookie) ---
        const sessionData = {
            userId: dummyUser.id,
            name: dummyUser.name,
            email: dummyUser.email,
            role: dummyUser.role,
            loggedInAt: Date.now(),
        };

        // Set a secure, httpOnly cookie
        cookies().set('session', JSON.stringify(sessionData), {
            httpOnly: true, // Prevents client-side JavaScript access
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            maxAge: 60 * 60 * 24 * 7, // 1 week expiration
            path: '/', // Cookie available for all paths
            sameSite: 'lax', // Protects against CSRF
        });

        return {
            success: true,
            message: 'Login successful!',
            user: { id: dummyUser.id, name: dummyUser.name, email: dummyUser.email, role: dummyUser.role },
            redirectTo: '/dashboard',
        };
    } else {
      console.log('Server Action: Login failed for:', validatedData.email);
      return { success: false, message: 'Invalid email or password.' };
    }
    // --- End Simulate Backend Call ---

  } catch (error) {
    if (error instanceof z.ZodError) {
      // Combine Zod error messages
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      return { success: false, message: `Validation failed: ${messages}` };
    }
    console.error('Server Action Error (loginUser):', error);
    return { success: false, message: 'An unexpected error occurred during login.' };
  }
}

/**
 * Simulates registering a new user.
 * In a real app, this would call a PHP/MySQL backend API to create the user.
 * On success, sets a session cookie.
 */
export async function registerUser(data: RegisterInput): Promise<AuthResponse> {
    try {
        const validatedData = RegisterSchema.parse(data);
        console.log('Server Action: Attempting registration for:', validatedData.email);

        // --- Simulate Backend Call ---
        // Replace with your actual API call to PHP/MySQL
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Simulate checking if user exists (replace with database lookup)
        const userExists = false;

        if (userExists) {
             console.log('Server Action: Registration failed - user exists:', validatedData.email);
             return { success: false, message: 'An account with this email already exists.' };
        }

         // Simulate user creation (replace with database insert)
         const newUser = {
            id: '2', // Generate unique ID
            name: validatedData.name,
            email: validatedData.email,
            role: 'customer' as const, // Default role
         };
         console.log('Server Action: Registration successful for:', validatedData.email);

         // --- Session Management (Using Secure HTTP-Only Cookie) ---
         const sessionData = {
            userId: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            loggedInAt: Date.now(),
        };

         cookies().set('session', JSON.stringify(sessionData), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
            sameSite: 'lax',
        });

        return {
             success: true,
             message: 'Registration successful! Welcome!',
             user: newUser,
             redirectTo: '/dashboard', // Redirect to dashboard after successful registration
        };
        // --- End Simulate Backend Call ---

    } catch (error) {
         if (error instanceof z.ZodError) {
            const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
            return { success: false, message: `Validation failed: ${messages}` };
        }
        console.error('Server Action Error (registerUser):', error);
        return { success: false, message: 'An unexpected error occurred during registration.' };
    }
}


/**
 * Simulates sending a password reset link.
 * In a real app, this would call a PHP/MySQL backend API to generate a token and send an email.
 */
export async function sendPasswordResetLink(data: ForgotPasswordInput): Promise<AuthResponse> {
    try {
        const validatedData = ForgotPasswordSchema.parse(data);
        console.log('Server Action: Requesting password reset for:', validatedData.email);

        // --- Simulate Backend Call ---
        // Replace with your actual API call (check email, generate token, send email)
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Simulate email sending success (don't reveal if email exists)
        const emailSent = true;

        if (emailSent) {
             console.log('Server Action: Password reset link request processed for:', validatedData.email);
             // Always return a generic success message for security
             return { success: true, message: 'If an account exists for this email, a password reset link has been sent.' };
        } else {
            // Log the error server-side, but return generic success to the user
             console.error('Server Action: Failed to send password reset email for:', validatedData.email);
             return { success: true, message: 'If an account exists for this email, a password reset link has been sent.' };
        }
        // --- End Simulate Backend Call ---

    } catch (error) {
         if (error instanceof z.ZodError) {
            const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
            return { success: false, message: `Validation failed: ${messages}` };
        }
        console.error('Server Action Error (sendPasswordResetLink):', error);
        // Still return generic success to avoid leaking info
        return { success: true, message: 'If an account exists for this email, a password reset link has been sent.' };
    }
}


/**
 * Logs the user out by clearing the session cookie.
 */
export async function logoutUser(): Promise<{ success: boolean }> {
    try {
        console.log('Server Action: Logging out user');
        cookies().delete('session');
        return { success: true };
    } catch (error) {
        console.error('Server Action Error (logoutUser):', error);
        return { success: false };
    }
}

/**
 * Retrieves the current user session from the cookie.
 * To be called from Server Components or Route Handlers.
 */
export async function getUserSession() {
    const sessionCookie = cookies().get('session');
    if (!sessionCookie) {
        return null;
    }

    try {
        const sessionData = JSON.parse(sessionCookie.value);
        // Basic validation of session data structure
        if (sessionData && sessionData.userId && sessionData.email && sessionData.role) {
            return sessionData as { userId: string; name: string; email: string; role: 'customer' | 'staff' | 'admin'; loggedInAt: number };
        }
        return null;
    } catch (error) {
        console.error('Error parsing session cookie:', error);
        // Clear invalid cookie
        cookies().delete('session');
        return null;
    }
}