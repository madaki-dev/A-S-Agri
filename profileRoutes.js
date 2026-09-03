const express = require("express");

const router = express.Router();

const protect =
    require("./authMiddleware");

const {
    getProfile,
    uploadProfileImage
} = require("./profileController");

const upload =
    require("./Uploads/profileUploads");

const cloudinary =
    require("./cloudinary");


// ==============================
// GET PROFILE
// ==============================

router.get(
    "/",
    protect,
    getProfile
);


// ==============================
// UPLOAD PROFILE IMAGE
// ==============================

router.post(
    "/upload-profile",
    protect,
    upload.single("image"),

    async (req, res, next) => {

        try {

            if (!req.file) {

                return res.status(400).json({
                    message: "No file uploaded."
                });

            }

            const result =
                await new Promise(
                    (resolve, reject) => {

                        const stream =
                            cloudinary.uploader.upload_stream(
                                {
                                    folder:
                                        "as-ventures/profiles",

                                    transformation: [
                                        {
                                            width: 500,
                                            height: 500,
                                            crop: "fill",
                                            gravity: "face",
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

                        stream.end(
                            req.file.buffer
                        );

                    }
                );


            // ==================================
            // IMPORTANT
            // ==================================

            console.log(
                "🔥 CLOUDINARY RESULT:",
                result.secure_url
            );

            req.file.path =
                result.secure_url;

            req.file.filename =
                result.public_id;

            req.file.public_id =
                result.public_id;


            next();

        } catch (error) {

            console.error(
                "PROFILE CLOUDINARY ERROR:",
                error
            );

            return res.status(500).json({

                message:
                    "Profile image upload to Cloudinary failed."

            });

        }

    },

    uploadProfileImage
);


module.exports = router;