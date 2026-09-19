import 'package:flutter/material.dart';

import '../../data/mock_data.dart';
import '../../models/project_model.dart';
import '../../models/task_model.dart';
import '../../models/team_member_model.dart';
import '../../theme/app_theme.dart';
import '../../widgets/bottom_nav_bar.dart';
import '../../widgets/project_card.dart';
import '../../widgets/task_card.dart';
import '../projects/project_workspace_screen.dart';
import '../projects/projects_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  // Lifted state so changes persist and reflect across tabs
  late final List<dynamic> _projectsList = List.from(MockData.projects);
  late final List<dynamic> _tasksList = List.from(MockData.tasks);

  // 1. Show the Quick Add bottom sheet
  void _showQuickAddSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (BuildContext context) {
        return Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: AppTheme.panelSoft,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            border: Border.all(color: Colors.white12),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'QUICK ADD',
                style: TextStyle(
                  color: AppTheme.textMuted,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'What are we building?',
                style: TextStyle(
                  color: AppTheme.text,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),

              // Grid of 4 options
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 2.2,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  _QuickAddButton(
                    icon: Icons.add,
                    label: 'New task',
                    onTap: () {
                      Navigator.pop(context);
                      _showTaskInputDialog();
                    },
                  ),
                  _QuickAddButton(
                    icon: Icons.diamond_outlined,
                    label: 'New project',
                    onTap: () {
                      Navigator.pop(context); // Close the quick add sheet
                      _showProjectNameInputDialog(); // Open text input dialog
                    },
                  ),
                  _QuickAddButton(
                    icon: Icons.schedule_rounded,
                    label: 'Schedule meeting',
                    onTap: () {
                      Navigator.pop(context);
                    },
                  ),
                  _QuickAddButton(
                    icon: Icons.note_alt_outlined,
                    label: 'Add note',
                    onTap: () {
                      Navigator.pop(context);
                    },
                  ),
                ],
              ),
              const SizedBox(height: 20),
            ],
          ),
        );
      },
    );
  }

  // 2. Open text input dialog to write the project name
  void _showProjectNameInputDialog() {
    final TextEditingController nameController = TextEditingController();

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: AppTheme.panelSoft,
          title: const Text(
            'Name your new project',
            style: TextStyle(color: AppTheme.text),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                style: const TextStyle(color: AppTheme.text),
                decoration: const InputDecoration(
                  hintText: 'e.g. Smart Architecture',
                  hintStyle: TextStyle(color: AppTheme.textMuted),
                  enabledBorder: UnderlineInputBorder(
                    borderSide: BorderSide(color: AppTheme.accent),
                  ),
                  focusedBorder: UnderlineInputBorder(
                    borderSide: BorderSide(color: AppTheme.accent),
                  ),
                ),
                autofocus: true,
              ),
            ],
          ),
          actions: [
            TextButton(
              child: const Text(
                'Cancel',
                style: TextStyle(color: AppTheme.textMuted),
              ),
              onPressed: () => Navigator.of(context).pop(),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.accent),
              child: const Text(
                'Submit & Create',
                style: TextStyle(color: Colors.white),
              ),
              onPressed: () {
                if (nameController.text.trim().isNotEmpty) {
                  setState(() {
                    final newProject = ProjectModel(
                      id: DateTime.now().millisecondsSinceEpoch.toString(),
                      name: nameController.text.trim(),
                      description: 'Newly created project',
                      category: 'College',
                      status: 'On Track',
                      deadlineLabel: '30 Sept',
                      progress: 0.0,
                      completedTasks: 0,
                      totalTasks: 5,
                      teamSize: 1,
                      members: [
                        TeamMemberModel(
                          id: MockData.currentUser.id,
                          name: MockData.currentUser.name,
                          initials: MockData.currentUser.initials,
                          role: MockData.currentUser.role,
                          accent: MockData.currentUser.accent,
                          status: 'In Progress',
                        ),
                      ],
                    );
                    _projectsList.insert(0, newProject);
                    _selectedIndex =
                        1; // Switch to Projects tab (index 1) to see it
                  });
                  Navigator.of(context).pop();
                }
              },
            ),
          ],
        );
      },
    );
  }

  // 3. Open task input dialog
  void _showTaskInputDialog() {
    final TextEditingController taskController = TextEditingController();

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: AppTheme.panelSoft,
          title: const Text(
            'Add new task',
            style: TextStyle(color: AppTheme.text),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: taskController,
                style: const TextStyle(color: AppTheme.text),
                decoration: const InputDecoration(
                  hintText: 'e.g. Finish API integration',
                  hintStyle: TextStyle(color: AppTheme.textMuted),
                  enabledBorder: UnderlineInputBorder(
                    borderSide: BorderSide(color: AppTheme.accent),
                  ),
                  focusedBorder: UnderlineInputBorder(
                    borderSide: BorderSide(color: AppTheme.accent),
                  ),
                ),
                autofocus: true,
              ),
            ],
          ),
          actions: [
            TextButton(
              child: const Text(
                'Cancel',
                style: TextStyle(color: AppTheme.textMuted),
              ),
              onPressed: () => Navigator.of(context).pop(),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.accent),
              child: const Text(
                'Add Task',
                style: TextStyle(color: Colors.white),
              ),
              onPressed: () {
                if (taskController.text.trim().isNotEmpty) {
                  setState(() {
                    final newTask = TaskModel(
                      id: DateTime.now().millisecondsSinceEpoch.toString(),
                      title: taskController.text.trim(),
                      projectId: 'project-1',
                      projectName: 'General Work',
                      assignedMemberId: 'shruti',
                      priority: 'High',
                      status: 'To Do',
                      dueLabel: 'Today',
                      estimatedHours: 2,
                      description: 'Newly created task',
                    );
                    _tasksList.insert(0, newTask);
                  });
                  Navigator.of(context).pop();
                }
              },
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      _HomeTab(
        projects: _projectsList,
        tasks: _tasksList,
        onCreateProjectTap: _showQuickAddSheet,
      ),
      ProjectsScreen(projects: _projectsList),
      const _PlaceholderPage(label: 'Create'),
      const _PlaceholderPage(label: 'Tasks'),
      const _PlaceholderPage(label: 'AI'),
    ];

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(child: pages[_selectedIndex == 2 ? 0 : _selectedIndex]),
      bottomNavigationBar: BottomNavBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          if (index == 2) {
            _showQuickAddSheet();
          } else {
            setState(() => _selectedIndex = index);
          }
        },
      ),
    );
  }
}

