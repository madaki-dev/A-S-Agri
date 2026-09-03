const multer = require("multer");
const cloudinary = require("../cloudinary");

// Store uploaded files temporarily in memory
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {

    if (file.mimetype.startsWith("image/")) {
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


// ==========================================
// CLOUDINARY UPLOAD MIDDLEWARE
// ==========================================

const uploadToCloudinary = (folder) => {

    return async (req, res, next) => {

        try {

            if (!req.file) {
                return next();
            }

            const result =
                await new Promise((resolve, reject) => {

                    const stream =
                        cloudinary.uploader.upload_stream(
                            {
                                folder: folder,

                                transformation: [
                                    {
                                        width: 1200,
                                        height: 1200,
                                        crop: "limit",
                                        quality: "auto"
                                    }
                                ]
                            },

                            (error, result) => {

                                if (error) {
                                    reject(error);
                                } else {
                                    resolve(result);
                                }

                            }
                        );

                    stream.end(req.file.buffer);

                });


            // Replace Multer file information
            // with Cloudinary information

            req.file.path =
                result.secure_url;

            req.file.filename =
                result.public_id;

            req.file.cloudinaryUrl =
                result.secure_url;

            req.file.public_id =
                result.public_id;


            next();

        } catch (error) {

            console.error(
                "CLOUDINARY UPLOAD ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "Image upload to Cloudinary failed."
            });

        }

    };

};


module.exports = {
    upload,
    uploadToCloudinary
};