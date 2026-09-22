import { supabase } from '../lib/supabase'

const memberColors = ['purple', 'orange', 'pink', 'teal', 'blue']
const projectTones = ['blue', 'violet', 'green']

export function getProfileName(user, profile) {
  return profile?.display_name || profile?.name || user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
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
  const name = profile?.display_name || profile?.name || profile?.email || 'Team member'
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
  // Check localStorage for githubUrl as fallback if database column doesn't exist
  const localGithubUrl = localStorage.getItem(`github_${project.id}`)
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
    githubUrl: project.github_url || localGithubUrl || null,
  }
}

export async function updateProjectGithubUrl(projectId, githubUrl) {
  try {
    const { data, error } = await supabase.from('projects').update({ github_url: githubUrl }).eq('id', projectId).select().maybeSingle()
    if (error) throw error
    if (!data) {
      console.log('Project not found in database, using localStorage fallback')
      // Store in localStorage as fallback
      localStorage.setItem(`github_${projectId}`, githubUrl)
      return { id: projectId, github_url: githubUrl }
    }
    return data
  } catch (error) {
    // If column doesn't exist or other errors, use localStorage as fallback
    console.log('Database update failed, using localStorage fallback:', error.message)
    // Store in localStorage as fallback
    localStorage.setItem(`github_${projectId}`, githubUrl)
    // Return a mock object with the githubUrl
    return { id: projectId, github_url: githubUrl }
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
  
  // Try with new fields first, fall back to basic fields if columns don't exist
  const profileWithNewFields = {
    ...profile,
    display_name: name,
  }
  
  let { data, error } = await supabase.from('profiles').upsert(profileWithNewFields).select().single()
  
  // If error is about missing columns, try without the new fields
  if (error && error.message && error.message.includes('column')) {
    console.log('New onboarding columns not yet created, using basic profile')
    const result = await supabase.from('profiles').upsert(profile).select().single()
    data = result.data
    error = result.error
  }
  
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
  console.log('=== CREATING PROJECT ===')
  console.log('User:', user.id, 'Project name:', values.name)
  
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

  console.log('Project created successfully:', project.id)

  const { error: memberError } = await supabase.from('project_members').upsert({ project_id: project.id, user_id: user.id, role: 'Product Lead' })
  if (memberError) throw memberError

  console.log('Project member added, now logging activity...')

  // Log activity
  await logActivity(user.id, project.id, 'project_created', project.name, `${project.members?.length || 1} team member`, project.id)

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  return mapProjectFromSupabase(project, [mapMember(profile, { user_id: user.id, role: 'Product Lead' }, 0)])
}

export async function createTask(user, values) {
  console.log('=== CREATING TASK ===')
  console.log('User:', user.id, 'Task title:', values.title, 'Project ID:', values.projectId)
  
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

  console.log('Task created successfully:', task.id)

  // Log activity
  await logActivity(user.id, values.projectId, 'task_created', task.title, values.project?.name || 'Project', task.id)

  return mapTaskFromSupabase(task, values.project, values.assigneeProfile)
}

export async function updateTask(taskId, changes) {
  console.log('=== UPDATING TASK ===')
  console.log('Task ID:', taskId, 'Changes:', changes)
  
  const { data, error } = await supabase.from('tasks').update(changes).eq('id', taskId).select().single()
  if (error) throw error

  console.log('Task updated successfully:', data.id, 'Status:', data.status, 'Done:', data.done)

  // Log activity if task status changed to completed
  if (changes.status === 'Completed' || changes.done === true) {
    console.log('Task marked as completed, logging activity...')
    try {
      await logActivity(
        data.assigned_to || data.created_by, 
        data.project_id, 
        'task_completed', 
        data.title, 
        'Task marked as completed',
        taskId // Use task ID to prevent duplicate completions
      )
    } catch (logError) {
      console.log('Failed to log task completion:', logError.message)
    }
  }

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
  return { 
    ...mapProjectFile({ name: file.name, created_at: file.created_at, metadata: { mimetype: file.content_type, size: file.size } }, projectId, signedFile.signedUrl, uploaderId), 
    uploaderId: file.uploaded_by || uploaderId,
    date: file.created_at ? new Date(file.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
  }
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
  return Promise.all((files || []).map(async (file) => {
    const mappedFile = await mapStoredProjectFile(file, file.project_id, uploaderId)
    return {
      ...mappedFile,
      projectName: file.projects?.name || 'Project'
    }
  }))
}

export async function listAllProjectFiles(projectIds) {
  if (!projectIds.length) return []
  
  try {
    const { data: files, error } = await supabase.from('project_files').select('*, projects(name)').in('project_id', projectIds).order('created_at', { ascending: false })
    if (error) throw error
    
    // Get all uploader IDs to fetch their profiles
    const uploaderIds = [...new Set((files || []).map(file => file.uploaded_by).filter(Boolean))]
    const { data: profiles, error: profilesError } = uploaderIds.length 
      ? await supabase.from('profiles').select('id, name, initials').in('id', uploaderIds)
      : { data: [], error: null }
    
    if (profilesError) console.log('Could not fetch uploader profiles:', profilesError.message)
    
    const profileMap = new Map((profiles || []).map(p => [p.id, p]))
    
    return Promise.all((files || []).map(async (file) => {
      const mappedFile = await mapStoredProjectFile(file, file.project_id, file.uploaded_by)
      const uploaderProfile = profileMap.get(file.uploaded_by)
      
      return {
        ...mappedFile,
        projectName: file.projects?.name || 'Project',
        uploaderName: uploaderProfile?.name || 'Team member',
        uploaderInitials: uploaderProfile?.initials || 'T'
      }
    }))
  } catch (error) {
    console.log('Error loading all project files:', error.message)
    return []
  }
}

export async function uploadProjectFile(projectId, uploaderId, file) {
  console.log('=== UPLOADING FILE ===')
  console.log('Project ID:', projectId, 'Uploader:', uploaderId, 'File:', file.name)
  
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

  console.log('File uploaded successfully:', data.id)

  // Log activity
  await logActivity(uploaderId, projectId, 'file_uploaded', file.name, 'File uploaded to project', data.id)

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

  // Get the user profile to log activity
  try {
    const { data: profile } = await supabase.from('profiles').select('name').eq('id', userId).maybeSingle()
    if (profile) {
      await logActivity(userId, projectId, 'member_added', profile.name, `Added as ${role}`, userId)
    }
  } catch (logError) {
    console.log('Failed to log member addition:', logError.message)
  }
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

export async function checkOnboardingCompleted(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .maybeSingle()
    if (error) throw error
    return data?.onboarding_completed || false
  } catch (error) {
    // If column doesn't exist yet, assume onboarding is not needed
    if (error.message && error.message.includes('column')) {
      console.log('onboarding_completed column not yet created, skipping onboarding check')
      return true // Skip onboarding until migration is run
    }
    throw error
  }
}

export async function saveOnboardingData(userId, onboardingData) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        display_name: onboardingData.displayName,
        role: onboardingData.role,
        year: onboardingData.year,
        focus_area: onboardingData.focusArea,
        onboarding_completed: true,
      })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  } catch (error) {
    // If columns don't exist yet, try updating just the name field
    if (error.message && error.message.includes('column')) {
      console.log('Some onboarding columns not yet created, updating basic profile')
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          name: onboardingData.displayName,
        })
        .eq('id', userId)
        .select()
        .single()
      if (updateError) throw updateError
      return data
    }
    throw error
  }
}

