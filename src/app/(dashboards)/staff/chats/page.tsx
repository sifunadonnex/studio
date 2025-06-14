
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, User, MessageSquareText, Loader2, AlertTriangle, Users, MessagesSquare, Wrench } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useUserSession } from '@/contexts/session-context';
import { 
    sendStaffMessageAction, 
    getActiveChatUsersAction,
    ChatMessage, 
    ChatUser,
    ChatResponse,
    FetchActiveChatUsersResponse,
    StaffSendMessageInput
} from '@/actions/chat';
import { formatDistanceToNow } from 'date-fns';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, onSnapshot, Timestamp, Unsubscribe } from 'firebase/firestore';

export default function StaffChatsPage() {
    const { toast } = useToast();
    const { userProfile: staffProfile, loading: sessionLoading } = useUserSession();
    
    const [activeChatUsers, setActiveChatUsers] = useState<ChatUser[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const messagesScrollAreaRef = useRef<HTMLDivElement>(null);
    const messagesListenerUnsubscribe = useRef<Unsubscribe | null>(null);

    const scrollToBottom = useCallback(() => {
        if (messagesScrollAreaRef.current) {
             const viewport = messagesScrollAreaRef.current.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');
             if (viewport) {
                 viewport.scrollTop = viewport.scrollHeight;
             }
        }
    }, []);

    const loadActiveChatUsers = useCallback(async () => {
        if (!staffProfile || (staffProfile.role !== 'staff' && staffProfile.role !== 'admin')) {
            setError("Unauthorized to view chats.");
            setLoadingUsers(false);
            return;
        }
        setLoadingUsers(true);
        setError(null);
        try {
            const result: FetchActiveChatUsersResponse = await getActiveChatUsersAction();
            if (result.success && result.users) {
                setActiveChatUsers(result.users);
            } else {
                setError(result.message || "Failed to load user list.");
                toast({ title: "Error Loading Users", description: result.message, variant: "destructive" });
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "An unexpected error occurred.";
            setError(message);
            toast({ title: "Load Users Error", description: message, variant: "destructive" });
        } finally {
            setLoadingUsers(false);
        }
    }, [staffProfile, toast]);

    useEffect(() => {
        if (!sessionLoading && staffProfile) {
            loadActiveChatUsers();
        }
    }, [sessionLoading, staffProfile, loadActiveChatUsers]);

    useEffect(() => {
        // Cleanup previous listener if selectedUserId changes
        if (messagesListenerUnsubscribe.current) {
            console.log(`[StaffChatPage] Unsubscribing from messages for user ${selectedUserId} due to selection change.`);
            messagesListenerUnsubscribe.current();
            messagesListenerUnsubscribe.current = null;
        }

        if (!selectedUserId) {
            setCurrentMessages([]);
            setLoadingMessages(false);
            return;
        }

        setLoadingMessages(true);
        setCurrentMessages([]); // Clear previous messages
        setError(null);

        const messagesCollectionRef = collection(db, 'chats', selectedUserId, 'messages');
        const q = query(messagesCollectionRef, orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            console.log(`[StaffChatPage] onSnapshot: Received ${querySnapshot.docs.length} messages for selected user ${selectedUserId}`);
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
            setCurrentMessages(chatMessages);
            setLoadingMessages(false);
            scrollToBottom();
        }, (err) => {
            console.error(`[StaffChatPage] onSnapshot error for user ${selectedUserId}:`, err);
            const message = err instanceof Error ? err.message : "An unexpected error occurred while fetching messages.";
            setError(message);
            toast({ title: "Load Messages Error", description: message, variant: "destructive" });
            setLoadingMessages(false);
        });

        messagesListenerUnsubscribe.current = unsubscribe;

        // Cleanup listener on component unmount
        return () => {
            if (messagesListenerUnsubscribe.current) {
                console.log(`[StaffChatPage] Unsubscribing from messages for user ${selectedUserId} on component unmount.`);
                messagesListenerUnsubscribe.current();
            }
        };
    }, [selectedUserId, toast, scrollToBottom]);


    useEffect(() => {
        if (currentMessages.length > 0) {
          setTimeout(scrollToBottom, 100);
        }
    }, [currentMessages, scrollToBottom]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUserId || !staffProfile) return;

        setSendingMessage(true);
        const messageTextToSend = newMessage;
        setNewMessage('');
        // scrollToBottom(); // onSnapshot will handle this

        const messageData: StaffSendMessageInput = { targetUserId: selectedUserId, text: messageTextToSend };

        try {
            const result: ChatResponse = await sendStaffMessageAction(messageData);
            if (!result.success) {
                toast({ title: "Message Failed", description: result.message, variant: "destructive" });
                setNewMessage(messageTextToSend);
            }
            // No need to manually add to state, onSnapshot handles it
        } catch (err) {
            const message = err instanceof Error ? err.message : "Could not send message.";
            toast({ title: "Error", description: message, variant: "destructive" });
            setNewMessage(messageTextToSend);
        } finally {
            setSendingMessage(false);
            // scrollToBottom(); // onSnapshot will handle this
        }
    };
    
    const formatTimestamp = (isoString: string) => {
        try {
            return formatDistanceToNow(new Date(isoString), { addSuffix: true });
        } catch (e) {
            return "just now";
        }
    };

    if (sessionLoading && !staffProfile) {
        return (
            <div className="flex flex-col h-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-2 text-muted-foreground">Loading session...</p>
            </div>
        );
    }
    
    if (!staffProfile || (staffProfile.role !== 'staff' && staffProfile.role !== 'admin')) {
         return (
            <div className="flex flex-col h-full items-center justify-center text-center p-4">
                <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
                <h2 className="text-xl font-semibold text-primary mb-2">Access Denied</h2>
                <p className="text-muted-foreground">You do not have permission to access this page.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] space-y-4">
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2 px-4 md:px-0">
                <MessageSquareText className="h-7 w-7" /> Customer Chats
            </h1>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-hidden">
                {/* User List */}
                <Card className="md:col-span-1 lg:col-span-1 flex flex-col">
                    <CardHeader className="border-b">
                        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Active Chats</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-grow overflow-hidden">
                        <ScrollArea className="h-full">
                            {loadingUsers ? (
                                <div className="p-4 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                            ) : activeChatUsers.length === 0 ? (
                                <p className="p-4 text-sm text-muted-foreground text-center">No active customer chats.</p>
                            ) : (
                                <div className="space-y-1 p-2">
                                    {activeChatUsers.map(user => (
                                        <Button
                                            key={user.id}
                                            variant={selectedUserId === user.id ? "secondary" : "ghost"}
                                            className="w-full justify-start h-auto py-2 px-3 text-left"
                                            onClick={() => setSelectedUserId(user.id)}
                                        >
                                            <div>
                                                <p className="font-medium text-sm">{user.name}</p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Chat Area */}
                <Card className="md:col-span-2 lg:col-span-3 flex flex-col overflow-hidden">
                    {!selectedUserId ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                            <MessagesSquare className="h-16 w-16 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Select a user from the list to view their chat messages.</p>
                        </div>
                    ) : (
                        <>
                            <CardHeader className="border-b">
                                <CardTitle>Conversation with {activeChatUsers.find(u => u.id === selectedUserId)?.name || 'User'}</CardTitle>
                                <CardDescription>Responding as {staffProfile.name} ({staffProfile.role})</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow p-0 overflow-hidden">
                                <ScrollArea className="h-full p-4" ref={messagesScrollAreaRef} data-testid="staff-chat-scroll-area">
                                    {loadingMessages && currentMessages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <p className="mt-2 text-sm text-muted-foreground">Loading messages...</p>
                                        </div>
                                    ) : error && !loadingMessages && currentMessages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                                            <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
                                            <p className="text-destructive font-medium">Error loading messages</p>
                                            <p className="text-muted-foreground text-xs mb-3">{error}</p>
                                        </div>
                                    ): currentMessages.length === 0 && !loadingMessages ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center">
                                            <MessagesSquare className="h-10 w-10 text-muted-foreground mb-3" />
                                            <p className="text-sm text-muted-foreground">No messages in this conversation yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {currentMessages.map((message) => (
                                                <div
                                                    key={message.id}
                                                    className={cn(
                                                        "flex items-end gap-2",
                                                        message.senderType === 'staff' ? "justify-end" : "justify-start"
                                                    )}
                                                >
                                                    {message.senderType === 'user' && (
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                    <div
                                                        className={cn(
                                                            "max-w-[75%] rounded-lg p-3 shadow text-sm",
                                                            message.senderType === 'staff'
                                                                ? "bg-primary text-primary-foreground"
                                                                : "bg-secondary text-secondary-foreground"
                                                        )}
                                                    >
                                                        <p>{message.text}</p>
                                                        <p className="text-xs mt-1 opacity-80 text-right">
                                                            {formatTimestamp(message.timestamp)} by {message.senderName}
                                                        </p>
                                                    </div>
                                                    {message.senderType === 'staff' && staffProfile && (
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback><Wrench className="h-4 w-4" /></AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                            <div className="border-t p-4 bg-background">
                                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                    <Input
                                        id="message"
                                        placeholder="Type your reply..."
                                        autoComplete="off"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        disabled={sendingMessage || loadingMessages || !selectedUserId}
                                        className="flex-grow"
                                    />
                                    <Button type="submit" size="icon" disabled={sendingMessage || loadingMessages || !newMessage.trim() || !selectedUserId}>
                                        {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        <span className="sr-only">Send Reply</span>
                                    </Button>
                                </form>
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}
