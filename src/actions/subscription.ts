
'use server';

import { z } from 'zod';
import { Timestamp } from 'firebase/firestore'; // For type consistency with eventual Firebase use

// --- Types ---
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'payment_failed' | 'pending';

export interface AdminSubscription {
  id: string; // Subscription document ID
  userId: string;
  customerName: string;
  customerEmail: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  startDate: string; // ISO String date
  endDate?: string | null; // ISO String date
  nextBillingDate?: string | null; // ISO String date
  price: number;
  currency: string;
  createdAt: string; // ISO String date
  updatedAt: string; // ISO String date
}

export interface FetchAllSubscriptionsResponse {
  success: boolean;
  message: string;
  subscriptions?: AdminSubscription[];
}

export interface UpdateSubscriptionStatusInput {
  subscriptionId: string;
  newStatus: SubscriptionStatus;
}

export interface UpdateSubscriptionStatusResponse {
  success: boolean;
  message: string;
}

// --- Mock Data (Replace with Firestore fetching) ---
const mockAdminSubscriptions: AdminSubscription[] = [
  {
    id: 'sub_admin_001',
    userId: 'usr_001',
    customerName: 'Alice Wonderland',
    customerEmail: 'alice@example.com',
    planId: 'monthly',
    planName: 'Monthly Care Plan',
    status: 'active',
    startDate: new Date(2024, 7, 1).toISOString(), // Aug 1, 2024
    nextBillingDate: new Date(2024, 10, 1).toISOString(), // Nov 1, 2024
    price: 2500,
    currency: 'KES',
    createdAt: new Date(2024, 7, 1).toISOString(),
    updatedAt: new Date(2024, 9, 1).toISOString(),
  },
  {
    id: 'sub_admin_002',
    userId: 'usr_004',
    customerName: 'Diana Prince',
    customerEmail: 'diana@example.com',
    planId: 'yearly',
    planName: 'Annual Pro Plan',
    status: 'active',
    startDate: new Date(2024, 0, 15).toISOString(), // Jan 15, 2024
    nextBillingDate: new Date(2025, 0, 15).toISOString(), // Jan 15, 2025
    price: 25000,
    currency: 'KES',
    createdAt: new Date(2024, 0, 15).toISOString(),
    updatedAt: new Date(2024, 0, 15).toISOString(),
  },
  {
    id: 'sub_admin_003',
    userId: 'some_other_user_id',
    customerName: 'Bob The Builder',
    customerEmail: 'bob_guest@example.com',
    planId: 'basic',
    planName: 'Basic Checkup Plan',
    status: 'cancelled',
    startDate: new Date(2024, 5, 1).toISOString(), // June 1, 2024
    endDate: new Date(2024, 6, 1).toISOString(), // July 1, 2024
    price: 1000,
    currency: 'KES',
    createdAt: new Date(2024, 5, 1).toISOString(),
    updatedAt: new Date(2024, 6, 1).toISOString(),
  },
];

/**
 * Fetches all subscriptions (stubbed).
 * In a real implementation, this would query Firestore, potentially joining user data.
 */
export async function fetchAllSubscriptionsAction(): Promise<FetchAllSubscriptionsResponse> {
  console.log('[fetchAllSubscriptionsAction] Admin: Fetching all subscriptions (stubbed).');
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 700));

  // In a real scenario, you'd fetch from Firestore's 'subscriptions' collection
  // and potentially populate customerName/Email by looking up the userId in the 'users' collection.

  return {
    success: true,
    message: 'Subscriptions fetched successfully (stubbed).',
    subscriptions: mockAdminSubscriptions,
  };
}

/**
 * Updates the status of a subscription (stubbed).
 */
export async function updateSubscriptionStatusAction(
  data: UpdateSubscriptionStatusInput
): Promise<UpdateSubscriptionStatusResponse> {
  const { subscriptionId, newStatus } = data;
  console.log(
    `[updateSubscriptionStatusAction] Admin: Updating subscription ${subscriptionId} to status ${newStatus} (stubbed).`
  );

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // In a real scenario, you'd find the subscription in Firestore by ID and update its status field
  // and the updatedAt timestamp.
  const targetSubIndex = mockAdminSubscriptions.findIndex(sub => sub.id === subscriptionId);
  if (targetSubIndex !== -1) {
    mockAdminSubscriptions[targetSubIndex].status = newStatus;
    mockAdminSubscriptions[targetSubIndex].updatedAt = new Date().toISOString();
     console.log(`[updateSubscriptionStatusAction] Mock data updated for ${subscriptionId}`);
  } else {
     console.warn(`[updateSubscriptionStatusAction] Mock subscription with ID ${subscriptionId} not found.`);
     return { success: false, message: `Subscription with ID ${subscriptionId} not found (stubbed).` };
  }


  return {
    success: true,
    message: `Subscription ${subscriptionId} status updated to ${newStatus} (stubbed).`,
  };
}
