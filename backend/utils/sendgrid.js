import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (subject, body, to) => {
    const msg = {
        to: to, // Change to your recipient
        from: 'benjaminjskoog@gmail.com', // Change to your verified sender
        subject: subject,
        text: body,
        html: body,
    };

    try {
        const response = await sgMail.send(msg);
        console.log(response[0].statusCode);
        console.log(response[0].headers);
    } catch (error) {
        console.error(error);

        if (error.response) {
            console.error(error.response.body)
        }
    }
};

export { sendEmail };
