const nodemailer = require('nodemailer');
const config = require('./config/config');

const transporter = nodemailer.createTransport(config.arbitorCoinNodeMailerCred);

const from = config.arbitorCoinNodeMailerCred.auth.user;
const to = config.nodemailRecipients;

const sendMail = (type, msg, filename) => {
    let mailOptions = { from, to };

    switch (type) {
        case 'trade':
            mailOptions.subject = 'Arbitor - trade notification';
            mailOptions.text = JSON.stringify(msg, null, 4);
            break;
        case 'opportunity':
            mailOptions.subject = 'Arbitor - opportunities summary';
            mailOptions.text = msg;
            mailOptions.attachments = [
                {
                    filename, path: './hcd/' + filename,
                },
            ]
            break;
        default:
            break;
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

module.exports = { sendMail };

const mode = process.argv[2] || false;

if (mode === "test") {
    sendMail('opportunity', 'Attached.', '2020-06-26.html');
}