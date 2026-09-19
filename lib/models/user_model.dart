import 'package:flutter/material.dart';

class UserModel {
  final String id;
  final String name;
  final String role;
  final String initials;
  final Color accent;

  const UserModel({
    required this.id,
    required this.name,
    required this.role,
    required this.initials,
    required this.accent,
  });
}
