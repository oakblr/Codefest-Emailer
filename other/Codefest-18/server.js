var port = process.env.PORT; // Port of server

//Libraries
var getenv = require('getenv'); // Library for Enviroment Variables, Used for Db Conn
var mysql = require('promise-mysql'); // Mysql Library, With Node Promises
var sha512 = require('sha512'); // Sha512 Library, Sha512 is a hash
var bodyParser = require('body-parser'); // Library for parsing data
var jsonParser = bodyParser.json(); // Using Data type Json
var cors = require("cors"); // Library for handling access headers
var QRCode = require('qrcode');
var nodemailer = require('nodemailer');
var randomstring = require("randomstring");



var express = require('express'); // Framework for Node
var app = express(); // Establishing Express App
app.use(express.logger());
app.use(cors()); // Cors to Handle Url Authentication 
app.use(bodyParser.json()); // Using Body Parser
var server = app.listen(port); // Set Port

var con = null;
mysql.createConnection({
  host: getenv('IP'),
  user: getenv('C9_USER'),
  password: "",
  database: "c9"
}).then(function(connection) { con = connection });

app.use("/checkIn", async function(req, res) {
  //console.log(req);
  //console.log(req.body);
  var code = req.body.authcode;
  console.log(code);
  var hash;
  var open = code.substring(0, 9);
  console.log(open);
  if (open = "Congrats!") {
    hash = code.substring(9);
  }
  else {
    hash = code
  }
  console.log(hash);
  let [team] = await con.query(`SELECT * FROM Teams WHERE Hash="${hash}"`);
  //  console.log(team)
  if (team) {
    if (team.Status == 0) {
      let insert = await con.query(`UPDATE Teams SET Status=1 WHERE Hash="${hash}"`)
      console.log("Sucessful");
      res.status(200).json({
        message: `Sucessful Check-In for team ${team.Name}`
      });
    }
    else {
      res.status(400).json({
        message: "Already Check-In"
      });
    }
  }
  else {
    res.status(400).json({
      message: "Not registered"
    });
  }
});

app.post("/sendEmail", async function(req, res) {
  var email = req.body.email;
  var teamName = req.body.name;

  var hash = sha512(teamName);
  console.log(hash.toString('hex'));
  QRCode.toFile('qrcode.png', hash.toString('hex'), function(err) {
    if (err) throw err
    console.log('done')
  })
  let insert = await con.query(`INSERT INTO Teams (Name,Hash) VALUES ("${teamName}","${hash.toString('hex')}")`);
  var message = `Dear participants,<br>
<br>
We would like to congratulate team ${teamName} on qualifying for the Oak Codefest 2018 on the <b>20th and 21st January</b>. Reporting time for the event is <b>7:45</b><br>
<br>
We would require that you send each participants school and an emergency contact number for the team.<br>
<br>
We have also set up a discord server: <a href="https://discord.gg/VtZGxXF">https://discord.gg/VtZGxX</a> where participants can directly communicate with us. We would request the entire team to join as it would help us communicate with the participants before and during the event.<br>
<br>
We would require you to bring the unique QR code given below on the day of the event.<br>
<img src="cid:invite@oak.ee"/><br>
Regards,<br>
The Oak Codefest Team
`;

  sendMail(email, message);
  res.status(200).json({
    message: "success"
  })
});
app.post("/sendSponsorMail", async function(req, res) {
  console.log("Hello")
  var email = req.body.email;
  //var companyName = req.body.name;
  var message = `
  <p>Dear Sir/Ma’am,</p>
<p>We, the students of Oakridge International School, held Bangalore's first overnight school hackathon in January 2018 - The Oak Codefest 2018. The event was a massive success with over 15 teams participating in a multitude of themes. The event was sponsored by companies such as IBM, Digital Ocean, Hackerearth, Dot Tech, and Watchlive, and the proceedings were donated to a charity, the Samarthanam Trust for the Disabled.</p>
<p>This year, we plan on making the second edition of our codefest significantly grander, more elaborate and successful. To accomplish this, we request you to be a part of Codefest 2019. The event will be conducted on the 19th and 20th of January, 2019. We are expecting over 25-30 teams for this event with participants from various cities across India.</p>
<p>It would be a great honour for us if you choose to sponsor and support our event. For more details regarding the sponsorship, you can find attached a sponsorship brochure.</p>
<p>For any more details regarding codefest please visit Oakridge Codefest or email us.</p>
<p>The video from Codefest 2018 is linked below.<a href="https://www.youtube.com/watch?v=ZtgLnrW2Bj8">https://www.youtube.com/watch?v=ZtgLnrW2Bj8</a> </p>
<p>Thank you,<p>
<p>The Oakridge Codefest Team<p>
<p><a href="http://codefest.oakridge.in">codefest.oakridge.in</a>
  `

  sendMail(email, message, res);

});

