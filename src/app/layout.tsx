import type {Metadata} from 'next';
import { Inter } from 'next/font/google'; // Using Inter for clean sans-serif
import './globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Changed from Geist to Inter
});


export const metadata: Metadata = {
  title: 'Top Autocorrect Garage - Ngong, Kajiado County',
  description: 'Premier vehicle maintenance and repair services in Ngong. Book appointments, manage subscriptions, and get predictive maintenance alerts.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
