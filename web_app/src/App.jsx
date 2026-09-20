import { useEffect, useState } from 'react'
import './App.css'
import { supabase } from './lib/supabase'
import {
  acceptProjectInvitation,
  addProjectMember,
  checkExistingMembership,
  checkPendingInvitation,
  createProjectMessage,
  createProject,
  createProjectInvitation,
  createTask,
  declineProjectInvitation,
  findProfileByEmail,
  getInitials,
  getProfileName,
  getProjectInvitations,
  listMyProjectFiles,
  listProjectFiles,
  loadProjectMessages,
  loadWorkspace,
  uploadProjectFile,
  updateTask as updateTaskRecord,
} from './services/supabaseData'

const navItems = [['⌂', 'Home'], ['◈', 'Projects'], ['✓', 'Tasks'], ['◫', 'Meetings'], ['◌', 'Activity']]

const defaultMembers = [
  { id: 'm1', name: 'Shruti Mehta', role: 'Product Lead', avatar: 'S', color: 'purple' },
  { id: 'm2', name: 'Rahul Sharma', role: 'Frontend Dev', avatar: 'R', color: 'orange' },
  { id: 'm3', name: 'Priya Verma', role: 'UI/UX Lead', avatar: 'P', color: 'pink' },
  { id: 'm4', name: 'Aryan Kapoor', role: 'AI Researcher', avatar: 'A', color: 'teal' },
]

const _initialProjects = [
  { 
    id: '1', 
    name: 'Smart Agriculture', 
    type: 'AI / ML', 
    description: 'Smart IoT campus infrastructure monitoring and AI crop health prediction platform.',
    progress: 68, 
    due: '28 Sep 2026', 
    dueDate: '2026-09-28',
    tone: 'blue', 
    members: [
      { name: 'Shruti Mehta', role: 'Product Lead', avatar: 'S', color: 'purple' },
      { name: 'Rahul Sharma', role: 'Frontend Dev', avatar: 'R', color: 'orange' },
      { name: 'Aryan Kapoor', role: 'AI Researcher', avatar: 'A', color: 'teal' },
    ] 
  },
  { 
    id: '2', 
    name: 'Expense Tracker', 
    type: 'Web app', 
    description: 'Budget management app for student shared expenses, reports, and bill splitting.',
    progress: 42, 
    due: '22 Sep 2026', 
    dueDate: '2026-09-22',
    tone: 'violet', 
    members: [
      { name: 'Shruti Mehta', role: 'Product Lead', avatar: 'S', color: 'purple' },
      { name: 'Rahul Sharma', role: 'Frontend Dev', avatar: 'R', color: 'orange' }
    ] 
  },
  { 
    id: '3', 
    name: 'Cybersecurity Lab', 
    type: 'Research', 
    description: 'Security assessment, threat vulnerability scanning, and team penetration testing dashboard.',
    progress: 84, 
    due: '30 Sep 2026', 
    dueDate: '2026-09-30',
    tone: 'green', 
    members: [
      { name: 'Priya Verma', role: 'Security Analyst', avatar: 'P', color: 'pink' },
      { name: 'Aryan Kapoor', role: 'Research Lead', avatar: 'A', color: 'teal' }
    ] 
  },
]

const _initialTasks = [
  { 
    id: 't1', 
    title: 'Complete DBMS documentation', 
    projectId: '2',
    project: 'Expense Tracker', 
    time: 'Today, 6:00 PM', 
    dueDate: '2026-09-10',
    priority: 'High', 
    assignee: 'Shruti Mehta', 
    assigneeAvatar: 'S',
    done: false,
    comments: [
      { id: 'c1', author: 'Rahul Sharma', avatar: 'R', color: 'orange', time: '2 hours ago', text: 'Please check section 3 ER diagrams and include the relational schema.' }
    ]
  },
  { 
    id: 't2', 
    title: 'Push authentication module', 
    projectId: '1',
    project: 'Smart Agriculture', 
    time: 'Today, 8:30 PM', 
    dueDate: '2026-09-10',
    priority: 'High', 
    assignee: 'Rahul Sharma', 
    assigneeAvatar: 'R',
    done: false,
    comments: [
      { id: 'c2', author: 'Shruti Mehta', avatar: 'S', color: 'purple', time: '1 hour ago', text: 'JWT refresh token logic is tested and working properly.' }
    ]
  },
  { 
    id: 't3', 
    title: 'Review UI with team', 
    projectId: '3',
    project: 'Cybersecurity Lab', 
    time: 'Tomorrow, 5:00 PM', 
    dueDate: '2026-09-11',
    priority: 'Medium', 
    assignee: 'Priya Verma', 
    assigneeAvatar: 'P',
    done: false,
    comments: []
  },
  { 
    id: 't4', 
    title: 'Prepare project presentation', 
    projectId: '1',
    project: 'Smart Agriculture', 
    time: 'Completed', 
    dueDate: '2026-09-08',
    priority: 'Low', 
    assignee: 'Shruti Mehta', 
    assigneeAvatar: 'S',
    done: true,
    comments: []
  },
]

const _initialMeetings = [
  {
    id: 'm1',
    title: 'Sprint Sync & Architecture Review',
    project: 'Smart Agriculture',
    host: 'Shruti Mehta (Product Lead)',
    hostAvatar: 'S',
    time: 'Today, 4:00 PM - 4:45 PM',
    dateLabel: 'Today',
    link: 'https://meet.google.com/abc-defg-hij',
    platform: 'Google Meet',
    status: 'Live Soon'
  },
  {
    id: 'm2',
    title: 'Database Schema & Relational Model Sync',
    project: 'Expense Tracker',
    host: 'Rahul Sharma',
    hostAvatar: 'R',
    time: 'Tomorrow, 6:00 PM - 6:30 PM',
    dateLabel: 'Tomorrow',
    link: 'https://meet.google.com/xyz-9876-mno',
    platform: 'Google Meet',
    status: 'Upcoming'
  }
]

