import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useCallback } from "react";
import { logActivity } from "@/hooks/useActivityLogger";

export interface RequestComment {
  id: string;
  request_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  content: string;
  created_at: string;
}

export function useRequestComments(requestId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["request-comments", requestId],
    queryFn: async () => {
      if (!requestId) return [];

      const { data, error } = await supabase
        .from("request_comments")
        .select("*")
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as RequestComment[];
    },
    enabled: !!requestId,
  });

  // Handle realtime notification
  const handleRealtimeUpdate = useCallback((payload: any) => {
    queryClient.invalidateQueries({ queryKey: ["request-comments", requestId] });
    
    // Show notification for new comments from others
    if (payload.eventType === "INSERT" && payload.new) {
      const newComment = payload.new as RequestComment;
      
      // Get current user to avoid self-notification
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user && newComment.user_id !== user.id) {
          toast({
            title: "💬 Nowy komentarz",
            description: `${newComment.user_name}: ${newComment.content.slice(0, 50)}${newComment.content.length > 50 ? '...' : ''}`,
          });
        }
      });
    }
  }, [requestId, queryClient, toast]);

  // Subscribe to realtime updates with notifications
  useEffect(() => {
    if (!requestId) return;

    const channel = supabase
      .channel(`request-comments-${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "request_comments",
          filter: `request_id=eq.${requestId}`,
        },
        handleRealtimeUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, handleRealtimeUpdate]);

  const addComment = useMutation({
    mutationFn: async ({ content, userName, userRole }: { content: string; userName: string; userRole: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (!requestId) throw new Error("No request selected");

      const { data, error } = await supabase
        .from("request_comments")
        .insert({
          request_id: requestId,
          user_id: user.id,
          user_name: userName,
          user_role: userRole,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["request-comments", requestId] });
      logActivity("comment_add", "request", requestId!, null, {
        comment_id: data.id,
        preview: data.content.slice(0, 50),
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("request_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
    },
    onSuccess: (_, commentId) => {
      queryClient.invalidateQueries({ queryKey: ["request-comments", requestId] });
      toast({
        title: "Komentarz usunięty",
      });
      logActivity("comment_delete", "request", requestId!, null, {
        comment_id: commentId,
      });
    },
  });

  return {
    comments,
    isLoading,
    addComment: addComment.mutate,
    deleteComment: deleteComment.mutate,
    isAdding: addComment.isPending,
  };
}
