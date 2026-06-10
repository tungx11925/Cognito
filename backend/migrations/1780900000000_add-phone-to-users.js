exports.shorthands = undefined;

exports.up = pgm => {
  pgm.addColumn('users', {
    phone: { type: 'varchar(20)', unique: true }
  }, { ifNotExists: true });
};

exports.down = pgm => {
  pgm.dropColumn('users', 'phone');
};
