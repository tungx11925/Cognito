/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // 1. Cập nhật bảng users: thêm primary_organization_id
  pgm.addColumn('users', {
    primary_organization_id: { type: 'uuid' }
  });

  // 2. Bảng organizations
  pgm.createTable('organizations', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'text', notNull: true },
    school_code: { type: 'text', notNull: true, unique: true },
    is_active: { type: 'boolean', default: true },
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
  });

  // Tạo liên kết cho users.primary_organization_id (vì organizations vừa được tạo)
  pgm.addConstraint('users', 'fk_users_primary_organization', {
    foreignKeys: {
      columns: 'primary_organization_id',
      references: 'organizations(id)',
      onDelete: 'SET NULL',
    }
  });

  // 3. Bảng majors
  pgm.createTable('majors', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    organization_id: {
      type: 'uuid',
      notNull: true,
      references: '"organizations"',
      onDelete: 'CASCADE',
    },
    name: { type: 'text', notNull: true },
    code: { type: 'text' },
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
  });

  // 4. Bảng school_classes
  pgm.createTable('school_classes', {
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
    },
    name: { type: 'text', notNull: true },
    homeroom_teacher_id: {
      type: 'integer', // Chú ý: bảng users dùng id kiểu int (serial)
      references: '"users"',
    },
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
  });

  // 5. Bảng organization_members
  pgm.createTable('organization_members', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    organization_id: {
      type: 'uuid',
      notNull: true,
      references: '"organizations"',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: 'integer', // Chú ý: bảng users dùng id kiểu int (serial)
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    org_role: { type: 'text', notNull: true }, // school_admin | teacher | student
    class_id: {
      type: 'uuid',
      references: '"school_classes"',
    },
    student_code: { type: 'text' },
    status: { type: 'text', notNull: true, default: 'ACTIVE' }, // PENDING_FIRST_LOGIN | ACTIVE | DISABLED
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
  }, {
    constraints: {
      unique: ['organization_id', 'user_id']
    }
  });

  // 6. Bảng class_assignments
  pgm.createTable('class_assignments', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    class_id: {
      type: 'uuid',
      notNull: true,
      references: '"school_classes"',
      onDelete: 'CASCADE',
    },
    test_set_id: {
      type: 'integer', // Chú ý: test_sets dùng id kiểu int (serial)
      references: '"test_sets"',
    },
    document_id: {
      type: 'integer', // Chú ý: documents dùng id kiểu int (serial)
      references: '"documents"',
    },
    assigned_by: {
      type: 'integer', // Chú ý: users dùng id kiểu int (serial)
      notNull: true,
      references: '"users"',
    },
    due_date: { type: 'timestamptz' },
    is_mandatory: { type: 'boolean', default: false },
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
  });

  // 7. Tạo Indexes để tăng tốc độ truy vấn
  pgm.createIndex('organization_members', 'organization_id');
  pgm.createIndex('organization_members', 'user_id');
  pgm.createIndex('organization_members', 'class_id');
  pgm.createIndex('organization_members', 'student_code');
  pgm.createIndex('organizations', 'school_code');
  pgm.createIndex('school_classes', 'organization_id');
  pgm.createIndex('class_assignments', 'class_id');
};

exports.down = pgm => {
  pgm.dropIndex('class_assignments', 'class_id');
  pgm.dropIndex('school_classes', 'organization_id');
  pgm.dropIndex('organizations', 'school_code');
  pgm.dropIndex('organization_members', 'student_code');
  pgm.dropIndex('organization_members', 'class_id');
  pgm.dropIndex('organization_members', 'user_id');
  pgm.dropIndex('organization_members', 'organization_id');

  pgm.dropTable('class_assignments');
  pgm.dropTable('organization_members');
  pgm.dropTable('school_classes');
  pgm.dropTable('majors');
  
  pgm.dropConstraint('users', 'fk_users_primary_organization');
  pgm.dropTable('organizations');
  
  pgm.dropColumn('users', 'primary_organization_id');
};
