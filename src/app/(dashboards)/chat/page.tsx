
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, User, Wrench, MessageSquare, Loader2, AlertTriangle } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useUserSession } from '@/contexts/session-context';
import { sendUserMessageAction, fetchChatHistoryAction, SendMessageInput, ChatMessage, ChatResponse, FetchChatHistoryResponse } from '@/actions/chat';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';


export default function ChatPage() {
    const { toast } = useToast();
    const { userProfile, loading: sessionLoading } = useUserSession();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
             const viewport = scrollAreaRef.current.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');
             if (viewport) {
                 viewport.scrollTop = viewport.scrollHeight;
             }
        }
    };

    const loadChatHistory = useCallback(async () => {
        if (!userProfile?.id) {
            setLoadingHistory(false);
            return;
        }
        setLoadingHistory(true);
        setError(null);
        try {
            const result: FetchChatHistoryResponse = await fetchChatHistoryAction();
            if (result.success && result.messages) {
                setMessages(result.messages);
            } else {
                setError(result.message || "Failed to load chat history.");
                toast({ title: "Error Loading Chat", description: result.message, variant: "destructive" });
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "An unexpected error occurred.";
            setError(message);
            toast({ title: "Chat Error", description: message, variant: "destructive" });
        } finally {
            setLoadingHistory(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userProfile?.id, toast]); // toast is stable, userProfile.id is key

    useEffect(() => {
        if (!sessionLoading && userProfile) {
            loadChatHistory();
        } else if (!sessionLoading && !userProfile) {
            setLoadingHistory(false);
            setMessages([]); // Clear messages if user logs out
        }
    }, [sessionLoading, userProfile, loadChatHistory]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !userProfile) return;

        setSendingMessage(true);
        const optimisticMessage: ChatMessage = {
            id: `temp-${Date.now()}`,
            senderId: userProfile.id,
            senderName: userProfile.name || 'You',
            senderType: 'user',
            text: newMessage,
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');
        scrollToBottom();

        const messageData: SendMessageInput = { text: newMessage };

        try {
            const result: ChatResponse = await sendUserMessageAction(messageData);
            if (result.success && result.chatMessage) {
                // Replace optimistic message with confirmed message from server
                setMessages(prev => prev.map(msg => msg.id === optimisticMessage.id ? result.chatMessage! : msg));
            } else {
                toast({ title: "Message Failed", description: result.message, variant: "destructive" });
                // Remove optimistic message if sending failed
                setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Could not send message.";
            toast({ title: "Error", description: message, variant: "destructive" });
            setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        } finally {
            setSendingMessage(false);
            scrollToBottom();
        }
    };
    
    const formatTimestamp = (isoString: string) => {
        try {
            return formatDistanceToNow(new Date(isoString), { addSuffix: true });
        } catch (e) {
            return "just now"; // Fallback for invalid date string
        }
    };

    if (sessionLoading) {
        return (
            <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-2 text-muted-foreground">Loading session...</p>
            </div>
        );
    }
    
    if (!userProfile) {
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
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            {loadingHistory ? (
                 <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading chat history...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
                    <p className="text-destructive font-medium">Error loading chat</p>
                    <p className="text-muted-foreground text-sm mb-3">{error}</p>
                    <Button variant="outline" onClick={loadChatHistory}>Try Again</Button>
                </div>
            ) : messages.length === 0 ? (
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
                    {message.senderType === 'user' && (
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
