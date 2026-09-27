/**
 * Migration: 1790200000000_drop_deprecated_school_tables.js
 * Stage 2 of Two-Stage Removal (Rule 0.1.4): Hard Delete deprecated School/LMS tables & enums.
 * Executed after Stage 1 (soft-remove) passed a full round of build and static analysis tests.
 */

exports.up = (pgm) => {
  const deprecatedTables = [
    '_deprecated_attempt_answers',
    '_deprecated_assignment_attempts',
    '_deprecated_class_assignments',
    '_deprecated_class_teacher_assignments',
    '_deprecated_class_enrollments',
    '_deprecated_organization_members',
    '_deprecated_school_classes',
    '_deprecated_subjects',
    '_deprecated_semesters',
    '_deprecated_academic_years',
    '_deprecated_majors',
    '_deprecated_organizations'
  ];

  deprecatedTables.forEach((table) => {
    pgm.sql(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
  });

  const deprecatedEnums = [
    'academic_status',
    'semester_status',
    'enrollment_status',
    'attempt_status'
  ];

  deprecatedEnums.forEach((enumType) => {
    pgm.sql(`DROP TYPE IF EXISTS "${enumType}" CASCADE;`);
  });
};

exports.down = (pgm) => {
  // Irreversible hard removal of obsolete School/LMS subsystem
  pgm.sql('-- Irreversible cleanup of obsolete school tables');
};