// Activity logging functions
export async function logActivity(userId, projectId, actionType, subject, context, subjectId = null) {
  try {
    console.log('=== LOGGING ACTIVITY ===')
    console.log('Details:', { userId, projectId, actionType, subject, context, subjectId })
    
    // Try to insert with subject_id first
    let insertData = {
      user_id: userId,
      project_id: projectId,
      action_type: actionType,
      subject: subject,
      context: context,
    }
    
    // Only add subject_id if it's provided
    if (subjectId) {
      insertData.subject_id = subjectId
    }
    
    const { error } = await supabase.from('activity_log').insert(insertData)
    
    if (error) {
      console.error('Activity logging ERROR:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      
      // If it's a column doesn't exist error, try without subject_id
      if (error.message && error.message.includes('column') && error.message.includes('subject_id')) {
        console.log('subject_id column doesn\'t exist, trying without it...')
        const { error: retryError } = await supabase.from('activity_log').insert({
          user_id: userId,
          project_id: projectId,
          action_type: actionType,
          subject: subject,
          context: context,
        })
        
        if (retryError) {
          console.error('Retry also failed:', retryError)
          throw retryError
        }
        
        console.log('✅ Activity logged successfully (without subject_id)')
        return
      }
      
      // If it's a duplicate key error, just log it and don't throw
      if (error.code === '23505') {
        console.log('Activity already logged (duplicate), skipping')
        return
      }
      throw error
    }
    
    console.log('✅ Activity logged successfully')
  } catch (error) {
    console.error('❌ Failed to log activity:', error.message)
    console.error('Full error:', error)
    // Don't throw - activity logging shouldn't break the main flow
  }
}

export async function loadActivities(projectIds) {
  try {
    console.log('=== LOADING ACTIVITIES ===')
    console.log('Project IDs:', projectIds)
    
    if (!projectIds || projectIds.length === 0) {
      console.log('❌ No project IDs provided, returning empty activities')
      return []
    }
    
    console.log('Querying activity_log table...')
    
    // First, check if the table exists by trying a simple query
    const { data: tableCheck, error: tableError } = await supabase
      .from('activity_log')
      .select('id')
      .limit(1)
    
    if (tableError) {
      console.error('❌ activity_log table might not exist:', tableError)
      console.error('Error code:', tableError.code)
      console.error('Error message:', tableError.message)
      console.error('⚠️ PLEASE RUN THE SQL SCRIPT: supabase_activity_log.sql')
      return []
    }
    
    console.log('✅ activity_log table exists, proceeding with full query...')
    
    const { data: activities, error } = await supabase
      .from('activity_log')
      .select('*, profiles(name, initials), projects(name)')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error) {
      console.error('❌ Error loading activities:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      // Don't throw, just return empty array
      return []
    }
    
    console.log('✅ Raw activities loaded:', activities?.length || 0, 'items')
    if (activities?.length > 0) {
      console.log('Sample activity:', activities[0])
    }
    
    // Remove duplicates based on user_id, action_type, and subject_id
    const uniqueActivities = []
    const seen = new Set()
    
    for (const activity of (activities || [])) {
      const key = `${activity.user_id}-${activity.action_type}-${activity.subject_id || activity.subject}`
      if (!seen.has(key)) {
        seen.add(key)
        uniqueActivities.push(activity)
      }
    }
    
    console.log('✅ After deduplication:', uniqueActivities.length, 'unique activities')
    
    const mappedActivities = uniqueActivities.map((activity) => ({
      id: activity.id,
      avatar: activity.profiles?.initials || 'U',
      color: 'blue',
      text: getActivityText(activity.action_type),
      subject: activity.subject,
      context: `${activity.projects?.name || 'Workspace'} · ${formatTimeAgo(activity.created_at)}`,
      createdAt: activity.created_at,
    }))
    
    console.log('✅ Final mapped activities:', mappedActivities.length, 'items')
    if (mappedActivities.length > 0) {
      console.log('Sample mapped activity:', mappedActivities[0])
    }
    
    return mappedActivities
  } catch (error) {
    console.error('❌ Failed to load activities:', error.message)
    console.error('Full error:', error)
    return []
  }
}

function getActivityText(actionType) {
  const actionTexts = {
    'task_completed': 'completed task',
    'task_created': 'created task',
    'task_updated': 'updated task',
    'project_created': 'created project',
    'project_updated': 'updated project',
    'file_uploaded': 'uploaded file',
    'meeting_scheduled': 'scheduled meeting',
    'member_added': 'added team member',
    'status_changed': 'changed status',
  }
  return actionTexts[actionType] || 'performed action'
}

function formatTimeAgo(dateString) {
  if (!dateString) return 'just now'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// Simple test function to manually insert an activity (for debugging)
export async function insertTestActivity(userId, projectId, actionType, subject) {
  try {
    console.log('=== MANUAL TEST ACTIVITY INSERT ===')
    console.log('Inserting:', { userId, projectId, actionType, subject })
    
    // Try with subject_id first
    let insertData = {
      user_id: userId,
      project_id: projectId,
      action_type: actionType,
      subject: subject,
      context: 'Manual test activity',
    }
    
    const { data, error } = await supabase.from('activity_log').insert(insertData).select().single()
    
    if (error) {
      console.error('❌ Manual insert failed:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      
      // If it's a column error, try without any optional fields
      if (error.message && error.message.includes('column')) {
        console.log('Column error, trying with minimal fields...')
        const { data: retryData, error: retryError } = await supabase.from('activity_log').insert({
          user_id: userId,
          project_id: projectId,
          action_type: actionType,
          subject: subject,
        }).select().single()
        
        if (retryError) {
          console.error('Retry also failed:', retryError)
          throw retryError
        }
        
        console.log('✅ Manual insert successful (minimal):', retryData)
        return retryData
      }
      
      throw error
    }
    
    console.log('✅ Manual insert successful:', data)
    return data
  } catch (error) {
    console.error('❌ Manual test activity failed:', error)
    throw error
  }
}
