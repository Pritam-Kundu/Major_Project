const transporter = require("./mailer");

async function sendOTP(email, otp) {

    await transporter.sendMail({

        from: `"Homigo" <${process.env.EMAIL_USER}>`,

        to: email,

        subject: "Verify your Homigo account",

        html: `

<div style="font-family:Arial;padding:40px;background:#f5f5f5;">

<div style="max-width:600px;margin:auto;background:white;padding:40px;border-radius:15px;">

<h1 style="color:#2f80ed;text-align:center;">

Homigo

</h1>

<h2 style="text-align:center;">

Email Verification

</h2>

<p>

Thank you for creating your Homigo account.

</p>

<p>

Use the OTP below to verify your email.

</p>

<div style="font-size:40px;
font-weight:bold;
letter-spacing:12px;
text-align:center;
margin:35px 0;
color:#2f80ed;">

${otp}

</div>

<p>

This OTP will expire in

<b>

5 minutes

</b>

</p>

<p>

Do not share this OTP with anyone.

</p>

<hr>

<p style="color:#888">

Homigo Team

</p>

</div>

</div>

`

    });

}

module.exports = sendOTP;