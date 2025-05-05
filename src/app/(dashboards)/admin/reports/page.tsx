'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, BarChart2, RefreshCw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateReportInsights, GenerateReportInsightsInput, GenerateReportInsightsOutput } from '@/ai/flows/admin-report-insights'; // Import GenAI flow
import { Skeleton } from '@/components/ui/skeleton';

// Define report types
const reportTypes = [
    { id: 'daily_appointments', name: 'Daily Appointments Report' },
    { id: 'monthly_revenue', name: 'Monthly Revenue Report' },
    { id: 'active_subscriptions', name: 'Active Subscriptions Report' },
    { id: 'service_usage', name: 'Service Usage Frequency' },
    { id: 'staff_response', name: 'Staff Response Times' },
    { id: 'most_booked', name: 'Most Booked Services' },
    { id: 'missed_appointments', name: 'Missed/No-Show Appointments' },
    { id: 'predictive_accuracy', name: 'Predictive Maintenance Accuracy' }, // Placeholder
    { id: 'top_customers', name: 'Top Revenue-Generating Customers' },
    { id: 'booking_lead_time', name: 'Average Booking Lead Time' },
    { id: 'transaction_history', name: 'Transaction History Report' },
    { id: 'subscription_expiry', name: 'Upcoming Subscription Expiry Report' },
];

// Placeholder data generation functions (replace with actual PHP/MySQL fetches)
const generateMockData = (reportType: string) => {
    switch (reportType) {
        case 'daily_appointments':
            return {
                headers: ['Time', 'Customer', 'Service', 'Vehicle', 'Status'],
                rows: [
                    ['09:00 AM', 'John D.', 'Oil Change', 'Toyota Corolla', 'Completed'],
                    ['11:00 AM', 'Jane S.', 'Brake Check', 'Nissan X-Trail', 'In Progress'],
                    ['02:00 PM', 'Alex K.', 'Diagnostics', 'Subaru Forester', 'Scheduled'],
                ]
            };
        case 'monthly_revenue':
            return {
                headers: ['Month', 'Service Revenue (KES)', 'Subscription Revenue (KES)', 'Total Revenue (KES)'],
                rows: [
                    ['October 2024', '350,000', '100,000', '450,000'],
                    ['September 2024', '320,000', '95,000', '415,000'],
                    ['August 2024', '300,000', '90,000', '390,000'],
                ]
            };
        case 'active_subscriptions':
             return {
                 headers: ['Plan Name', 'Active Count', 'Monthly Revenue (KES)'],
                 rows: [
                    ['Monthly Care Plan', '95', '237,500'],
                    ['Annual Pro Plan', '33', '68,750'], // Monthly equivalent for comparison
                    ['Basic Checkup Plan', '50', '50,000'],
                 ]
             };
         case 'service_usage':
              return {
                  headers: ['Service Name', 'Times Booked (Last 30d)', '% of Total'],
                  rows: [
                     ['Standard Oil Change', '85', '40%'],
                     ['Tire Rotation & Balancing', '40', '19%'],
                     ['Brake Inspection & Pad Replacement', '30', '14%'],
                      ['Engine Diagnostics', '25', '12%'],
                      ['Other', '32', '15%'],
                 ]
             };
        default:
            return { headers: ['Info'], rows: [['Data for this report is not yet available.']] };
    }
};


