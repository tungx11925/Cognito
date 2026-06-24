exports.shorthands = undefined;

exports.up = pgm => {
  pgm.addColumn('users', {
    is_verified: { type: 'boolean', default: false },
    verification_code: { type: 'varchar(6)', default: null },
    code_expires_at: { type: 'timestamp', default: null }
  }, {
    ifNotExists: true
  });
};

exports.down = pgm => {
  pgm.dropColumn('users', ['is_verified', 'verification_code', 'code_expires_at']);
};
