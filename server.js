var port = 8080; // Port of server

//Libraries
var getenv = require('getenv'); // Library for Enviroment Variables, Used for DB Connection
var mysql = require('promise-mysql'); // MySQL Library, With Node Promises
var sha512 = require('sha512'); // SHA512 Library; SHA512 is a hash
var bodyParser = require('body-parser'); // Library for parsing data
var jsonParser = bodyParser.json(); // Using Data type Json
var cors = require("cors"); // Library for handling access headers
//var QRCode = require('qrcode');
var nodemailer = require('nodemailer');
var randomstring = require("randomstring");
const spawn = require("child_process").spawn;


var express = require('express'); // Express Framework for Node
var app = express(); // Establishing Express App
app.use(express.logger());
app.use(cors()); // Cors to Handle URL Authentication 
app.use(bodyParser.json()); // Using Body Parser
var server = app.listen(8080); // Set Port

var con = null;
mysql.createConnection({
  host: getenv('IP'),
  user: getenv('C9_USER'),
  password: "",
  database: "c9"
}).then(function(connection) { con = connection });


app.get("/registration", async function(req, res) {
  console.log(req.query)
  let hash = req.query.hash;
  console.log(hash)
  let [query] = await con.query(`SELECT * FROM Participant WHERE Hash="${hash}"`)
  //console.log(query)
  if (query) {
    let updateStatus = await con.query(`UPDATE Participant SET status = 1 WHERE Hash = "${hash}"`)
    //console.log(updateStatus)
    if (updateStatus){
      res.status(200).json({
        message : `${query.Name}Succesfully Registered`
      });
      }
    } else {
      res.status(400)
    }
});

app.get('/sendQrInvites', async function(req, res) {
  let email = req.query.email
  if (email == "all") {
    var participants = await con.query(`SELECT * From Participant WHERE mailSent = 0 LIMIT 20`)
    //var participants = [{ "Name": "Yeshwant", "Hash": null, "Email": "ykethineni@gmail.com" }]
    for (var participant of participants) {
      await allEmails(participant, res)
    }
  }
});

async function sendQrEmail(message, emailTo, res, name) {
  console.log(name)
  var ticketLocation = "./tickets/out-" + name + ".png"
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  nodemailer.createTestAccount((err, account) => {

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: "ssl", // true for 465, false for other ports
      auth: {
        user: 'oakcodefest@oakridge.in', // generated ethereal user
        pass: '' // Add Password before using removed for Git Push
      }
    });

    // setup email data with unicode symbols
    let mailOptions = {
      from: '"Oakridge Codefest Team"<oakcodefest@oakridge.in>', // sender address
      to: emailTo, // list of receivers
      cc: ['rahultarak12345@gmail.com', 'gaurangbharti@gmail.com', 'rithvikm8@gmail.com', 'kavesbteja@gmail.com', 'ykethineni@gmail.com'], // Me!
      subject: 'Oak Codefest 2019 Invite', // Subject line
      html: message,
      attachments: [{
        filename: 'Oak Codefest Consent Form.pdf',
        path: './consentForm.pdf'
      }, {
        filename: 'Oak Codefest Ticket.png',
        path: ticketLocation
      }, {
        filename: 'Oak Codefest Ticket-Back.png',
        path: './backOfTicket.png'
      }] 
      
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

async function generateHash() {
  var code
  while (true) {
    code = randomstring.generate(12);
    console.log(code)
    let [codeExsists] = await con.query(`SELECT * FROM Participant WHERE Hash="${code}"`);
    if (!codeExsists) {
      break;
    }
  }
  return code
}

async function allEmails(participant, res) {
  console.log(participant.Name)
  var code;
  if (participant.Hash == "") {

    code = await generateHash()
  }
  else {
    code = participant.Hash
  }
  console.log("calling python")
  var pythonProcess = spawn('python3', ["./embed.py", code, participant.UUID]);
  await pythonProcess.stdout.on('data', async function(data) {

    if (data.toString()) {
      console.log(data.toString());
      console.log(participant);
      let newInvite = await con.query(`UPDATE Participant SET mailSent = '1', Hash = '${code}' WHERE UUID = '${participant.UUID}'`)
      //let newInvite = true
      if (newInvite) {
        var message = `Hey ${participant.Name},<br>
<br>
We would like to congratulate you on qualifying for the Oak Codefest 2019 on the <b>19th and 20th January</b>. Reporting time for the event is <b>9:15 am</b><br>
<br>
We would require that you send your school and an emergency contact number. For participants who would be staying overnight,please find the attached consent form which we would require you to submit on the day of the event.<br>
<br>
This year for Oak Codefest we will be selling t-shirts at Rs.300, if you would like to purchase one please inform us beforehand so we can make sure there is enough stock in your size.
<br><br>
We have also set up a discord server: <a href="https://discord.gg/jwJZqDs">https://discord.gg/jwJZqDs</a> where participants can directly communicate with us. We would request the entire team to join as it would help us communicate with the participants before and during the event.<br>
<br>
We would require you to bring your ticket given below on the day of the event.<br>
Regards,<br>
The Oak Codefest Team
`
        console.log(message)
        await sendQrEmail(message, participant.Email, res, participant.UUID);
      }
    }
  });
}

