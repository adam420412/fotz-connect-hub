import { supabase } from "@/integrations/supabase/client";

interface SlackNotificationPayload {
  text: string;
  blocks?: Array<{
    type: string;
    text?: {
      type: string;
      text: string;
      emoji?: boolean;
    };
    fields?: Array<{
      type: string;
      text: string;
    }>;
  }>;
}

export async function sendSlackNotification(message: string, details?: Record<string, string>) {
  try {
    const { data, error } = await supabase.functions.invoke("slack-notification", {
      body: { message, details },
    });

    if (error) {
      console.error("Error sending Slack notification:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send Slack notification:", error);
    return false;
  }
}

export async function notifyNewComment(
  taskTitle: string,
  commentAuthor: string,
  commentContent: string
) {
  return sendSlackNotification(`💬 Nowy komentarz w zadaniu "${taskTitle}"`, {
    Autor: commentAuthor,
    Treść: commentContent.slice(0, 200) + (commentContent.length > 200 ? "..." : ""),
  });
}

export async function notifyTaskStatusChange(
  taskTitle: string,
  oldStatus: string,
  newStatus: string,
  changedBy: string
) {
  return sendSlackNotification(`📋 Zmiana statusu zadania "${taskTitle}"`, {
    "Poprzedni status": oldStatus,
    "Nowy status": newStatus,
    "Zmieniono przez": changedBy,
  });
}

export async function notifyNewTask(taskTitle: string, createdBy: string, priority?: string) {
  return sendSlackNotification(`➕ Nowe zadanie: "${taskTitle}"`, {
    "Utworzone przez": createdBy,
    ...(priority && { Priorytet: priority }),
  });
}
