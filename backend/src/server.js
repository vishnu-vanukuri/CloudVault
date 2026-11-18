import express from 'express';
import cors from 'cors';
import { handler } from './api-handler.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Forward any incoming Express request to the Lambda api-handler
app.all('*', async (req, res) => {
  try {
    // Construct Lambda-compatible event object
    const event = {
      httpMethod: req.method,
      path: req.path,
      headers: req.headers,
      queryStringParameters: req.query,
      body: JSON.stringify(req.body),
      requestContext: {
        http: {
          method: req.method,
          path: req.path
        },
        identity: {
          sourceIp: req.ip
        },
        authorizer: {
          claims: {
            sub: req.headers['x-user-id'] || 'render-user-default'
          }
        }
      }
    };

    const result = await handler(event, {});
    res.status(result.statusCode || 200)
       .set(result.headers || {})
       .send(result.body);
  } catch (err) {
    console.error('Express wrapper error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[CloudVault Backend] Server running on port ${PORT}`);
});
