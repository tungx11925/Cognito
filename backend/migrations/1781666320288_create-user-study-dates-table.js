/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async pgm => {
  await pgm.createTable('user_study_dates', {
    id: { type: 'serial', primaryKey: true },
    user_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    study_date: { type: 'date', notNull: true },
  }, { ifNotExists: true });

  await pgm.sql(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_study_date') THEN
        ALTER TABLE user_study_dates ADD CONSTRAINT unique_user_study_date UNIQUE (user_id, study_date);
      END IF;
    END $$;
  `);
};

exports.down = pgm => {
  pgm.dropTable('user_study_dates');
};
