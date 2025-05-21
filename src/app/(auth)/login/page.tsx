
'use client';

import Link from 'next/link';
// useRouter no longer needed for main redirect
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { loginUser, LoginInput, AuthResponse } from '@/actions/auth';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
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
      // loginUser will now either redirect server-side on success,
      // or return an AuthResponse on failure.
      const result: AuthResponse | void = await loginUser(loginData);

      // If result is returned, it means login failed (server did not redirect)
      if (result && !result.success) {
        setError(result.message);
        toast({
          title: 'Login Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
      // On successful login, server action redirects, so no client-side redirect needed.
      // Success toast is removed as page will navigate away.
      
    } catch (err: any) {
        // If the error is NEXT_REDIRECT, it's handled by Next.js and browser redirects.
        // We don't need to do anything specific for it here.
        if (err.message === 'NEXT_REDIRECT' || (typeof err.digest === 'string' && err.digest.startsWith('NEXT_REDIRECT'))) {
          // This error is expected when redirect() is called from server action.
          // The browser will handle the redirect. Let loading state persist until navigation.
          return; 
        }

        // Handle other errors
        console.error("Login page error:", err);
        const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
        setError(message);
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
    } finally {
      // Set loading to false only if not redirected.
      // If a redirect is in progress, this might not be reached or might flash.
      // It's generally safe to set it, as a redirect will unload the page.
      setLoading(false); 
    }
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
