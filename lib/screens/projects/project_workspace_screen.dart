import 'package:flutter/material.dart';

import '../../data/mock_data.dart';
import '../../models/project_model.dart';
import '../../theme/app_theme.dart';

class ProjectWorkspaceScreen extends StatefulWidget {
  final ProjectModel project;

  const ProjectWorkspaceScreen({super.key, required this.project});

  @override
  State<ProjectWorkspaceScreen> createState() => _ProjectWorkspaceScreenState();
}

class _ProjectWorkspaceScreenState extends State<ProjectWorkspaceScreen> {
  int _tabIndex = 0;

  @override
  Widget build(BuildContext context) {
    final tabs = ['Overview', 'Tasks', 'Chat', 'Files', 'Activity'];

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(18, 10, 18, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.arrow_back_rounded, color: AppTheme.text),
                  ),
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
              Container(
                padding: const EdgeInsets.all(18),
                decoration: AppTheme.panelDecoration,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.project.name,
                      style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppTheme.text),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${(widget.project.progress * 100).round()}% complete',
                      style: const TextStyle(fontSize: 14, color: AppTheme.textMuted),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        ...widget.project.members.take(4).map((member) => Container(
                          margin: const EdgeInsets.only(right: 8),
                          width: 30,
                          height: 30,
                          decoration: BoxDecoration(
                            color: member.accent,
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(color: AppTheme.panel, width: 2),
                          ),
                          alignment: Alignment.center,
                          child: Text(member.initials, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.white)),
                        )),
                        const Spacer(),
                        const Icon(Icons.calendar_today_rounded, color: AppTheme.textMuted, size: 16),
                        const SizedBox(width: 6),
                        Text(widget.project.deadlineLabel, style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(6),
                decoration: AppTheme.softPanelDecoration,
                child: Row(
                  children: List.generate(tabs.length, (index) {
                    final selected = index == _tabIndex;
                    return Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _tabIndex = index),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: selected ? AppTheme.accent : Colors.transparent,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            tabs[index],
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              color: selected ? Colors.white : AppTheme.textMuted,
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
                ),
              ),
              const SizedBox(height: 18),
              _buildTabContent(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTabContent() {
    switch (_tabIndex) {
      case 0:
        return Column(
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: AppTheme.panelDecoration,
              child: Column(
                children: [
                  const Icon(Icons.task_alt_rounded, color: AppTheme.accent, size: 40),
                  const SizedBox(height: 10),
                  Text(
                    '${(widget.project.progress * 100).round()}%',
                    style: const TextStyle(fontSize: 34, fontWeight: FontWeight.w800, color: AppTheme.text),
                  ),
                  const Text('complete', style: TextStyle(color: AppTheme.textMuted)),
                  const SizedBox(height: 16),
                  const Text('Project progress', style: TextStyle(fontSize: 14, color: AppTheme.textMuted)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(18),
              decoration: AppTheme.panelDecoration,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Who is working on what?', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.text)),
                  const SizedBox(height: 14),
                  ...widget.project.members.map((member) => Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(12),
                    decoration: AppTheme.softPanelDecoration,
                    child: Row(
                      children: [
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: member.accent,
                            borderRadius: BorderRadius.circular(999),
                          ),
                          alignment: Alignment.center,
                          child: Text(member.initials, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Colors.white)),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(member.name, style: const TextStyle(fontWeight: FontWeight.w700, color: AppTheme.text)),
                              const SizedBox(height: 2),
                              Text(member.role, style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                            ],
                          ),
                        ),
                        Text(
                          member.status,
                          style: TextStyle(
                            color: member.status == 'Completed' ? AppTheme.success : AppTheme.accent,
                            fontWeight: FontWeight.w700,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  )),
                ],
              ),
            ),
          ],
        );
      case 1:
        return Column(
          children: [
            ...MockData.tasks.take(4).map((task) => Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(14),
              decoration: AppTheme.panelDecoration,
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(task.title, style: const TextStyle(fontWeight: FontWeight.w700, color: AppTheme.text)),
                        const SizedBox(height: 6),
                        Text('${task.assignedMemberId} • ${task.priority}', style: const TextStyle(color: AppTheme.textMuted)),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppTheme.accent.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(task.status, style: const TextStyle(color: AppTheme.accent, fontSize: 11, fontWeight: FontWeight.w700)),
                  ),
                ],
              ),
            )),
          ],
        );
      case 2:
        return Container(
          decoration: AppTheme.panelDecoration,
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ...MockData.messages.map((message) => Align(
                alignment: message.isMine ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.72),
                  decoration: BoxDecoration(
                    color: message.isMine ? AppTheme.accent : AppTheme.panelSoft,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Text(
                    message.text,
                    style: TextStyle(color: message.isMine ? Colors.white : AppTheme.text, fontWeight: FontWeight.w500),
                  ),
                ),
              )),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      decoration: const InputDecoration(
                        hintText: 'Type a message...',
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  FloatingActionButton.small(
                    onPressed: () {},
                    child: const Icon(Icons.send_rounded),
                  ),
                ],
              ),
            ],
          ),
        );
      case 3:
        return Container(
          decoration: AppTheme.panelDecoration,
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              ...MockData.projectFiles.map((file) => Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(12),
                decoration: AppTheme.softPanelDecoration,
                child: Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: AppTheme.accent.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.insert_drive_file_rounded, color: AppTheme.accent),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(file.name, style: const TextStyle(fontWeight: FontWeight.w700, color: AppTheme.text)),
                          const SizedBox(height: 4),
                          Text('${file.type} • ${file.uploadedBy} • ${file.dateLabel}', style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                        ],
                      ),
                    ),
                    const Icon(Icons.more_horiz_rounded, color: AppTheme.textMuted),
                  ],
                ),
              )),
            ],
          ),
        );
      default:
        return Column(
          children: [
            ...MockData.activities.map((activity) => Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(14),
              decoration: AppTheme.panelDecoration,
              child: Row(
                children: [
                  Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color: AppTheme.accent,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(activity.title, style: const TextStyle(color: AppTheme.text, fontWeight: FontWeight.w600)),
                  ),
                  Text(activity.timeAgo, style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
                ],
              ),
            )),
          ],
        );
    }
  }
}
