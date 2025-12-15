import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  platform: string;
  hashtags: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  status: "scheduled" | "published" | "draft";
  author_id: string | null;
  client_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePostData {
  title: string;
  content: string;
  platform: string;
  hashtags?: string;
  scheduled_date: string;
  scheduled_time?: string;
  status?: "scheduled" | "published" | "draft";
  author_id?: string;
  client_name?: string | null;
}

export const useScheduledPosts = (clientFilter?: string | null) => {
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["scheduled-posts", clientFilter],
    queryFn: async () => {
      let query = supabase
        .from("scheduled_posts")
        .select("*")
        .order("scheduled_date", { ascending: true });

      if (clientFilter === "agency") {
        query = query.is("client_name", null);
      } else if (clientFilter) {
        query = query.eq("client_name", clientFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ScheduledPost[];
    },
  });

  const createPost = useMutation({
    mutationFn: async (postData: CreatePostData) => {
      const { data, error } = await supabase
        .from("scheduled_posts")
        .insert(postData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      toast.success("Post został zaplanowany");
    },
    onError: () => {
      toast.error("Błąd podczas planowania posta");
    },
  });

  const updatePost = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ScheduledPost> & { id: string }) => {
      const { data, error } = await supabase
        .from("scheduled_posts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      toast.success("Post został zaktualizowany");
    },
    onError: () => {
      toast.error("Błąd podczas aktualizacji posta");
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("scheduled_posts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      toast.success("Post został usunięty");
    },
    onError: () => {
      toast.error("Błąd podczas usuwania posta");
    },
  });

  return {
    posts,
    isLoading,
    createPost: createPost.mutate,
    updatePost: updatePost.mutate,
    deletePost: deletePost.mutate,
    isCreating: createPost.isPending,
  };
};

export const getClientsFromPosts = (posts: ScheduledPost[]): string[] => {
  const clients = new Set<string>();
  posts.forEach((post) => {
    if (post.client_name) {
      clients.add(post.client_name);
    }
  });
  return Array.from(clients).sort();
};
