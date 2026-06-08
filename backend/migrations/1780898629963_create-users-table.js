exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable('users', {
    id: 'id', // shortcut for serial primary key
    email: { type: 'varchar(255)', notNull: true, unique: true },
    phone: { type: 'varchar(20)', unique: true },
    password: { type: 'varchar(255)', notNull: true },
    name: { type: 'varchar(255)', notNull: true },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  }, { ifNotExists: true });
};

exports.down = pgm => {
  pgm.dropTable('users');
};
