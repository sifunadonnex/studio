
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, query, orderBy, getDocs, serverTimestamp, Timestamp, doc, getDoc } from 'firebase/firestore';
import { getUserSession, UserProfile } from '@/actions/auth';
import { fetchUserProfile } from './profile'; // To fetch user profile details

// --- Schemas ---
const SendMessageSchema = z.object({
  text: z.string().min(1, { message: "Message cannot be empty." }).max(1000, { message: "Message is too long." }),
});

const StaffSendMessageSchema = z.object({
  targetUserId: z.string().min(1, { message: "Target user ID is required."}),
  text: z.string().min(1, { message: "Message cannot be empty." }).max(1000, { message: "Message is too long." }),
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

export interface ChatUser {
    id: string; // User ID
    name: string;
    email: string;
    // lastMessageTimestamp?: string; // Optional: For sorting or display
}

export interface FetchActiveChatUsersResponse {
    success: boolean;
    message: string;
    users?: ChatUser[];
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

    const chatThreadRef = collection(db, 'chats', session.id, 'messages');
    console.log(`[sendUserMessageAction] Firestore collection path: chats/${session.id}/messages`);
    
    const messageData = {
      senderId: session.id,
      senderName: session.name, 
      senderType: 'user' as 'user' | 'staff',
      text: validatedData.text,
      timestamp: serverTimestamp(),
    };
    console.log('[sendUserMessageAction] Message data to be saved:', JSON.stringify(messageData));

    const docRef = await addDoc(chatThreadRef, messageData);
    console.log('[sendUserMessageAction] Message saved to Firestore. Document ID:', docRef.id);

    const savedMessageForClient: ChatMessage = {
        id: docRef.id,
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        senderType: messageData.senderType,
        text: messageData.text,
        timestamp: new Date().toISOString(), 
    };

    return { success: true, message: "Message sent successfully.", chatMessage: savedMessageForClient };

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      console.error('[sendUserMessageAction] Validation Error:', messages);
      return { success: false, message: `Validation failed: ${messages}` };
    }
    console.error('[sendUserMessageAction] Firestore or other Error saving message:', error);
    let errorMessage = 'An unexpected error occurred while sending the message.';
    if (error.message) { 
        errorMessage = error.message;
    } else if (error.code) { 
        errorMessage = `Error sending message (Code: ${error.code || 'N/A'})`;
    }
    return { success: false, message: errorMessage };
  }
}

/**
 * Fetches the chat history for the currently logged-in user.
 */
export async function fetchChatHistoryAction(): Promise<FetchChatHistoryResponse> {
  console.log('[fetchChatHistoryAction] Action initiated.');
  const session = await getUserSession();
  if (!session?.id) {
    console.error('[fetchChatHistoryAction] Authentication error: No session ID. Session:', session);
    return { success: false, message: "Authentication required to fetch chat history." };
  }
  console.log(`[fetchChatHistoryAction] Fetching history for user: ${session.id}`);

  try {
    const messagesCollectionRef = collection(db, 'chats', session.id, 'messages');
    const q = query(messagesCollectionRef, orderBy("timestamp", "asc")); 
    console.log(`[fetchChatHistoryAction] Querying Firestore path: chats/${session.id}/messages, ordering by timestamp asc.`);
    
    const querySnapshot = await getDocs(q);
    console.log(`[fetchChatHistoryAction] Fetched ${querySnapshot.docs.length} messages.`);
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
    let errorMessage = 'An unexpected error occurred while fetching chat history.';
    if (error.code === 'failed-precondition' && error.message && error.message.includes('index')) {
        errorMessage = `Error: Firestore query requires an index. Please create it for the 'messages' subcollection on the 'timestamp' field (ascending). Details: ${error.message}`;
    } else if (error.message) {
        errorMessage = error.message;
    } else if (error.code) { 
        errorMessage = `Error fetching history (Code: ${error.code || 'N/A'})`;
    }
    return { success: false, message: errorMessage, messages: [] };
  }
}


/**
 * Saves a staff member's message to a user's chat thread in Firestore.
 */
export async function sendStaffMessageAction(data: StaffSendMessageInput): Promise<ChatResponse> {
  console.log('[sendStaffMessageAction] Action initiated by staff. Data received:', data);
  const staffSession = await getUserSession();

  if (!staffSession?.id || !staffSession.name) {
    console.error('[sendStaffMessageAction] Authentication error: No staff session ID or name found. Session:', staffSession);
    return { success: false, message: "Staff authentication required." };
  }

  if (staffSession.role !== 'staff' && staffSession.role !== 'admin') {
    console.error(`[sendStaffMessageAction] Authorization error: User ${staffSession.id} (${staffSession.role}) is not authorized to send staff messages.`);
    return { success: false, message: "Unauthorized to send staff messages." };
  }
  
  console.log(`[sendStaffMessageAction] Staff authenticated: ${staffSession.id} (${staffSession.name}), Role: ${staffSession.role}`);

  try {
    const validatedData = StaffSendMessageSchema.parse(data);
    console.log('[sendStaffMessageAction] Data validated:', validatedData);

    const chatThreadRef = collection(db, 'chats', validatedData.targetUserId, 'messages');
    console.log(`[sendStaffMessageAction] Firestore collection path: chats/${validatedData.targetUserId}/messages`);
    
    const messageData = {
      senderId: staffSession.id, 
      senderName: staffSession.name, 
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
    return { success: true, message: `Message sent to user ${validatedData.targetUserId}.`, chatMessage: savedMessageForClient };

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      console.error('[sendStaffMessageAction] Validation Error:', messages);
      return { success: false, message: `Validation failed: ${messages}` };
    }
    console.error('[sendStaffMessageAction] Firestore or other Error saving staff message:', error);
    let errorMessage = 'An unexpected error occurred while sending the staff message.';
     if (error.message) {
        errorMessage = error.message;
    } else if (error.code) { 
        errorMessage = `Error sending message (Code: ${error.code || 'N/A'})`;
    }
    return { success: false, message: errorMessage };
  }
}

