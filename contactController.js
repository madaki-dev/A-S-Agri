const { Resend } = require("resend");

const resend = new Resend(
    process.env.RESEND_API_KEY
);


// ==============================
// SEND CONTACT MESSAGE
// ==============================

exports.sendContactMessage = async (req, res) => {

    try {

        const {
            name,
            email,
            subject,
            message
        } = req.body;


        console.log("📩 CONTACT REQUEST:", {
            name,
            email,
            subject
        });


        if (!name || !email || !message) {

            return res.status(400).json({

                message:
                    "Please complete your name, email and message."

            });

        }


        console.log("📤 SENDING EMAIL...");


        const { data, error } = await resend.emails.send({

            from: "A&S Agri <onboarding@resend.dev>",

            to: process.env.CONTACT_EMAIL,

            replyTo: email,

            subject:
                subject ||
                `New A&S Agri Contact Message from ${name}`,

            html: `

                <h2>New A&S Agri Contact Message</h2>

                <p>
                    <strong>Name:</strong>
                    ${name}
                </p>

                <p>
                    <strong>Email:</strong>
                    ${email}
                </p>

                <p>
                    <strong>Subject:</strong>
                    ${subject || "No subject"}
                </p>

                <hr>

                <h3>Message:</h3>

                <p>
                    ${message.replace(/\n/g, "<br>")}
                </p>

            `

        });


        if (error) {

            console.error(
                "🔥 RESEND ERROR:",
                error
            );

            return res.status(500).json({

                message:
                    "Failed to send message."

            });

        }


        console.log(
            "✅ EMAIL SENT:",
            data
        );


        res.status(200).json({

            message:
                "Your message has been sent successfully."

        });


    } catch (error) {

        console.error(
            "🔥 CONTACT EMAIL ERROR:",
            error
        );

        res.status(500).json({

            message:
                "Failed to send message."

        });

    }

};