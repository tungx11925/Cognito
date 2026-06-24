exports.shorthands = undefined;

exports.up = pgm => {
  pgm.addColumn('users', {
    education: { type: 'varchar(255)', default: 'Đại học Quốc gia Hà Nội' },
    address: { type: 'varchar(255)', default: 'Hà Nội, Việt Nam' },
    website: { type: 'varchar(255)', default: '' }
  }, {
    ifNotExists: true
  });
};

exports.down = pgm => {
  pgm.dropColumn('users', ['education', 'address', 'website']);
};
