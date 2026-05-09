#!/usr/bin/env node
/**
 * Humanizer HTTP API Server
 *
 * Simple HTTP server for OpenAI Actions and other integrations.
 * Run with: node api-server/server.js
 *
 * SECURITY NOTE: This server is intended for LOCAL USE ONLY.
 * Do not deploy without adding authentication and restricting CORS.
 *
 * Endpoints:
 *   POST /api/score     - Quick AI score (0-100)
 *   POST /api/analyze   - Full analysis with patterns
 *   POST /api/humanize  - Get humanization suggestions
 *   POST /api/stats     - Statistical analysis only
 *   GET  /api/openapi   - OpenAPI spec
 */

import http from 'http';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { analyze, score } = await import('../src/core/analyzer.js');
const { humanize } = await import('../src/core/humanizer.js');
const { computeStats } = await import('../src/core/stats.js');

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const MAX_BODY_SIZE = 1024 * 1024; // 1MB max request body

// CORS - must be explicitly configured via CORS_ORIGIN env var (no wildcard allowed)
const CORS_ORIGIN = process.env.CORS_ORIGIN;
if (!CORS_ORIGIN) {
  console.warn('WARNING: CORS_ORIGIN not set. API server will reject cross-origin requests.');
}
const corsHeaders = {
  'Access-Control-Allow-Origin': CORS_ORIGIN || 'none',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Parse JSON body with size limit
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        reject(new Error('Request body too large'));
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

// Send JSON response
function sendJson(res, data, status = 200) {
  res.writeHead(status, {
    ...corsHeaders,
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify(data));
}

// Request handler
async function handleRequest(req, res) {
  // Reject cross-origin requests if CORS_ORIGIN is not configured
  if (req.headers['origin'] && !CORS_ORIGIN) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({ error: 'CORS not configured. Set CORS_ORIGIN environment variable.' }),
    );
    return;
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    // GET /api/openapi - Return OpenAPI spec
    if (req.method === 'GET' && path === '/api/openapi') {
      const spec = await readFile(join(__dirname, 'openapi.yaml'), 'utf-8');
      res.writeHead(200, {
        ...corsHeaders,
        'Content-Type': 'application/yaml',
      });
      res.end(spec);
      return;
    }

    // GET / - Health check
    if (req.method === 'GET' && path === '/') {
      sendJson(res, {
        status: 'ok',
        name: 'humanizer-api',
        version: '2.1.0',
        endpoints: ['/api/score', '/api/analyze', '/api/humanize', '/api/stats', '/api/openapi'],
      });
      return;
    }

    // POST endpoints
    if (req.method === 'POST') {
      const body = await parseBody(req);

      if (!body.text) {
        sendJson(res, { error: 'Missing required field: text' }, 400);
        return;
      }

      switch (path) {
        case '/api/score': {
          const s = score(body.text);
          const badge = s <= 25 ? '🟢' : s <= 50 ? '🟡' : s <= 75 ? '🟠' : '🔴';
          const interpretation =
            s <= 25
              ? 'Mostly human-sounding'
              : s <= 50
                ? 'Lightly AI-touched'
                : s <= 75
                  ? 'Moderately AI-influenced'
                  : 'Heavily AI-generated';
          sendJson(res, { score: s, badge, interpretation });
          return;
        }

        case '/api/analyze': {
          const result = analyze(body.text, {
            verbose: body.verbose || false,
            includeStats: true,
          });
          sendJson(res, result);
          return;
        }

        case '/api/humanize': {
          const suggestions = humanize(body.text, {
            autofix: body.autofix || false,
          });
          sendJson(res, suggestions);
          return;
        }

        case '/api/stats': {
          const stats = computeStats(body.text);
          sendJson(res, stats);
          return;
        }

        default:
          sendJson(res, { error: 'Not found' }, 404);
          return;
      }
    }

    sendJson(res, { error: 'Not found' }, 404);
  } catch (error) {
    console.error('Error:', error);
    sendJson(res, { error: error.message }, 500);
  }
}

// Start server
const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  console.log(`Humanizer API server running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  POST /api/score     - Quick AI score');
  console.log('  POST /api/analyze   - Full analysis');
  console.log('  POST /api/humanize  - Humanization suggestions');
  console.log('  POST /api/stats     - Statistical analysis');
  console.log('  GET  /api/openapi   - OpenAPI spec');
});
