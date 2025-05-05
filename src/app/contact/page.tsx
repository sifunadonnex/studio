'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Phone, Mail } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// Placeholder for Google Maps - Replace with @vis.gl/react-google-maps or iframe if API key is available
const GoogleMapPlaceholder = () => (
    <div className="bg-secondary rounded-lg h-64 md:h-full flex items-center justify-center text-muted-foreground">
       Map Placeholder (Ngong, Kajiado County)
       <p className="text-xs mt-2">(Integrate Google Maps API here)</p>
   </div>
);


export default function ContactPage() {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // TODO: Replace with actual PHP/MySQL message saving logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = { name, email, subject, message };
    console.log('Submitting contact form:', formData);

    // Simulate API call to save message
    await new Promise(resolve => setTimeout(resolve, 1000));

    const submissionSuccessful = true; // Simulate success

    if (submissionSuccessful) {
        toast({
            title: "Message Sent!",
            description: "Thank you for contacting us. We'll get back to you soon.",
        });
        // Clear form
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
    } else {
        setError('Failed to send message. Please try again later.');
         toast({
             title: "Submission Failed",
             description: "Could not send your message. Please try again.",
             variant: "destructive",
         });
    }

    setLoading(false);
  };


  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-center text-primary mb-4">Contact Us</h1>
      <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
        Have questions or need assistance? Reach out to us using the form below or through our contact details.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Contact Form */}
        <div>
           <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl">Send Us a Message</CardTitle>
                 <CardDescription>Fill out the form and we'll respond as soon as possible.</CardDescription>
            </CardHeader>
            <CardContent>
               <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                      <Input id="name" placeholder="Your Full Name" required value={name} onChange={e => setName(e.target.value)} disabled={loading}/>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                      <Input id="email" type="email" placeholder="you@example.com" required value={email} onChange={e => setEmail(e.target.value)} disabled={loading}/>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject <span className="text-destructive">*</span></Label>
                    <Input id="subject" placeholder="Reason for contacting" required value={subject} onChange={e => setSubject(e.target.value)} disabled={loading}/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message <span className="text-destructive">*</span></Label>
                    <Textarea id="message" placeholder="Your detailed message..." required rows={5} value={message} onChange={e => setMessage(e.target.value)} disabled={loading}/>
                  </div>
                   {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Message'}
                  </Button>
               </form>
            </CardContent>
           </Card>
        </div>

        {/* Contact Details & Map */}
        <div className="space-y-8">
            <div>
                 <h2 className="text-2xl font-semibold mb-4 text-primary">Our Location</h2>
                 <GoogleMapPlaceholder />
                 {/* TODO: Integrate @vis.gl/react-google-maps or an iframe here
                     Example with iframe (replace with actual embed code):
                     <iframe
                         src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d[...]" // Your Ngong embed link
                         width="100%"
                         height="300"
                         style={{ border:0 }}
                         allowFullScreen={true}
                         loading="lazy"
                         referrerPolicy="no-referrer-when-downgrade"
                         className="rounded-lg"
                    ></iframe>
                 */}
            </div>

            <div>
                 <h2 className="text-2xl font-semibold mb-4 text-primary">Contact Information</h2>
                <div className="space-y-4 text-muted-foreground">
                    <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 mt-1 text-primary shrink-0" />
                        <div>
                             <h3 className="font-medium text-foreground">Address</h3>
                            <p>Top Autocorrect Garage</p>
                             <p>Ngong Town (Near [Landmark - Placeholder])</p>
                             <p>Kajiado County, Kenya</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-primary shrink-0" />
                         <div>
                            <h3 className="font-medium text-foreground">Phone</h3>
                            <a href="tel:+254700000000" className="hover:text-foreground">+254 700 000 000</a> {/* Placeholder */}
                         </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-primary shrink-0" />
                        <div>
                             <h3 className="font-medium text-foreground">Email</h3>
                             <a href="mailto:info@topautocorrect.co.ke" className="hover:text-foreground">info@topautocorrect.co.ke</a> {/* Placeholder */}
                        </div>
                    </div>
                </div>
            </div>

             <div>
                 <h2 className="text-2xl font-semibold mb-4 text-primary">Operating Hours</h2>
                 <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                    <li>Monday - Friday: 8:00 AM - 6:00 PM</li>
                    <li>Saturday: 9:00 AM - 4:00 PM</li>
                    <li>Sunday & Public Holidays: Closed</li>
                 </ul>
             </div>
        </div>
      </div>
    </div>
  );
}
