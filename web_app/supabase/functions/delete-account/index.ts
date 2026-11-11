import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405)
  }

  const authorization = req.headers.get("Authorization")
  if (!authorization?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Authentication required" }, 401)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured.")
    return jsonResponse({ error: "Account deletion is not configured." }, 500)
  }

  const accessToken = authorization.slice("Bearer ".length)
  const authClient = createClient(supabaseUrl, serviceRoleKey)
  const { data: { user }, error: authError } = await authClient.auth.getUser(accessToken)
  if (authError || !user) {
    return jsonResponse({ error: "Your session is invalid or expired. Sign in again and retry." }, 401)
  }

  try {
    const { data: ownedProjects, error: projectsError } = await authClient
      .from("projects")
      .select("id")
      .eq("created_by", user.id)
    if (projectsError) throw projectsError

    const ownedProjectIds = (ownedProjects || []).map((project) => project.id)
    let successorByProject = new Map<string, string>()
    if (ownedProjectIds.length) {
      const { data: memberships, error: membershipsError } = await authClient
        .from("project_members")
        .select("project_id, user_id")
        .in("project_id", ownedProjectIds)
        .neq("user_id", user.id)
      if (membershipsError) throw membershipsError

      successorByProject = new Map()
      for (const membership of memberships || []) {
        if (!successorByProject.has(membership.project_id)) {
          successorByProject.set(membership.project_id, membership.user_id)
        }
      }
    }

    const projectsToDelete = ownedProjectIds.filter((id) => !successorByProject.has(id))
    const { data: uploadedFiles, error: filesError } = await authClient
      .from("project_files")
      .select("storage_path")
      .eq("uploaded_by", user.id)
    if (filesError && filesError.code !== "42P01") throw filesError

    let ownedProjectFiles: { storage_path: string }[] = []
    if (projectsToDelete.length) {
      const { data, error } = await authClient
        .from("project_files")
        .select("storage_path")
        .in("project_id", projectsToDelete)
      if (error && error.code !== "42P01") throw error
      ownedProjectFiles = data || []
    }

    const storagePaths = [...new Set([
      ...(uploadedFiles || []).map((file) => file.storage_path),
      ...ownedProjectFiles.map((file) => file.storage_path),
    ])]
    if (storagePaths.length) {
      const { error } = await authClient.storage.from("project-files").remove(storagePaths)
      if (error) throw error
    }

    if (ownedProjectIds.length) {
      for (const projectId of ownedProjectIds) {
        const successorId = successorByProject.get(projectId)
        if (successorId) {
          const { error } = await authClient
            .from("projects")
            .update({ created_by: successorId })
            .eq("id", projectId)
          if (error) throw error

          const { error: successorError } = await authClient
            .from("project_members")
            .update({ role: "Product Lead" })
            .eq("project_id", projectId)
            .eq("user_id", successorId)
          if (successorError) throw successorError
        } else {
          const { error } = await authClient.from("projects").delete().eq("id", projectId)
          if (error) throw error
        }
      }
    }

    const { data: authoredTasks, error: authoredTasksError } = await authClient
      .from("tasks")
      .select("id, project_id")
      .eq("created_by", user.id)
    if (authoredTasksError) throw authoredTasksError

    for (const task of authoredTasks || []) {
      const { data: project, error } = await authClient
        .from("projects")
        .select("created_by")
        .eq("id", task.project_id)
        .maybeSingle()
      if (error) throw error
      if (!project?.created_by) {
        const { error: deleteTaskError } = await authClient
          .from("tasks")
          .delete()
          .eq("id", task.id)
        if (deleteTaskError) throw deleteTaskError
      } else if (project.created_by !== user.id) {
        const { error: taskError } = await authClient
          .from("tasks")
          .update({ created_by: project.created_by })
          .eq("id", task.id)
        if (taskError) throw taskError
      }
    }

    const { error: assignedTasksError } = await authClient
      .from("tasks")
      .update({ assigned_to: null })
      .eq("assigned_to", user.id)
    if (assignedTasksError) throw assignedTasksError

    const cleanupResults = await Promise.all([
      authClient.from("activity_log").delete().eq("user_id", user.id),
      authClient.from("project_messages").delete().eq("sender_id", user.id),
      authClient.from("project_files").delete().eq("uploaded_by", user.id),
      authClient.from("project_members").delete().eq("user_id", user.id),
      authClient.from("project_invitations").delete().eq("inviter_id", user.id),
      authClient.from("project_invitations").delete().ilike("invitee_email", user.email || ""),
    ])
    for (const result of cleanupResults) {
      if (result.error && result.error.code !== "42P01") throw result.error
    }

    const { error: deleteUserError } = await authClient.auth.admin.deleteUser(user.id)
    if (deleteUserError) throw deleteUserError

    return jsonResponse({ success: true }, 200)
  } catch (error) {
    console.error("Account deletion failed:", error)
    return jsonResponse({
      error: error instanceof Error ? error.message : "Unable to delete your account.",
    }, 500)
  }
})
