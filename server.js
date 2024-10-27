const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const app = express();

// Load environment variables
require('dotenv').config();

// Initialize Twilio client
const twilioClient = require('./twilio');

// Middleware to parse URL-encoded body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

app.post('/makeCall', async (req, res) => {
    console.log(req.body);
    const {phone_number}  = req.body;
    console.log(phone_number)
  
    // Check if the phone_number parameter is provided
    if (!phone_number) {
      return res.status(400).send({ error: 'Missing phone_number parameter' });
    }
  
    try {
      // Initiate the call using Twilio API
      const call = await twilioClient.calls.create({
        url: 'https://handler.twilio.com/twiml/EHfa3a318881549e2ca3d8ff8338e058c1',
        to: phone_number,
        from: process.env.TWILIO_PHONE_NUMBER
      });
  
      // Send a successful response with the call SID
      res.send({ message: 'Call initiated', callSid: call.sid });
    } catch (error) {
      // Handle errors and send an error response
      res.status(500).send({ error: error.message });
    }
  });
  
  

// Endpoint to respond to IVR requests (TwiML)
app.post('/ivrResponse', (req, res) => {
    const response = new twilio.twiml.VoiceResponse();
    response.say('Thank you for your interest. Press 1 for an interview link.');
    response.gather({
      numDigits: 1,
      action: '/processResponse',
      method: 'POST',
    });
    res.type('text/xml');
    res.send(response.toString().trim()); // Ensure no extraneous whitespace
});

app.post('/processResponse', (req, res) => {
    const digits = req.body.Digits;
    const to = req.body.To; // The recipient's number (replace with your desired number)

    if (digits === '1') {
        twilioClient.messages.create({
            to: to,
            from: process.env.TWILIO_PHONE_NUMBER,
            body: 'Here is your interview link: https://example.com/interview'
        })
        .then(message => {
            console.log('Message sent:', message.sid);
            // Return a success message to Twilio
            const response = new twilio.twiml.VoiceResponse();
            response.say('Message has been successfully sent, check your inbox. Thanks.');
            res.type('text/xml');
            res.send(response.toString());
        })
        .catch(error => {
            console.error('Error sending message:', error);
            res.status(500).send('Error processing response');
        });
    } else {
        // Return a response indicating no action was taken
        const response = new twilio.twiml.VoiceResponse();
        response.say('No action taken.');
        res.type('text/xml');
        res.send(response.toString());
    }
});




// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