class _HomeTab extends StatelessWidget {
  final List<dynamic> projects;
  final List<dynamic> tasks;
  final VoidCallback onCreateProjectTap;

  const _HomeTab({
    required this.projects,
    required this.tasks,
    required this.onCreateProjectTap,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(18, 10, 18, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: const BoxDecoration(
                  color: AppTheme.accent,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: const Text(
                  'S',
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  height: 42,
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(
                    color: AppTheme.panelSoft,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Row(
                    children: const [
                      Icon(Icons.search_rounded, color: AppTheme.textMuted),
                      SizedBox(width: 8),
                      Text(
                        'Search anything...',
                        style: TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 15,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Container(
                width: 40,
                height: 40,
                decoration: const BoxDecoration(
                  color: AppTheme.panelSoft,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.notifications_none_rounded,
                  color: AppTheme.text,
                ),
              ),
            ],
          ),
          const SizedBox(height: 22),
          const Text(
            'Good evening, Shruti 👋',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: AppTheme.text,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            "Here's what needs your attention.",
            style: TextStyle(fontSize: 16, color: AppTheme.textMuted),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: _StatChip(
                  value: '${projects.length}',
                  label: 'Projects',
                ),
              ),
              Expanded(
                child: _StatChip(value: '${tasks.length}', label: 'Tasks'),
              ),
              const Expanded(
                child: _StatChip(value: '3', label: 'Due soon'),
              ),
            ],
          ),
          const SizedBox(height: 22),
          Container(
            padding: const EdgeInsets.all(18),
            decoration: AppTheme.panelDecoration,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: const [
                    Icon(Icons.auto_awesome_rounded, color: AppTheme.accent),
                    SizedBox(width: 8),
                    Text(
                      'AI Priority',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.text,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                const Text(
                  'You have 3 deadlines this week. Your Smart Architecture project needs attention first because its documentation is only 45% complete.',
                  style: TextStyle(
                    fontSize: 15,
                    color: AppTheme.text,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: onCreateProjectTap,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.accent,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: const Text('View Priorities'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {},
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppTheme.accent,
                          side: const BorderSide(color: AppTheme.accent),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: const Text('Ask AI'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 26),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'TODAY',
                style: TextStyle(
                  letterSpacing: 1.2,
                  color: AppTheme.textMuted,
                  fontWeight: FontWeight.w800,
                ),
              ),
              TextButton(
                onPressed: () {},
                child: const Text(
                  'All tasks',
                  style: TextStyle(
                    color: AppTheme.accent,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ...tasks
              .take(4)
              .map(
                (task) => TaskCard(
                  task: task is TaskModel
                      ? task
                      : TaskModel(
                          id: task['id'] ?? '1',
                          title: task['title'] ?? '',
                          projectId: 'p1',
                          projectName: 'Project',
                          assignedMemberId: 'shruti',
                          priority: 'High',
                          status: 'To Do',
                          dueLabel: 'Today',
                          estimatedHours: 2,
                          description: '',
                        ),
                  compact: true,
                ),
              ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Active projects',
                style: TextStyle(
                  color: AppTheme.textMuted,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.2,
                ),
              ),
              IconButton(
                icon: const Icon(
                  Icons.add_circle_outline,
                  color: AppTheme.accent,
                ),
                onPressed: onCreateProjectTap,
              ),
            ],
          ),
          const SizedBox(height: 10),
          ...projects.take(4).map((project) {
            final pModel = project is ProjectModel
                ? project
                : ProjectModel(
                    id: project['id'] ?? '',
                    name: project['name'] ?? '',
                    description: 'Custom created project',
                    category: project['category'] ?? 'College',
                    status: project['status'] ?? 'On Track',
                    deadlineLabel: project['deadlineLabel'] ?? 'Soon',
                    progress: (project['progress'] as num?)?.toDouble() ?? 0.0,
                    completedTasks: 0,
                    totalTasks: 5,
                    teamSize: 1,
                    members: [
                      TeamMemberModel(
                        id: MockData.currentUser.id,
                        name: MockData.currentUser.name,
                        initials: MockData.currentUser.initials,
                        role: MockData.currentUser.role,
                        accent: MockData.currentUser.accent,
                        status: 'In Progress',
                      ),
                    ],
                  );
            return ProjectCard(
              project: pModel,
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => ProjectWorkspaceScreen(project: pModel),
                  ),
                );
              },
            );
          }),
        ],
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final String value;
  final String label;

  const _StatChip({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: AppTheme.panelDecoration,
      child: Column(
        children: [
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: AppTheme.text,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              color: AppTheme.textMuted,
              letterSpacing: 1.1,
            ),
          ),
        ],
      ),
    );
  }
}

class _PlaceholderPage extends StatelessWidget {
  final String label;

  const _PlaceholderPage({required this.label});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.w800,
          color: AppTheme.text,
        ),
      ),
    );
  }
}

class _QuickAddButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _QuickAddButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.03),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Row(
          children: [
            Icon(icon, color: AppTheme.accent, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  color: AppTheme.text,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
