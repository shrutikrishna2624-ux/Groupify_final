import 'package:flutter/material.dart';

import '../models/task_model.dart';
import '../theme/app_theme.dart';

class TaskCard extends StatelessWidget {
  final TaskModel task;
  final bool compact;
  final VoidCallback? onTap;

  const TaskCard({
    super.key,
    required this.task,
    this.compact = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final priorityColor = switch (task.priority.toLowerCase()) {
      'high' => const Color(0xFFFF6D7A),
      'medium' => const Color(0xFFFFB261),
      _ => const Color(0xFF66D9A0),
    };

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.symmetric(horizontal: compact ? 16 : 18, vertical: compact ? 14 : 16),
      decoration: AppTheme.softPanelDecoration,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: compact ? 22 : 24,
            height: compact ? 22 : 24,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AppTheme.textMuted.withValues(alpha: 0.65), width: 2),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  task.title,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.text),
                ),
                const SizedBox(height: 6),
                Text(
                  '${task.projectName} • ${task.dueLabel}',
                  style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            decoration: BoxDecoration(
              color: priorityColor.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              task.priority.toUpperCase(),
              style: TextStyle(
                color: priorityColor,
                fontSize: 10,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
