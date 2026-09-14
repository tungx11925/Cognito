/* eslint-disable camelcase */

exports.up = (pgm) => {
  // Add cloudinary-related columns to documents table
  pgm.addColumns('documents', {
    file_type: {
      type: 'varchar(100)',
      notNull: false,
      default: null,
      comment: 'MIME type of the uploaded file, e.g. application/pdf'
    },
    file_size: {
      type: 'integer',
      notNull: false,
      default: null,
      comment: 'File size in bytes'
    },
    cloudinary_public_id: {
      type: 'varchar(500)',
      notNull: false,
      default: null,
      comment: 'Cloudinary public_id for deletion/transform operations'
    }
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('documents', ['file_type', 'file_size', 'cloudinary_public_id']);
};
