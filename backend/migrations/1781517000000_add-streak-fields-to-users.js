exports.up = pgm => {
  pgm.addColumn('users', {
    streak: { type: 'integer', default: 0 },
    last_study_date: { type: 'timestamp', default: null }
  });
};

exports.down = pgm => {
  pgm.dropColumn('users', ['streak', 'last_study_date']);
};
