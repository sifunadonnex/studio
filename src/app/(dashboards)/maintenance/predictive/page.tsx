'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Car, CalendarPlus, History, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { predictMaintenanceDate, PredictMaintenanceInput, PredictMaintenanceOutput } from '@/ai/flows/predictive-maintenance'; // Import the GenAI flow
import { Skeleton } from '@/components/ui/skeleton';

// Placeholder data - Fetch vehicle list and service history from MySQL via PHP
const mockUserVehicles = [
  { id: 'V1', make: 'Toyota', model: 'Corolla', year: '2018', nickname: 'My Sedan', serviceHistory: '2024-09-10: Standard Oil Change; 2024-06-01: Brake Pad Replacement (Front)' },
  { id: 'V2', make: 'Nissan', model: 'X-Trail', year: '2020', nickname: 'Family SUV', serviceHistory: '2024-10-15: Tire Rotation; 2024-05-20: AC Service' },
];

interface PredictionResult extends PredictMaintenanceOutput {
    vehicleId: string;
}

export default function PredictiveMaintenancePage() {
    const { toast } = useToast();
    const [vehicles] = useState(mockUserVehicles); // User's registered vehicles
    const [predictions, setPredictions] = useState<PredictionResult[]>([]);
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({}); // Track loading per vehicle
    const [error, setError] = useState<string | null>(null);

    const fetchPrediction = async (vehicle: typeof mockUserVehicles[0]) => {
        setLoadingStates(prev => ({ ...prev, [vehicle.id]: true }));
        setError(null);

        try {
            const input: PredictMaintenanceInput = {
                vehicleId: vehicle.id,
                serviceHistory: vehicle.serviceHistory,
            };
            const result = await predictMaintenanceDate(input); // Call the GenAI flow
            setPredictions(prev => [...prev.filter(p => p.vehicleId !== vehicle.id), { ...result, vehicleId: vehicle.id }]);
            toast({
                title: `Prediction Updated for ${vehicle.nickname}`,
                description: `Next estimated service: ${result.predictedMaintenanceDate}`,
            });
        } catch (err) {
            console.error("Error fetching prediction:", err);
            setError(`Failed to get prediction for ${vehicle.nickname}. Please try again.`);
            toast({
                title: "Prediction Failed",
                description: `Could not get prediction for ${vehicle.nickname}.`,
                variant: "destructive",
            });
        } finally {
            setLoadingStates(prev => ({ ...prev, [vehicle.id]: false }));
        }
    };

     // Fetch predictions for all vehicles on initial load
     // UseEffect runs only on the client-side
     useEffect(() => {
         vehicles.forEach(vehicle => {
             // Check if prediction already exists to avoid re-fetching unnecessarily
             if (!predictions.some(p => p.vehicleId === vehicle.id)) {
                 fetchPrediction(vehicle);
             }
         });
         // eslint-disable-next-line react-hooks/exhaustive-deps
     }, []); // Empty dependency array ensures this runs once on mount


  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Bell className="h-7 w-7 text-accent" /> Predictive Maintenance
        </h1>
        {/* Optional: Add button to add a new vehicle? */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Vehicle Maintenance Forecast</CardTitle>
          <CardDescription>
            Based on your service history, here are the estimated next maintenance dates for your vehicles.
            This is an estimate; actual needs may vary.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {error && (
                <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive border border-destructive/30 rounded-md">
                    <AlertTriangle className="h-5 w-5" />
                    <p className="text-sm">{error}</p>
                </div>
            )}
          {vehicles.length > 0 ? vehicles.map((vehicle) => {
             const prediction = predictions.find(p => p.vehicleId === vehicle.id);
             const isLoading = loadingStates[vehicle.id] || false;

             return (
                <Card key={vehicle.id} className="bg-secondary p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                        <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                            <Car className="h-5 w-5" /> {vehicle.nickname} ({vehicle.make} {vehicle.model} {vehicle.year})
                        </h3>
                         <Button variant="ghost" size="sm" onClick={() => fetchPrediction(vehicle)} disabled={isLoading}>
                             <History className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            {isLoading ? 'Updating...' : 'Refresh Prediction'}
                        </Button>
                    </div>

                     {isLoading && !prediction && ( // Show skeleton only when loading initially
                         <div className="space-y-2">
                             <Skeleton className="h-4 w-3/4" />
                             <Skeleton className="h-4 w-1/2" />
                             <Skeleton className="h-8 w-24 mt-2" />
                         </div>
                     )}

                     {prediction && (
                         <>
                             <p>
                                 <strong>Estimated Next Service Date:</strong>{' '}
                                 <span className="font-medium text-accent">{prediction.predictedMaintenanceDate || 'Not available'}</span>
                             </p>
                             <p className="text-sm text-muted-foreground mt-1">
                                <strong>Reasoning:</strong> {prediction.reasoning || 'Could not determine.'}
                             </p>
                            <Link href={`/book-appointment?vehicle=${vehicle.id}&predicted_service=true`} passHref>
                                <Button size="sm" className="mt-3 bg-accent hover:bg-accent/90 text-accent-foreground">
                                    <CalendarPlus className="mr-2 h-4 w-4" /> Book Service Now
                                </Button>
                             </Link>
                         </>
                     )}

                      {!isLoading && !prediction && error && ( // Show error state if loading finished but no prediction and there was an error for this vehicle
                         <p className="text-sm text-destructive mt-2">Could not retrieve prediction for this vehicle.</p>
                      )}

                </Card>
             );

          }) : (
            <p className="text-center text-muted-foreground py-8">
              You haven't added any vehicles yet. Go to your profile to add a vehicle.
              <Link href="/profile" passHref>
                  <Button variant="link">Add Vehicle</Button>
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
