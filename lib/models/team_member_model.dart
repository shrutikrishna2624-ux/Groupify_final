import 'package:flutter/material.dart';

class TeamMemberModel {
  final String id;
  final String name;
  final String initials;
  final String role;
  final Color accent;
  final String status;

  const TeamMemberModel({
    required this.id,
    required this.name,
    required this.initials,
    required this.role,
    required this.accent,
    required this.status,
  });
}
