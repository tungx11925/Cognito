/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.addColumn('users', {
    avatar_url: { type: 'varchar(500)' }
  });
};

exports.down = pgm => {
  pgm.dropColumn('users', 'avatar_url');
};
