exports.up = (pgm) => {
  pgm.addColumn('flashcard_decks', {
    is_public: {
      type: 'boolean',
      default: false,
      notNull: true,
    },
  }, {
    ifNotExists: true
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('flashcard_decks', 'is_public');
};
