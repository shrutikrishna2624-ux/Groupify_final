import 'package:flutter/material.dart';

import '../../data/mock_data.dart';
import '../../models/team_member_model.dart';
import '../../theme/app_theme.dart';
import '../../widgets/project_card.dart';
import 'project_workspace_screen.dart';

import '../../models/project_model.dart';

class ProjectsScreen extends StatelessWidget {
  final List<dynamic>? projects;
  const ProjectsScreen({super.key, this.projects});

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
                child: const Text('S', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
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
                      Text('Search anything...', style: TextStyle(color: AppTheme.textMuted, fontSize: 15)),
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
                child: const Icon(Icons.notifications_none_rounded, color: AppTheme.text),
              ),
            ],
          ),
          const SizedBox(height: 18),
          const Text('My Projects', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppTheme.text)),
          const SizedBox(height: 14),
          ...(projects ?? MockData.projects).map((project) {
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
                  MaterialPageRoute(builder: (_) => ProjectWorkspaceScreen(project: pModel)),
                );
              },
            );
          }),

        ],
      ),
    );
  }
}
