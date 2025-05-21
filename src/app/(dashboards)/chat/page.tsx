
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, User, Wrench, MessageSquare, Loader2, AlertTriangle } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useUserSession } from '@/contexts/session-context';
import { sendUserMessageAction, SendMessageInput, ChatMessage, ChatResponse } from '@/actions/chat';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, onSnapshot, Timestamp, Unsubscribe } from 'firebase/firestore';

export default function ChatPage() {
    const { toast } = useToast();
    const { userProfile, loading: sessionLoading } = useUserSession();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        if (scrollAreaRef.current) {
             const viewport = scrollAreaRef.current.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');
             if (viewport) {
                 viewport.scrollTop = viewport.scrollHeight;
             }
        }
    }, []);

    useEffect(() => {
        if (sessionLoading || !userProfile?.id) {
            setLoadingHistory(false);
            setMessages([]); // Clear messages if no user or session is loading
            return;
        }

        setLoadingHistory(true);
        setError(null);

        const messagesCollectionRef = collection(db, 'chats', userProfile.id, 'messages');
        const q = query(messagesCollectionRef, orderBy("timestamp", "asc"));

        const unsubscribe: Unsubscribe = onSnapshot(q, (querySnapshot) => {
            console.log(`[ChatPage] onSnapshot: Received ${querySnapshot.docs.length} messages for user ${userProfile.id}`);
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
            setMessages(chatMessages);
            setLoadingHistory(false);
            scrollToBottom();
        }, (err) => {
            console.error("[ChatPage] onSnapshot error:", err);
            const message = err instanceof Error ? err.message : "An unexpected error occurred while fetching messages.";
            setError(message);
            toast({ title: "Chat Error", description: message, variant: "destructive" });
            setLoadingHistory(false);
        });

        // Cleanup listener on component unmount or when userProfile.id changes
        return () => {
            console.log(`[ChatPage] Unsubscribing from chat messages for user ${userProfile.id}`);
            unsubscribe();
        };
    }, [sessionLoading, userProfile, toast, scrollToBottom]);


    useEffect(() => {
        // Scroll to bottom whenever messages state updates, but after a slight delay to allow DOM update
        if (messages.length > 0) {
            setTimeout(scrollToBottom, 100);
        }
    }, [messages, scrollToBottom]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !userProfile) return;

        setSendingMessage(true);
        // Optimistic update is handled by onSnapshot, but we can clear input
        const messageTextToSend = newMessage;
        setNewMessage('');
        // scrollToBottom(); // onSnapshot will trigger this

        const messageData: SendMessageInput = { text: messageTextToSend };

        try {
            const result: ChatResponse = await sendUserMessageAction(messageData);
            if (!result.success) {
                toast({ title: "Message Failed", description: result.message, variant: "destructive" });
                // Optionally, re-add newMessage to input if sending failed
                setNewMessage(messageTextToSend);
            }
            // No need to manually add message to state, onSnapshot will handle it
        } catch (err) {
            const message = err instanceof Error ? err.message : "Could not send message.";
            toast({ title: "Error", description: message, variant: "destructive" });
            setNewMessage(messageTextToSend); // Re-add message to input on error
        } finally {
            setSendingMessage(false);
            // scrollToBottom(); // onSnapshot will trigger this
        }
    };
    
    const formatTimestamp = (isoString: string) => {
        try {
            return formatDistanceToNow(new Date(isoString), { addSuffix: true });
        } catch (e) {
            return "just now"; // Fallback for invalid date string
        }
    };

    if (sessionLoading && !userProfile) { // Show loading only if userProfile is not yet available
        return (
            <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-2 text-muted-foreground">Loading session...</p>
            </div>
        );
    }
    
    if (!userProfile && !sessionLoading) { // Session loaded, but no user
         return (
            <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] items-center justify-center text-center p-4">
                <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold text-primary mb-2">Chat Unavailable</h2>
                <p className="text-muted-foreground mb-4">
                    Please <Link href="/login" className="text-accent hover:underline">log in</Link> to use the chat feature.
                </p>
            </div>
        );
    }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)]">
      <h1 className="text-3xl font-bold text-primary mb-4 px-4 md:px-0">Chat with Support</h1>

      <Card className="flex-grow flex flex-col overflow-hidden shadow-lg">
        <CardHeader className="border-b">
          <CardTitle>Your Conversation</CardTitle>
          <CardDescription>Ask questions about your appointments, services, or subscription. Staff typically replies within a few hours during business days.</CardDescription>
        </CardHeader>

        <CardContent className="flex-grow p-0 overflow-hidden">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef} data-testid="chat-scroll-area">
            {loadingHistory && messages.length === 0 ? ( // Show loading only if messages are empty
                 <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading chat history...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
                    <p className="text-destructive font-medium">Error loading chat</p>
                    <p className="text-muted-foreground text-sm mb-3">{error}</p>
                    {/* <Button variant="outline" onClick={loadChatHistory}>Try Again</Button> // loadChatHistory is now part of useEffect */}
                </div>
            ) : messages.length === 0 && !loadingHistory ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                </div>
            ) : (
                <div className="space-y-4">
                {messages.map((message) => (
                    <div
                    key={message.id}
                    className={cn(
                        "flex items-end gap-2",
                        message.senderType === 'user' ? "justify-end" : "justify-start"
                    )}
                    >
                    {message.senderType === 'staff' && (
                        <Avatar className="h-8 w-8">
                        <AvatarFallback><Wrench className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                    )}
                    <div
                        className={cn(
                        "max-w-[75%] rounded-lg p-3 shadow",
                        message.senderType === 'user'
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        )}
                    >
                        <p className="text-sm">{message.text}</p>
                        <p className="text-xs mt-1 opacity-80 text-right">{formatTimestamp(message.timestamp)} by {message.senderName}</p>
                    </div>
                    {message.senderType === 'user' && userProfile && (
                        <Avatar className="h-8 w-8">
                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
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
              placeholder="Type your message..."
              autoComplete="off"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sendingMessage || loadingHistory || !userProfile}
              className="flex-grow"
            />
            <Button type="submit" size="icon" disabled={sendingMessage || loadingHistory || !newMessage.trim() || !userProfile}>
              {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
