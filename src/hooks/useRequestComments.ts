import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

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

  // Subscribe to realtime updates
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
        () => {
          queryClient.invalidateQueries({ queryKey: ["request-comments", requestId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, queryClient]);

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["request-comments", requestId] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["request-comments", requestId] });
      toast({
        title: "Komentarz usunięty",
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
