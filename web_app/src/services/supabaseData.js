import { supabase } from '../lib/supabase'

const memberColors = ['purple', 'orange', 'pink', 'teal', 'blue']
const projectTones = ['blue', 'violet', 'green']

export function getProfileName(user, profile) {
  return profile?.name || user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
}

export function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || 'U'
}

export function formatDate(date) {
  if (!date) return ''
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${date}T00:00:00`))
}

function mapMember(profile, membership, index) {
  const name = profile?.name || profile?.email || 'Team member'
  return {
    id: profile?.id || membership.user_id,
    name,
    role: membership?.role || profile?.role || 'Member',
    avatar: profile?.initials || getInitials(name),
    color: memberColors[index % memberColors.length],
  }
}

export function mapProjectFromSupabase(project, members = []) {
  const tone = projectTones[Math.abs(String(project.id).charCodeAt(0)) % projectTones.length]
  return {
    id: project.id,
    name: project.name,
    type: 'Web app',
    description: project.description || 'Collaborative team project workspace.',
    progress: Number(project.progress || 0),
    due: formatDate(project.deadline),
    dueDate: project.deadline || '',
    status: project.status || 'Active',
    tone,
    members,
  }
}

export function mapTaskFromSupabase(task, project, assigneeProfile) {
  const assignee = assigneeProfile?.name || assigneeProfile?.email || 'Unassigned'
  const status = task.status || 'Todo'
  return {
    id: task.id,
    assigneeId: task.assigned_to || assigneeProfile?.id || null,
    title: task.title,
    projectId: task.project_id,
    project: project?.name || 'Unknown project',
    time: formatDate(task.deadline),
    dueDate: task.deadline || '',
    priority: task.priority || 'Medium',
    assignee,
    assigneeAvatar: assigneeProfile?.initials || getInitials(assignee),
    done: status === 'Completed',
    status,
    comments: [],
  }
}

export async function ensureProfile(user, nameOverride) {
  if (!user) return null
  const name = nameOverride || getProfileName(user)
  const profile = {
    id: user.id,
    name,
    email: user.email || '',
    role: 'Student',
    initials: getInitials(name),
  }
  const { data, error } = await supabase.from('profiles').upsert(profile).select().single()
  if (error) throw error
  return data
}

export async function loadWorkspace(user) {
  if (!user) return { profile: null, projects: [], tasks: [], invitations: [] }

  const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (profileError) throw profileError
  const currentProfile = profile || await ensureProfile(user)

  const [{ data: ownedProjects, error: ownedError }, { data: memberships, error: membershipsError }] = await Promise.all([
    supabase.from('projects').select('*').eq('created_by', user.id),
    supabase.from('project_members').select('*').eq('user_id', user.id),
  ])
  if (ownedError) throw ownedError
  if (membershipsError) throw membershipsError

  let invitations = []
  try {
    const { data: invData } = await supabase
      .from('project_invitations')
      .select('*, projects(*)')
      .ilike('invitee_email', user.email)
      .eq('status', 'pending')
    invitations = invData || []
  } catch (invError) {
    console.log('Invitations table may not exist yet:', invError.message)
    invitations = []
  }

  const projectIds = [...new Set([...(ownedProjects || []).map((project) => project.id), ...(memberships || []).map((membership) => membership.project_id)])]
  if (!projectIds.length) return { profile: currentProfile, projects: [], tasks: [], invitations: invitations || [] }

  const [{ data: projects, error: projectsError }, { data: allMemberships, error: allMembershipsError }, { data: allTasks, error: tasksError }] = await Promise.all([
    supabase.from('projects').select('*').in('id', projectIds),
    supabase.from('project_members').select('*').in('project_id', projectIds),
    supabase.from('tasks').select('*').in('project_id', projectIds),
  ])
  if (projectsError) throw projectsError
  if (allMembershipsError) throw allMembershipsError
  if (tasksError) throw tasksError

  const userIds = [...new Set((allMemberships || []).map((membership) => membership.user_id).concat((allTasks || []).map((task) => task.assigned_to).filter(Boolean)))]
  const { data: profiles, error: profilesError } = userIds.length
    ? await supabase.from('profiles').select('*').in('id', userIds)
    : { data: [], error: null }
  if (profilesError) throw profilesError

  const profileMap = new Map((profiles || []).map((item) => [item.id, item]))
  const projectMap = new Map((projects || []).map((project) => [project.id, project]))
  const mappedProjects = (projects || []).map((project) => mapProjectFromSupabase(
    project,
    (allMemberships || [])
      .filter((membership) => membership.project_id === project.id)
      .map((membership, index) => mapMember(profileMap.get(membership.user_id), membership, index)),
  ))
  const mappedTasks = (allTasks || []).map((task) => mapTaskFromSupabase(task, projectMap.get(task.project_id), profileMap.get(task.assigned_to)))

  return { profile: currentProfile, projects: mappedProjects, tasks: mappedTasks, invitations: invitations || [] }
}

export async function createProject(user, values) {
  await ensureProfile(user)

  const { data: project, error } = await supabase.from('projects').insert({
    name: values.name,
    description: values.description,
    deadline: values.deadline,
    status: 'Active',
    progress: 0,
    created_by: user.id,
  }).select().single()
  if (error) throw error

  const { error: memberError } = await supabase.from('project_members').upsert({ project_id: project.id, user_id: user.id, role: 'Product Lead' })
  if (memberError) throw memberError

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  return mapProjectFromSupabase(project, [mapMember(profile, { user_id: user.id, role: 'Product Lead' }, 0)])
}

export async function createTask(user, values) {
  const { data: task, error } = await supabase.from('tasks').insert({
    project_id: values.projectId,
    title: values.title,
    description: values.description || '',
    assigned_to: values.assignedTo || null,
    created_by: user.id,
    priority: values.priority,
    status: 'Todo',
    deadline: values.deadline,
  }).select().single()
  if (error) throw error
  return mapTaskFromSupabase(task, values.project, values.assigneeProfile)
}

export async function updateTask(taskId, changes) {
  const { data, error } = await supabase.from('tasks').update(changes).eq('id', taskId).select().single()
  if (error) throw error
  return data
}

function fileCategory(fileName, contentType = '') {
  if (contentType.startsWith('image/')) return 'Images'
  const extension = fileName.split('.').pop()?.toLowerCase()
  if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension)) return 'Documents'
  if (['ppt', 'pptx'].includes(extension)) return 'Presentations'
  if (['xls', 'xlsx', 'csv'].includes(extension)) return 'Reports'
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'json', 'css', 'html'].includes(extension)) return 'Code'
  return 'Other'
}

function mapProjectFile(file, projectId, signedUrl, uploaderId) {
  return {
    id: `${projectId}/${file.name}`,
    name: file.name.split('/').pop(),
    type: file.metadata?.mimetype?.split('/').pop()?.toUpperCase() || 'FILE',
    category: fileCategory(file.name, file.metadata?.mimetype),
    size: file.metadata?.size ? `${Math.max(1, Math.round(file.metadata.size / 1024))} KB` : '',
    uploadedBy: uploaderId ? 'You' : 'Project team',
    date: file.created_at ? new Date(file.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
    icon: file.metadata?.mimetype?.startsWith('image/') ? '▧' : '▤',
    url: signedUrl,
  }
}

async function mapStoredProjectFile(file, projectId, uploaderId) {
  const { data: signedFile, error: signedUrlError } = await supabase.storage.from('project-files').createSignedUrl(file.storage_path, 3600)
  if (signedUrlError) throw signedUrlError
  return { ...mapProjectFile({ name: file.name, created_at: file.created_at, metadata: { mimetype: file.content_type, size: file.size } }, projectId, signedFile.signedUrl, uploaderId), uploaderId: file.uploaded_by || uploaderId }
}

export async function listProjectFiles(projectId, uploaderId) {
  let query = supabase.from('project_files').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
  if (uploaderId) query = query.eq('uploaded_by', uploaderId)
  const { data: files, error } = await query
  if (error) throw error
  return Promise.all((files || []).map((file) => mapStoredProjectFile(file, projectId, uploaderId)))
}

export async function listMyProjectFiles(projectIds, uploaderId) {
  if (!projectIds.length || !uploaderId) return []
  const { data: files, error } = await supabase.from('project_files').select('*, projects(name)').in('project_id', projectIds).eq('uploaded_by', uploaderId).order('created_at', { ascending: false })
  if (error) throw error
  return Promise.all((files || []).map(async (file) => ({ ...(await mapStoredProjectFile(file, file.project_id, uploaderId)), projectName: file.projects?.name || 'Project' })))
}

export async function uploadProjectFile(projectId, uploaderId, file) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${projectId}/${crypto.randomUUID()}-${safeName}`
  const { error: uploadError } = await supabase.storage.from('project-files').upload(path, file, { upsert: false })
  if (uploadError) throw uploadError

  const { data, error } = await supabase.from('project_files').insert({
    project_id: projectId,
    storage_path: path,
    name: file.name,
    content_type: file.type || 'application/octet-stream',
    size: file.size,
    uploaded_by: uploaderId,
  }).select().single()
  if (error) throw error
  return mapStoredProjectFile(data, projectId, uploaderId)
}

