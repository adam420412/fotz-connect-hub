import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Trash2, MessageSquare, User } from "lucide-react";
import { useFileComments, FileComment } from "@/hooks/useFileComments";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FileCommentsPanelProps {
  fileId: string | null;
  fileName: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const FileCommentsPanel = ({ fileId, fileName }: FileCommentsPanelProps) => {
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorRole, setAuthorRole] = useState<"client" | "team">("client");

  const { comments, isLoading, addComment, deleteComment, isAdding } =
    useFileComments(fileId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !authorName.trim()) return;

    addComment({
      content: content.trim(),
      authorName: authorName.trim(),
      authorRole,
    });

    setContent("");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!fileId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
        <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
        <p>Wybierz plik, aby zobaczyć komentarze</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border p-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Komentarze
        </h3>
        <p className="text-sm text-muted-foreground truncate">{fileName}</p>
      </div>

      {/* Comments List */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Brak komentarzy</p>
            <p className="text-sm">Dodaj pierwszy komentarz poniżej</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment: FileComment) => (
              <div
                key={comment.id}
                className={`group rounded-lg p-3 ${
                  comment.author_role === "team"
                    ? "bg-primary/5 border-l-2 border-primary"
                    : "bg-muted/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback
                      className={
                        comment.author_role === "team"
                          ? "bg-primary text-primary-foreground"
                          : "bg-accent text-accent-foreground"
                      }
                    >
                      {getInitials(comment.author_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground text-sm">
                        {comment.author_name}
                      </span>
                      <Badge
                        variant={
                          comment.author_role === "team" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {comment.author_role === "team" ? "Zespół" : "Klient"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteComment(comment.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="border-t border-border p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="authorName" className="text-xs">
              Imię
            </Label>
            <Input
              id="authorName"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Twoje imię"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="authorRole" className="text-xs">
              Rola
            </Label>
            <Select
              value={authorRole}
              onValueChange={(value: "client" | "team") => setAuthorRole(value)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">
                  <span className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    Klient
                  </span>
                </SelectItem>
                <SelectItem value="team">
                  <span className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    Zespół
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="content" className="text-xs">
            Komentarz
          </Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Napisz komentarz..."
            className="min-h-[80px] text-sm resize-none"
          />
        </div>
        <Button
          type="submit"
          variant="gradient"
          className="w-full gap-2"
          disabled={!content.trim() || !authorName.trim() || isAdding}
        >
          {isAdding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Wyślij komentarz
        </Button>
      </form>
    </div>
  );
};

export default FileCommentsPanel;
