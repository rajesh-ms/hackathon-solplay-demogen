const https = require('https');

const data = JSON.stringify({
  model: 'v0-1.5-md',
  messages: [{ role: 'user', content: 'Create a simple React button component' }],
  max_completion_tokens: 500
});

const options = {
  hostname: 'api.v0.dev',
  port: 443,
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer v1:v2JnnoRtT8JqfK1PhnGXgwHs:I1DMbP7ExyWkr4MvVIEEwqfu',
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);
  console.log(`headers:`, res.headers);

  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('Response:', responseData);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();