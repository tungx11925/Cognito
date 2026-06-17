/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable('user_study_dates', {
    id: { type: 'serial', primaryKey: true },
    user_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    study_date: { type: 'date', notNull: true },
  });
  pgm.addConstraint('user_study_dates', 'unique_user_study_date', {
    unique: ['user_id', 'study_date']
  });
};

exports.down = pgm => {
  pgm.dropTable('user_study_dates');
};
