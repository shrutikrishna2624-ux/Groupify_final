import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

class BottomNavBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const BottomNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final items = [
      _NavItem(icon: Icons.home_rounded, label: 'Home'),
      _NavItem(icon: Icons.folder_rounded, label: 'Projects'),
      _NavItem(icon: Icons.add_rounded, label: 'Create', isPrimary: true),
      _NavItem(icon: Icons.checklist_rounded, label: 'Tasks'),
      _NavItem(icon: Icons.auto_awesome_rounded, label: 'AI'),
    ];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppTheme.background,
        border: Border(top: BorderSide(color: AppTheme.border.withValues(alpha: 0.2))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: List.generate(items.length, (index) {
          final item = items[index];
          final isSelected = index == currentIndex;

          if (item.isPrimary) {
            return GestureDetector(
              onTap: () => onTap(index),
              child: Container(
                width: 58,
                height: 58,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF44C7FF), Color(0xFF35A1FF)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF44C7FF).withValues(alpha: 0.55),
                      blurRadius: 18,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: const Icon(Icons.add_rounded, size: 30, color: Colors.white),
              ),
            );
          }

          return GestureDetector(
            onTap: () => onTap(index),
            child: SizedBox(
              width: 60,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    item.icon,
                    size: 25,
                    color: isSelected ? AppTheme.accent : Colors.white.withValues(alpha: 0.75),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.label,
                    style: TextStyle(
                      fontSize: 11,
                      color: isSelected ? AppTheme.accent : Colors.white.withValues(alpha: 0.75),
                      fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final String label;
  final bool isPrimary;

  const _NavItem({required this.icon, required this.label, this.isPrimary = false});
}
