const User = require("./User");


// ==============================
// GET PROFILE
// ==============================

exports.getProfile = async (req, res) => {

    try {

        const user =
            await User
                .findById(req.user._id)
                .select("-password");

        if (!user) {

            return res.status(404).json({

                message:
                    "User not found"

            });

        }

        res.json(user);

    } catch (error) {

        console.error(
            "GET PROFILE ERROR:",
            error
        );

        res.status(500).json({

            message:
                error.message

        });

    }

};


// ==============================
// UPLOAD PROFILE IMAGE
// ==============================

exports.uploadProfileImage = async (
    req,
    res
) => {

    console.log("🔥 NEW PROFILE CONTROLLER RUNNING");

    console.log("REQ.FILE:", req.file);


    try {

        if (!req.file) {

            return res.status(400).json({

                message:
                    "No file uploaded"

            });

        }

        const user =
            await User.findById(
                req.user._id
            );

        if (!user) {

            return res.status(404).json({

                message:
                    "User not found"

            });

        }

        // Cloudinary URL
        user.profileImage =
            req.file.path;

        await user.save();

        console.log("🔥 CLOUDINARY PATH:", req.file.path);

        res.json({

            message:
                "Profile image updated",

            imageUrl:
                req.file.path

        });

    } catch (error) {

        console.error(
            "PROFILE IMAGE ERROR:",
            error
        );

        res.status(500).json({

            message:
                error.message

        });

    }

};