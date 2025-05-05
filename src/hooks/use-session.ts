'use client';

import { useState, useEffect } from 'react';

interface UserInfo {
    id: string;
    name: string;
    email: string;
    role: 'customer' | 'staff' | 'admin';
    phone?: string; // Add other relevant fields if needed
}

interface SessionState {
    isLoggedIn: boolean;
    user: UserInfo | null;
}

interface UseSessionReturn {
    session: SessionState | null;
    loading: boolean;
    refreshSession: () => void; // Function to manually re-check session
}

/**
 * Client-side hook to check for the presence and basic validity of the session cookie.
 * **Note:** This hook ONLY checks if the cookie exists on the client.
 * It DOES NOT guarantee the session is still valid on the server.
 * For critical actions or loading sensitive data, always re-validate the session
 * on the server (e.g., in Server Components, Route Handlers, or Server Actions).
 *
 * @returns An object containing the session state (`isLoggedIn`, `user` details if found) and a loading indicator.
 */
export function useSession(): UseSessionReturn {
    const [session, setSession] = useState<SessionState | null>(null);
    const [loading, setLoading] = useState(true);

    const checkSession = () => {
        setLoading(true);
        try {
            const sessionCookie = document.cookie
                .split('; ')
                .find((row) => row.startsWith('session='));

            if (sessionCookie) {
                const cookieValue = sessionCookie.split('=')[1];
                if (cookieValue) {
                    const decodedValue = decodeURIComponent(cookieValue);
                    const parsedSession: Partial<UserInfo & { userId: string }> = JSON.parse(decodedValue);

                    // Basic validation: check for essential fields
                    if (parsedSession.userId && parsedSession.email && parsedSession.role) {
                         // Map userId to id for consistency if needed
                         const userInfo: UserInfo = {
                            id: parsedSession.userId,
                            name: parsedSession.name || 'User',
                            email: parsedSession.email,
                            role: parsedSession.role,
                            // Add phone mapping if it exists in cookie
                            // phone: parsedSession.phone
                         };
                        setSession({ isLoggedIn: true, user: userInfo });
                    } else {
                        // Cookie exists but is malformed or missing data
                        console.warn('Session cookie found but malformed.');
                        setSession({ isLoggedIn: false, user: null });
                         // Optionally clear the malformed cookie
                         document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
                    }
                } else {
                     // Cookie exists but has no value
                     setSession({ isLoggedIn: false, user: null });
                }
            } else {
                // No session cookie found
                setSession({ isLoggedIn: false, user: null });
            }
        } catch (error) {
            console.error("Error parsing session cookie:", error);
            setSession({ isLoggedIn: false, user: null });
             // Optionally clear the invalid cookie
             document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkSession(); // Check on initial mount

         // Optional: Listen for storage events if session changes across tabs might occur,
         // but cookie changes are typically handled per request.
         // window.addEventListener('storage', checkSession);
         // return () => window.removeEventListener('storage', checkSession);

    }, []);

    return { session, loading, refreshSession: checkSession };
}