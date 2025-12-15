import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Trash2, Loader2, MessageCircle } from "lucide-react";
import { useRequestComments, RequestComment } from "@/hooks/useRequestComments";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface RequestCommentsProps {
  requestId: string;
}

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  manager: "Manager",
  employee: "Zespół",
  client: "Klient",
};

const RequestComments = ({ requestId }: RequestCommentsProps) => {
  const { comments, isLoading, addComment, deleteComment, isAdding } = useRequestComments(requestId);
  const { user, profile, role } = useAuth();
  const [newComment, setNewComment] = useState("");
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const isTeamMember = role && ["admin", "manager", "employee"].includes(role);

  // Scroll to bottom when new comments arrive
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    addComment({
      content: newComment.trim(),
      userName: profile?.full_name || user.email || "Użytkownik",
      userRole: role || "client",
    });
    setNewComment("");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-foreground flex items-center gap-2">
        <MessageCircle className="h-4 w-4" />
        Komentarze ({comments.length})
      </h4>

      {/* Comments List */}
      <div className="max-h-[300px] overflow-y-auto space-y-3 rounded-xl border border-border bg-card p-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Brak komentarzy. Bądź pierwszy!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={user?.id}
              onDelete={deleteComment}
              getInitials={getInitials}
            />
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Napisz komentarz..."
          className="min-h-[60px] resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button
          type="submit"
          variant="gradient"
          size="icon"
          className="h-[60px] w-[60px]"
          disabled={!newComment.trim() || isAdding}
        >
          {isAdding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
};

interface CommentItemProps {
  comment: RequestComment;
  currentUserId?: string;
  onDelete: (id: string) => void;
  getInitials: (name: string) => string;
}

const CommentItem = ({ comment, currentUserId, onDelete, getInitials }: CommentItemProps) => {
  const isOwn = currentUserId === comment.user_id;
  const isTeam = ["admin", "manager", "employee"].includes(comment.user_role);

  return (
    <div className={cn("flex gap-3", isOwn && "flex-row-reverse")}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className={cn(
          "text-xs",
          isTeam ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          {getInitials(comment.user_name)}
        </AvatarFallback>
      </Avatar>
      <div className={cn("flex-1 min-w-0", isOwn && "text-right")}>
        <div className={cn("flex items-center gap-2", isOwn && "justify-end")}>
          <span className="text-sm font-medium text-foreground">
            {comment.user_name}
          </span>
          <span className="text-xs text-muted-foreground">
            {roleLabels[comment.user_role] || comment.user_role}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(comment.created_at), "d MMM, HH:mm", { locale: pl })}
          </span>
          {isOwn && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
        <p className={cn(
          "text-sm text-foreground mt-1 whitespace-pre-wrap",
          isOwn ? "text-right" : "text-left"
        )}>
          {comment.content}
        </p>
      </div>
    </div>
  );
};

export default RequestComments;
