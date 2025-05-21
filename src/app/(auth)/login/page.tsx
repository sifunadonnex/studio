
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { loginUser, LoginInput, AuthResponse } from '@/actions/auth'; // Import server action
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter(); // Keep for other potential uses, though not for main redirect now
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const loginData: LoginInput = { email, password };

    try {
      const result: AuthResponse = await loginUser(loginData); // Call server action

      if (result.success) {
        toast({
          title: 'Login Successful',
          description: result.message,
        });
        // Force a full page navigation to ensure cookie is sent with the new request
        // and server-side components/middleware correctly pick up the session.
        if (typeof window !== "undefined") {
            window.location.assign(result.redirectTo || '/dashboard');
        }
      } else {
        setError(result.message);
        toast({
          title: 'Login Failed',
          description: result.message,
          variant: 'destructive',
        });
        setLoading(false); // Ensure loading is false on failure
      }
    } catch (err) {
        console.error("Login page error:", err);
        const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
        setError(message);
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
        setLoading(false); // Ensure loading is false on catch
    } 
    // setLoading(false) will not be reached if window.location.assign happens, which is fine.
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Login to Your Account</CardTitle>
          <CardDescription>Enter your email and password to access your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
             {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-sm">
           <Link href="/forgot-password" passHref className="mb-2 text-primary hover:underline">
                Forgot password?
            </Link>
          <p className="text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Register here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