export default function AdminReportsPage() {
    const { toast } = useToast();
    const [selectedReport, setSelectedReport] = useState<string>(reportTypes[0].id);
    const [reportData, setReportData] = useState<{ headers: string[], rows: string[][] } | null>(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [insights, setInsights] = useState<GenerateReportInsightsOutput | null>(null);
    const [error, setError] = useState<string | null>(null);


    const fetchReportData = (reportType: string) => {
        setLoadingReport(true);
        setError(null);
        setInsights(null); // Clear previous insights
        console.log("Fetching report data for:", reportType);
        // Simulate API call to PHP/MySQL backend
        setTimeout(() => {
            try {
                 const data = generateMockData(reportType);
                 setReportData(data);
            } catch (err) {
                 console.error("Error fetching report:", err);
                 setError("Failed to load report data.");
                 setReportData(null);
                 toast({ title: "Error", description: "Could not load report data.", variant: "destructive" });
            } finally {
                setLoadingReport(false);
            }
        }, 800); // Simulate network delay
    };


     const getReportInsights = async () => {
         if (!reportData || !selectedReport) return;

        setLoadingInsights(true);
         setError(null);
         setInsights(null); // Clear previous insights

         try {
             const input: GenerateReportInsightsInput = {
                 reportType: reportTypes.find(rt => rt.id === selectedReport)?.name || 'Unknown Report',
                 // Convert array data to a simple string format (e.g., CSV or JSON) for the AI
                  reportData: JSON.stringify({ headers: reportData.headers, rows: reportData.rows }),
             };
             const result = await generateReportInsights(input);
             setInsights(result);
              toast({ title: "Insights Generated", description: "AI analysis complete." });
        } catch (err) {
             console.error("Error generating insights:", err);
            setError("Failed to generate insights from the report data.");
             toast({ title: "Insight Error", description: "Could not generate AI insights.", variant: "destructive" });
        } finally {
            setLoadingInsights(false);
        }
    };


    // Fetch data for the initially selected report
    useEffect(() => {
        fetchReportData(selectedReport);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedReport]); // Re-fetch when selectedReport changes


    const handleDownloadReport = () => {
        console.log("Download report:", selectedReport);
         // TODO: Implement actual report download (CSV/PDF generation via PHP)
         alert(`Download functionality for '${selectedReport}' not implemented.`);
    };


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
           <BarChart2 className="h-7 w-7" /> Admin Reports
        </h1>
         <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={selectedReport} onValueChange={(value) => setSelectedReport(value)} disabled={loadingReport}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Select a report" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((report) => (
                  <SelectItem key={report.id} value={report.id}>{report.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleDownloadReport} disabled={!reportData || loadingReport}>
              <Download className="h-4 w-4" />
               <span className="sr-only sm:not-sr-only sm:ml-1">Download</span>
            </Button>
        </div>
      </div>

      {/* Report Data Display */}
      <Card>
        <CardHeader>
           <CardTitle>{reportTypes.find(rt => rt.id === selectedReport)?.name}</CardTitle>
           <CardDescription>Displaying data for the selected report.</CardDescription>
        </CardHeader>
        <CardContent>
           {loadingReport ? (
               <div className="space-y-2">
                   <Skeleton className="h-8 w-full" />
                   <Skeleton className="h-8 w-full" />
                   <Skeleton className="h-8 w-full" />
               </div>
           ) : reportData ? (
             <Table>
                <TableHeader>
                    <TableRow>
                        {reportData.headers.map((header, index) => (
                            <TableHead key={index}>{header}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reportData.rows.length > 0 ? reportData.rows.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                                <TableCell key={cellIndex} className={cellIndex === 0 ? 'font-medium' : ''}>{cell}</TableCell>
                             ))}
                        </TableRow>
                     )) : (
                        <TableRow>
                            <TableCell colSpan={reportData.headers.length} className="text-center h-24 text-muted-foreground">
                                No data available for this report period.
                            </TableCell>
                        </TableRow>
                     )}
                </TableBody>
             </Table>
           ) : (
                <p className="text-center text-muted-foreground py-8">
                    {error ? error : "Select a report to view data."}
                </p>
           )}
        </CardContent>
      </Card>

       {/* AI Insights Section */}
       {reportData && reportData.rows.length > 0 && (
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                     <div>
                        <CardTitle>AI-Powered Insights</CardTitle>
                         <CardDescription>Automatically generated analysis of the current report.</CardDescription>
                    </div>
                    <Button onClick={getReportInsights} disabled={loadingInsights || loadingReport}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loadingInsights ? 'animate-spin' : ''}`} />
                        {loadingInsights ? 'Analyzing...' : 'Generate Insights'}
                    </Button>
                </CardHeader>
                 <CardContent>
                    {loadingInsights ? (
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                             <Skeleton className="h-4 w-1/3 mt-4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                    ) : insights ? (
                         <div className="space-y-4 text-sm">
                             <div>
                                <h4 className="font-semibold mb-1">Summary:</h4>
                                 <p className="text-muted-foreground">{insights.summary}</p>
                             </div>
                             <div>
                                 <h4 className="font-semibold mb-1">Key Insights:</h4>
                                 <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                     {insights.insights.map((insight, i) => <li key={i}>{insight}</li>)}
                                 </ul>
                             </div>
                             <div>
                                 <h4 className="font-semibold mb-1">Recommendations:</h4>
                                 <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                    {insights.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                                 </ul>
                             </div>
                         </div>
                     ) : error && !loadingReport ? ( // Show error only if insights failed, not if report is loading
                         <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive border border-destructive/30 rounded-md">
                             <AlertTriangle className="h-5 w-5" />
                             <p className="text-sm">{error}</p>
                         </div>
                     ) : (
                         <p className="text-muted-foreground">Click "Generate Insights" to analyze the report data.</p>
                     )}
                 </CardContent>
            </Card>
       )}

    </div>
  );
}
