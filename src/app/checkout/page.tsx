'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Smartphone, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { processPayment, PaymentResult } from '@/services/payment'; // Import payment service

// Placeholder plan details - Fetch based on query param
const subscriptionPlans = {
  monthly: { name: 'Monthly Care Plan', price: 2500, currency: 'KES' },
  yearly: { name: 'Annual Pro Plan', price: 25000, currency: 'KES' },
  basic: { name: 'Basic Checkup Plan', price: 1000, currency: 'KES' },
};

type PlanKey = keyof typeof subscriptionPlans;

export default function CheckoutPage() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const planId = searchParams.get('plan') as PlanKey | null;

    const [selectedPlan, setSelectedPlan] = useState<typeof subscriptionPlans[PlanKey] | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<string>('card'); // 'card' or 'mpesa'
    const [loading, setLoading] = useState(false);
    const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Card details state (basic placeholders)
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvc, setCvc] = useState('');
    const [cardName, setCardName] = useState('');

    // M-Pesa state
    const [mpesaPhone, setMpesaPhone] = useState('');


    useEffect(() => {
        if (planId && subscriptionPlans[planId]) {
            setSelectedPlan(subscriptionPlans[planId]);
        } else {
            // Handle invalid or missing plan ID - redirect or show error
            setError("Invalid subscription plan selected.");
            console.error("Invalid plan ID:", planId);
        }
    }, [planId]);

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPlan) return;

        setLoading(true);
        setError(null);
        setPaymentResult(null);

        // Basic validation
        if (paymentMethod === 'card' && (!cardNumber || !expiryDate || !cvc || !cardName)) {
            setError("Please fill in all card details.");
            setLoading(false);
            return;
        }
         if (paymentMethod === 'mpesa' && !mpesaPhone) {
            setError("Please enter your M-Pesa phone number.");
            setLoading(false);
            return;
        }


        console.log("Processing payment for:", selectedPlan.name, "via", paymentMethod);

        try {
            // TODO: Replace with actual payment gateway integration (PHP backend)
             // Pass amount and method
             const result = await processPayment(selectedPlan.price, paymentMethod);
             setPaymentResult(result);

             if (result.success) {
                toast({
                    title: "Payment Successful!",
                     description: `Subscription to ${selectedPlan.name} activated. ${result.message}`,
                });
                // TODO: Update subscription status in DB (via PHP)
             } else {
                 setError(result.message || "Payment failed. Please try again.");
                 toast({
                     title: "Payment Failed",
                     description: result.message || "An unknown error occurred.",
                     variant: "destructive",
                 });
             }

        } catch (err) {
             console.error("Payment error:", err);
             const message = err instanceof Error ? err.message : "An unexpected error occurred during payment.";
             setError(message);
             toast({ title: "Payment Error", description: message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    if (error && !selectedPlan) {
         return (
            <div className="container mx-auto px-4 py-16 text-center">
                 <Card className="max-w-md mx-auto">
                     <CardHeader>
                        <CardTitle className="text-destructive">Error</CardTitle>
                     </CardHeader>
                     <CardContent>
                        <p>{error}</p>
                        <Link href="/subscriptions" passHref>
                             <Button variant="link" className="mt-4">Go back to plans</Button>
                        </Link>
                     </CardContent>
                </Card>
             </div>
        );
     }

     if (!selectedPlan) {
         // Loading state or handle invalid plan more gracefully
         return <div className="container mx-auto px-4 py-16 text-center">Loading plan details...</div>;
     }

     if (paymentResult?.success) {
         return (
             <div className="container mx-auto px-4 py-16 flex justify-center">
                 <Card className="w-full max-w-lg text-center shadow-lg">
                    <CardHeader>
                         <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                         <CardTitle className="text-2xl text-primary">Payment Successful!</CardTitle>
                        <CardDescription>Your subscription is now active.</CardDescription>
                     </CardHeader>
                    <CardContent className="space-y-2">
                         <p><strong>Plan:</strong> {selectedPlan.name}</p>
                         <p><strong>Amount Paid:</strong> {selectedPlan.currency} {selectedPlan.price.toLocaleString()}</p>
                         <p><strong>Transaction ID:</strong> {paymentResult.transactionId || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground mt-4">{paymentResult.message}</p>
                     </CardContent>
                     <CardFooter className="flex justify-center">
                        <Link href="/dashboard" passHref>
                            <Button>Go to Dashboard</Button>
                         </Link>
                     </CardFooter>
                </Card>
             </div>
        );
    }

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Checkout</CardTitle>
          <CardDescription>
            Complete your subscription for the <strong>{selectedPlan.name}</strong> plan.
             Amount due: <span className="font-semibold">{selectedPlan.currency} {selectedPlan.price.toLocaleString()}</span>
          </CardDescription>
        </CardHeader>
         <form onSubmit={handlePayment}>
            <CardContent className="space-y-6">
                {/* Payment Method Selection */}
                <div>
                    <Label className="text-base font-medium">Select Payment Method</Label>
                    <RadioGroup
                        defaultValue="card"
                        className="mt-2 grid grid-cols-2 gap-4"
                        value={paymentMethod}
                        onValueChange={setPaymentMethod}
                        >
                        <div>
                            <RadioGroupItem value="card" id="card" className="peer sr-only" />
                             <Label
                                htmlFor="card"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                                 <CreditCard className="mb-3 h-6 w-6" />
                                Credit/Debit Card
                            </Label>
                         </div>
                         <div>
                            <RadioGroupItem value="mpesa" id="mpesa" className="peer sr-only" />
                            <Label
                                htmlFor="mpesa"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                             >
                                <Smartphone className="mb-3 h-6 w-6" />
                                M-Pesa
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Card Details Form */}
                {paymentMethod === 'card' && (
                    <div className="space-y-4 p-4 border rounded-md">
                         <h3 className="font-medium mb-2">Enter Card Details</h3>
                         <div className="space-y-2">
                             <Label htmlFor="cardName">Name on Card</Label>
                             <Input id="cardName" placeholder="John Doe" required value={cardName} onChange={e => setCardName(e.target.value)} disabled={loading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cardNumber">Card Number</Label>
                             {/* TODO: Add card formatting/validation library */}
                            <Input id="cardNumber" placeholder="**** **** **** ****" required value={cardNumber} onChange={e => setCardNumber(e.target.value)} disabled={loading}/>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                 <Label htmlFor="expiryDate">Expiry Date</Label>
                                 <Input id="expiryDate" placeholder="MM/YY" required value={expiryDate} onChange={e => setExpiryDate(e.target.value)} disabled={loading}/>
                            </div>
                            <div className="space-y-2">
                                 <Label htmlFor="cvc">CVC</Label>
                                 <Input id="cvc" placeholder="123" required value={cvc} onChange={e => setCvc(e.target.value)} disabled={loading}/>
                             </div>
                        </div>
                         <p className="text-xs text-muted-foreground">Your card details are securely processed.</p>
                    </div>
                 )}

                {/* M-Pesa Form */}
                {paymentMethod === 'mpesa' && (
                    <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-medium mb-2">Enter M-Pesa Details</h3>
                         <div className="space-y-2">
                            <Label htmlFor="mpesaPhone">M-Pesa Phone Number</Label>
                             <Input id="mpesaPhone" type="tel" placeholder="e.g., 2547XXXXXXXX" required value={mpesaPhone} onChange={e => setMpesaPhone(e.target.value)} disabled={loading}/>
                         </div>
                         <p className="text-xs text-muted-foreground">You will receive an STK push on your phone to confirm the payment of {selectedPlan.currency} {selectedPlan.price.toLocaleString()}.</p>
                    </div>
                 )}

                 {error && <p className="text-sm text-destructive text-center">{error}</p>}

             </CardContent>
             <CardFooter>
                 <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading || !selectedPlan}>
                    {loading ? 'Processing Payment...' : `Pay ${selectedPlan.currency} ${selectedPlan.price.toLocaleString()}`}
                </Button>
             </CardFooter>
        </form>
      </Card>
    </div>
  );
}
