import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Send,
  Paperclip,
  MessageSquare,
  Users,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  name: string;
  type: "project" | "direct";
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  participants: string[];
}

interface Message {
  id: string;
  content: string;
  sender: string;
  senderInitials: string;
  isOwn: boolean;
  time: string;
  isInternal?: boolean;
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    name: "Rebranding Klient ABC",
    type: "project",
    lastMessage: "Aktualizacja logo została przesłana do akceptacji",
    lastMessageTime: "5 min",
    unread: 3,
    participants: ["Anna K.", "Michał P.", "Klient ABC"],
  },
  {
    id: "2",
    name: "Kampania Social Media",
    type: "project",
    lastMessage: "Posty na tydzień zostały zaplanowane",
    lastMessageTime: "1 godz.",
    unread: 0,
    participants: ["Tomek W.", "Kasia M."],
  },
  {
    id: "3",
    name: "Strona WWW - XYZ Corp",
    type: "project",
    lastMessage: "Proszę o feedback do mockupów",
    lastMessageTime: "2 godz.",
    unread: 1,
    participants: ["Piotr N.", "Anna K."],
  },
];

const mockMessages: Message[] = [
  {
    id: "1",
    content: "Dzień dobry! Przesyłam zaktualizowaną wersję logo zgodnie z uwagami.",
    sender: "Anna K.",
    senderInitials: "AK",
    isOwn: false,
    time: "10:30",
  },
  {
    id: "2",
    content: "Dziękuję za szybką reakcję. Czy mogę prosić o wersję w formacie PNG?",
    sender: "Ty",
    senderInitials: "TY",
    isOwn: true,
    time: "10:35",
  },
  {
    id: "3",
    content: "Oczywiście, przesyłam w załączniku. Proszę też o potwierdzenie kolorystyki.",
    sender: "Anna K.",
    senderInitials: "AK",
    isOwn: false,
    time: "10:40",
  },
  {
    id: "4",
    content: "Logo_final_v3.png",
    sender: "Anna K.",
    senderInitials: "AK",
    isOwn: false,
    time: "10:40",
  },
  {
    id: "5",
    content: "Wygląda świetnie! Akceptuję tę wersję. Możemy przejść do wizytówek.",
    sender: "Ty",
    senderInitials: "TY",
    isOwn: true,
    time: "11:00",
  },
];

const Messages = () => {
  const [selectedConversation, setSelectedConversation] = useState<string>("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const filteredConversations = mockConversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      console.log("Sending message:", newMessage);
      setNewMessage("");
    }
  };

  return (
    <DashboardLayout title="Wiadomości" userRole="client">
      <div className="flex h-[calc(100vh-12rem)] rounded-xl border border-border bg-card overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Szukaj rozmów..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={cn(
                  "w-full p-4 text-left border-b border-border transition-colors hover:bg-muted/50",
                  selectedConversation === conv.id && "bg-muted"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    {conv.type === "project" ? (
                      <Users className="h-5 w-5 text-primary" />
                    ) : (
                      <MessageSquare className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium text-foreground truncate">{conv.name}</h3>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {conv.lastMessageTime}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs">
                      {conv.unread}
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-foreground">
                  {mockConversations.find((c) => c.id === selectedConversation)?.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {mockConversations.find((c) => c.id === selectedConversation)?.participants.join(", ")}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {mockMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.isOwn && "flex-row-reverse"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={cn(
                    message.isOwn ? "bg-primary text-primary-foreground" : "bg-accent/10 text-accent"
                  )}>
                    {message.senderInitials}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-2",
                    message.isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={cn(
                    "text-xs mt-1",
                    message.isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {message.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                placeholder="Napisz wiadomość..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1"
              />
              <Button variant="gradient" size="icon" onClick={handleSendMessage}>
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
