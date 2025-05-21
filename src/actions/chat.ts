
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, query, orderBy, getDocs, serverTimestamp, Timestamp, doc } from 'firebase/firestore';
import { getUserSession, UserProfile } from '@/actions/auth';

// --- Schemas ---
const SendMessageSchema = z.object({
  text: z.string().min(1, { message: "Message cannot be empty." }).max(1000, { message: "Message is too long." }),
  // userId and userName will be derived from session server-side for user messages
});

const StaffSendMessageSchema = z.object({
  targetUserId: z.string().min(1, { message: "Target user ID is required."}),
  text: z.string().min(1, { message: "Message cannot be empty." }).max(1000, { message: "Message is too long." }),
  // staffId and staffName will be derived from staff's session server-side
});


// --- Types ---
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type StaffSendMessageInput = z.infer<typeof StaffSendMessageSchema>;

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
  console.log('[sendUserMessageAction] Action initiated. Data received:', data);
  const session = await getUserSession();

  if (!session?.id || !session.name) {
    console.error('[sendUserMessageAction] Authentication error: No session ID or name found. Session:', session);
    return { success: false, message: "Authentication required to send messages." };
  }
  console.log(`[sendUserMessageAction] User authenticated: ${session.id} (${session.name})`);

  try {
    const validatedData = SendMessageSchema.parse(data);
    console.log('[sendUserMessageAction] Data validated:', validatedData);

    // Messages are stored in a subcollection under the user's chat document
    // e.g., chats/{userId}/messages/{messageId}
    const chatThreadRef = collection(db, 'chats', session.id, 'messages');
    console.log(`[sendUserMessageAction] Firestore collection path: chats/${session.id}/messages`);
    
    const messageData = {
      senderId: session.id,
      senderName: session.name, // User's name from session
      senderType: 'user' as 'user' | 'staff',
      text: validatedData.text,
      timestamp: serverTimestamp(),
    };
    console.log('[sendUserMessageAction] Message data to be saved:', messageData);

    const docRef = await addDoc(chatThreadRef, messageData);
    console.log('[sendUserMessageAction] Message saved to Firestore. Document ID:', docRef.id);

    const savedMessageForClient: ChatMessage = {
        id: docRef.id,
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        senderType: messageData.senderType,
        text: messageData.text,
        timestamp: new Date().toISOString(), // Use current date for optimistic update
    };

    return { success: true, message: "Message sent successfully.", chatMessage: savedMessageForClient };

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      console.error('[sendUserMessageAction] Validation Error:', messages);
      return { success: false, message: `Validation failed: ${messages}` };
    }
    console.error('[sendUserMessageAction] Firestore or other Error:', error);
    let errorMessage = 'An unexpected error occurred while sending the message.';
    if (error.code) { 
        errorMessage = `Error sending message: ${error.message} (Code: ${error.code})`;
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { success: false, message: errorMessage };
  }
}

/**
 * Fetches the chat history for a given user.
 * Called by the user on their chat page.
 */
export async function fetchChatHistoryAction(): Promise<FetchChatHistoryResponse> {
  const session = await getUserSession();
  if (!session?.id) {
    return { success: false, message: "Authentication required to fetch chat history." };
  }

  try {
    const messagesCollectionRef = collection(db, 'chats', session.id, 'messages');
    const q = query(messagesCollectionRef, orderBy("timestamp", "asc")); 
    
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
    if (error.code === 'failed-precondition' && error.message.includes('index')) {
        const detailedMessage = `Error: Firestore query requires an index. Please create it for the 'messages' subcollection on the 'timestamp' field (ascending). Details: ${error.message}`;
        console.error(detailedMessage);
        return { success: false, message: detailedMessage, messages: [] };
    }
    return { success: false, message: 'An unexpected error occurred while fetching chat history.', messages: [] };
  }
}

/**
 * @fileOverview Server action for staff members to send messages to users.
 * This action would be called from a dedicated staff/admin chat interface (not yet built).
 * It requires the staff member to be authenticated and have appropriate permissions.
 */
export async function sendStaffMessageAction(data: StaffSendMessageInput): Promise<ChatResponse> {
  console.log('[sendStaffMessageAction] Action initiated by staff. Data received:', data);
  const staffSession = await getUserSession();

  if (!staffSession?.id || !staffSession.name) {
    console.error('[sendStaffMessageAction] Authentication error: No staff session ID or name found. Session:', staffSession);
    return { success: false, message: "Staff authentication required." };
  }

  // Role check: Ensure the sender is 'staff' or 'admin'
  if (staffSession.role !== 'staff' && staffSession.role !== 'admin') {
    console.error(`[sendStaffMessageAction] Authorization error: User ${staffSession.id} (${staffSession.role}) is not authorized to send staff messages.`);
    return { success: false, message: "Unauthorized to send staff messages." };
  }
  
  console.log(`[sendStaffMessageAction] Staff authenticated: ${staffSession.id} (${staffSession.name}), Role: ${staffSession.role}`);

  try {
    const validatedData = StaffSendMessageSchema.parse(data);
    console.log('[sendStaffMessageAction] Data validated:', validatedData);

    // Staff sends a message to a specific user's chat thread
    const chatThreadRef = collection(db, 'chats', validatedData.targetUserId, 'messages');
    console.log(`[sendStaffMessageAction] Firestore collection path: chats/${validatedData.targetUserId}/messages`);
    
    const messageData = {
      senderId: staffSession.id, // Staff's own user ID
      senderName: staffSession.name, // Staff's name
      senderType: 'staff' as 'user' | 'staff',
      text: validatedData.text,
      timestamp: serverTimestamp(),
    };
    console.log('[sendStaffMessageAction] Staff message data to be saved:', messageData);

    const docRef = await addDoc(chatThreadRef, messageData);
    console.log('[sendStaffMessageAction] Staff message saved to Firestore. Document ID:', docRef.id);

    const savedMessageForClient: ChatMessage = {
        id: docRef.id,
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        senderType: messageData.senderType,
        text: messageData.text,
        timestamp: new Date().toISOString(), 
    };

    // Note: This response is for the staff member's action.
    // The target user would see this message through their regular fetchChatHistoryAction or real-time listeners (if implemented).
    return { success: true, message: `Message sent to user ${validatedData.targetUserId}.`, chatMessage: savedMessageForClient };

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      console.error('[sendStaffMessageAction] Validation Error:', messages);
      return { success: false, message: `Validation failed: ${messages}` };
    }
    console.error('[sendStaffMessageAction] Firestore or other Error:', error);
    let errorMessage = 'An unexpected error occurred while sending the staff message.';
    if (error.code) { 
        errorMessage = `Error sending message: ${error.message} (Code: ${error.code})`;
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { success: false, message: errorMessage };
  }
}
