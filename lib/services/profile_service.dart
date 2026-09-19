import 'package:supabase_flutter/supabase_flutter.dart';
import 'supabase_service.dart';

class ProfileService {
  static final SupabaseClient _client = SupabaseService.client;

  static Future<void> createProfile({
    required String name,
    required String email,
  }) async {
    final user = _client.auth.currentUser;

    if (user == null) {
      throw Exception('User is not logged in');
    }

    final initials = _getInitials(name);

    await _client.from('profiles').upsert({
      'id': user.id,
      'name': name,
      'email': email,
      'role': 'Student',
      'initials': initials,
    });
  }

  static String _getInitials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));

    if (parts.length == 1) {
      return parts[0].isNotEmpty
          ? parts[0][0].toUpperCase()
          : '';
    }

    return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
  }
}