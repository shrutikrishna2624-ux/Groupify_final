import 'package:flutter/material.dart';

class AppTheme {
  static const Color background = Color(0xFF031A2D);
  static const Color backgroundDeep = Color(0xFF061E35);
  static const Color panel = Color(0xFF0E2B42);
  static const Color panelSoft = Color(0xFF123657);
  static const Color panelLight = Color(0xFF1A3E5E);
  static const Color accent = Color(0xFF3DD9FF);
  static const Color accentStrong = Color(0xFF1CA9FF);
  static const Color success = Color(0xFF55E3B2);
  static const Color warning = Color(0xFFF5B86E);
  static const Color danger = Color(0xFFFF5C7A);
  static const Color text = Color(0xFFEAF7FF);
  static const Color textMuted = Color(0xFF9BB7CB);
  static const Color border = Color(0xFF3A5E7D);

  static ThemeData theme() {
    return ThemeData(
      scaffoldBackgroundColor: background,
      primaryColor: accent,
      colorScheme: ColorScheme.fromSeed(
        seedColor: accent,
        brightness: Brightness.dark,
        primary: accent,
        secondary: accentStrong,
      ),
      fontFamily: 'SFProDisplay',
      textTheme: const TextTheme(
        displayLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: text),
        displayMedium: TextStyle(fontSize: 26, fontWeight: FontWeight.w700, color: text),
        headlineMedium: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: text),
        titleLarge: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: text),
        titleMedium: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: text),
        bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: text),
        bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: text),
        bodySmall: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: textMuted),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: text,
        elevation: 0,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: panelSoft,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(color: accent, width: 1.5),
        ),
        hintStyle: const TextStyle(color: textMuted),
        labelStyle: const TextStyle(color: textMuted),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: accent,
        foregroundColor: Colors.white,
      ),
    );
  }

  static BoxDecoration panelDecoration = BoxDecoration(
    color: panel,
    borderRadius: BorderRadius.circular(24),
    border: Border.all(color: border.withValues(alpha: 0.35)),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withValues(alpha: 0.18),
        blurRadius: 18,
        offset: const Offset(0, 8),
      ),
    ],
  );

  static BoxDecoration softPanelDecoration = BoxDecoration(
    color: panelSoft,
    borderRadius: BorderRadius.circular(22),
    border: Border.all(color: border.withValues(alpha: 0.2)),
  );
}
