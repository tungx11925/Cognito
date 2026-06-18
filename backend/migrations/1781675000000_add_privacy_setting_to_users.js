exports.up = (pgm) => {
  pgm.addColumn('users', {
    privacy_setting: {
      type: 'varchar(20)',
      notNull: true,
      default: 'public'
    }
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('users', 'privacy_setting');
};
