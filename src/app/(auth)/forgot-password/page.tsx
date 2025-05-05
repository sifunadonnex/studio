{'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { sendPasswordResetLink, ForgotPasswordInput, AuthResponse } from '@/actions/auth'; // Import server action

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // Use state for success message


  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage(''); // Clear previous success message

    const forgotPasswordData: ForgotPasswordInput = { email };

    try {
        const result: AuthResponse = await sendPasswordResetLink(forgotPasswordData); // Call server action

        if (result.success) {
             setSuccessMessage(result.message); // Set success message from response
             toast({
                title: "Reset Link Request Processed",
                description: result.message, // Use message from response
             });
            setEmail(''); // Clear input on success
        } else {
            // Although the server action currently always returns success=true for security,
            // handle potential future failure scenarios or validation errors
            setError(result.message);
             toast({
                title: "Request Failed",
                description: result.message,
                variant: "destructive",
             });
        }
    } catch (err) {
        console.error("Forgot password page error:", err);
        const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
        setError(message);
        toast({
            title: "Error",
            description: message,
            variant: "destructive",
        });
         // Still show generic message to user in case of unexpected error
        setSuccessMessage('If an account exists for this email, a password reset link has been sent.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Forgot Your Password?</CardTitle>
          <CardDescription>Enter your email address below, and we'll send you a link to reset your password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetRequest} className="space-y-4">
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
            {error && <p className="text-sm text-destructive">{error}</p>}
            {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <p className="text-muted-foreground">
            Remember your password?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Login here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}