function calculateDaysLeft(dueDateStr) {
  if (!dueDateStr) return 'N/A'
  const target = new Date(dueDateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffTime = target - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  if (isNaN(diffDays)) return '14 days left'
  if (diffDays < 0) return 'Overdue'
  if (diffDays === 0) return 'Due today'
  return `${diffDays} days left`
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '30 Sep 2026'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function formatTimeDisplay(timeStr) {
  if (!timeStr) return '6:00 PM'
  const [hours, minutes] = timeStr.split(':')
  if (!hours) return timeStr
  let h = parseInt(hours, 10)
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${minutes || '00'} ${ampm}`
}

function getAiReply(question, projects, tasks, meetings) {
  const normalizedQuestion = question.toLowerCase()
  const openTasks = tasks.filter((task) => !task.done)
  const nextTask = openTasks[0]

  if (normalizedQuestion.includes('next') || normalizedQuestion.includes('work on')) {
    return nextTask
      ? `Your next open task is “${nextTask.title}” for ${nextTask.project}, assigned to ${nextTask.assignee}. It is ${nextTask.priority.toLowerCase()} priority and due ${nextTask.time.toLowerCase()}.`
      : 'You have no open tasks right now. Nice work.'
  }

  if (normalizedQuestion.includes('block') || normalizedQuestion.includes('progress')) {
    const overdueTasks = openTasks.filter((task) => task.time === 'Overdue')
    return overdueTasks.length
      ? `${overdueTasks.length} open task${overdueTasks.length === 1 ? '' : 's'} ${overdueTasks.length === 1 ? 'is' : 'are'} overdue. Start with ${overdueTasks[0].title}.`
      : `I found no overdue tasks. The main focus is ${nextTask ? `${nextTask.title} in ${nextTask.project}` : 'keeping the completed work moving'}; ${meetings.length} meeting${meetings.length === 1 ? '' : 's'} ${meetings.length === 1 ? 'is' : 'are'} scheduled.`
  }

  if (normalizedQuestion.includes('summar')) {
    const completedTasks = tasks.filter((task) => task.done).length
    return `You have ${projects.length} active projects, ${openTasks.length} open tasks, and ${completedTasks} completed task${completedTasks === 1 ? '' : 's'}. ${meetings.length} upcoming meeting${meetings.length === 1 ? '' : 's'} ${meetings.length === 1 ? 'is' : 'are'} on the calendar.`
  }

  return `I can help with your ${projects.length} projects, ${tasks.length} tasks, and ${meetings.length} meetings. Try asking what you should work on next, what is blocking progress, or for a project summary.`
}

const workspaceFiles = [
  { id: 'f1', name: 'SRS Document v2.pdf', type: 'PDF', category: 'Documents', size: '2.4 MB', uploadedBy: 'Shruti Mehta', date: '6 Sep 2026', icon: '▤' },
  { id: 'f2', name: 'Final Review.pptx', type: 'PPTX', category: 'Presentations', size: '8.1 MB', uploadedBy: 'Rahul Sharma', date: '5 Sep 2026', icon: '▥' },
  { id: 'f3', name: 'model_train.py', type: 'PY', category: 'Code', size: '12 KB', uploadedBy: 'Aryan Kapoor', date: '3 Sep 2026', icon: '</>' },
  { id: 'f4', name: 'field_sensor.jpg', type: 'JPG', category: 'Images', size: '1.2 MB', uploadedBy: 'Priya Verma', date: '3 Sep 2026', icon: '▧' },
  { id: 'f5', name: 'Sprint report.pdf', type: 'PDF', category: 'Reports', size: '640 KB', uploadedBy: 'Shruti Mehta', date: '1 Sep 2026', icon: '▤' },
]

function ProjectWorkspace({ project, tasks, meetings, currentUser, isAuthenticated, onClose, onCreateTask, onScheduleMeeting, onAddMember, onToggleTask, onUpdateTask, onOpenTask }) {
  const [activeTab, setActiveTab] = useState('Overview')
  const [fileFilter, setFileFilter] = useState('All')
  const [messages, setMessages] = useState([])
  const [messageDraft, setMessageDraft] = useState('')
  const [onlineMemberIds, setOnlineMemberIds] = useState(new Set())
  const [chatError, setChatError] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [projectFiles, setProjectFiles] = useState([])
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const projectTasks = tasks.filter((task) => task.projectId === project.id || task.project === project.name)
  const projectMeetings = meetings.filter((meeting) => meeting.project === project.name)
  const completedTasks = projectTasks.filter((task) => task.done).length
  const files = isAuthenticated
    ? (fileFilter === 'All' ? projectFiles : projectFiles.filter((file) => file.category === fileFilter))
    : (fileFilter === 'All' ? workspaceFiles : workspaceFiles.filter((file) => file.category === fileFilter))
  const categories = ['All', 'Documents', 'Presentations', 'Code', 'Images', 'Reports']

  useEffect(() => {
    if (!isAuthenticated || !project.id) return undefined
    let isMounted = true
    listProjectFiles(project.id)
      .then((nextFiles) => isMounted && setProjectFiles(nextFiles))
      .catch(() => isMounted && setProjectFiles([]))
    return () => { isMounted = false }
  }, [isAuthenticated, project.id])

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !currentUser?.id || isUploadingFile) return

    setIsUploadingFile(true)
    try {
      const uploadedFile = await uploadProjectFile(project.id, currentUser.id, file)
      setProjectFiles((current) => [uploadedFile, ...current])
      setChatError('')
    } catch (error) {
      const message = error?.code === '42501'
        ? 'You do not have permission to upload files to this project. Run supabase_project_files.sql and confirm you are a project member.'
        : error?.code === '42P01'
          ? 'The project_files table is missing. Run supabase_project_files.sql in Supabase.'
          : error?.message || 'Unable to upload this file.'
      setChatError(message)
    } finally {
      setIsUploadingFile(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !project.id || !currentUser?.id) return undefined

    let isMounted = true
    const channel = supabase.channel(`project-chat:${project.id}`, {
      config: { presence: { key: currentUser.id } },
    })

    const refreshMessages = async () => {
      try {
        const nextMessages = await loadProjectMessages(project.id)
        if (isMounted) {
          setMessages(nextMessages)
          setChatError('')
        }
      } catch (error) {
        if (isMounted) setChatError(error.message || 'Chat is unavailable until the chat table is enabled.')
      }
    }

    const updatePresence = () => {
      const state = channel.presenceState()
      setOnlineMemberIds(new Set(Object.keys(state)))
    }

    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'project_messages', filter: `project_id=eq.${project.id}` }, refreshMessages)
      .on('presence', { event: 'sync' }, updatePresence)
      .on('presence', { event: 'join' }, updatePresence)
      .on('presence', { event: 'leave' }, updatePresence)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: currentUser.id, name: currentUser.name })
          updatePresence()
        }
      })

    refreshMessages()
    return () => {
      isMounted = false
      supabase.removeChannel(channel)
      setOnlineMemberIds(new Set())
    }
  }, [currentUser, isAuthenticated, project.id])

  const sendMessage = async (event) => {
    event.preventDefault()
    const body = messageDraft.trim()
    if (!body || !currentUser?.id || isSendingMessage) return

    setIsSendingMessage(true)
    try {
      const savedMessage = await createProjectMessage(project.id, currentUser.id, body)
      setMessages((current) => [...current, {
        id: savedMessage.id,
        senderId: currentUser.id,
        author: currentUser.name,
        avatar: currentUser.avatar,
        color: currentUser.color,
        time: new Date(savedMessage.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        text: savedMessage.body,
      }])
      setMessageDraft('')
      setChatError('')
    } catch (error) {
      setChatError(error.message || 'Unable to send message.')
    } finally {
      setIsSendingMessage(false)
    }
  }

  const isMemberOnline = (member) => member.id === currentUser?.id || onlineMemberIds.has(member.id)

  const updateTask = (taskId, field, value) => onUpdateTask(taskId, { [field]: value, ...(field === 'status' ? { done: value === 'Completed' } : {}) })

  const taskRow = (task) => (
    <div className={task.done ? 'workspace-task done' : 'workspace-task'} key={task.id}>
      <button className="task-check" onClick={() => onToggleTask(task.id)}>{task.done ? '✓' : ''}</button>
      <button className="workspace-task-title" onClick={() => onOpenTask(task)}>{task.title}<small>{task.estimatedHours ? `${task.estimatedHours}h estimated` : 'Effort not set'}</small></button>
      <select value={task.priority} onChange={(event) => updateTask(task.id, 'priority', event.target.value)} aria-label={`Priority for ${task.title}`}><option>High</option><option>Medium</option><option>Low</option></select>
      <select value={task.assignee} onChange={(event) => {
        const member = project.members.find((item) => item.name === event.target.value)
        onUpdateTask(task.id, {
          assignee: event.target.value,
          assigneeId: member?.id,
          assigneeAvatar: member?.avatar,
        })
      }} aria-label={`Assignee for ${task.title}`}>{project.members.map((member) => <option key={member.name}>{member.name}</option>)}</select>
      <span className="workspace-task-due">{task.time || formatDateDisplay(task.dueDate)}</span>
      <select value={task.done ? 'Completed' : (task.status || 'To Do')} onChange={(event) => updateTask(task.id, 'status', event.target.value)} aria-label={`Status for ${task.title}`}><option>To Do</option><option>In Progress</option><option>Completed</option></select>
    </div>
  )

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="workspace-sheet workspace-v2" onClick={(event) => event.stopPropagation()}>
        <div className="workspace-header"><div className="workspace-title-row"><button className="back-projects" onClick={onClose}>← Back to Projects</button><span className="section-kicker">{project.type} PROJECT</span><h2>{project.name}</h2><p>{project.description}</p></div><div className="workspace-header-meta"><span className="status-badge">{project.progress < 50 ? 'At Risk' : 'On Track'}</span><strong>{project.progress}%</strong><small>Target · {project.due}</small></div></div>
        <div className="workspace-tabs" role="tablist">{['Overview', 'Tasks', 'Chat', 'Files', 'Meetings'].map((tab) => <button key={tab} role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>

        {activeTab === 'Overview' && <><div className="workspace-stats"><div className="w-stat-card"><label>PROGRESS</label><strong>{project.progress}%</strong><div className="progress-track"><span style={{ width: `${project.progress}%` }} /></div></div><div className="w-stat-card"><label>TOTAL TASKS</label><strong>{projectTasks.length}</strong><span>{completedTasks} completed</span></div><div className="w-stat-card"><label>TEAM MEMBERS</label><strong>{project.members.length}</strong><span>{project.members.filter(isMemberOnline).length} online now</span></div></div><div className="workspace-section"><div className="workspace-section-heading"><div><span className="section-kicker">PROJECT TEAM MEMBERS</span><h3>Everyone on this project</h3></div><button className="add-member-btn" onClick={onAddMember}>+ Add Member</button></div><div className="members-grid">{project.members.map((member) => <div className="member-chip member-card" key={member.name}><div className={`avatar avatar-${member.color || 'purple'}`}><i className={isMemberOnline(member) ? 'presence-dot online' : 'presence-dot'} />{member.avatar || member.name.charAt(0)}</div><div><strong>{member.name}</strong><span>{isMemberOnline(member) ? 'Active now' : 'Offline'} · {member.role}</span></div></div>)}</div></div><div className="workspace-section"><div className="workspace-section-heading"><div><span className="section-kicker">PROJECT TASKS</span><h3>Current work <span className="count-pill">{projectTasks.length}</span></h3></div><button className="primary-button compact-button" onClick={onCreateTask}>+ Create Task</button></div><div className="workspace-task-list">{projectTasks.length ? projectTasks.slice(0, 4).map(taskRow) : <p className="empty-state">No tasks created for this project yet.</p>}</div></div></>}

        {activeTab === 'Tasks' && <div className="workspace-section"><div className="workspace-section-heading"><div><span className="section-kicker">DELIVERY BOARD</span><h3>All project tasks <span className="count-pill">{projectTasks.length}</span></h3></div><button className="primary-button compact-button" onClick={onCreateTask}>+ Create Task</button></div><div className="task-table-head"><span>Task</span><span>Priority</span><span>Assignee</span><span>Due</span><span>Status</span></div><div className="workspace-task-list">{projectTasks.length ? projectTasks.map(taskRow) : <p className="empty-state">No tasks created for this project yet.</p>}</div></div>}

        {activeTab === 'Chat' && <div className="workspace-section"><div className="workspace-section-heading"><div><span className="section-kicker">PROJECT CONVERSATION</span><h3>Team chat</h3></div><span className="live-label">● {project.members.filter(isMemberOnline).length} online</span></div><div className="chat-members">{project.members.filter(isMemberOnline).map((member) => <div className="chat-member" key={member.id}><div className={`avatar avatar-${member.color || 'purple'}`}><i className="presence-dot online" />{member.avatar || member.name.charAt(0)}</div><span>{member.name.split(' ')[0]}<small>Active</small></span></div>)}</div>{chatError && <p className="chat-error">{chatError}</p>}{messages.length ? <div className="chat-feed">{messages.map((message) => <div className={message.senderId === currentUser?.id ? 'chat-message mine' : 'chat-message'} key={message.id}><div className={`avatar avatar-${message.color || 'blue'}`}>{message.avatar}</div><div><div className="chat-meta"><strong>{message.senderId === currentUser?.id ? 'You' : message.author}</strong><span>{message.time}</span></div><p>{message.text}</p></div></div>)}</div> : <p className="empty-state">No messages yet. Start the conversation.</p>}<form className="chat-composer" onSubmit={sendMessage}><input value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} placeholder="Message your project team..." aria-label="Message your project team" disabled={isSendingMessage} /><button type="submit" aria-label="Send message" disabled={!messageDraft.trim() || isSendingMessage}>↑</button></form></div>}

        {activeTab === 'Files' && <div className="workspace-section"><div className="workspace-section-heading"><div><span className="section-kicker">PROJECT FILES</span><h3>Shared resources</h3></div><><input id={`project-file-${project.id}`} className="project-file-input" type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip" onChange={handleFileUpload} disabled={isUploadingFile} /><label className="primary-button compact-button project-file-button" htmlFor={`project-file-${project.id}`}>{isUploadingFile ? 'Uploading...' : '↥ Upload file'}</label></></div><div className="file-filters">{categories.map((category) => <button className={fileFilter === category ? 'selected' : ''} key={category} onClick={() => setFileFilter(category)}>{category}</button>)}</div>{files.length ? <div className="file-grid">{files.map((file) => <article className="file-card" key={file.id}><div className="file-icon">{file.icon}</div><a className="file-more" aria-label={`Open ${file.name}`} href={file.url} target="_blank" rel="noreferrer">↗</a><strong>{file.name}</strong><span>{file.type} · {file.size}</span><small>Uploaded by {file.uploadedBy}<br />{file.date}</small></article>)}</div> : <p className="empty-state">No files yet. Upload a document or image to share it with the project.</p>}</div>}

        {activeTab === 'Meetings' && <div className="workspace-section"><div className="workspace-section-heading"><div><span className="section-kicker">PROJECT CALENDAR</span><h3>Meetings</h3></div><button className="primary-button compact-button" onClick={onScheduleMeeting}>+ Schedule Meeting</button></div>{projectMeetings.length ? <div className="meeting-group"><span className="meeting-label">UPCOMING MEETINGS</span>{projectMeetings.map((meeting) => <div className="meeting-card" key={meeting.id}><div className="meeting-icon">◷</div><div><strong>{meeting.title}</strong><span>{meeting.time}</span><small>{meeting.host || 'Project team'} · {meeting.status}</small></div><span className="status-badge">Upcoming</span></div>)}</div> : <p className="empty-state">No meetings yet.</p>}{!isAuthenticated && <div className="meeting-group"><span className="meeting-label">PAST MEETINGS</span><div className="meeting-card past"><div className="meeting-icon">✓</div><div><strong>Weekly project review</strong><span>2 Sep 2026 · 3:00 PM</span><small>4 participants · Past</small></div><button className="ghost-button" onClick={() => window.alert('AI summary generated from the meeting transcript.')}>Generate AI Summary</button></div><div className="meeting-summary"><strong>AI meeting summary</strong><p><b>Key Decisions:</b> Finalize the dashboard flow and auth API integration.</p><p><b>Tasks Assigned:</b> Rahul owns the login API; Shruti owns dashboard UI.</p><p><b>Deadlines:</b> First review by Wednesday.</p><p><b>Open Questions:</b> Confirm production deployment environment.</p></div></div>}</div>}
        <button className="workspace-close" onClick={onClose}>Close Workspace</button>
      </div>
    </div>
  )
}

function App() {
  const [supabaseUser, setSupabaseUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(true)
  const [supabaseError, setSupabaseError] = useState('')
  const [activeNav, setActiveNav] = useState('Home')
  const [projectsList, setProjectsList] = useState([])
  const [tasks, setTasks] = useState([])
  const [meetingsList, setMeetingsList] = useState([])
  const [invitations, setInvitations] = useState([])
  const [projectInvitations, setProjectInvitations] = useState([])
  const [filter, setFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [githubRepo, setGithubRepo] = useState('')
  const [githubConnected, setGithubConnected] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [myUploadedFiles, setMyUploadedFiles] = useState([])
  
  // Modals & Selection
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false)
  const [isWorkspaceTaskModal, setIsWorkspaceTaskModal] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showAi, setShowAi] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [aiMessages, setAiMessages] = useState([])
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authMessage, setAuthMessage] = useState('')

  const sendAiMessage = (message = aiInput) => {
    const question = message.trim()
    if (!question || isAiThinking) return

    setAiInput('')
    setAiMessages((current) => [...current, { role: 'user', text: question }])
    setIsAiThinking(true)
    window.setTimeout(() => {
      setAiMessages((current) => [...current, {
        role: 'assistant',
        text: getAiReply(question, projectsList, tasks, meetingsList),
      }])
      setIsAiThinking(false)
    }, 450)
  }

  // Form State - Project
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectType, setNewProjectType] = useState('Web app')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [newProjectDueDate, setNewProjectDueDate] = useState('2026-09-30')

  // Form State - Task (Date + Time)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskProject, setNewTaskProject] = useState('')
  const [newTaskAssignee, setNewTaskAssignee] = useState('Shruti Mehta')
  const [newTaskPriority, setNewTaskPriority] = useState('High')
  const [newTaskDayOption, setNewTaskDayOption] = useState('Today')
  const [newTaskCustomDate, setNewTaskCustomDate] = useState('2026-09-15')
  const [newTaskTime, setNewTaskTime] = useState('18:00')

  // Form State - Meeting (Link + Time)
  const [newMeetingTitle, setNewMeetingTitle] = useState('')
  const [newMeetingProject, setNewMeetingProject] = useState('')
  const [newMeetingLink, setNewMeetingLink] = useState('https://meet.google.com/')
  const [newMeetingDateOption, setNewMeetingDateOption] = useState('Today')
  const [newMeetingCustomDate, setNewMeetingCustomDate] = useState('2026-09-15')
  const [newMeetingTime, setNewMeetingTime] = useState('16:00')
  const [newMeetingDuration, setNewMeetingDuration] = useState('30 mins')

  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('Developer')

  const [newCommentText, setNewCommentText] = useState('')

  const showSupabaseError = (error, fallbackMessage) => {
    console.error(error)
    const message = error?.code === '42P17'
      ? 'Supabase RLS policies are recursive. Replace the projects and project_members policies with the non-recursive SQL configuration.'
      : error?.code === '42501'
      ? 'Supabase denied this action. Check the projects and project_members RLS policies.'
      : error?.code === '23502'
        ? 'A required database column is missing a value. Check the projects table defaults.'
        : error?.code === '23503'
          ? 'The creator profile is missing. Please log out and sign in again.'
          : error?.message?.toLowerCase().includes('jwt')
            ? 'Your session expired. Please sign in again.'
            : fallbackMessage
    setSupabaseError(message)
    window.setTimeout(() => setSupabaseError(''), 4500)
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    if (!authEmail.trim() || authPassword.length < 6) {
      setAuthMessage('Enter an email and a password with at least 6 characters.')
      return
    }

    setAuthLoading(true)
    setAuthMessage('')
    try {
      const response = authMode === 'login'
        ? await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword })
        : await supabase.auth.signUp({ email: authEmail.trim(), password: authPassword })

      if (response.error) throw response.error
      if (authMode === 'signup' && !response.data.session) {
        setAuthMessage('Account created. Please verify your email before logging in.')
        return
      }

      setShowAuthModal(false)
      setAuthEmail('')
      setAuthPassword('')
    } catch (error) {
      console.error(error)
      setAuthMessage(authMode === 'login' ? 'Unable to log in with those credentials.' : 'Unable to create the account.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSupabaseUser(null)
    setProfile(null)
    setProjectsList([])
    setTasks([])
    setMeetingsList([])
    setInvitations([])
    setSelectedProject(null)
    setSelectedTask(null)
  }

  useEffect(() => {
    let isMounted = true

    const loadUserWorkspace = async (session) => {
      if (!isMounted) return
      const user = session?.user ?? null
      setSupabaseUser(user)
      if (!user) {
        setProfile(null)
        setProjectsList([])
        setTasks([])
        setMeetingsList([])
        setInvitations([])
        setIsWorkspaceLoading(false)
        return
      }

      setIsWorkspaceLoading(true)
      try {
        const workspace = await loadWorkspace(user)
        if (!isMounted) return
        setProfile(workspace.profile)
        setProjectsList(workspace.projects)
        setTasks(workspace.tasks)
        setInvitations(workspace.invitations || [])
      } catch (error) {
        if (isMounted) {
          setProfile(null)
          setProjectsList([])
          setTasks([])
          setMeetingsList([])
          setInvitations([])
          showSupabaseError(error, 'Unable to load your workspace.')
        }
      } finally {
        if (isMounted) setIsWorkspaceLoading(false)
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => loadUserWorkspace(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => loadUserWorkspace(session), 0)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const loadProjectInvitations = async () => {
      if (!selectedProject) {
        setProjectInvitations([])
        return
      }
      try {
        const invitations = await getProjectInvitations(selectedProject.id)
        setProjectInvitations(invitations || [])
      } catch (error) {
        console.log('Invitations table may not exist yet:', error.message)
        setProjectInvitations([])
      }
    }
    loadProjectInvitations()
  }, [selectedProject])

  useEffect(() => {
    if (!supabaseUser || !projectsList.length) {
      setMyUploadedFiles([])
      return
    }
    let isMounted = true
    listMyProjectFiles(projectsList.map((project) => project.id), supabaseUser.id)
      .then((files) => isMounted && setMyUploadedFiles(files))
      .catch(() => isMounted && setMyUploadedFiles([]))
    return () => { isMounted = false }
  }, [projectsList, supabaseUser])

  useEffect(() => {
    const handleInvitationFromUrl = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const invitationId = urlParams.get('invitation')
      
      if (!invitationId || !supabaseUser) return

      try {
        const { data: invitation } = await supabase
          .from('project_invitations')
          .select('*')
          .eq('id', invitationId)
          .single()

        if (!invitation || invitation.status !== 'pending') {
          showSupabaseError(null, 'Invalid or expired invitation.')
          return
        }

        if (invitation.invitee_email.toLowerCase() !== supabaseUser.email.toLowerCase()) {
          showSupabaseError(null, 'This invitation is for a different email address.')
          return
        }

        await handleAcceptInvitation(invitationId)
        
        window.history.replaceState({}, document.title, window.location.pathname)
      } catch (error) {
        console.error('Error handling invitation from URL:', error)
        showSupabaseError(error, 'Unable to accept invitation.')
      }
    }

    handleInvitationFromUrl()
  }, [supabaseUser])

  // Task Toggle
  const toggleTask = async (taskId) => {
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return
    const nextStatus = task.done ? 'Todo' : 'Completed'
    try {
      if (supabaseUser && !String(taskId).startsWith('t')) await updateTaskRecord(taskId, { status: nextStatus })
      updateTask(taskId, { done: !task.done, status: nextStatus })
    } catch (error) {
      showSupabaseError(error, 'Unable to save task.')
    }
  }

  const updateTask = async (taskId, changes) => {
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return
    const databaseChanges = {}
    if (changes.priority) databaseChanges.priority = changes.priority
    if (changes.assigneeId !== undefined) databaseChanges.assigned_to = changes.assigneeId
    if (changes.status) databaseChanges.status = changes.status

    try {
      if (supabaseUser && !String(taskId).startsWith('t') && Object.keys(databaseChanges).length) {
        await updateTaskRecord(taskId, databaseChanges)
      }
    } catch (error) {
      showSupabaseError(error, 'Unable to save task.')
      return
    }
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, ...changes } : task))
    setSelectedTask((current) => current?.id === taskId ? { ...current, ...changes } : current)
  }

  // Create Project
  const handleCreateProject = async (e) => {
    e.preventDefault()
    if (!newProjectName.trim()) return

    if (!supabaseUser) {
      showSupabaseError(null, 'Please log in again to create a project.')
      return
    }

    try {
      const newProj = await createProject(supabaseUser, {
        name: newProjectName.trim(),
        description: newProjectDesc.trim() || 'Collaborative team project workspace.',
        deadline: newProjectDueDate || '2026-09-30',
      })

      setProjectsList((current) => [newProj, ...current])
      setNewProjectName('')
      setNewProjectDesc('')
      setShowNewProjectModal(false)
      setSelectedProject(newProj)
    } catch (error) {
      showSupabaseError(error, 'Unable to create project.')
    }
  }

  const openNewTaskComposer = () => {
    if (!projectsList.length) {
      showSupabaseError(null, 'Create or join a project before adding a task.')
      return
    }
    setIsWorkspaceTaskModal(false)
    setNewTaskProject(projectsList[0].name)
    setNewTaskAssignee(getProfileName(supabaseUser, profile))
    setShowNewTaskModal(true)
  }

  // Create Task
  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    if (!supabaseUser) {
      showSupabaseError(null, 'Please log in again to create a task.')
      return
    }

    const targetProjectName = isWorkspaceTaskModal && selectedProject ? selectedProject.name : (newTaskProject || projectsList[0]?.name || 'Smart Agriculture')
    const targetProject = projectsList.find(p => p.name === targetProjectName)
    if (!targetProject?.id || String(targetProject.id).startsWith('1') && targetProject.id.length < 10) {
      showSupabaseError(null, 'Select a project loaded from Supabase before creating a task.')
      return
    }

    let dayLabel = 'Today'
    if (newTaskDayOption === 'Tomorrow') {
      dayLabel = 'Tomorrow'
    } else if (newTaskDayOption === 'Custom') {
      dayLabel = formatDateDisplay(newTaskCustomDate)
    }

    const formattedTime = formatTimeDisplay(newTaskTime)
    const deadlineString = `${dayLabel}, ${formattedTime}`

    try {
      const assigneeProfile = targetProject.members.find((member) => member.name === newTaskAssignee)
        || (newTaskAssignee === getProfileName(supabaseUser, profile) ? profile : null)
      const newTaskObj = await createTask(supabaseUser, {
        projectId: targetProject.id,
        project: targetProject,
        title: newTaskTitle.trim(),
        priority: newTaskPriority,
        deadline: newTaskCustomDate || null,
        assignedTo: assigneeProfile?.id || (newTaskAssignee === getProfileName(supabaseUser, profile) ? supabaseUser.id : null),
        assigneeProfile,
      })

      newTaskObj.time = deadlineString
      setTasks((current) => [newTaskObj, ...current])
      setNewTaskTitle('')
      setShowNewTaskModal(false)
    } catch (error) {
      showSupabaseError(error, 'Unable to save task.')
    }
  }

  // Schedule Meeting (Shared with Everyone)
  const handleScheduleMeeting = (e) => {
    e.preventDefault()
    if (!newMeetingTitle.trim() || !newMeetingLink.trim()) return

    const targetProjectName = newMeetingProject || selectedProject?.name || projectsList[0]?.name || 'Smart Agriculture'
    let dayLabel = 'Today'
    if (newMeetingDateOption === 'Tomorrow') {
      dayLabel = 'Tomorrow'
    } else if (newMeetingDateOption === 'Custom') {
      dayLabel = formatDateDisplay(newMeetingCustomDate)
    }

    const formattedTime = formatTimeDisplay(newMeetingTime)
    const timeDisplay = `${dayLabel}, ${formattedTime} (${newMeetingDuration})`

    let formattedLink = newMeetingLink.trim()
    if (!formattedLink.startsWith('http://') && !formattedLink.startsWith('https://')) {
      formattedLink = 'https://' + formattedLink
    }

    const platform = formattedLink.includes('zoom') ? 'Zoom' : formattedLink.includes('teams') ? 'MS Teams' : 'Google Meet'

    const newMeeting = {
      id: Date.now().toString(),
      title: newMeetingTitle.trim(),
      project: targetProjectName,
      host: 'Shruti Mehta (Product Lead)',
      hostAvatar: 'S',
      time: timeDisplay,
      dateLabel: dayLabel,
      link: formattedLink,
      platform: platform,
      status: 'Upcoming'
    }

    setMeetingsList([newMeeting, ...meetingsList])
    setNewMeetingTitle('')
    setShowNewMeetingModal(false)
    setActiveNav('Meetings')
  }

  // Add Team Member to Project
  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!newMemberEmail.trim() || !selectedProject || !supabaseUser) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newMemberEmail.trim())) {
      showSupabaseError(null, 'Please enter a valid email address.')
      return
    }

    try {
      const profile = await findProfileByEmail(newMemberEmail)
      
      if (profile) {
        const existingMembership = await checkExistingMembership(selectedProject.id, profile.id)
        if (existingMembership) {
          showSupabaseError(null, 'This user is already a member of this project.')
          setShowAddMemberModal(false)
          return
        }

        let pendingInvitation
        try {
          pendingInvitation = await checkPendingInvitation(selectedProject.id, newMemberEmail)
        } catch (error) {
          pendingInvitation = null
        }
        if (pendingInvitation) {
          showSupabaseError(null, 'An invitation has already been sent to this email.')
          setShowAddMemberModal(false)
          return
        }

        const invitation = await createProjectInvitation(selectedProject.id, supabaseUser.id, newMemberEmail, newMemberRole)
        
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invitation-email`
          await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ invitationId: invitation.id }),
          })
        } catch (emailError) {
          console.log('Email sending failed:', emailError.message)
        }

        showSupabaseError(null, `Invitation sent to ${newMemberEmail}`)
      } else {
        let pendingInvitation
        try {
          pendingInvitation = await checkPendingInvitation(selectedProject.id, newMemberEmail)
        } catch (error) {
          pendingInvitation = null
        }
        if (pendingInvitation) {
          showSupabaseError(null, 'An invitation has already been sent to this email.')
          setShowAddMemberModal(false)
          return
        }

        const invitation = await createProjectInvitation(selectedProject.id, supabaseUser.id, newMemberEmail, newMemberRole)
        
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invitation-email`
          await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ invitationId: invitation.id }),
          })
        } catch (emailError) {
          console.log('Email sending failed:', emailError.message)
        }

        showSupabaseError(null, `Invitation sent to ${newMemberEmail}`)
      }

      setNewMemberName('')
      setNewMemberEmail('')
      setShowAddMemberModal(false)
      
      const invitations = await getProjectInvitations(selectedProject.id)
      setProjectInvitations(invitations || [])
    } catch (error) {
      console.error('Full error in handleAddMember:', error)
      showSupabaseError(error, 'Unable to send invitation.')
    }
  }

  // Accept Invitation
  const handleAcceptInvitation = async (invitationId) => {
    if (!supabaseUser) return
    try {
      await acceptProjectInvitation(invitationId, supabaseUser.id)
      setInvitations((current) => current.filter((inv) => inv.id !== invitationId))
      const workspace = await loadWorkspace(supabaseUser)
      setProfile(workspace.profile)
      setProjectsList(workspace.projects)
      setTasks(workspace.tasks)
      setInvitations(workspace.invitations || [])
      showSupabaseError(null, 'Invitation accepted! You can now access the project.')
    } catch (error) {
      showSupabaseError(error, 'Unable to accept invitation.')
    }
  }

  // Decline Invitation
  const handleDeclineInvitation = async (invitationId) => {
    try {
      await declineProjectInvitation(invitationId)
      setInvitations((current) => current.filter((inv) => inv.id !== invitationId))
      showSupabaseError(null, 'Invitation declined.')
    } catch (error) {
      showSupabaseError(error, 'Unable to decline invitation.')
    }
  }

  // Post Review / Comment on Task
  const handlePostComment = (e) => {
    e.preventDefault()
    if (!newCommentText.trim() || !selectedTask) return

    const newComment = {
      id: Date.now().toString(),
      author: 'Shruti Mehta (You)',
      avatar: 'S',
      color: 'purple',
      time: 'Just now',
      text: newCommentText.trim()
    }

    const updatedTasks = tasks.map(t => {
      if (t.id === selectedTask.id) {
        return { ...t, comments: [...t.comments, newComment] }
      }
      return t
    })

    setTasks(updatedTasks)
    setSelectedTask(prev => prev ? { ...prev, comments: [...prev.comments, newComment] } : null)
    setNewCommentText('')
  }

  const visibleProjects = filter === 'All' 
    ? projectsList 
    : projectsList.filter((project) => filter === 'Active' ? project.progress < 100 : filter === 'At Risk' ? project.progress < 50 : project.progress === 100)

  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const searchProjects = normalizedSearchQuery
    ? projectsList.filter((project) => project.name.toLowerCase().includes(normalizedSearchQuery)).slice(0, 5)
    : []
  const searchTasks = normalizedSearchQuery
    ? tasks.filter((task) => task.title.toLowerCase().includes(normalizedSearchQuery) || task.project.toLowerCase().includes(normalizedSearchQuery)).slice(0, 5)
    : []

  // Priority Rank Helper: High (1), Medium (2), Low (3)
  const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 }

  // ONLY LOGGED IN USER'S TASKS (Shruti Mehta / You), sorted by High priority first
  const myUserTasks = tasks
    .filter(task => task.assigneeId === supabaseUser?.id || task.assignee === getProfileName(supabaseUser, profile) || task.assignee === 'You' || task.assignee?.includes('Shruti'))
    .sort((a, b) => (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4))

  // Tasks inside a specific project workspace
  const projectTasks = selectedProject 
    ? tasks.filter(t => t.projectId === selectedProject.id || t.project === selectedProject.name) 
    : []

  const activityItems = [
    ...tasks.filter((task) => task.assignee && task.assignee !== 'Unassigned').slice(0, 8).map((task) => ({
      id: `task-${task.id}`,
      avatar: task.assigneeAvatar || getInitials(task.assignee),
      color: task.assignee?.toLowerCase().includes('rahul') ? 'orange' : task.assignee?.toLowerCase().includes('priya') ? 'pink' : task.assignee?.toLowerCase().includes('aryan') ? 'teal' : 'purple',
      text: `${task.done ? 'completed' : 'is working on'} task`,
      subject: task.title,
      context: `${task.project} · ${task.assignee}`,
    })),
    ...meetingsList.filter((meeting) => meeting.host).slice(0, 4).map((meeting) => ({
      id: `meeting-${meeting.id}`,
      avatar: meeting.hostAvatar || getInitials(meeting.host),
      color: 'blue',
      text: 'scheduled a team meeting',
      subject: meeting.title,
      context: `${meeting.project} · ${meeting.time}`,
    })),
    ...projectsList.filter((project) => project.members.length).slice(0, 4).map((project) => ({
      id: `project-${project.id}`,
      avatar: project.members.find((member) => member.id === supabaseUser?.id)?.avatar || project.members[0].avatar,
      color: 'purple',
      text: 'is available in your workspace',
      subject: project.name,
      context: `${project.members.length} team member${project.members.length === 1 ? '' : 's'}`,
    })),
  ].slice(0, 12)

  if (!supabaseUser) {
    return (
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <span className="brand-mark">G</span>
            <span>groupify<span className="brand-dot">.</span></span>
          </div>
        </aside>
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ maxWidth: '400px', width: '100%', padding: '20px' }}>
            <div className="section-kicker" style={{ textAlign: 'center', marginBottom: '10px' }}>GROUPIFY</div>
            <h2 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '32px' }}>Collaborate on projects</h2>
            <form onSubmit={handleAuthSubmit} style={{ display: 'grid', gap: '15px' }}>
              <input
                type="email"
                placeholder="Email"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                autoFocus
                style={{ width: '100%', padding: '12px 14px', borderRadius: '9px', border: '1px solid #294365', background: '#091322', color: '#fff', fontSize: '14px', outline: 'none' }}
              />
              <input
                type="password"
                placeholder="Password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '9px', border: '1px solid #294365', background: '#091322', color: '#fff', fontSize: '14px', outline: 'none' }}
              />
              {authMessage && <p style={{ color: '#ffb8bd', fontSize: '12px', margin: 0 }}>{authMessage}</p>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <button type="button" className="ghost-button" onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthMessage('') }}>
                  {authMode === 'login' ? 'Create account' : 'Back to sign in'}
                </button>
                <button type="submit" className="primary-button" disabled={authLoading}>
                  {authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign in' : 'Sign up'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">G</span>
          <span>groupify<span className="brand-dot">.</span></span>
        </div>
        <div className="workspace-switcher">
          <span className="workspace-icon">S</span>
          <span><strong>Study squad</strong><small>Engineering · 3rd year</small></span>
          <span className="chevron">⌄</span>
        </div>
        <nav className="main-nav">
          {navItems.map(([icon, label]) => (
            <button 
              className={activeNav === label ? 'nav-item active' : 'nav-item'} 
              key={label} 
              onClick={() => setActiveNav(label)}
            >
              <span>{icon}</span>{label}<em>{label === 'Tasks' ? myUserTasks.length : label === 'Projects' ? projectsList.length : label === 'Meetings' ? meetingsList.length : ''}</em>
            </button>
          ))}
        </nav>
        <div className="nav-label">WORKSPACE</div>
        <button className={activeNav === 'Files' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveNav('Files')}><span>▣</span>Files</button>
        <button className={activeNav === 'GitHub' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveNav('GitHub')}><span>⌘</span>GitHub</button>
        <div className="sidebar-bottom">
          <button className={activeNav === 'Settings' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveNav('Settings')}><span>⚙</span>Settings</button>
          <div className="profile-mini">
            <div className="avatar avatar-purple">{profile?.initials || getInitials(getProfileName(supabaseUser, profile))}</div>
            <span><strong>{profile?.name || getProfileName(supabaseUser)}</strong><small>{supabaseUser?.email || 'View profile'}</small></span>
            <span>⋯</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span className="mobile-brand">G</span>
            <span>Workspace</span><b>/</b><strong>{activeNav}</strong>
          </div>
          <div className="top-actions">
            <button className="ghost-button" onClick={handleLogout}>Log out</button>
            <div className="search-trigger search-box">
              <span className="search-icon">⌕</span>
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search anything..." aria-label="Search projects and tasks" />
              <kbd>⌘ K</kbd>
              {normalizedSearchQuery && <div className="search-results">
                {searchProjects.map((project) => <button key={`project-${project.id}`} onClick={() => { setSelectedProject(project); setSearchQuery('') }}><strong>{project.name}</strong><small>Project</small></button>)}
                {searchTasks.map((task) => <button key={`task-${task.id}`} onClick={() => { setSelectedTask(task); setSearchQuery('') }}><strong>{task.title}</strong><small>{task.project}</small></button>)}
                {!searchProjects.length && !searchTasks.length && <span className="search-empty">No matching projects or tasks</span>}
              </div>}
            </div>
            <div className="topbar-profile" title={supabaseUser?.email || 'Logged-in account'}>
              <div className="avatar avatar-purple">{profile?.initials || getInitials(getProfileName(supabaseUser, profile))}</div>
              <span><strong>{profile?.name || getProfileName(supabaseUser, profile)}</strong><small>{supabaseUser?.email}</small></span>
            </div>
          </div>
        </header>

        <div className="content-wrap">
          {isWorkspaceLoading && supabaseUser && <div className="section-kicker" style={{ marginBottom: '18px' }}>Loading your Supabase workspace...</div>}
          {supabaseError && <div className="status-badge" style={{ marginBottom: '18px', color: '#ffb8bd', background: '#4b2029', borderColor: '#8b3d4b' }}>{supabaseError}</div>}
          {/* RENDER DEDICATED VIEW BASED ON ACTIVE NAV */}
          {activeNav === 'Projects' ? (
            /* DEDICATED PROJECTS PAGE - ONLY PROJECTS SHOWN! */
            <section className="projects-section" style={{ marginTop: '0', marginBottom: '40px' }}>
              <div className="panel-heading" style={{ marginBottom: '24px' }}>
                <div>
                  <div className="section-kicker">YOUR WORKSPACE</div>
                  <h2 style={{ fontSize: '28px', margin: '4px 0 2px' }}>Projects <span className="count-pill">{projectsList.length}</span></h2>
                  <p style={{ fontSize: '13px', color: '#687d98', margin: '0' }}>All active and completed team projects</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button className="primary-button" style={{ padding: '9px 16px', fontSize: '12px' }} onClick={() => setShowNewProjectModal(true)}>+ New Project</button>
                  <div className="filter-row">
                    {['All', 'Active', 'Completed', 'At Risk'].map((item) => (
                      <button 
                        className={filter === item ? 'filter-chip selected' : 'filter-chip'} 
                        onClick={() => setFilter(item)} 
                        key={item}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="project-grid">
                {visibleProjects.length ? visibleProjects.map((project) => (
                  <article 
                    className={`project-card ${project.tone}`} 
                    key={project.id || project.name}
                    onClick={() => setSelectedProject(project)}
                  >
                    <div className="project-card-top">
                      <span className="project-symbol">{project.tone === 'blue' ? '⌁' : project.tone === 'violet' ? '◒' : '◉'}</span>
                      <span className="days-left-pill" style={{ fontSize: '9px', background: '#12253d', padding: '2px 7px', borderRadius: '10px', color: '#4cd39b', fontWeight: '700' }}>
                        {calculateDaysLeft(project.dueDate)}
                      </span>
                    </div>
                    <span className="project-type">{project.type}</span>
                    <h3>{project.name}</h3>
                    <div className="progress-meta">
                      <span>Progress</span>
                      <strong>{project.progress}%</strong>
                    </div>
                    <div className="progress-track">
                      <span style={{ width: `${project.progress}%` }}></span>
                    </div>
                    <div className="project-footer">
                      <div className="avatar-stack">
                        {project.members.map((member, index) => (
                          <span className={`avatar avatar-${member.color || ['orange', 'pink', 'teal', 'blue'][index % 4]}`} key={index} title={`${member.name} (${member.role})`}>
                            {member.avatar || member.name.charAt(0)}
                          </span>
                        ))}
                      </div>
                      <span>⌁ {tasks.filter(t => t.projectId === project.id || t.project === project.name).length} tasks</span>
                      <span>◷ {project.due}</span>
                    </div>
                  </article>
                )) : <p className="empty-state">No projects yet. Create your first project to get started.</p>}
              </div>
            </section>
          ) : activeNav === 'Tasks' ? (
            /* DEDICATED TASKS PAGE */
            <section className="panel" style={{ background: '#0a1424', marginBottom: '40px' }}>
              <div className="panel-heading">
                <div>
                  <div className="section-kicker">PERSONAL DASHBOARD</div>
                  <h2 style={{ fontSize: '26px', margin: '4px 0 2px' }}>Your tasks ({myUserTasks.length})</h2>
                  <p style={{ fontSize: '12px', color: '#687d98', margin: '0' }}>Filtered to your account (Shruti Mehta) · Sorted by High Priority first</p>
                </div>
                <button className="primary-button" onClick={openNewTaskComposer}>+ Add task</button>
              </div>

              <div className="task-list">
                {myUserTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <p style={{ color: '#687c97', fontSize: '12px', margin: '0 0 12px' }}>No tasks assigned to you currently.</p>
                    <button className="primary-button compact-button" onClick={openNewTaskComposer}>Create your first task</button>
                  </div>
                ) : (
                  myUserTasks.map((task) => (
                    <div className={task.done ? 'task-row done' : 'task-row'} key={task.id} onClick={() => setSelectedTask(task)}>
                      <button className="task-check" onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}>{task.done ? '✓' : ''}</button>
                      <div className="task-detail">
                        <strong>{task.title}</strong>
                        <span>
                          <b className={`priority-dot ${task.priority.toLowerCase()}`}></b>
                          {task.project} <i>·</i> Assigned to: <strong>{task.assignee}</strong> 
                          {task.comments?.length > 0 && <small style={{ color: '#6fbaff', marginLeft: '6px' }}>💬 {task.comments.length}</small>}
                        </span>
                      </div>
                      <div className="task-time">
                        <strong>{task.time}</strong>
                        <span className={`priority-text ${task.priority.toLowerCase()}`}>{task.priority} Priority</span>
                      </div>
                      <span className="task-arrow">→</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          ) : activeNav === 'Files' ? (
            <section className="panel workspace-page-panel">
              <div className="panel-heading">
                <div><div className="section-kicker">WORKSPACE FILES</div><h2>Shared files</h2><p>Open a project to upload and manage files for its team.</p></div>
              </div>
              <div className="file-grid workspace-file-grid">
                {myUploadedFiles.map((file) => <article className="file-card" key={file.id}>
                  <div className="file-icon">{file.icon}</div><a className="file-more" href={file.url} target="_blank" rel="noreferrer" aria-label={`Open ${file.name}`}>↗</a><strong>{file.name}</strong><span>{file.type} · {file.size}</span><small>{file.projectName}<br />{file.date}</small>
                </article>)}
              </div>
              {!myUploadedFiles.length && <p className="empty-state">You have not uploaded any files yet.</p>}
              <div className="workspace-project-links"><h3>Project file spaces</h3>{projectsList.length ? projectsList.map((project) => <button className="workspace-link-row" key={project.id} onClick={() => setSelectedProject(project)}><span><strong>{project.name}</strong><small>{project.members.length} members · Open Files tab to upload</small></span><b>Open →</b></button>) : <p className="empty-state">No projects available yet.</p>}</div>
            </section>
          ) : activeNav === 'GitHub' ? (
            <section className="panel workspace-page-panel">
              <div className="panel-heading"><div><div className="section-kicker">DEVELOPER WORKSPACE</div><h2>GitHub</h2><p>Connect a repository so your team can reach the project code quickly.</p></div><span className="status-badge">{githubConnected ? 'Connected' : 'Not connected'}</span></div>
              <div className="github-connect-card"><label htmlFor="github-repository">Repository URL</label><div className="github-input-row"><input id="github-repository" value={githubRepo} onChange={(event) => setGithubRepo(event.target.value)} placeholder="https://github.com/your-team/repository" /><button className="primary-button" onClick={() => { if (githubRepo.trim()) setGithubConnected(true) }}>Save repository</button></div>{githubConnected && <a className="github-repository-link" href={githubRepo} target="_blank" rel="noreferrer">Open connected repository ↗</a>}</div>
              <div className="github-feature-grid"><div><strong>Project code</strong><span>Keep the repository link visible to every workspace member.</span></div><div><strong>Team workflow</strong><span>Use Tasks and Activity alongside your GitHub work.</span></div></div>
            </section>
          ) : activeNav === 'Settings' ? (
            <section className="panel workspace-page-panel">
              <div className="panel-heading"><div><div className="section-kicker">WORKSPACE PREFERENCES</div><h2>Settings</h2><p>Manage your Groupify account preferences.</p></div></div>
              <div className="settings-list"><div className="settings-row"><span><strong>Account</strong><small>{profile?.name || getProfileName(supabaseUser, profile)} · {supabaseUser?.email}</small></span><div className="avatar avatar-purple">{profile?.initials || getInitials(getProfileName(supabaseUser, profile))}</div></div><label className="settings-row settings-toggle"><span><strong>Email notifications</strong><small>Receive updates about invitations and workspace activity.</small></span><input type="checkbox" checked={emailNotifications} onChange={(event) => setEmailNotifications(event.target.checked)} /></label><div className="settings-row"><span><strong>Session</strong><small>Sign out of this Groupify account.</small></span><button className="ghost-button" onClick={handleLogout}>Log out</button></div></div>
            </section>
          ) : activeNav === 'Meetings' ? (
            /* DEDICATED MEETINGS PAGE - VISIBLE TO EVERYONE! */
            <section className="panel" style={{ background: '#0a1424', marginBottom: '40px' }}>
              <div className="panel-heading" style={{ marginBottom: '24px' }}>
                <div>
                  <div className="section-kicker">TEAM SYNCS & LIVE CALLS</div>
                  <h2 style={{ fontSize: '28px', margin: '4px 0 2px' }}>Team Meetings <span className="count-pill">{meetingsList.length}</span></h2>
                  <p style={{ fontSize: '13px', color: '#687d98', margin: '0' }}>Shared meeting links visible to all workspace team members</p>
                </div>
                <button 
                  className="primary-button" 
                  style={{ padding: '9px 16px', fontSize: '12px' }}
                  onClick={() => setShowNewMeetingModal(true)}
                >
                  + Schedule Meeting
                </button>
              </div>

              <div style={{ display: 'grid', gap: '16px' }}>
                {meetingsList.length === 0 ? (
                  <p style={{ color: '#687c97', fontSize: '13px', textAlign: 'center', padding: '30px 0' }}>
                    No meetings scheduled yet. Click "+ Schedule Meeting" to add a Google Meet or Zoom link for the team!
                  </p>
                ) : (
                  meetingsList.map((m) => (
                    <div 
                      key={m.id} 
                      style={{
                        padding: '20px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #0e1e35, #0a1322)',
                        border: '1px solid #1e385c',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        boxShadow: '0 4px 20px #0004'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div 
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '12px',
                            background: '#163354',
                            border: '1px solid #28548a',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: '22px',
                            color: '#55e0e6',
                            flex: 'none'
                          }}
                        >
                          🎥
                        </div>
                        <div style={{ display: 'grid', gap: '4px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <strong style={{ fontSize: '16px', color: '#fff' }}>{m.title}</strong>
                            <span style={{ fontSize: '9px', background: '#19395e', color: '#6fcbf4', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>{m.project}</span>
                            <span style={{ fontSize: '9px', background: '#194236', color: '#4cd39b', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>{m.platform}</span>
                          </div>
                          <span style={{ fontSize: '12px', color: '#879bb6' }}>
                            Hosted by <strong>{m.host}</strong> · 🕒 {m.time}
                          </span>
                          <a 
                            href={m.link} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{ fontSize: '11px', color: '#4c9fff', textDecoration: 'none', wordBreak: 'break-all', marginTop: '2px' }}
                          >
                            🔗 {m.link}
                          </a>
                        </div>
                      </div>

                      <a 
                        href={m.link} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="primary-button" 
                        style={{ padding: '10px 18px', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        Join Meeting ↗
                      </a>
                    </div>
                  ))
                )}
              </div>
            </section>
          ) : activeNav === 'Activity' ? (
            /* DEDICATED TEAM ACTIVITY PAGE */
            <section className="panel" style={{ background: '#0a1424', marginBottom: '40px' }}>
              <div className="panel-heading">
                <div>
                  <div className="section-kicker">TEAM PULSE & AUDIT LOG</div>
                  <h2 style={{ fontSize: '26px', margin: '4px 0 2px' }}>Team Activity Stream</h2>
                  <p style={{ fontSize: '12px', color: '#687d98', margin: '0' }}>Real-time updates across all workspace projects</p>
                </div>
              </div>
              {supabaseUser ? <div className="activity-list" style={{ marginTop: '15px' }}>{activityItems.length ? activityItems.map((item) => (
                <div className="activity-item" style={{ padding: '12px 0', borderBottom: '1px solid #162438' }} key={item.id}>
                  <div className={`avatar avatar-${item.color}`}>{item.avatar}</div>
                  <div><p><strong>{item.text}</strong> <b>{item.subject}</b></p><span>{item.context}</span></div>
                </div>
              )) : <p className="empty-state">No activity yet. Create a task, meeting, or project to see updates here.</p>}</div> : <div className="activity-list" style={{ marginTop: '15px' }}>
                <div className="activity-item" style={{ padding: '12px 0', borderBottom: '1px solid #162438' }}>
                  <div className="avatar avatar-orange">R</div>
                  <div><p><strong>Rahul Sharma</strong> pushed 3 commits to <b>authentication-fix</b></p><span>12 minutes ago · Smart Agriculture</span></div>
                </div>
                <div className="activity-item" style={{ padding: '12px 0', borderBottom: '1px solid #162438' }}>
                  <div className="avatar avatar-pink">P</div>
                  <div><p><strong>Priya Verma</strong> completed task <b>Dashboard UI Mockups</b></p><span>38 minutes ago · Cybersecurity Lab</span></div>
                </div>
                <div className="activity-item" style={{ padding: '12px 0', borderBottom: '1px solid #162438' }}>
                  <div className="avatar avatar-teal">A</div>
                  <div><p><strong>Aryan Kapoor</strong> uploaded file <b>research-notes-v2.pdf</b></p><span>1 hour ago · Smart Agriculture</span></div>
                </div>
                <div className="activity-item" style={{ padding: '12px 0' }}>
                  <div className="avatar avatar-purple">S</div>
                  <div><p><strong>Shruti Mehta</strong> created project <b>Mitro ML Pipeline</b></p><span>2 hours ago · Machine Learning</span></div>
                </div>
              </div>}
            </section>
          ) : (
            /* DEFAULT HOME DASHBOARD PAGE */
            <>
              <section className="welcome-row">
                <div>
                  <p className="eyebrow">MONDAY, SEPTEMBER 7, 2026</p>
                    <h1>Good evening, {profile?.name || getProfileName(supabaseUser)} <span>✦</span></h1>
                  <p className="subhead">Here’s what needs your attention.</p>
                </div>
                <button className="primary-button" onClick={() => setShowQuickAdd(true)}>
                  <span>+</span> Create new
                </button>
              </section>

              <section className="stats-grid">
                {[
                  ['◈', projectsList.length, 'Projects', '2 at risk'], 
                  ['✓', myUserTasks.filter(t => !t.done).length, 'Your open tasks', 'Sorted by priority'], 
                  ['◷', '18h', 'This week', '↑ 12% from last week'], 
                  ['✦', '82%', 'Team health', 'Looking good']
                ].map(([icon, value, label, note]) => (
                  <div className="stat-card" key={label}>
                    <div className="stat-icon">{icon}</div>
                    <div><strong>{value}</strong><span>{label}</span><small>{note}</small></div>
                  </div>
                ))}
              </section>

              {invitations.length > 0 && (
                <section className="panel" style={{ background: '#0a1424', marginBottom: '24px' }}>
                  <div className="panel-heading">
                    <div>
                      <div className="section-kicker">PENDING INVITATIONS</div>
                      <h2>You have {invitations.length} invitation{invitations.length > 1 ? 's' : ''}</h2>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {invitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #0e1e35, #0a1322)',
                          border: '1px solid #1e385c',
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '16px',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '12px',
                              background: '#163354',
                              border: '1px solid #28548a',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: '22px',
                              color: '#55e0e6',
                              flex: 'none',
                            }}
                          >
                            ◈
                          </div>
                          <div style={{ display: 'grid', gap: '4px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <strong style={{ fontSize: '16px', color: '#fff' }}>{invitation.projects?.name || 'Project'}</strong>
                              <span style={{ fontSize: '9px', background: '#19395e', color: '#6fcbf4', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>{invitation.role}</span>
                            </div>
                            <span style={{ fontSize: '12px', color: '#879bb6' }}>
                              Expires in {Math.ceil((new Date(invitation.expires_at) - new Date()) / (1000 * 60 * 60 * 24))} days
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="ghost-button"
                            onClick={() => handleDeclineInvitation(invitation.id)}
                            style={{ padding: '8px 16px', fontSize: '12px' }}
                          >
                            Decline
                          </button>
                          <button
                            className="primary-button"
                            onClick={() => handleAcceptInvitation(invitation.id)}
                            style={{ padding: '8px 16px', fontSize: '12px' }}
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="ai-priority">
                <div className="ai-orb">✦</div>
                <div className="ai-copy">
                  <div className="section-kicker">AI PRIORITY <span className="live-dot">●</span></div>
                  <h2>Your next best move</h2>
                  <p>You have {myUserTasks.filter(t => !t.done).length} open tasks. <strong>{myUserTasks[0]?.title || 'Smart Agriculture'}</strong> needs attention first because of its High priority tag.</p>
                  <div className="ai-actions">
                    <button onClick={() => setShowAi(true)}>View priorities <span>→</span></button>
                    <button className="ghost-button" onClick={() => setShowAi(true)}>Ask AI <span>↗</span></button>
                  </div>
                </div>
                <div className="priority-ring">
                  <strong>45</strong><span>doc progress</span>
                </div>
              </section>

              <div className="dashboard-grid">
                {/* YOUR TASKS PANEL */}
                <section className="panel tasks-panel">
                  <div className="panel-heading">
                    <div>
                      <div className="section-kicker">YOUR FOCUS</div>
                      <h2>Your tasks <span className="count-pill">{myUserTasks.filter((task) => !task.done).length}</span></h2>
                    </div>
                    <button 
                      className="text-button" 
                      onClick={() => { 
                        setIsWorkspaceTaskModal(false)
                        setNewTaskProject(projectsList[0]?.name || '')
                        setShowNewTaskModal(true) 
                      }}
                    >
                      + Add task
                    </button>
                  </div>

                  <div className="task-list">
                    {myUserTasks.length === 0 ? (
                      <p style={{ color: '#687c97', fontSize: '12px', padding: '15px 0' }}>No tasks assigned to your account.</p>
                    ) : (
                      myUserTasks.map((task) => (
                        <div className={task.done ? 'task-row done' : 'task-row'} key={task.id} onClick={() => setSelectedTask(task)}>
                          <button className="task-check" onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}>{task.done ? '✓' : ''}</button>
                          <div className="task-detail">
                            <strong>{task.title}</strong>
                            <span>
                              <b className={`priority-dot ${task.priority.toLowerCase()}`}></b>
                              {task.project} <i>·</i> {task.assignee} 
                              {task.comments?.length > 0 && <small style={{ color: '#6fbaff', marginLeft: '6px' }}>💬 {task.comments.length}</small>}
                            </span>
                          </div>
                          <div className="task-time">
                            <strong>{task.time}</strong>
                            <span className={`priority-text ${task.priority.toLowerCase()}`}>{task.priority}</span>
                          </div>
                          <span className="task-arrow">→</span>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="panel activity-panel">
                  <div className="panel-heading">
                    <div>
                      <div className="section-kicker">LIVE PULSE</div>
                      <h2>Team activity</h2>
                    </div>
                    <button className="more-button">•••</button>
                  </div>
                  {supabaseUser ? <p className="empty-state">No activity yet.</p> : <div className="activity-list">
                    <div className="activity-item">
                      <div className="avatar avatar-orange">R</div>
                      <div><p><strong>Rahul</strong> pushed code to <b>authentication-fix</b></p><span>12 minutes ago · Smart Agriculture</span></div>
                    </div>
                    <div className="activity-item">
                      <div className="avatar avatar-pink">P</div>
                      <div><p><strong>Priya</strong> completed <b>Dashboard UI</b></p><span>38 minutes ago · Cybersecurity Lab</span></div>
                    </div>
                    <div className="activity-item">
                      <div className="avatar avatar-teal">A</div>
                      <div><p><strong>Aryan</strong> uploaded <b>research-notes.pdf</b></p><span>1 hour ago · Smart Agriculture</span></div>
                    </div>
                  </div>}
                  {!supabaseUser && <div className="team-status">
                    <div className="status-avatars">
                      <span className="avatar avatar-orange">R</span>
                      <span className="avatar avatar-pink">P</span>
                      <span className="avatar avatar-teal">A</span>
                      <span className="avatar avatar-blue">N</span>
                    </div>
                    <span><b>4 members</b> active now</span>
                    <i className="green-pulse"></i>
                  </div>}
                </section>
              </div>

              {/* PROJECTS QUICK OVERVIEW ON HOME PAGE */}
              <section className="projects-section">
                <div className="panel-heading">
                  <div>
                    <div className="section-kicker">YOUR SPACE</div>
                    <h2>Projects <span className="count-pill">{projectsList.length}</span></h2>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button className="text-button" onClick={() => setActiveNav('Projects')}>View all →</button>
                    <button className="primary-button" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => setShowNewProjectModal(true)}>+ New Project</button>
                  </div>
                </div>

                <div className="project-grid">
                  {visibleProjects.length ? visibleProjects.slice(0, 3).map((project) => (
                    <article 
                      className={`project-card ${project.tone}`} 
                      key={project.id || project.name}
                      onClick={() => setSelectedProject(project)}
                    >
                      <div className="project-card-top">
                        <span className="project-symbol">{project.tone === 'blue' ? '⌁' : project.tone === 'violet' ? '◒' : '◉'}</span>
                        <span className="days-left-pill" style={{ fontSize: '9px', background: '#12253d', padding: '2px 7px', borderRadius: '10px', color: '#4cd39b', fontWeight: '700' }}>
                          {calculateDaysLeft(project.dueDate)}
                        </span>
                      </div>
                      <span className="project-type">{project.type}</span>
                      <h3>{project.name}</h3>
                      <div className="progress-meta">
                        <span>Progress</span>
                        <strong>{project.progress}%</strong>
                      </div>
                      <div className="progress-track">
                        <span style={{ width: `${project.progress}%` }}></span>
                      </div>
                      <div className="project-footer">
                        <div className="avatar-stack">
                          {project.members.map((member, index) => (
                            <span className={`avatar avatar-${member.color || ['orange', 'pink', 'teal', 'blue'][index % 4]}`} key={index} title={`${member.name} (${member.role})`}>
                              {member.avatar || member.name.charAt(0)}
                            </span>
                          ))}
                        </div>
                        <span>⌁ {tasks.filter(t => t.projectId === project.id || t.project === project.name).length} tasks</span>
                        <span>◷ {project.due}</span>
                      </div>
                    </article>
                  )) : <p className="empty-state">No projects yet. Create your first project to get started.</p>}
                </div>
              </section>
            </>
          )}

          <div className="bottom-space"></div>
        </div>
      </main>

      <button className="ai-fab" onClick={() => setShowAi(true)}><span>✦</span><i></i></button>

      <nav className="mobile-nav">
        {navItems.slice(0, 4).map(([icon, label]) => (
          <button className={activeNav === label ? 'active' : ''} key={label} onClick={() => setActiveNav(label)}>
            <span>{icon}</span>{label}
          </button>
        ))}
        <button onClick={() => setShowQuickAdd(true)}><span className="mobile-add">+</span>Create</button>
      </nav>

      {/* SCHEDULE MEETING MODAL */}
      {showNewMeetingModal && (
        <div className="modal-backdrop" onClick={() => setShowNewMeetingModal(false)}>
          <div className="quick-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle"></div>
            <div className="section-kicker">SCHEDULE MEETING</div>
            <h2>Schedule Team Call & Add Link</h2>
            <form onSubmit={handleScheduleMeeting} style={{ display: 'grid', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '10px', color: '#778ca7', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>MEETING TITLE</label>
                <input 
                  type="text" 
                  placeholder="e.g. Sprint Review & Architecture Sync" 
                  value={newMeetingTitle}
                  onChange={(e) => setNewMeetingTitle(e.target.value)}
                  autoFocus
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '9px', border: '1px solid #294365', background: '#091322', color: '#fff', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '10px', color: '#778ca7', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>MEETING LINK (GOOGLE MEET / ZOOM)</label>
                <input 
                  type="text" 
                  placeholder="e.g. https://meet.google.com/abc-defg-hij" 
                  value={newMeetingLink}
                  onChange={(e) => setNewMeetingLink(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '9px', border: '1px solid #294365', background: '#091322', color: '#fff', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: '#778ca7', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>PROJECT</label>
                  <select
                    value={newMeetingProject}
                    onChange={(e) => setNewMeetingProject(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '9px', border: '1px solid #294365', background: '#091322', color: '#fff', fontSize: '14px', outline: 'none' }}
                  >
                    {projectsList.map(p => (
                      <option key={p.id || p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '10px', color: '#778ca7', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>DURATION</label>
                  <select
                    value={newMeetingDuration}
                    onChange={(e) => setNewMeetingDuration(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '9px', border: '1px solid #294365', background: '#091322', color: '#fff', fontSize: '14px', outline: 'none' }}
                  >
                    <option value="30 mins">30 mins</option>
                    <option value="45 mins">45 mins</option>
                    <option value="1 hour">1 hour</option>
                    <option value="1.5 hours">1.5 hours</option>
                  </select>
                </div>
              </div>

              {/* DATE & TIME SELECTOR */}
              <div style={{ border: '1px solid #1c3352', borderRadius: '12px', padding: '14px', background: '#091324' }}>
                <label style={{ fontSize: '10px', color: '#7697bf', display: 'block', marginBottom: '8px', fontWeight: 'bold', letterSpacing: '1px' }}>
                  MEETING DATE & TIME
                </label>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '9px', color: '#687c97', display: 'block', marginBottom: '3px' }}>MEETING DATE</label>
                    <select
                      value={newMeetingDateOption}
                      onChange={(e) => setNewMeetingDateOption(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #294365', background: '#0c1a2d', color: '#fff', fontSize: '13px', outline: 'none', marginBottom: newMeetingDateOption === 'Custom' ? '8px' : '0' }}
                    >
                      <option value="Today">Today</option>
                      <option value="Tomorrow">Tomorrow</option>
                      <option value="Custom">Custom Date...</option>
                    </select>

                    {newMeetingDateOption === 'Custom' && (
                      <input 
                        type="date"
                        value={newMeetingCustomDate}
                        onChange={(e) => setNewMeetingCustomDate(e.target.value)}
                        style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #294365', background: '#0c1a2d', color: '#fff', fontSize: '13px', outline: 'none' }}
                      />
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '9px', color: '#687c97', display: 'block', marginBottom: '3px' }}>START TIME</label>
                    <input 
                      type="time"
                      value={newMeetingTime}
                      onChange={(e) => setNewMeetingTime(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #294365', background: '#0c1a2d', color: '#fff', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="ghost-button" style={{ padding: '10px 16px', color: '#91a3bb', background: 'none', border: 0, cursor: 'pointer' }} onClick={() => setShowNewMeetingModal(false)}>Cancel</button>
                <button type="submit" className="primary-button">Publish Meeting Link</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROJECT WORKSPACE MODAL */}
      {false && selectedProject && (
        <div className="modal-backdrop" onClick={() => setSelectedProject(null)}>
          <div className="workspace-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="workspace-header">
              <div className="workspace-title-row">
                <span className="section-kicker">PROJECT WORKSPACE · {selectedProject.type}</span>
                <h2>{selectedProject.name}</h2>
                <p>{selectedProject.description}</p>
              </div>
              <div className="deadline-badge">
                <span>🗓 Target Deadline: <strong>{selectedProject.due}</strong></span>
                <span className="days-left">({calculateDaysLeft(selectedProject.dueDate)})</span>
              </div>
            </div>

            <div className="workspace-stats">
              <div className="w-stat-card">
                <label>PROGRESS</label>
                <strong>{selectedProject.progress}%</strong>
                <div className="progress-track" style={{ marginTop: '5px' }}>
                  <span style={{ width: `${selectedProject.progress}%` }}></span>
                </div>
              </div>
              <div className="w-stat-card">
                <label>TOTAL TASKS</label>
                <strong>{projectTasks.length} tasks</strong>
                <span style={{ fontSize: '10px', color: '#687d98' }}>{projectTasks.filter(t => t.done).length} completed</span>
              </div>
              <div className="w-stat-card">
                <label>TEAM MEMBERS</label>
                <strong>{selectedProject.members.length} members</strong>
                <span style={{ fontSize: '10px', color: '#4cd39b' }}>● Active workspace</span>
              </div>
            </div>

            {/* TEAM MEMBERS LIST */}
            <div className="members-section">
              <div className="members-header">
                <h4>PROJECT TEAM MEMBERS</h4>
                <button className="add-member-btn" onClick={() => setShowAddMemberModal(true)}>+ Add Member</button>
              </div>
              
              {/* Active Members */}
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '10px', color: '#687d98', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>ACTIVE MEMBERS</span>
                <div className="members-grid">
                  {selectedProject.members.map((member, i) => (
                    <div className="member-chip" key={i}>
                      <div className={`avatar avatar-${member.color || 'purple'}`} style={{ width: '22px', height: '22px', fontSize: '9px' }}>
                        {member.avatar || member.name.charAt(0)}
                      </div>
                      <div>
                        <strong>{member.name}</strong>
                        <span style={{ display: 'block', fontSize: '9px', color: '#7b90ab' }}>{member.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Invitations */}
              {projectInvitations.length > 0 && (
                <div>
                  <span style={{ fontSize: '10px', color: '#687d98', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>PENDING INVITATIONS</span>
                  <div className="members-grid">
                    {projectInvitations.map((invitation, i) => (
                      <div className="member-chip" key={i} style={{ opacity: '0.7' }}>
                        <div className="avatar avatar-gray" style={{ width: '22px', height: '22px', fontSize: '9px', background: '#2a3f5e', color: '#8aa1be' }}>
                          ?
                        </div>
                        <div>
                          <strong>{invitation.invitee_email}</strong>
                          <span style={{ display: 'block', fontSize: '9px', color: '#7b90ab' }}>{invitation.role} · Pending</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* TASKS IN WORKSPACE */}
            <div className="panel" style={{ background: '#0a1424' }}>
              <div className="panel-heading">
                <div>
                  <div className="section-kicker">PROJECT TASKS</div>
                  <h2>Tasks ({projectTasks.length})</h2>
                </div>
                <button 
                  className="primary-button" 
                  style={{ padding: '8px 14px', fontSize: '11px' }}
                  onClick={() => {
                    setIsWorkspaceTaskModal(true)
                    setNewTaskProject(selectedProject.name)
                    setShowNewTaskModal(true)
                  }}
                >
                  + Create Task
                </button>
              </div>

              <div className="task-list">
                {projectTasks.length === 0 ? (
                  <p style={{ color: '#687c97', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>
                    No tasks created for this project yet. Click "+ Create Task" to assign work!
                  </p>
                ) : (
                  projectTasks.map((task) => (
                    <div 
                      className={task.done ? 'task-row done' : 'task-row'} 
                      key={task.id} 
                      onClick={() => setSelectedTask(task)}
                    >
                      <button className="task-check" onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}>{task.done ? '✓' : ''}</button>
                      <div className="task-detail">
                        <strong>{task.title}</strong>
                        <span>
                          <b className={`priority-dot ${task.priority.toLowerCase()}`}></b>
                          Assigned to: <strong>{task.assignee}</strong> <i>·</i> {task.time} 
                          {task.comments?.length > 0 && <small style={{ color: '#6fbaff', marginLeft: '8px' }}>💬 {task.comments.length} review(s)</small>}
                        </span>
                      </div>
                      <div className="task-time">
                        <span className={`priority-text ${task.priority.toLowerCase()}`}>{task.priority} Priority</span>
                      </div>
                      <span className="task-arrow">→</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button className="primary-button" style={{ background: '#1c3455' }} onClick={() => setSelectedProject(null)}>Close Workspace</button>
            </div>
          </div>
        </div>
      )}

      {selectedProject && (
        <ProjectWorkspace
          project={selectedProject}
          tasks={tasks}
          meetings={meetingsList}
          currentUser={{ id: supabaseUser.id, name: profile?.name || getProfileName(supabaseUser), avatar: profile?.initials || 'U', color: 'purple' }}
          onClose={() => setSelectedProject(null)}
          onCreateTask={() => {
            setIsWorkspaceTaskModal(true)
            setNewTaskProject(selectedProject.name)
            setShowNewTaskModal(true)
          }}
          onScheduleMeeting={() => setShowNewMeetingModal(true)}
          onAddMember={() => setShowAddMemberModal(true)}
          onToggleTask={toggleTask}
          onUpdateTask={updateTask}
          onOpenTask={setSelectedTask}
          isAuthenticated={Boolean(supabaseUser)}
        />
      )}

      {/* TASK REVIEWS & COMMENTS MODAL */}
      {selectedTask && (
        <div className="modal-backdrop" onClick={() => setSelectedTask(null)}>
          <div className="workspace-sheet" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="workspace-header">
              <div>
                <span className="section-kicker">TASK REVIEW & DETAILS · {selectedTask.project}</span>
                <h2 style={{ fontSize: '20px', margin: '4px 0' }}>{selectedTask.title}</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px', fontSize: '12px', color: '#8aa1be' }}>
                  <span>Assigned to: <strong style={{ color: '#fff' }}>{selectedTask.assignee}</strong></span>
                  <span>·</span>
                  <span className={`priority-text ${selectedTask.priority.toLowerCase()}`}>{selectedTask.priority} Priority</span>
                  <span>·</span>
                  <span>Due: <strong>{selectedTask.time}</strong></span>
                </div>
              </div>
              <button className="close-button" onClick={() => setSelectedTask(null)}>×</button>
            </div>

            <div style={{ margin: '14px 0', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button 
                className="primary-button" 
                style={{ background: selectedTask.done ? '#287e85' : '#438cf4', padding: '8px 14px', fontSize: '11px' }}
                onClick={() => toggleTask(selectedTask.id)}
              >
                {selectedTask.done ? '✓ Completed (Click to Reopen)' : 'Mark as Complete'}
              </button>
            </div>

            {/* COMMENTS / REVIEWS FEED */}
            <div style={{ marginTop: '20px' }}>
              <div className="section-kicker">TEAM REVIEWS & COMMENTS ({selectedTask.comments?.length || 0})</div>
              
              <div className="comments-feed">
                {(!selectedTask.comments || selectedTask.comments.length === 0) ? (
                  <p style={{ color: '#627690', fontSize: '12px', fontStyle: 'italic', margin: '10px 0' }}>
                    No reviews or comments yet. Add a review comment below for {selectedTask.assignee}!
                  </p>
                ) : (
                  selectedTask.comments.map((c) => (
                    <div className="comment-bubble" key={c.id}>
                      <div className={`avatar avatar-${c.color || 'purple'}`} style={{ width: '26px', height: '26px', fontSize: '10px' }}>
                        {c.avatar}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div>
                          <strong>{c.author}</strong>
                          <small>{c.time}</small>
                        </div>
                        <p>{c.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handlePostComment} className="comment-input-row">
                <input 
                  type="text" 
                  placeholder={`Write a review for ${selectedTask.assignee}...`} 
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                />
                <button type="submit" className="primary-button" style={{ padding: '10px 16px', fontSize: '11px' }}>Post Review</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {showAddMemberModal && (
        <div className="modal-backdrop" onClick={() => setShowAddMemberModal(false)}>
          <div className="quick-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle"></div>
            <div className="section-kicker">ADD TEAM MEMBER</div>
            <h2>Assign member to {selectedProject?.name}</h2>
            <form onSubmit={handleAddMember} style={{ display: 'grid', gap: '15px' }}>
              <input 
                type="text" 
                placeholder="Member name (optional)" 
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                autoFocus
                style={{ padding: '12px 14px', borderRadius: '9px', border: '1px solid #294365', background: '#091322', color: '#fff', fontSize: '14px', outline: 'none' }}
              />
              <input
                type="email"
                placeholder="Member email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                style={{ padding: '12px 14px', borderRadius: '9px', border: '1px solid #294365', background: '#091322', color: '#fff', fontSize: '14px', outline: 'none' }}
              />
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
                style={{ padding: '12px 14px', borderRadius: '9px', border: '1px solid #294365', background: '#091322', color: '#fff', fontSize: '14px', outline: 'none' }}
              >
                <option value="Frontend Dev">Frontend Dev</option>
                <option value="Backend Dev">Backend Dev</option>
                <option value="AI Research">AI Research</option>
                <option value="UI/UX Lead">UI/UX Lead</option>
                <option value="Documentation">Documentation</option>
                <option value="Security Analyst">Security Analyst</option>
              </select>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="ghost-button" style={{ padding: '10px 16px', color: '#91a3bb', background: 'none', border: 0, cursor: 'pointer' }} onClick={() => setShowAddMemberModal(false)}>Cancel</button>
                <button type="submit" className="primary-button">Add to Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD MODAL */}
      {showQuickAdd && (
        <div className="modal-backdrop" onClick={() => setShowQuickAdd(false)}>
          <div className="quick-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle"></div>
            <div className="section-kicker">QUICK ADD</div>
            <h2>What are we building?</h2>
            <div className="quick-grid">
              <button onClick={() => { 
                setShowQuickAdd(false); 
                setIsWorkspaceTaskModal(false);
                setNewTaskProject(projectsList[0]?.name || ''); 
                setShowNewTaskModal(true); 
              }}>
                <span>＋</span>New task
              </button>
              <button onClick={() => { setShowQuickAdd(false); setShowNewProjectModal(true); }}>
                <span>◈</span>New project
              </button>
              <button onClick={() => { setShowQuickAdd(false); setShowNewMeetingModal(true); }}>
                <span>◷</span>Schedule meeting
              </button>
              <button onClick={() => setShowQuickAdd(false)}>
                <span>□</span>Add note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW PROJECT MODAL */}
      {showNewProjectModal && (
        <div className="modal-backdrop" onClick={() => setShowNewProjectModal(false)}>
          <div className="quick-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle"></div>
            <div className="section-kicker">NEW PROJECT</div>
            <h2>Create New Project</h2>
            <form onSubmit={handleCreateProject} style={{ display: 'grid', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '10px', color: '#778ca7', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>PROJECT NAME</label>
                <input 
                  type="text" 
                  placeholder="e.g. Parampara v2" 
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  autoFocus
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '9px', border: '1px solid #294365', background: '#091322', color: '#fff', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '10px', color: '#778ca7', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>PROJECT DESCRIPTION</label>
                <input 
                  type="text" 
                  placeholder="Short description..." 
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '9px', border: '1px solid #294365', background: '#091322', color: '#fff', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: '#778ca7', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>CATEGORY</label>
                  <select
                    value={newProjectType}
                    onChange={(e) => setNewProjectType(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '9px', border: '1px solid #294365', background: '#091322', color: '#fff', fontSize: '14px', outline: 'none' }}
                  >
                    <option value="Web app">Web app</option>
                    <option value="AI / ML">AI / ML</option>
                    <option value="Research">Research</option>
                    <option value="College">College</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '10px', color: '#778ca7', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>PROJECT DEADLINE (DATE)</label>
                  <input 
                    type="date"
                    value={newProjectDueDate}
                    onChange={(e) => setNewProjectDueDate(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '9px', border: '1px solid #294365', background: '#091322', color: '#fff', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="ghost-button" style={{ padding: '10px 16px', color: '#91a3bb', background: 'none', border: 0, cursor: 'pointer' }} onClick={() => setShowNewProjectModal(false)}>Cancel</button>
                <button type="submit" className="primary-button">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW TASK MODAL */}
      {showNewTaskModal && (
        <div className="modal-backdrop" onClick={() => setShowNewTaskModal(false)}>
          <div className="quick-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle"></div>
            <div className="section-kicker">NEW TASK</div>
            <h2>Create & Assign Task</h2>
            <form onSubmit={handleCreateTask} style={{ display: 'grid', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '10px', color: '#778ca7', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>TASK TITLE</label>
                <input 
                  type="text" 
                  placeholder="Task title..." 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  autoFocus
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '9px', border: '1px solid #294365', background: '#091322', color: '#fff', fontSize: '14px', outline: 'none' }}
                />
              </div>

              {/* CONTEXT-AWARE PROJECT SELECTION */}
              {isWorkspaceTaskModal && selectedProject ? (
                <div style={{ background: '#12253e', padding: '10px 14px', borderRadius: '9px', border: '1px solid #244671' }}>
                  <span style={{ fontSize: '9px', color: '#688bb7', display: 'block', fontWeight: 'bold' }}>PROJECT CONTEXT</span>
                  <strong style={{ color: '#55e0e6', fontSize: '14px' }}>◈ {selectedProject.name}</strong>
                </div>
              ) : (
                <div>
                  <label style={{ fontSize: '10px', color: '#778ca7', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>SELECT PROJECT</label>
                  <select
                    value={newTaskProject}
                    onChange={(e) => setNewTaskProject(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '9px', border: '1px solid #294365', background: '#091322', color: '#fff', fontSize: '14px', outline: 'none' }}
                  >
                    {projectsList.map(p => (
                      <option key={p.id || p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* ASSIGNEE SELECTOR */}
              <div>
                <label style={{ fontSize: '10px', color: '#778ca7', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>ASSIGN TO MEMBER</label>
                <select
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '9px', border: '1px solid #294365', background: '#091322', color: '#fff', fontSize: '14px', outline: 'none' }}
                >
                  <option value="Shruti Mehta">Myself (Shruti Mehta - Product Lead)</option>
                  {(selectedProject?.members || defaultMembers).map((m, idx) => (
                    <option key={idx} value={m.name}>{m.name} ({m.role})</option>
                  ))}
                </select>
              </div>

              {/* TASK DEADLINE: DATE WITH TIME PICKER */}
              <div style={{ border: '1px solid #1c3352', borderRadius: '12px', padding: '14px', background: '#091324' }}>
                <label style={{ fontSize: '10px', color: '#7697bf', display: 'block', marginBottom: '8px', fontWeight: 'bold', letterSpacing: '1px' }}>
                  TASK DEADLINE (DATE WITH TIME)
                </label>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '9px', color: '#687c97', display: 'block', marginBottom: '3px' }}>DEADLINE DATE</label>
                    <select
                      value={newTaskDayOption}
                      onChange={(e) => setNewTaskDayOption(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #294365', background: '#0c1a2d', color: '#fff', fontSize: '13px', outline: 'none', marginBottom: newTaskDayOption === 'Custom' ? '8px' : '0' }}
                    >
                      <option value="Today">Today</option>
                      <option value="Tomorrow">Tomorrow</option>
                      <option value="Custom">Custom Date...</option>
                    </select>

                    {newTaskDayOption === 'Custom' && (
                      <input 
                        type="date"
                        value={newTaskCustomDate}
                        onChange={(e) => setNewTaskCustomDate(e.target.value)}
                        style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #294365', background: '#0c1a2d', color: '#fff', fontSize: '13px', outline: 'none' }}
                      />
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '9px', color: '#687c97', display: 'block', marginBottom: '3px' }}>DEADLINE TIME</label>
                    <input 
                      type="time"
                      value={newTaskTime}
                      onChange={(e) => setNewTaskTime(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #294365', background: '#0c1a2d', color: '#fff', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '10px', color: '#778ca7', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>PRIORITY LEVEL</label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '9px', border: '1px solid #294365', background: '#091322', color: '#fff', fontSize: '14px', outline: 'none' }}
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="ghost-button" style={{ padding: '10px 16px', color: '#91a3bb', background: 'none', border: 0, cursor: 'pointer' }} onClick={() => setShowNewTaskModal(false)}>Cancel</button>
                <button type="submit" className="primary-button">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAi && (
        <div className="modal-backdrop" onClick={() => setShowAi(false)}>
          <div className="ai-drawer" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" onClick={() => setShowAi(false)}>×</button>
            <div className="ai-drawer-heading">
              <div className="ai-orb small">✦</div>
              <div>
                <div className="section-kicker">GROUPIFY AI</div>
                <h2>Ask your project</h2>
              </div>
            </div>
            <p className="ai-intro">I’ve read through your project context. What would you like to figure out?</p>
            <div className="ai-messages" aria-live="polite">
              {aiMessages.length === 0 && (
                <div className="prompt-list">
                  {['What should I work on next?', 'What is blocking our progress?', 'Summarize this project'].map((prompt) => (
                    <button key={prompt} onClick={() => sendAiMessage(prompt)}>{prompt}<span>↗</span></button>
                  ))}
                </div>
              )}
              {aiMessages.map((message, index) => (
                <div className={`ai-message ${message.role}`} key={`${message.role}-${index}`}>
                  {message.text}
                </div>
              ))}
              {isAiThinking && <div className="ai-message assistant thinking">Thinking...</div>}
            </div>
            <form className="ai-input" onSubmit={(event) => { event.preventDefault(); sendAiMessage() }}>
              <input
                value={aiInput}
                onChange={(event) => setAiInput(event.target.value)}
                placeholder="Ask anything about your workspace..."
                aria-label="Ask Groupify AI"
                disabled={isAiThinking}
              />
              <button type="submit" aria-label="Send message" disabled={!aiInput.trim() || isAiThinking}>↑</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
