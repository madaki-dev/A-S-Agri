const multer = require("multer");

// Store uploaded image temporarily in memory.
// The image will then be uploaded directly to Cloudinary.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {

    if (file.mimetype && file.mimetype.startsWith("image/")) {

        cb(null, true);

    } else {

        cb(
            new Error("Only image files are allowed."),
            false
        );

    }
};

const upload = multer({

    storage,

    fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024
    }

});

module.exports = upload;