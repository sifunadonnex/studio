
'use server';

import { z } from 'zod';
import { getUserSession } from '@/actions/auth';
import { ServiceSchema, type AdminServiceInput, type AdminService, type ManageServiceResponse, type FetchServicesResponse } from '@/lib/types/service';
// Firestore imports would go here if not using mock data
// import { db } from '@/lib/firebase/config';
// import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';


// --- Mock Data (Replace with Firestore interaction) ---
let mockAdminServices: AdminService[] = [
  { id: 'svc_oil_std', name: 'Standard Oil Change', description: 'Includes conventional oil, filter, and chassis lube.', price: 3500, category: 'Maintenance', duration: 45, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'svc_brake_front', name: 'Front Brake Pad Replacement', description: 'Replace front brake pads and inspect rotors.', price: 7000, category: 'Repair', duration: 90, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'svc_tire_rot', name: 'Tire Rotation & Balancing', description: 'Rotate tires and balance all four wheels.', price: 2500, category: 'Maintenance', duration: 60, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'svc_ac_check', name: 'AC System Check', description: 'Inspect AC system for leaks and performance.', price: 4500, category: 'Inspection', duration: 75, isActive: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

// --- Server Actions (Stubbed) ---

export async function fetchAllServicesAction(): Promise<FetchServicesResponse> {
  const session = await getUserSession();
  if (!session?.id || session.role !== 'admin') {
    return { success: false, message: "Unauthorized: Admin privileges required." };
  }
  console.log('[fetchAllServicesAction] Admin: Fetching all services (mock data).');
  // TODO: Replace with actual Firestore fetch
  return { success: true, message: "Services fetched successfully (mock).", services: [...mockAdminServices] };
}

export async function addServiceAction(data: AdminServiceInput): Promise<ManageServiceResponse> {
  const session = await getUserSession();
  if (!session?.id || session.role !== 'admin') {
    return { success: false, message: "Unauthorized: Admin privileges required." };
  }
  try {
    const validatedData = ServiceSchema.parse(data);
    console.log('[addServiceAction] Admin: Adding new service (mock):', validatedData);
    // TODO: Replace with actual Firestore add
    const newServiceId = `svc_mock_${Date.now()}`;
    const newService: AdminService = {
        ...validatedData,
        id: newServiceId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    mockAdminServices.push(newService);
    return { success: true, message: "Service added successfully (mock).", serviceId: newServiceId };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
        const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
        return { success: false, message: `Validation failed: ${messages}` };
    }
    console.error('[addServiceAction] Error:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function updateServiceAction(serviceId: string, data: AdminServiceInput): Promise<ManageServiceResponse> {
  const session = await getUserSession();
  if (!session?.id || session.role !== 'admin') {
    return { success: false, message: "Unauthorized: Admin privileges required." };
  }
  try {
    const validatedData = ServiceSchema.parse(data);
    console.log(`[updateServiceAction] Admin: Updating service ${serviceId} (mock):`, validatedData);
    // TODO: Replace with actual Firestore update
    const serviceIndex = mockAdminServices.findIndex(s => s.id === serviceId);
    if (serviceIndex === -1) {
        return { success: false, message: "Service not found (mock)." };
    }
    mockAdminServices[serviceIndex] = { ...mockAdminServices[serviceIndex], ...validatedData, updatedAt: new Date().toISOString() };
    return { success: true, message: "Service updated successfully (mock)." };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
        const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
        return { success: false, message: `Validation failed: ${messages}` };
    }
    console.error('[updateServiceAction] Error:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function deleteServiceAction(serviceId: string): Promise<ManageServiceResponse> {
  const session = await getUserSession();
  if (!session?.id || session.role !== 'admin') {
    return { success: false, message: "Unauthorized: Admin privileges required." };
  }
  console.log(`[deleteServiceAction] Admin: Deleting service ${serviceId} (mock).`);
  // TODO: Replace with actual Firestore delete
  const initialLength = mockAdminServices.length;
  mockAdminServices = mockAdminServices.filter(s => s.id !== serviceId);
  if (mockAdminServices.length === initialLength) {
    return { success: false, message: "Service not found or already deleted (mock)." };
  }
  return { success: true, message: "Service deleted successfully (mock)." };
}
