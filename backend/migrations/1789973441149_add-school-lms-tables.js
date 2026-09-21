/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // 1. Create Enums
  pgm.sql(`
    DO $$ BEGIN
      CREATE TYPE academic_status AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    
    DO $$ BEGIN
      CREATE TYPE semester_status AS ENUM ('UPCOMING', 'OPEN_FOR_SETUP', 'ACTIVE', 'FINALIZING', 'CLOSED');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    
    DO $$ BEGIN
      CREATE TYPE enrollment_status AS ENUM ('ACTIVE', 'DROPPED', 'COMPLETED', 'TRANSFERRED');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    
    DO $$ BEGIN
      CREATE TYPE attempt_status AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'GRADED', 'ABANDONED');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  // 2. Academic Years
  pgm.createTable('academic_years', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    organization_id: {
      type: 'uuid',
      notNull: true,
      references: '"organizations"',
      onDelete: 'CASCADE',
    },
    name: { type: 'text', notNull: true }, // e.g., "2026-2027"
    start_date: { type: 'date' },
    end_date: { type: 'date' },
    status: { type: 'academic_status', default: 'ACTIVE' },
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
  });

  // 3. Semesters
  pgm.createTable('semesters', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    academic_year_id: {
      type: 'uuid',
      notNull: true,
      references: '"academic_years"',
      onDelete: 'CASCADE',
    },
    name: { type: 'text', notNull: true }, // e.g., "Semester 1"
    start_date: { type: 'date' },
    end_date: { type: 'date' },
    status: { type: 'semester_status', default: 'UPCOMING' },
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
  });

  // 4. Subjects
  pgm.createTable('subjects', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    organization_id: {
      type: 'uuid',
      notNull: true,
      references: '"organizations"',
      onDelete: 'CASCADE',
    },
    major_id: {
      type: 'uuid',
      references: '"majors"',
      onDelete: 'SET NULL',
    },
    code: { type: 'text', notNull: true },
    name: { type: 'text', notNull: true },
    credits: { type: 'integer' },
    status: { type: 'boolean', default: true },
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
  });

  // 5. Update school_classes
  pgm.addColumns('school_classes', {
    semester_id: {
      type: 'uuid',
      references: '"semesters"',
      onDelete: 'CASCADE',
    },
    subject_id: {
      type: 'uuid',
      references: '"subjects"',
      onDelete: 'SET NULL',
    }
  });

  // 6. Class Enrollments
  pgm.createTable('class_enrollments', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    class_id: {
      type: 'uuid',
      notNull: true,
      references: '"school_classes"',
      onDelete: 'CASCADE',
    },
    student_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    status: { type: 'enrollment_status', default: 'ACTIVE' },
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
  }, {
    constraints: {
      unique: ['class_id', 'student_id']
    }
  });

  // 7. Class Teacher Assignments
  pgm.createTable('class_teacher_assignments', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    class_id: {
      type: 'uuid',
      notNull: true,
      references: '"school_classes"',
      onDelete: 'CASCADE',
    },
    teacher_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    role: { type: 'text', default: 'LECTURER' }, // LECTURER, ASSISTANT
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
  }, {
    constraints: {
      unique: ['class_id', 'teacher_id']
    }
  });

  // 8. Update class_assignments (Exam settings)
  pgm.addColumns('class_assignments', {
    title: { type: 'text' },
    description: { type: 'text' },
    start_date: { type: 'timestamptz' },
    duration_minutes: { type: 'integer' },
    attempt_limit: { type: 'integer', default: 1 },
    access_code: { type: 'text' },
  });

  // 9. Assignment Attempts
  pgm.createTable('assignment_attempts', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    assignment_id: {
      type: 'uuid',
      notNull: true,
      references: '"class_assignments"',
      onDelete: 'CASCADE',
    },
    student_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    status: { type: 'attempt_status', default: 'IN_PROGRESS' },
    start_time: { type: 'timestamptz', default: pgm.func('now()') },
    end_time: { type: 'timestamptz' },
    score: { type: 'numeric(6,2)' },
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
  });

  // 10. Attempt Answers
  pgm.createTable('attempt_answers', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    attempt_id: {
      type: 'uuid',
      notNull: true,
      references: '"assignment_attempts"',
      onDelete: 'CASCADE',
    },
    question_id: {
      type: 'integer',
      notNull: true,
      references: '"questions"',
      onDelete: 'CASCADE',
    },
    selected_option: { type: 'jsonb' },
    is_correct: { type: 'boolean' },
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
  });

  // 11. Indexes for performance
  pgm.createIndex('academic_years', 'organization_id');
  pgm.createIndex('semesters', 'academic_year_id');
  pgm.createIndex('subjects', 'organization_id');
  pgm.createIndex('class_enrollments', 'student_id');
  pgm.createIndex('class_teacher_assignments', 'teacher_id');
  pgm.createIndex('assignment_attempts', 'student_id');
  pgm.createIndex('assignment_attempts', 'assignment_id');
  pgm.createIndex('attempt_answers', 'attempt_id');
};

exports.down = pgm => {
  pgm.dropIndex('attempt_answers', 'attempt_id');
  pgm.dropIndex('assignment_attempts', 'assignment_id');
  pgm.dropIndex('assignment_attempts', 'student_id');
  pgm.dropIndex('class_teacher_assignments', 'teacher_id');
  pgm.dropIndex('class_enrollments', 'student_id');
  pgm.dropIndex('subjects', 'organization_id');
  pgm.dropIndex('semesters', 'academic_year_id');
  pgm.dropIndex('academic_years', 'organization_id');

  pgm.dropTable('attempt_answers');
  pgm.dropTable('assignment_attempts');

  pgm.dropColumns('class_assignments', ['title', 'description', 'start_date', 'duration_minutes', 'attempt_limit', 'access_code']);
  
  pgm.dropTable('class_teacher_assignments');
  pgm.dropTable('class_enrollments');
  
  pgm.dropColumns('school_classes', ['semester_id', 'subject_id']);
  
  pgm.dropTable('subjects');
  pgm.dropTable('semesters');
  pgm.dropTable('academic_years');

  pgm.sql(`
    DROP TYPE IF EXISTS attempt_status;
    DROP TYPE IF EXISTS enrollment_status;
    DROP TYPE IF EXISTS semester_status;
    DROP TYPE IF EXISTS academic_status;
  `);
};