/**
 * Fetches a list of users who have active chat threads.
 * For staff/admin interface.
 */
export async function getActiveChatUsersAction(): Promise<FetchActiveChatUsersResponse> {
    console.log('[getActiveChatUsersAction] Action initiated.');
    const staffSession = await getUserSession();

    if (!staffSession || (staffSession.role !== 'staff' && staffSession.role !== 'admin')) {
        console.error('[getActiveChatUsersAction] Unauthorized attempt.');
        return { success: false, message: "Unauthorized: Staff or admin privileges required." };
    }
    console.log(`[getActiveChatUsersAction] Staff/Admin ${staffSession.id} fetching active chat users.`);

    try {
        const chatsCollectionRef = collection(db, 'chats');
        const chatDocsSnapshot = await getDocs(chatsCollectionRef);
        
        console.log(`[getActiveChatUsersAction] Snapshot of 'chats' collection received. Number of docs: ${chatDocsSnapshot.size}. Is empty: ${chatDocsSnapshot.empty}`);

        if (chatDocsSnapshot.empty) {
            console.log("[getActiveChatUsersAction] No documents found in 'chats' collection. Either it's empty or permissions are insufficient for listing.");
            return { success: true, message: "No active chat users found.", users: [] };
        }
        
        const userChatPromises = chatDocsSnapshot.docs.map(async (chatDoc) => {
            const userId = chatDoc.id;
            console.log(`[getActiveChatUsersAction] Processing chat for userId: ${userId}`);
            const userProfile = await fetchUserProfile(userId); 
            if (userProfile) {
                console.log(`[getActiveChatUsersAction] User profile found for ${userId}: ${userProfile.name}`);
                return {
                    id: userProfile.id,
                    name: userProfile.name,
                    email: userProfile.email,
                } as ChatUser;
            }
            console.warn(`[getActiveChatUsersAction] User profile NOT found for userId: ${userId}. This user will not be listed.`);
            return null;
        });

        const chatUsers = (await Promise.all(userChatPromises)).filter(user => user !== null) as ChatUser[];
        
        console.log(`[getActiveChatUsersAction] Found ${chatUsers.length} active chat users after processing profiles.`);
        return { success: true, message: "Active chat users fetched.", users: chatUsers };

    } catch (error: any) {
        console.error('[getActiveChatUsersAction] Error fetching active chat users:', error);
        let errorMessage = 'An unexpected error occurred while fetching chat users.';
        if (error.message) errorMessage = error.message;
        else if (error.code) errorMessage = `Error (Code: ${error.code || 'N/A'})`;
        return { success: false, message: errorMessage, users: [] };
    }
}


/**
 * Fetches the chat history for a specific user, callable by staff.
 */
export async function fetchMessagesForUserByStaffAction(targetUserId: string): Promise<FetchChatHistoryResponse> {
    console.log(`[fetchMessagesForUserByStaffAction] Action initiated for targetUserId: ${targetUserId}`);
    const staffSession = await getUserSession();

    if (!staffSession || (staffSession.role !== 'staff' && staffSession.role !== 'admin')) {
        console.error('[fetchMessagesForUserByStaffAction] Unauthorized attempt.');
        return { success: false, message: "Unauthorized: Staff or admin privileges required." };
    }
    console.log(`[fetchMessagesForUserByStaffAction] Staff/Admin ${staffSession.id} fetching messages for user ${targetUserId}.`);
    
    if (!targetUserId) {
        return { success: false, message: "Target user ID is required." };
    }

    try {
        const messagesCollectionRef = collection(db, 'chats', targetUserId, 'messages');
        const q = query(messagesCollectionRef, orderBy("timestamp", "asc"));
        console.log(`[fetchMessagesForUserByStaffAction] Querying Firestore path: chats/${targetUserId}/messages`);

        const querySnapshot = await getDocs(q);
        console.log(`[fetchMessagesForUserByStaffAction] Fetched ${querySnapshot.docs.length} messages for user ${targetUserId}.`);
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

    } catch (error: any)
        console.error(`[fetchMessagesForUserByStaffAction] Error fetching chat history for user ${targetUserId}:`, error);
        let errorMessage = 'An unexpected error occurred.';
        if (error.code === 'failed-precondition' && error.message && error.message.includes('index')) {
            errorMessage = `Error: Firestore query requires an index for 'messages' on 'timestamp' (ascending). Details: ${error.message}`;
        } else if (error.message) {
            errorMessage = error.message;
        } else if (error.code) {
            errorMessage = `Error (Code: ${error.code || 'N/A'})`;
        }
        return { success: false, message: errorMessage, messages: [] };
    }
}

