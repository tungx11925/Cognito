/**
 * Migration: 1790100000000_soft_remove_school_tables.js
 * Stage 1 of Two-Stage Removal (Rule 0.1.4): Soft-remove School/LMS tables.
 * Renames existing School tables to _deprecated_* before hard delete in Stage 2.
 */

exports.up = (pgm) => {
  const schoolTables = [
    'attempt_answers',
    'assignment_attempts',
    'class_assignments',
    'class_teacher_assignments',
    'class_enrollments',
    'organization_members',
    'school_classes',
    'subjects',
    'semesters',
    'academic_years',
    'majors',
    'organizations'
  ];

  schoolTables.forEach((table) => {
    pgm.sql(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = '${table}'
        ) THEN
          ALTER TABLE "${table}" RENAME TO "_deprecated_${table}";
        END IF;
      END $$;
    `);
  });
};

exports.down = (pgm) => {
  const schoolTables = [
    'organizations',
    'majors',
    'academic_years',
    'semesters',
    'subjects',
    'school_classes',
    'organization_members',
    'class_enrollments',
    'class_teacher_assignments',
    'class_assignments',
    'assignment_attempts',
    'attempt_answers'
  ];

  schoolTables.forEach((table) => {
    pgm.sql(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = '_deprecated_${table}'
        ) THEN
          ALTER TABLE "_deprecated_${table}" RENAME TO "${table}";
        END IF;
      END $$;
    `);
  });
};
