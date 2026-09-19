import 'package:flutter/material.dart';

import '../models/project_model.dart';
import '../theme/app_theme.dart';

class ProjectCard extends StatelessWidget {
  final ProjectModel project;
  final VoidCallback onTap;

  const ProjectCard({
    super.key,
    required this.project,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(18),
        decoration: AppTheme.panelDecoration,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  project.name,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.text,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: project.status == 'At Risk'
                        ? const Color(0xFFFF6B6B).withValues(alpha: 0.18)
                        : const Color(0xFF50D4A5).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    project.status,
                    style: TextStyle(
                      color: project.status == 'At Risk' ? const Color(0xFFFF8A8A) : const Color(0xFF72F0C5),
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _SmallPill(label: project.category),
                const SizedBox(width: 8),
                _SmallPill(label: '${project.teamSize} members'),
              ],
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                const Expanded(
                  child: Text(
                    'Progress',
                    style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                  ),
                ),
                Text(
                  '${(project.progress * 100).round()}%',
                  style: const TextStyle(
                    color: AppTheme.text,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: LinearProgressIndicator(
                value: project.progress,
                minHeight: 8,
                backgroundColor: AppTheme.panelLight,
                valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.accent),
              ),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                const Icon(Icons.task_alt_rounded, size: 14, color: AppTheme.textMuted),
                const SizedBox(width: 6),
                Text(
                  '${project.completedTasks} / ${project.totalTasks} tasks',
                  style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                ),
                const Spacer(),
                const Icon(Icons.calendar_today_rounded, size: 14, color: AppTheme.textMuted),
                const SizedBox(width: 6),
                Text(
                  project.deadlineLabel,
                  style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: List.generate(
                    project.members.length,
                    (index) {
                      final member = project.members[index];
                      final showExtra = index == project.members.length - 1 && project.members.length > 3;
                      return Container(
                        margin: const EdgeInsets.only(right: 6),
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: member.accent,
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(color: AppTheme.panel, width: 2),
                        ),
                        alignment: Alignment.center,
                        child: showExtra ? const Icon(Icons.more_horiz, size: 12) : Text(member.initials, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700)),
                      );
                    },
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.accent.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.arrow_forward_rounded, color: AppTheme.accent),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _SmallPill extends StatelessWidget {
  final String label;

  const _SmallPill({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: AppTheme.panelLight,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: const TextStyle(color: AppTheme.textMuted, fontSize: 11),
      ),
    );
  }
}
