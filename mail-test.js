
//fs
var fs = require("fs"),
    path = require("path"),
    buffer = require("buffer").Buffer;

var nodemailer = require('nodemailer');
var smtpPool = require('nodemailer-smtp-pool');
// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport(smtpPool({
    host: 'smtp.qq.com',
    auth: {
        user: 'stormtea@qq.com',
        pass: '19100biao*'
    }
}));
// setup e-mail data with unicode symbols
var mailOptions = {
    from: 'Fred Foo ✔ <stormtea@qq.com>', // sender address
    to: '1280597658@qq.com', // list of receivers
    subject: 'Hello ✔', // Subject line
    text: 'Hello world 2 ✔', // plaintext body
    html: '<b>Hello world ✔</b>Embedded image: <img src="cid:unique@kreata.ee"/>',
    attachments: [{
        filename: 'example.png',
        path: './example.png',
        cid: 'unique@kreata.ee' //same cid value as in the html img src
    },{
        filename: "source.svg",
        content: fs.createReadStream('source.svg')
        //path: ""
    }]
};

// send mail with defined transport object
transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
        console.log(error);
    } else {
        console.log('Message sent: ' + info.response);
    }
    transporter.close();
});