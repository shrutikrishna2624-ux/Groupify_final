class ProjectFileModel {
  final String id;
  final String name;
  final String type;
  final String uploadedBy;
  final String dateLabel;
  final String size;
  final String category;

  const ProjectFileModel({
    required this.id,
    required this.name,
    required this.type,
    required this.uploadedBy,
    required this.dateLabel,
    required this.size,
    required this.category,
  });
}
