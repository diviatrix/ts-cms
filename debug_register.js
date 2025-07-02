// Quick debug script to test registration
const http = require('http');

const data = JSON.stringify({
  login: 'testuser',
  email: 'test@example.com',
  password: 'password123'
});

const options = {
  hostname: 'localhost',
  port: 7331,
  path: '/api/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseData);
    try {
      const jsonResponse = JSON.parse(responseData);
      console.log('Parsed response:', JSON.stringify(jsonResponse, null, 2));
    } catch (e) {
      console.log('Failed to parse JSON:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