/* Legacy storage listing retained for compatibility with existing callers. */
export async function listProjectStorageFiles(projectId) {
  const { data: files, error } = await supabase.storage.from('project-files').list(projectId, {
    limit: 100,
    sortBy: { column: 'created_at', order: 'desc' },
  })
  if (error) throw error

  return Promise.all((files || []).filter((file) => file.name).map(async (file) => {
    const path = `${projectId}/${file.name}`
    const { data: signedFile, error: signedUrlError } = await supabase.storage.from('project-files').createSignedUrl(path, 3600)
    if (signedUrlError) throw signedUrlError
    return mapProjectFile(file, projectId, signedFile.signedUrl)
  }))
}

export async function uploadProjectStorageFile(projectId, file) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${projectId}/${crypto.randomUUID()}-${safeName}`
  const { data, error } = await supabase.storage.from('project-files').upload(path, file, { upsert: false })
  if (error) throw error

  const { data: signedFile, error: signedUrlError } = await supabase.storage.from('project-files').createSignedUrl(data.path, 3600)
  if (signedUrlError) throw signedUrlError
  return mapProjectFile({ ...file, name: data.path, created_at: new Date().toISOString(), metadata: { mimetype: file.type, size: file.size } }, projectId, signedFile.signedUrl)
}

export async function loadProjectMessages(projectId) {
  const { data: messages, error } = await supabase
    .from('project_messages')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
  if (error) throw error

  const senderIds = [...new Set((messages || []).map((message) => message.sender_id))]
  const { data: profiles, error: profilesError } = senderIds.length
    ? await supabase.from('profiles').select('id, name, initials').in('id', senderIds)
    : { data: [], error: null }
  if (profilesError) throw profilesError

  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]))
  return (messages || []).map((message) => {
    const sender = profileMap.get(message.sender_id)
    return {
      id: message.id,
      senderId: message.sender_id,
      author: sender?.name || 'Team member',
      avatar: sender?.initials || getInitials(sender?.name || 'Team member'),
      color: 'blue',
      time: new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      text: message.body,
    }
  })
}

export async function createProjectMessage(projectId, senderId, body) {
  const { data, error } = await supabase
    .from('project_messages')
    .insert({ project_id: projectId, sender_id: senderId, body })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function addProjectMember(projectId, userId, role) {
  const { error } = await supabase.from('project_members').insert({ project_id: projectId, user_id: userId, role })
  if (error) throw error
}

export async function findProfileByEmail(email) {
  const { data, error } = await supabase.from('profiles').select('*').ilike('email', email.trim()).maybeSingle()
  if (error) throw error
  return data
}

export async function createProjectInvitation(projectId, inviterId, inviteeEmail, role) {
  const { data, error } = await supabase.from('project_invitations').insert({
    project_id: projectId,
    inviter_id: inviterId,
    invitee_email: inviteeEmail.trim(),
    role: role || 'Member',
    status: 'pending',
  }).select().single()
  if (error) throw error
  return data
}

export async function getProjectInvitations(projectId) {
  const { data, error } = await supabase
    .from('project_invitations')
    .select('*')
    .eq('project_id', projectId)
    .in('status', ['pending'])
  if (error) throw error
  return data
}

export async function getInvitationsForUser(email) {
  const { data, error } = await supabase
    .from('project_invitations')
    .select('*, projects(*), profiles!project_invitations_inviter_id_fkey(name, email)')
    .ilike('invitee_email', email.trim())
    .eq('status', 'pending')
  if (error) throw error
  return data
}

export async function acceptProjectInvitation(invitationId, userId) {
  const { data: invitation, error: fetchError } = await supabase
    .from('project_invitations')
    .select('*')
    .eq('id', invitationId)
    .single()
  if (fetchError) throw fetchError

  if (invitation.status !== 'pending') {
    throw new Error('Invitation is not pending')
  }

  if (new Date(invitation.expires_at) < new Date()) {
    await supabase.from('project_invitations').update({ status: 'expired' }).eq('id', invitationId)
    throw new Error('Invitation has expired')
  }

  const { error: memberError } = await supabase.from('project_members').insert({
    project_id: invitation.project_id,
    user_id: userId,
    role: invitation.role,
  })
  if (memberError) throw memberError

  const { error: updateError } = await supabase
    .from('project_invitations')
    .update({ status: 'accepted' })
    .eq('id', invitationId)
  if (updateError) throw updateError

  return invitation
}

export async function declineProjectInvitation(invitationId) {
  const { error } = await supabase
    .from('project_invitations')
    .update({ status: 'declined' })
    .eq('id', invitationId)
  if (error) throw error
}

export async function checkExistingMembership(projectId, userId) {
  const { data, error } = await supabase
    .from('project_members')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function checkPendingInvitation(projectId, email) {
  const { data, error } = await supabase
    .from('project_invitations')
    .select('*')
    .eq('project_id', projectId)
    .ilike('invitee_email', email.trim())
    .eq('status', 'pending')
    .maybeSingle()
  if (error) throw error
  return data
}
