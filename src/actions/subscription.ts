
'use server';

import { z } from 'zod';
import { Timestamp, collection, doc, getDocs, getDoc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getUserSession, UserProfile } from '@/actions/auth';

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

const serializeTimestamp = (timestamp: any): string | undefined => {
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate().toISOString();
    }
    if (typeof timestamp === 'string') { // Already serialized
        return timestamp;
    }
    return undefined;
};


/**
 * Fetches all subscriptions from Firestore.
 * Populates customerName/Email by looking up the userId in the 'users' collection.
 */
export async function fetchAllSubscriptionsAction(): Promise<FetchAllSubscriptionsResponse> {
  const session = await getUserSession();
  if (!session?.id || session.role !== 'admin') {
    console.warn('[fetchAllSubscriptionsAction] Unauthorized attempt.');
    return { success: false, message: "Unauthorized: Admin privileges required." };
  }
  console.log('[fetchAllSubscriptionsAction] Admin: Fetching all subscriptions from Firestore.');

  try {
    const subscriptionsCollectionRef = collection(db, 'subscriptions');
    // Consider ordering, e.g., by createdAt or startDate
    const q = query(subscriptionsCollectionRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const subscriptionsPromises = querySnapshot.docs.map(async (subDocSnap) => {
      const subData = subDocSnap.data();
      let customerName = 'N/A';
      let customerEmail = 'N/A';

      if (subData.userId) {
        const userDocRef = doc(db, 'users', subData.userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          customerName = userData.name || 'Unknown User';
          customerEmail = userData.email || 'No Email';
        }
      }

      return {
        id: subDocSnap.id,
        userId: subData.userId || 'N/A',
        customerName,
        customerEmail,
        planId: subData.planId,
        planName: subData.planName,
        status: subData.status as SubscriptionStatus,
        startDate: serializeTimestamp(subData.startDate) || new Date(0).toISOString(),
        endDate: serializeTimestamp(subData.endDate),
        nextBillingDate: serializeTimestamp(subData.nextBillingDate),
        price: subData.price || 0,
        currency: subData.currency || 'KES',
        createdAt: serializeTimestamp(subData.createdAt) || new Date(0).toISOString(),
        updatedAt: serializeTimestamp(subData.updatedAt) || new Date(0).toISOString(),
      } as AdminSubscription;
    });

    const allSubscriptions = await Promise.all(subscriptionsPromises);
    
    console.log(`[fetchAllSubscriptionsAction] Fetched ${allSubscriptions.length} subscriptions for admin view.`);
    return {
      success: true,
      message: 'Subscriptions fetched successfully from Firestore.',
      subscriptions: allSubscriptions,
    };

  } catch (error: any) {
    console.error('[fetchAllSubscriptionsAction] Error fetching subscriptions from Firestore:', error);
    let detailedMessage = 'An unexpected error occurred while fetching subscriptions.';
    if (error.code && error.message) {
        detailedMessage = `Error fetching subscriptions: ${error.message} (Code: ${error.code}). Check server logs.`;
    }
    return { success: false, message: detailedMessage, subscriptions: [] };
  }
}

/**
 * Updates the status of a subscription in Firestore.
 */
export async function updateSubscriptionStatusAction(
  data: UpdateSubscriptionStatusInput
): Promise<UpdateSubscriptionStatusResponse> {
  const session = await getUserSession();
  if (!session?.id || session.role !== 'admin') {
    console.warn('[updateSubscriptionStatusAction] Unauthorized attempt.');
    return { success: false, message: "Unauthorized: Admin privileges required." };
  }

  const { subscriptionId, newStatus } = data;
  if (!subscriptionId || !newStatus) {
      return { success: false, message: "Subscription ID and new status are required." };
  }
  console.log(
    `[updateSubscriptionStatusAction] Admin: Updating subscription ${subscriptionId} to status ${newStatus} in Firestore.`
  );

  try {
    const subscriptionDocRef = doc(db, "subscriptions", subscriptionId);
    await updateDoc(subscriptionDocRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });

    console.log(`[updateSubscriptionStatusAction] Firestore: Updated status for subscription ${subscriptionId} to ${newStatus}`);
    return {
      success: true,
      message: `Subscription ${subscriptionId} status updated to ${newStatus} in Firestore.`,
    };
  } catch (error: any) {
    console.error('[updateSubscriptionStatusAction] Error updating subscription status in Firestore:', error);
    return { success: false, message: 'An unexpected error occurred while updating subscription status.' };
  }
}

