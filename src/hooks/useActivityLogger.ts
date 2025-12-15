import { supabase } from "@/integrations/supabase/client";

export type ActivityActionType = 
  | "file_upload"
  | "file_status_change"
  | "file_download"
  | "file_version_upload"
  | "file_version_restore"
  | "comment_add"
  | "comment_delete"
  | "request_create"
  | "request_update"
  | "folder_create"
  | "folder_delete"
  | "folder_assign_file"
  | "timer_start"
  | "timer_stop"
  | "time_entry_delete"
  | "post_schedule"
  | "post_update"
  | "post_delete"
  | "role_change"
  | "user_activated"
  | "user_deactivated"
  | "team_member_assigned"
  | "invitation_create";

export type ActivityEntityType = 
  | "file"
  | "comment"
  | "request"
  | "folder"
  | "time_entry"
  | "post"
  | "user"
  | "client"
  | "invitation";

export async function logActivity(
  actionType: ActivityActionType,
  entityType: ActivityEntityType,
  entityId?: string | null,
  entityName?: string | null,
  details?: Record<string, any>
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from("activity_logs").insert({
      user_id: user?.id || null,
      user_email: user?.email || null,
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId || null,
      entity_name: entityName || null,
      details: details || null,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

export function useActivityLogger() {
  return { logActivity };
}
