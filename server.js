const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const { Server } = require("socket.io");
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const emails = require("./model/emails");
const path = require("path");
const ejsMate = require("ejs-mate");

// Configure MongoDB
async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/mailer');
  console.log("Connected to database");
}
main().catch((err) => console.log(err));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", 'ejs');
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'tanyshah0@gmail.com',   
    pass: 'sxfuhodroizzntdp'
  }
});

app.get('/', (req, res) => {
  res.render('index.ejs');
});

app.post('/', async (req, res) => {
  const { name, email, number } = req.body;

  // Save to MongoDB
  try {
    let newEmail = new emails({ name, email, number });
    await newEmail.save();
    console.log("Data saved to MongoDB");

    // Emit event to client
    io.emit('newSubmission', newEmail);

    // Send thank-you email
     const mailOptions = {
      from: 'tanyshah0@gmail.com',
      to: email,
      subject: 'Thank You for Registering for Vision Voyage!',
      html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
              <p>Hi ${name},</p>
              <p>Thank you for registering for Vision Voyage!<  br> We’re excited to welcome you to this event and look forward to an inspiring day filled with exploration and learning.</p>
              <p>Please find your entry pass attached below <br>. You’ll need to present this pass for entry into the event.</p>
              <p>Event Details:</p>
              <p>Venue: SOC-N518</p>
              <p>Timing: 10:30 AM - 3:30 PM</p>
              <p>Thank you for trusting ACES to be part of your journey. We can’t wait to see you there!</p>
              <p>Best Regards</p>
              <p>Team ACES</p>
              <img src="cid:logoImage" alt="Logo" style="width: 1000px; height: auto;">
          </div>
      `,
      attachments: [
          {
              filename: 'logo1.png',
              path: './image/logo1.png',
              cid: 'logoImage' 
          }
      ]
  };
  

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        res.status(500).send('Error sending email');
        return;
      } else {
        console.log('Email sent: ' + info.response);
        res.redirect("/"); 
      }
    });

  } catch (error) {
    console.error("Error saving data to MongoDB:", error);
    res.status(500).send("Failed to save data");
  }
});


server.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});