function sendMail(email, message, res) {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  nodemailer.createTestAccount((err, account) => {

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: "ssl", // true for 465, false for other ports
      auth: {
        user: 'oakcodefest@gmail.com', // generated ethereal user
        pass: 'walang123' // generated ethereal password
      }
    });

    // setup email data with unicode symbols
    let mailOptions = {
      from: '"Oakridge Codefest Team"<oakcodefest@gmail.com>', // sender address
      to: email, // list of receivers
      cc: ['rahultarak12345@gmail.com', 'gaurangbharti@gmail.com', 'rithvikm8@gmail.com', 'kavesbteja@gmail.com', 'ykethineni@gmail.com'], // Me!
      subject: 'Codefest 2019 Sponsorship', // Subject line
      html: message,
      attachments: [{
        filename: 'Oak Codefest 2019 Sponsorship Brochure.pdf',
        path: './codefest.pdf'
      }] // Fancy Shit here
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
      res.status(200).json({
        message: "success"
      })
      console.log('Message sent: %s', info.messageId);
      console.log("Email alert sent");
      // Preview only available when sending through an Ethereal account
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    });
  });
}

function sendReferalMail(email, message, res) {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  nodemailer.createTestAccount((err, account) => {

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: "ssl", // true for 465, false for other ports
      auth: {
        user: 'oakcodefest@gmail.com', // generated ethereal user
        pass: 'walang123' // generated ethereal password
      }
    });

    // setup email data with unicode symbols
    let mailOptions = {
      from: '"Oakridge Codefest Team"<oakcodefest@gmail.com>', // sender address
      to: email, // list of receivers
      cc: ['rahultarak12345@gmail.com', 'gaurangbharti@gmail.com', 'rithvikm8@gmail.com', 'kavesbteja@gmail.com', 'ykethineni@gmail.com'], // Me!
      subject: 'Codefest 2019 Referral Program', // Subject line
      html: message
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
      res.status(200).json({
        message: "success"
      })
      console.log('Message sent: %s', info.messageId);
      console.log("Email alert sent");
      // Preview only available when sending through an Ethereal account
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    });
  });
}
app.post('/referral', async function(req, res) {
  let name = req.body.name;
  let email = req.body.email;
  var random = randomstring.generate({
    length: 8,
    charset: 'alphabetic'
  });
  console.log(random)
  random = await checkNewRandom(random, con)
  let update = await con.query(`INSERT INTO Referral (Name,Email,Code) VALUES ("${name}","${email}","${random}")`)
  let message = `
  <p>Dear Sir/Ma’am,</p>
<p>This year for Oak Codefest 2019, we are having a referral program for old participants.</p>
<p>Every former participant who is able to bring in new participants will be rewarded by getting a discount on the registration fee and some other prizes</p>
<p>Each participant has a unique 8 character referral code, please share this unique code to participants you are referring. </p>
<p>Your unique referral is <b>${random}</b></p>
<p>Thank you,<p>
<p>The Oakridge Codefest Team<p>
<p><a href="http://codefest.oakridge.in">codefest.oakridge.in</a>`
  sendReferalMail(email, message, res)
});

async function checkNewRandom(random, conn) {
  let sql = await conn.query(`SELECT * FROM Referral`);
  for (var entry of sql) {
    if (random == entry) {
      let random = randomstring.generate({
        length: 8,
        charset: 'alphabetic'
      });
      checkNewRandom(random, con)
    }
    else {
      return random
    }
  }
}
