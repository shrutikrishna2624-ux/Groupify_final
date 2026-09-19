class TaskModel {
  final String id;
  final String title;
  final String projectId;
  final String projectName;
  final String assignedMemberId;
  final String priority;
  final String status;
  final String dueLabel;
  final int estimatedHours;
  final String description;

  const TaskModel({
    required this.id,
    required this.title,
    required this.projectId,
    required this.projectName,
    required this.assignedMemberId,
    required this.priority,
    required this.status,
    required this.dueLabel,
    required this.estimatedHours,
    required this.description,
  });
}
