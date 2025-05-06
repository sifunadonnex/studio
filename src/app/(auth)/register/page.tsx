'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { registerUser, RegisterInput, AuthResponse } from '@/actions/auth'; // Import server action
import { useToast } from '@/hooks/use-toast';


export default function RegisterPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
             toast({
                title: "Registration Error",
                description: "Passwords do not match.",
                variant: "destructive",
            });
            return;
        }

        const registerData: RegisterInput = { name, email, password };

        try {
            const result: AuthResponse = await registerUser(registerData); // Call server action

            if (result.success) {
                 toast({
                    title: "Registration Successful!",
                    description: result.message,
                 });
                 // Redirect using Next.js router
                 router.push(result.redirectTo || '/dashboard');
                 router.refresh(); // Refresh server components
            } else {
                setError(result.message);
                toast({
                    title: "Registration Failed",
                    description: result.message,
                    variant: "destructive",
                });
            }

        } catch (err) {
             console.error("Registration page error:", err);
             const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
             setError(message);
             toast({
                title: "Error",
                description: message,
                variant: "destructive",
             });
        } finally {
            setLoading(false);
        }
    };


  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Create Your Account</CardTitle>
          <CardDescription>Join Top Autocorrect Garage to manage your car services easily.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    autoComplete="name"
                 />
             </div>
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
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
             {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Login here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}