import 'team_member_model.dart';

class ProjectModel {
  final String id;
  final String name;
  final String description;
  final String category;
  final String status;
  final String deadlineLabel;
  final double progress;
  final int completedTasks;
  final int totalTasks;
  final int teamSize;
  final List<TeamMemberModel> members;

  const ProjectModel({
    required this.id,
    required this.name,
    required this.description,
    required this.category,
    required this.status,
    required this.deadlineLabel,
    required this.progress,
    required this.completedTasks,
    required this.totalTasks,
    required this.teamSize,
    required this.members,
  });
}
