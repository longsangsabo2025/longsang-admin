const http = require('http');
const fs = require('fs');

// Create test file
const testContent = 'Test upload ' + Date.now();
fs.writeFileSync('test.txt', testContent);

// Read file and create multipart form data manually
const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2);
const fileContent = fs.readFileSync('test.txt');

const body = Buffer.concat([
  Buffer.from('--' + boundary + '\r\n'),
  Buffer.from('Content-Disposition: form-data; name="file"; filename="test.txt"\r\n'),
  Buffer.from('Content-Type: text/plain\r\n\r\n'),
  fileContent,
  Buffer.from('\r\n--' + boundary + '--\r\n')
]);

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/drive/upload',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': body.length
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Response:', data);
    fs.unlinkSync('test.txt');
  });
});

req.write(body);
req.end();
