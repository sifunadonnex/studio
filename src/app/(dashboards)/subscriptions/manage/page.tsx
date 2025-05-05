'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, CreditCard, RefreshCw, FileText } from "lucide-react";
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

// Placeholder data - Fetch from MySQL via PHP
const mockSubscription = {
  id: 'SUB789',
  planName: 'Monthly Care Plan',
  status: 'Active', // Could be 'Active', 'Cancelled', 'Expired', 'Payment Failed'
  startDate: '2024-08-01',
  nextBillingDate: '2024-11-01',
  price: 'KES 2,500',
  billingCycle: 'Monthly',
  paymentMethod: '**** **** **** 4242 (Visa)', // Masked payment method
};

const mockPaymentHistory = [
    { id: 'PAY101', date: '2024-10-01', amount: 'KES 2,500', status: 'Paid' },
    { id: 'PAY100', date: '2024-09-01', amount: 'KES 2,500', status: 'Paid' },
    { id: 'PAY099', date: '2024-08-01', amount: 'KES 2,500', status: 'Paid' },
]

type SubscriptionStatus = 'Active' | 'Cancelled' | 'Expired' | 'Payment Failed';

export default function ManageSubscriptionPage() {
  const { toast } = useToast();
  const [subscription, setSubscription] = useState(mockSubscription); // Use state
   const [paymentHistory, setPaymentHistory] = useState(mockPaymentHistory);
  const [loading, setLoading] = useState(false);

   // TODO: Implement API calls for actions
    const handleCancelSubscription = async () => {
        console.log("Cancel subscription:", subscription.id);
        setLoading(true);
         // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
         const success = true; // Simulate success
        if (success) {
            setSubscription(prev => ({ ...prev!, status: 'Cancelled', nextBillingDate: '-' })); // Update state
            toast({ title: "Subscription Cancelled", description: "Your subscription has been cancelled and will not renew." });
        } else {
             toast({ title: "Cancellation Failed", description: "Could not cancel subscription. Please contact support.", variant: "destructive" });
        }
        setLoading(false);
    };

    const handleUpdatePayment = () => {
        console.log("Update payment method");
        // TODO: Redirect to payment update page or open a modal (e.g., Stripe Elements)
        toast({ title: "Action Required", description: "Redirecting to update payment method..." });
         alert("Payment method update functionality not implemented.");
    };

    const getStatusBadgeVariant = (status: SubscriptionStatus): "default" | "secondary" | "destructive" | "outline" => {
         switch (status) {
            case 'Active': return 'default'; // Primary color
            case 'Cancelled': return 'secondary'; // Gray
            case 'Expired': return 'outline'; // Outline
            case 'Payment Failed': return 'destructive'; // Red
            default: return 'outline';
        }
     };


  return (
    <div>
      <h1 className="text-3xl font-bold text-primary mb-8">Manage Subscription</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Subscription Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your Current Plan</CardTitle>
             <CardDescription>Details of your active subscription with Top Autocorrect Garage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription ? (
              <>
                 <div className="flex justify-between items-center">
                     <span className="font-medium text-lg">{subscription.planName}</span>
                    <Badge variant={getStatusBadgeVariant(subscription.status as SubscriptionStatus)}>{subscription.status}</Badge>
                </div>
                 <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <p className="text-muted-foreground">Start Date:</p><p>{subscription.startDate}</p>
                    <p className="text-muted-foreground">Next Billing Date:</p><p>{subscription.nextBillingDate}</p>
                     <p className="text-muted-foreground">Price:</p><p>{subscription.price} ({subscription.billingCycle})</p>
                    <p className="text-muted-foreground">Payment Method:</p><p>{subscription.paymentMethod}</p>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">You do not have an active subscription.</p>
            )}
          </CardContent>
          {subscription && subscription.status === 'Active' && (
            <CardFooter className="flex flex-col sm:flex-row justify-end gap-2">
                 <Button variant="outline" onClick={handleUpdatePayment} disabled={loading}>
                     <CreditCard className="mr-2 h-4 w-4" /> Update Payment Method
                 </Button>

                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="destructive" disabled={loading}>
                             <XCircle className="mr-2 h-4 w-4" /> Cancel Subscription
                         </Button>
                     </AlertDialogTrigger>
                    <AlertDialogContent>
                         <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
                             <AlertDialogDescription>
                                Your subscription benefits will remain active until {subscription.nextBillingDate}. After this date, the subscription will not renew.
                             </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                            <AlertDialogAction onClick={handleCancelSubscription} className="bg-destructive hover:bg-destructive/90">
                                Confirm Cancellation
                            </AlertDialogAction>
                         </AlertDialogFooter>
                    </AlertDialogContent>
                 </AlertDialog>

            </CardFooter>
          )}
           {subscription && subscription.status === 'Payment Failed' && (
             <CardFooter>
                  <Button variant="destructive" onClick={handleUpdatePayment} disabled={loading} className="w-full">
                     <RefreshCw className="mr-2 h-4 w-4" /> Update Payment Method to Reactivate
                 </Button>
            </CardFooter>
           )}
            {!subscription && (
              <CardFooter>
                  <Link href="/subscriptions" passHref className="w-full">
                      <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">Explore Plans</Button>
                  </Link>
              </CardFooter>
            )}
        </Card>

         {/* Payment History */}
         <Card>
             <CardHeader>
                <CardTitle>Payment History</CardTitle>
                 <CardDescription>Record of your subscription payments.</CardDescription>
             </CardHeader>
             <CardContent>
                 {paymentHistory.length > 0 ? (
                    <ul className="space-y-3">
                         {paymentHistory.map(payment => (
                             <li key={payment.id} className="flex justify-between items-center text-sm border-b pb-2">
                                <div>
                                    <p className="font-medium">{payment.date}</p>
                                     <p className="text-xs text-muted-foreground">ID: {payment.id}</p>
                                </div>
                                <div className="text-right">
                                    <p>{payment.amount}</p>
                                    <Badge variant={payment.status === 'Paid' ? 'secondary' : 'destructive'} className="mt-1">{payment.status}</Badge>
                                </div>
                             </li>
                         ))}
                    </ul>
                 ) : (
                     <p className="text-muted-foreground text-sm">No payment history found.</p>
                 )}
             </CardContent>
         </Card>

      </div>

       {/* Link to explore other plans */}
        <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">Want to change your plan?</p>
             <Link href="/subscriptions" passHref>
                 <Button variant="outline">Explore Other Subscription Plans</Button>
             </Link>
       </div>

    </div>
  );
}
