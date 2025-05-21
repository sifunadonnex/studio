
import { z } from 'zod';

// --- Types and Schemas ---
export const ServiceSchema = z.object({
  id: z.string().optional(), // Firestore document ID or mock ID
  name: z.string().min(3, { message: "Service name must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  price: z.number().min(0, { message: "Price must be a positive number." }).transform(val => Number(val)), // Ensure it's a number
  category: z.string().min(2, { message: "Category is required." }), // e.g., Maintenance, Repair, Inspection
  duration: z.number().min(15, { message: "Duration must be at least 15 minutes." }).transform(val => Number(val)), // in minutes
  isActive: z.boolean().default(true),
});

export type AdminServiceInput = z.infer<typeof ServiceSchema>;

export interface AdminService extends AdminServiceInput {
  id: string; // Ensure ID is always present for fetched services
  createdAt?: string; // Serialized Timestamp or ISO string date
  updatedAt?: string; // Serialized Timestamp or ISO string date
}

export interface FetchServicesResponse {
  success: boolean;
  message: string;
  services?: AdminService[];
}

export interface ManageServiceResponse {
  success: boolean;
  message: string;
  serviceId?: string;
}
