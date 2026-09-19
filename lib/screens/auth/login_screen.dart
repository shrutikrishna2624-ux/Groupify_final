import 'package:flutter/material.dart';

import '../../services/supabase_service.dart';
import '../../theme/app_theme.dart';
import '../home/home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  // =========================
  // LOGIN
  // =========================

  Future<void> _login() async {
    if (!_validateFields()) return;

    setState(() => _isLoading = true);

    try {
      final response =
          await SupabaseService.client.auth.signInWithPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );

      if (!mounted) return;

      if (response.user != null) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => const HomeScreen(),
          ),
        );
      } else {
        _showMessage(
          'Login was not completed. Please try again.',
        );
      }
    } on Exception catch (error) {
      if (mounted) {
        _showMessage(
          _cleanErrorMessage(error.toString()),
        );
      }
    } catch (_) {
      if (mounted) {
        _showMessage(
          'Unable to log in. Check your connection and try again.',
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  // =========================
  // SIGN UP
  // =========================

  Future<void> _signUp() async {
    if (!_validateFields()) return;

    final nameController = TextEditingController();

    final name = await showDialog<String>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Create your account'),
          content: TextField(
            controller: nameController,
            autofocus: true,
            textCapitalization: TextCapitalization.words,
            decoration: const InputDecoration(
              hintText: 'Enter your name',
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(dialogContext).pop();
              },
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                final enteredName =
                    nameController.text.trim();

                if (enteredName.isEmpty) {
                  return;
                }

                Navigator.of(dialogContext).pop(
                  enteredName,
                );
              },
              child: const Text('Continue'),
            ),
          ],
        );
      },
    );

    nameController.dispose();

    if (name == null || name.trim().isEmpty) {
      return;
    }

    setState(() => _isLoading = true);

    try {
      final email = _emailController.text.trim();
      final password = _passwordController.text;

      // Create Supabase authentication account.
      final response =
          await SupabaseService.client.auth.signUp(
        email: email,
        password: password,
        data: {
          'name': name.trim(),
        },
      );

      if (!mounted) return;

      if (response.user != null) {
        final user = response.user!;

        // Create/update the user's profile.
        await SupabaseService.client
            .from('profiles')
            .upsert({
          'id': user.id,
          'name': name.trim(),
          'email': email,
          'role': 'Student',
          'initials': _getInitials(name),
        });

        if (!mounted) return;

        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => const HomeScreen(),
          ),
        );
      } else {
        _showMessage(
          'Account created. Please check your email to confirm your account.',
        );
      }
    } on Exception catch (error) {
      if (mounted) {
        _showMessage(
          _cleanErrorMessage(error.toString()),
        );
      }
    } catch (_) {
      if (mounted) {
        _showMessage(
          'Unable to create your account. Please try again.',
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  // =========================
  // VALIDATION
  // =========================

  bool _validateFields() {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (!email.contains('@')) {
      _showMessage(
        'Enter a valid email address.',
      );
      return false;
    }

    if (password.length < 6) {
      _showMessage(
        'Password must contain at least 6 characters.',
      );
      return false;
    }

    return true;
  }

  // =========================
  // INITIALS
  // =========================

  String _getInitials(String name) {
    final parts =
        name.trim().split(RegExp(r'\s+'));

    if (parts.isEmpty || parts[0].isEmpty) {
      return '';
    }

    if (parts.length == 1) {
      return parts[0][0].toUpperCase();
    }

    return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
  }

  // =========================
  // ERROR MESSAGE
  // =========================

  String _cleanErrorMessage(String error) {
    if (error.contains('Invalid login credentials')) {
      return 'Incorrect email or password.';
    }

    if (error.contains('User already registered')) {
      return 'An account with this email already exists.';
    }

    if (error.contains('Email not confirmed')) {
      return 'Please confirm your email before logging in.';
    }

    return error
        .replaceFirst('Exception: ', '')
        .trim();
  }

  // =========================
  // SNACKBAR
  // =========================

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(message),
        ),
      );
  }

  // =========================
  // UI
  // =========================

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFF071C2E),
              Color(0xFF0A2B3F),
              Color(0xFF04182A),
            ],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: 26,
            ),
            child: Column(
              crossAxisAlignment:
                  CrossAxisAlignment.start,
              children: [
                const Spacer(flex: 1),

                const Text(
                  'Groupify',
                  style: TextStyle(
                    fontSize: 30,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.text,
                  ),
                ),

                const SizedBox(height: 10),

                const Text(
                  'Your student project hub',
                  style: TextStyle(
                    fontSize: 16,
                    color: AppTheme.textMuted,
                  ),
                ),

                const Spacer(flex: 1),

                Container(
                  padding: const EdgeInsets.all(22),
                  decoration:
                      AppTheme.panelDecoration,
                  child: Column(
                    crossAxisAlignment:
                        CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Welcome back',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.text,
                        ),
                      ),

                      const SizedBox(height: 18),

                      TextField(
                        controller:
                            _emailController,
                        keyboardType:
                            TextInputType.emailAddress,
                        decoration:
                            const InputDecoration(
                          hintText: 'Email',
                        ),
                      ),

                      const SizedBox(height: 14),

                      TextField(
                        controller:
                            _passwordController,
                        obscureText: true,
                        decoration:
                            const InputDecoration(
                          hintText: 'Password',
                        ),
                      ),

                      const SizedBox(height: 18),

                      Align(
                        alignment:
                            Alignment.centerRight,
                        child: TextButton(
                          onPressed: () {},
                          child: const Text(
                            'Forgot password?',
                            style: TextStyle(
                              color: AppTheme.accent,
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 18),

                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed:
                              _isLoading
                                  ? null
                                  : _login,
                          style:
                              ElevatedButton.styleFrom(
                            padding:
                                const EdgeInsets
                                    .symmetric(
                              vertical: 18,
                            ),
                            backgroundColor:
                                AppTheme.accent,
                            foregroundColor:
                                Colors.white,
                            shape:
                                RoundedRectangleBorder(
                              borderRadius:
                                  BorderRadius.circular(
                                18,
                              ),
                            ),
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child:
                                      CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color:
                                        Colors.white,
                                  ),
                                )
                              : const Text(
                                  'Login',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight:
                                        FontWeight.w700,
                                  ),
                                ),
                        ),
                      ),

                      const SizedBox(height: 18),

                      Row(
                        children: [
                          const Expanded(
                            child: Divider(
                              color:
                                  AppTheme.border,
                            ),
                          ),
                          Padding(
                            padding:
                                const EdgeInsets
                                    .symmetric(
                              horizontal: 12,
                            ),
                            child: Text(
                              'OR',
                              style: TextStyle(
                                color:
                                    AppTheme.textMuted,
                                fontSize: 12,
                                letterSpacing: 1.2,
                              ),
                            ),
                          ),
                          const Expanded(
                            child: Divider(
                              color:
                                  AppTheme.border,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 18),

                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton(
                          onPressed:
                              _isLoading
                                  ? null
                                  : _signUp,
                          style:
                              OutlinedButton.styleFrom(
                            side:
                                const BorderSide(
                              color:
                                  AppTheme.border,
                            ),
                            padding:
                                const EdgeInsets
                                    .symmetric(
                              vertical: 18,
                            ),
                            shape:
                                RoundedRectangleBorder(
                              borderRadius:
                                  BorderRadius.circular(
                                18,
                              ),
                            ),
                          ),
                          child: const Text(
                            'Create account',
                            style: TextStyle(
                              color:
                                  AppTheme.text,
                              fontSize: 15,
                              fontWeight:
                                  FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                const Center(
                  child: Text(
                    'Demo user: Shruti • Computer Engineering Student',
                    style: TextStyle(
                      color: AppTheme.textMuted,
                      fontSize: 12,
                    ),
                  ),
                ),

                const Spacer(flex: 1),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
