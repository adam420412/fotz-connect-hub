# Project rules
- Share the Warsaw business calendar through supabase/functions/_shared/workingDays.ts and a frontend re-export so webhook deployments and CRM use the same date rules.
- Record daily CRM contacts and follow-up changes through one authenticated database transaction so history cannot be saved without its corresponding next step.
- Keep My Day as a separate CRM page, and scope its queries to the authenticated user while preserving existing admin/manager policies.