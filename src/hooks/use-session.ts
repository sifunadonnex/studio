
'use client';

import { useState, useEffect, useCallback } from 'react';

export interface UserInfo { // Exporting for use in other client components if needed
    id: string; // Firebase UID, maps to userId in cookie
    name: string;
    email: string;
    role: 'customer' | 'staff' | 'admin';
    phone?: string; 
}

interface SessionState {
    isLoggedIn: boolean;
    user: UserInfo | null;
}

interface UseSessionReturn {
    session: SessionState | null;
    loading: boolean;
    refreshSession: () => void; 
}

/**
 * Client-side hook to check for the presence and basic validity of the session cookie.
 * The cookie is set by server actions after successful Firebase authentication.
 */
export function useSession(): UseSessionReturn {
    const [session, setSession] = useState<SessionState | null>(null);
    const [loading, setLoading] = useState(true);

    const checkSession = useCallback(() => {
        // console.log("useSession: Checking session cookie...");
        setLoading(true);
        try {
            const sessionCookie = document.cookie
                .split('; ')
                .find((row) => row.startsWith('session='));

            if (sessionCookie) {
                const cookieValue = sessionCookie.split('=')[1];
                if (cookieValue) {
                    const decodedValue = decodeURIComponent(cookieValue);
                    // Structure of cookie set by updated auth actions:
                    // { userId, name, email, role, phone, loggedInAt }
                    const parsedSession: Partial<UserInfo & { userId: string, loggedInAt: number }> = JSON.parse(decodedValue);
                    // console.log("useSession: Parsed cookie data:", parsedSession);

                    if (parsedSession.userId && parsedSession.email && parsedSession.role && parsedSession.loggedInAt) {
                         const userInfo: UserInfo = {
                            id: parsedSession.userId, // Map userId from cookie to id in UserInfo
                            name: parsedSession.name || 'User',
                            email: parsedSession.email,
                            role: parsedSession.role as 'customer' | 'staff' | 'admin',
                            phone: parsedSession.phone || undefined,
                         };
                        // console.log("useSession: Session valid, user:", userInfo);
                        setSession({ isLoggedIn: true, user: userInfo });
                    } else {
                        console.warn('useSession: Session cookie found but malformed or missing required fields.');
                        setSession({ isLoggedIn: false, user: null });
                        document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
                    }
                } else {
                     console.log("useSession: Session cookie found but has no value.");
                     setSession({ isLoggedIn: false, user: null });
                     document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
                }
            } else {
                // console.log("useSession: No session cookie found.");
                setSession({ isLoggedIn: false, user: null });
            }
        } catch (error) {
            console.error("useSession: Error parsing session cookie:", error);
            setSession({ isLoggedIn: false, user: null });
            document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
        } finally {
            setLoading(false);
            // console.log("useSession: Check finished, loading set to false.");
        }
    }, []);

    useEffect(() => {
        checkSession();
        window.addEventListener('focus', checkSession);
        return () => {
            window.removeEventListener('focus', checkSession);
        };
    }, [checkSession]);

    return { session, loading, refreshSession: checkSession };
}
