'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, User, Tool } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Placeholder data - Fetch chat history and user info from MySQL via PHP
interface Message {
    id: string;
    sender: 'user' | 'staff';
    text: string;
    timestamp: string; // ISO string or formatted string
    senderName: string; // e.g., "You" or "Support Team"
}

const mockChatHistory: Message[] = [
    { id: 'm1', sender: 'staff', text: 'Hello! How can we help you today?', timestamp: '10:30 AM', senderName: 'Support' },
    { id: 'm2', sender: 'user', text: 'Hi, I wanted to ask about the status of my car (Toyota Corolla).', timestamp: '10:31 AM', senderName: 'You' },
    { id: 'm3', sender: 'staff', text: 'Let me check that for you. One moment please...', timestamp: '10:32 AM', senderName: 'Support' },
    { id: 'm4', sender: 'staff', text: 'Your Corolla service is complete and it\'s ready for pickup anytime before 6 PM today.', timestamp: '10:35 AM', senderName: 'Support'},
    { id: 'm5', sender: 'user', text: 'Great, thank you!', timestamp: '10:36 AM', senderName: 'You'},
];

export default function ChatPage() {
    const { toast } = useToast();
    const [messages, setMessages] = useState<Message[]>(mockChatHistory);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);


    // Function to scroll to the bottom of the chat
    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
             // Need to access the viewport element within ScrollArea
             const viewport = scrollAreaRef.current.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');
             if (viewport) {
                 viewport.scrollTop = viewport.scrollHeight;
             }
        }
    };

     // Scroll to bottom on initial load and when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    // TODO: Implement actual message sending via PHP/MySQL (WebSockets or polling)
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const userMessage: Message = {
            id: `temp-${Date.now()}`,
            sender: 'user',
            text: newMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            senderName: 'You',
        };

        setMessages(prev => [...prev, userMessage]);
        setNewMessage('');
        setLoading(true);
        scrollToBottom(); // Scroll after adding user message

        // Simulate API call to send message
        await new Promise(resolve => setTimeout(resolve, 800));

         // Simulate staff reply (replace with actual backend logic)
        const staffReply: Message = {
             id: `staff-${Date.now()}`,
             sender: 'staff',
             text: "Thank you for your message. A staff member will respond shortly.", // Generic reply
             timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
             senderName: 'Support',
        };
        setMessages(prev => [...prev, staffReply]);


        // const success = true; // Simulate success
        // if (!success) {
        //     toast({ title: "Message Failed", description: "Could not send message.", variant: "destructive" });
        //     // Optionally remove the failed message or mark it as failed
        //      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
        // }

        setLoading(false);
        scrollToBottom(); // Scroll again after potential staff reply
    };


  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)]"> {/* Adjust height based on layout */}
      <h1 className="text-3xl font-bold text-primary mb-4 px-4 md:px-0">Chat with Support</h1>

      <Card className="flex-grow flex flex-col overflow-hidden"> {/* flex-grow and flex-col */}
        <CardHeader className="border-b">
          <CardTitle>Conversation</CardTitle>
          <CardDescription>Ask questions about your appointments, services, or subscription.</CardDescription>
        </CardHeader>

        <CardContent className="flex-grow p-0 overflow-hidden"> {/* flex-grow and remove padding */}
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}> {/* Add padding here */}
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-end gap-2",
                    message.sender === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                   {message.sender === 'staff' && (
                     <Avatar className="h-8 w-8">
                        {/* Placeholder for staff image */}
                       <AvatarFallback><Tool className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                   )}
                  <div
                    className={cn(
                      "max-w-[75%] rounded-lg p-3",
                      message.sender === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    <p className="text-sm">{message.text}</p>
                     <p className="text-xs mt-1 opacity-70 text-right">{message.timestamp}</p>
                  </div>
                   {message.sender === 'user' && (
                     <Avatar className="h-8 w-8">
                        {/* Placeholder for user image */}
                       <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                   )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>

        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Input
              id="message"
              placeholder="Type your message..."
              autoComplete="off"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={loading}
              className="flex-grow"
            />
            <Button type="submit" size="icon" disabled={loading || !newMessage.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
