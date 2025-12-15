import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logActivity } from "@/hooks/useActivityLogger";

export interface FileComment {
  id: string;
  file_id: string;
  author_name: string;
  author_email: string | null;
  author_role: "client" | "team";
  content: string;
  created_at: string;
}

export const useFileComments = (fileId: string | null) => {
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["file-comments", fileId],
    queryFn: async () => {
      if (!fileId) return [];
      
      const { data, error } = await supabase
        .from("file_comments")
        .select("*")
        .eq("file_id", fileId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as FileComment[];
    },
    enabled: !!fileId,
  });

  // Real-time subscription for new comments
  useEffect(() => {
    if (!fileId) return;

    const channel = supabase
      .channel(`file-comments-${fileId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "file_comments",
          filter: `file_id=eq.${fileId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["file-comments", fileId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fileId, queryClient]);

  const addComment = useMutation({
    mutationFn: async ({
      content,
      authorName,
      authorEmail,
      authorRole,
    }: {
      content: string;
      authorName: string;
      authorEmail?: string;
      authorRole: "client" | "team";
    }) => {
      if (!fileId) throw new Error("No file selected");

      const { data, error } = await supabase
        .from("file_comments")
        .insert({
          file_id: fileId,
          author_name: authorName,
          author_email: authorEmail || null,
          author_role: authorRole,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification for new comment
      try {
        await supabase.functions.invoke("send-client-notification", {
          body: {
            type: "comment",
            fileName: "Plik",
            commentAuthor: authorName,
            commentContent: content,
          },
        });
      } catch (notifyError) {
        console.log("Notification not sent:", notifyError);
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["file-comments", fileId] });
      toast.success("Komentarz został dodany");
      logActivity("comment_add", "comment", data.id, null, {
        file_id: fileId,
        author_name: variables.authorName,
        author_role: variables.authorRole,
      });
    },
    onError: () => {
      toast.error("Błąd podczas dodawania komentarza");
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("file_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
    },
    onSuccess: (_, commentId) => {
      queryClient.invalidateQueries({ queryKey: ["file-comments", fileId] });
      toast.success("Komentarz został usunięty");
      logActivity("comment_delete", "comment", commentId, null, {
        file_id: fileId,
      });
    },
    onError: () => {
      toast.error("Błąd podczas usuwania komentarza");
    },
  });

  return {
    comments,
    isLoading,
    addComment: addComment.mutate,
    deleteComment: deleteComment.mutate,
    isAdding: addComment.isPending,
  };
};
