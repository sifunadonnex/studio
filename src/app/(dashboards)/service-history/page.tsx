'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download } from "lucide-react";
import { Button } from '@/components/ui/button';

// Placeholder data - Fetch from MySQL via PHP
const mockServiceHistory = [
  { id: 'INV567', service: 'Standard Oil Change', date: '2024-09-10', technician: 'Peter K.', cost: 'KES 3,500', notes: 'Checked tire pressure.' },
  { id: 'INV560', service: 'AC Service', date: '2024-08-05', technician: 'Mary A.', cost: 'KES 7,200', notes: 'Recharged refrigerant, replaced cabin filter.' },
  { id: 'INV555', service: 'Cooling System Flush', date: '2024-07-20', technician: 'Peter K.', cost: 'KES 5,500', notes: 'Used standard coolant.' },
  { id: 'INV548', service: 'Brake Pad Replacement (Front)', date: '2024-06-01', technician: 'John O.', cost: 'KES 7,800', notes: 'Resurfaced front rotors.' },
];

export default function ServiceHistoryPage() {
  const [history, setHistory] = useState(mockServiceHistory);
  const [loading, setLoading] = useState(false);

  // TODO: Implement logic to fetch actual history data

  const handleDownloadInvoice = (invoiceId: string) => {
    console.log("Download invoice:", invoiceId);
    // TODO: Implement actual invoice download logic (e.g., call PHP script)
    alert(`Download functionality for invoice ${invoiceId} is not implemented yet.`);
  };

   const handleDownloadSummary = () => {
        console.log("Download service history summary");
        // TODO: Implement summary download logic (e.g., generate PDF/CSV via PHP)
        alert("Service history summary download is not implemented yet.");
    };


  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Service History</h1>
        <Button variant="outline" onClick={handleDownloadSummary} disabled={history.length === 0}>
           <Download className="mr-2 h-4 w-4" /> Download Summary
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Past Services</CardTitle>
          <CardDescription>A record of all maintenance and repairs performed on your vehicle(s) at our garage.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date</TableHead>
                 <TableHead>Technician</TableHead>
                <TableHead>Cost (KES)</TableHead>
                <TableHead>Notes</TableHead>
                 <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length > 0 ? history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>{item.service}</TableCell>
                  <TableCell>{item.date}</TableCell>
                   <TableCell>{item.technician}</TableCell>
                  <TableCell>{item.cost}</TableCell>
                   <TableCell className="text-sm text-muted-foreground">{item.notes || '-'}</TableCell>
                   <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadInvoice(item.id)} title="Download Invoice">
                          <FileText className="h-4 w-4" />
                          <span className="sr-only">Download Invoice</span>
                      </Button>
                   </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    No service history found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
