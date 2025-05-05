import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

// Placeholder data - Fetch from MySQL via PHP
const subscriptionPlans = [
  {
    id: 'monthly',
    title: 'Monthly Care Plan',
    price: 'KES 2,500',
    billingCycle: '/ month',
    features: [
      '1 Free Standard Oil Change per month',
      '10% Discount on labor for other services',
      'Priority Booking Slots',
      'Basic Vehicle Health Check',
      'Chat Support',
    ],
    cta: 'Subscribe Monthly',
  },
  {
    id: 'yearly',
    title: 'Annual Pro Plan',
    price: 'KES 25,000',
    billingCycle: '/ year',
    features: [
      '12 Standard Oil Changes per year (or equivalent value)',
      '15% Discount on labor for all services',
      'Highest Priority Booking Slots',
      '2 Comprehensive Vehicle Inspections per year',
      'Predictive Maintenance Alerts',
      'Priority Chat & Phone Support',
      'Small top-ups included (e.g. washer fluid)',
    ],
    cta: 'Subscribe Annually',
    popular: true,
  },
    {
    id: 'basic',
    title: 'Basic Checkup Plan',
    price: 'KES 1,000',
    billingCycle: '/ month',
    features: [
      '5% Discount on labor',
      'Monthly fluid level check & top-up (basic fluids)',
      'Tire pressure check & adjustment',
      'Access to Chat Support',
    ],
    cta: 'Choose Basic',
  },
];

export default function SubscriptionsPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-center text-primary mb-4">Subscription Plans</h1>
      <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
        Choose a plan that suits your needs and enjoy exclusive benefits and discounts on our services. All prices in KES.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch"> {/* items-stretch makes cards equal height */}
        {subscriptionPlans.map((plan) => (
          <Card key={plan.id} className={`flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 ${plan.popular ? 'border-2 border-accent' : ''}`}>
             {plan.popular && (
                <div className="bg-accent text-accent-foreground text-center py-1 text-sm font-semibold rounded-t-lg">
                    Most Popular
                </div>
             )}
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{plan.title}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-primary">{plan.price}</span>
                <span className="text-muted-foreground">{plan.billingCycle}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow"> {/* flex-grow allows content to expand */}
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {/* TODO: Link to actual payment/subscription processing page */}
              <Link href={`/checkout?plan=${plan.id}`} passHref className="w-full">
                <Button className={`w-full ${plan.popular ? 'bg-accent hover:bg-accent/90 text-accent-foreground' : 'bg-primary hover:bg-primary/90'}`}>
                  {plan.cta}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

       <div className="text-center mt-16 bg-secondary p-8 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Need a Custom Plan?</h2>
             <p className="text-muted-foreground mb-6">
                We can tailor subscription plans for fleets or specific needs. Get in touch to discuss your requirements.
             </p>
            <Link href="/contact" passHref>
                <Button variant="outline" size="lg">
                    Contact Sales
                </Button>
             </Link>
       </div>
    </div>
  );
}
