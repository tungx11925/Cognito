/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('mindmaps', {
    id: 'id',
    document_id: {
      type: 'integer',
      notNull: true,
      references: '"documents"',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    mermaid_code: {
      type: 'text',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Unique constraint to allow ON CONFLICT (document_id, user_id)
  pgm.addConstraint('mindmaps', 'unique_document_user_mindmap', {
    unique: ['document_id', 'user_id'],
  });
};

exports.down = (pgm) => {
  pgm.dropTable('mindmaps');
};
