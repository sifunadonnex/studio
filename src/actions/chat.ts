
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, query, orderBy, getDocs, serverTimestamp, Timestamp, doc } from 'firebase/firestore';
import { getUserSession, UserProfile } from '@/actions/auth';

// --- Schemas ---
const SendMessageSchema = z.object({
  text: z.string().min(1, { message: "Message cannot be empty." }).max(1000, { message: "Message is too long." }),
  // userId and userName will be derived from session server-side
});

// --- Types ---
export type SendMessageInput = z.infer<typeof SendMessageSchema>;

export interface ChatMessage {
  id: string; // Firestore document ID
  senderId: string;
  senderName: string;
  senderType: 'user' | 'staff'; // To distinguish UI styling and source
  text: string;
  timestamp: string; // ISO string representation of Firestore Timestamp
}

export interface ChatResponse {
  success: boolean;
  message: string;
  chatMessage?: ChatMessage; // Optionally return the saved message
}

export interface FetchChatHistoryResponse {
  success: boolean;
  message: string;
  messages?: ChatMessage[];
}

/**
 * Saves a user's message to their chat thread in Firestore.
 */
export async function sendUserMessageAction(data: SendMessageInput): Promise<ChatResponse> {
  const session = await getUserSession();
  if (!session?.id || !session.name) {
    return { success: false, message: "Authentication required to send messages." };
  }

  try {
    const validatedData = SendMessageSchema.parse(data);

    const chatThreadRef = collection(db, 'chats', session.id, 'messages');
    
    const messageData = {
      senderId: session.id,
      senderName: session.name, // User's name
      senderType: 'user' as 'user' | 'staff',
      text: validatedData.text,
      timestamp: serverTimestamp(),
    };

    const docRef = await addDoc(chatThreadRef, messageData);

    // For returning the saved message, we create a ChatMessage object
    // Note: serverTimestamp() resolves on the server, so for immediate return, use current date.
    // For actual timestamp, re-fetch or accept slight client/server discrepancy.
    const savedMessageForClient: ChatMessage = {
        id: docRef.id,
        ...messageData,
        timestamp: new Date().toISOString(), // Use current date for optimistic update
    };

    return { success: true, message: "Message sent successfully.", chatMessage: savedMessageForClient };

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      return { success: false, message: `Validation failed: ${messages}` };
    }
    console.error('[sendUserMessageAction] Error:', error);
    return { success: false, message: 'An unexpected error occurred while sending the message.' };
  }
}

/**
 * Fetches the chat history for a given user.
 */
export async function fetchChatHistoryAction(): Promise<FetchChatHistoryResponse> {
  const session = await getUserSession();
  if (!session?.id) {
    return { success: false, message: "Authentication required to fetch chat history." };
  }

  try {
    const messagesCollectionRef = collection(db, 'chats', session.id, 'messages');
    const q = query(messagesCollectionRef, orderBy("timestamp", "asc")); // Fetch oldest first
    
    const querySnapshot = await getDocs(q);
    const chatMessages: ChatMessage[] = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        senderId: data.senderId,
        senderName: data.senderName,
        senderType: data.senderType as 'user' | 'staff',
        text: data.text,
        timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : new Date(0).toISOString(),
      } as ChatMessage;
    });

    return { success: true, message: "Chat history fetched successfully.", messages: chatMessages };

  } catch (error: any) {
    console.error('[fetchChatHistoryAction] Error fetching chat history:', error);
    // Check for Firestore index errors specifically if applicable
    if (error.code === 'failed-precondition' && error.message.includes('index')) {
        const detailedMessage = `Error: Firestore query requires an index. Please create it. Details: ${error.message}`;
        console.error(detailedMessage);
        return { success: false, message: detailedMessage, messages: [] };
    }
    return { success: false, message: 'An unexpected error occurred while fetching chat history.', messages: [] };
  }
}

// Placeholder for staff to send messages (would be called from an admin/staff interface)
// For now, staff messages would be manually added to Firestore or via a separate admin tool.
// Example:
/*
export async function sendStaffMessageAction(userId: string, text: string, staffName: string = "Support Team"): Promise<ChatResponse> {
    // Add admin role check here
    try {
        const chatThreadRef = collection(db, 'chats', userId, 'messages');
        const messageData = {
            senderId: "staff_system_id", // Or a specific staff member's ID
            senderName: staffName,
            senderType: 'staff' as 'user' | 'staff',
            text: text,
            timestamp: serverTimestamp(),
        };
        const docRef = await addDoc(chatThreadRef, messageData);
        const savedMessageForClient: ChatMessage = {
            id: docRef.id,
            ...messageData,
            timestamp: new Date().toISOString(),
        };
        return { success: true, message: "Staff message sent.", chatMessage: savedMessageForClient };
    } catch (error) {
        console.error('[sendStaffMessageAction] Error:', error);
        return { success: false, message: 'Failed to send staff message.' };
    }
}
*/
