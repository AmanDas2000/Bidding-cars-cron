var cron = require('node-cron');
const mongoose = require('mongoose');
let Car = require('./car.model');
require('dotenv').config();
var nodemailer = require('nodemailer');
const Razorpay = require('razorpay');
const axios = require('axios');
const { google } = require('googleapis');
const uri = process.env.ATLAS_URI;
const port = process.env.PORT || 6000;
const http = require('http');
const socketApp = require('express')();
const cors = require('cors');
const socketServer = http.createServer(socketApp);
const { Server } = require('socket.io');
const io = new Server(socketServer, {
  cors: {
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204
  },
});

mongoose.connect(uri, { useNewUrlParser: true });
const connection = mongoose.connection;
connection.once('open', () => {
  console.log('MongoDB database connection established successfully');
});

async function sendMail(name, email, body) {
  const CLIENT_EMAIL = process.env.REACT_APP_EMAIL;
  const CLIENT_ID = process.env.REACT_APP_EMAIL_CLIENT_ID;
  const CLIENT_SECRET = process.env.REACT_APP_EMAIL_CLIENT_SECRET;
  const REDIRECT_URI = process.env.REACT_APP_EMAIL_CLIENT_REDIRECT_URI;
  const REFRESH_TOKEN = process.env.REACT_APP_EMAIL_REFRESH_TOKEN;
  const OAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

  OAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
  try {
    // Generate the accessToken on the fly
    const accessToken = await OAuth2Client.getAccessToken();

    // Create the email envelope (transport)
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: CLIENT_EMAIL,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: `Bidding Cars <${CLIENT_EMAIL}>`,
      to: email,
      subject: `Congratulations you won the bid for ${name}`,
      html: body,
    };

    // Set up the email options and delivering it
    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    return error;
  }
}

cron.schedule('* * * * *', async () => {
  const cars = await Car.find({ status: 'approved' });
  const date = new Date();
  cars.forEach(async (car) => {
    const diff = car.endTime - date;
    if (diff <= 0) {
      const id = car._id;
      const newCar = await Car.findByIdAndUpdate(
        id,
        {
          status: 'sold',
        },
        {
          new: true,
        },
      );

      io.emit('bid_close', newCar);

      axios
        .post(
          'https://api.razorpay.com/v1/payment_links/',
          {
            amount: car.currentBid,
            currency: 'INR',
            accept_partial: true,
            first_min_partial_amount: 100,
            expire_by: 1691097057,
            reference_id: String(parseInt(Math.random() * 100000)),
            description: 'Payment for policy no #23456',
            customer: {
              name: 'Gaurav Kumar',
              contact: '+919437002544',
              email: 'gaurav.kumar@example.com',
            },
            notify: {
              sms: true,
              email: true,
            },
            reminder_enable: true,
            notes: {
              policy_name: 'Jeevan Bima',
            },
            callback_url: 'https://example-callback-url.com/',
            callback_method: 'get',
          },
          {
            headers: {
              'Content-type': 'application/json',
            },
            auth: {
              username: 'rzp_test_pKZRnqB018a4N5',
              password: 'Iy7XQLd5VYny60VUjZ2MdoYM',
            },
          },
        )
        .then(async (e) => {
          let name = `${car.carCompany} ${car.modelName} ${car.modelYear}`;
          let body = `<p>Congratulations! you have won the bidding war of ${name}.</p><p> Please click on: ${e.data.short_url} to do the down-payment</p>`;
          sendMail(name, 'das.aman45@gmail.com', body)
            .then((result) => console.log('result', result))
            .catch((error) => console.log('error', error.message));
        });
    }
  });
});



io.on('connection', (socket) => {
  console.log('user connected');

  socket.on('bid_close', (socket) => {
    console.log('bid closed', socket.data);
  });
  
  socket.on('bid_update', (socket) => {
    console.log('bid updated', socket.data);
  });
});

io.on('bid_close', (socket) => {
  console.log('bid closed', socket.data);
});

io.on('bid_update', (socket) => {
  console.log('bid updated', socket.data);
});

socketApp.use(cors());

socketServer.listen(port, () => {
  console.log(`Server is running on socket: ${port}`);
});
