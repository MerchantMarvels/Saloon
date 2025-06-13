// sesClient.js

const AWS = require('aws-sdk');

// Load credentials from environment variables
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,     // your IAM Access Key ID
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // your IAM Secret Access Key
  region: 'us-east-1', // Replace with your SES region
});

const ses = new AWS.SES({ apiVersion: '2010-12-01' });

module.exports = ses;
