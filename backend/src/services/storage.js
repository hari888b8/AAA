'use strict';

/**
 * Cloud Storage Service — S3-compatible (Cloudflare R2 / AWS S3 / MinIO)
 * Replaces local filesystem uploads with cloud storage.
 * Falls back to local storage in development if no credentials configured.
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const logger = require('../lib/logger');

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'agrihub-media';
const R2_ENDPOINT = process.env.R2_ENDPOINT; // e.g., https://account-id.r2.cloudflarestorage.com
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ''; // e.g., https://media.agrihub.in

const IS_CLOUD_CONFIGURED = !!(R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_ENDPOINT);
const LOCAL_UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Ensure local uploads dir exists for dev fallback
if (!IS_CLOUD_CONFIGURED && !fs.existsSync(LOCAL_UPLOADS_DIR)) {
  fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
}

/**
 * Generate AWS Signature V4 headers for S3-compatible APIs
 */
function signV4(method, pathname, headers, body, region = 'auto') {
  const service = 's3';
  const now = new Date();
  const dateStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dateOnly = dateStamp.slice(0, 8);

  const credential = `${R2_ACCESS_KEY_ID}/${dateOnly}/${region}/${service}/aws4_request`;

  const payloadHash = crypto.createHash('sha256').update(body || '').digest('hex');
  headers['x-amz-content-sha256'] = payloadHash;
  headers['x-amz-date'] = dateStamp;

  const signedHeaderKeys = Object.keys(headers).sort().map(k => k.toLowerCase());
  const signedHeaders = signedHeaderKeys.join(';');
  const canonicalHeaders = signedHeaderKeys.map(k => `${k}:${headers[k]}\n`).join('');

  const canonicalRequest = [method, pathname, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const canonicalHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    dateStamp,
    `${dateOnly}/${region}/${service}/aws4_request`,
    canonicalHash,
  ].join('\n');

  function hmac(key, data) {
    return crypto.createHmac('sha256', key).update(data).digest();
  }

  const kDate = hmac(`AWS4${R2_SECRET_ACCESS_KEY}`, dateOnly);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  headers['authorization'] = `AWS4-HMAC-SHA256 Credential=${credential}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return headers;
}

/**
 * Upload a file buffer to cloud storage (S3-compatible)
 * @param {Buffer} buffer - File content
 * @param {string} key - Storage key (path within bucket)
 * @param {string} contentType - MIME type
 * @returns {Promise<{url: string, key: string, size: number}>}
 */
async function uploadToCloud(buffer, key, contentType) {
  const url = new URL(`${R2_ENDPOINT}/${R2_BUCKET_NAME}/${key}`);

  const headers = {
    'host': url.hostname,
    'content-type': contentType,
    'content-length': String(buffer.length),
  };

  signV4('PUT', `/${R2_BUCKET_NAME}/${key}`, headers, buffer);

  return new Promise((resolve, reject) => {
    const transport = url.protocol === 'https:' ? https : http;
    const req = transport.request({
      hostname: url.hostname,
      port: url.port,
      path: `/${R2_BUCKET_NAME}/${key}`,
      method: 'PUT',
      headers,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const publicUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${key}`;
          resolve({ url: publicUrl, key, size: buffer.length });
        } else {
          reject(new Error(`Upload failed (${res.statusCode}): ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Upload timeout')); });
    req.write(buffer);
    req.end();
  });
}

/**
 * Upload a file (cloud in production, local in development)
 * @param {Buffer} buffer - File content
 * @param {Object} opts
 * @param {string} opts.context - Upload context (profile, listing, crop, etc.)
 * @param {string} opts.extension - File extension (jpeg, png, webp)
 * @param {string} opts.contentType - MIME type
 * @param {string} [opts.userId] - User who uploaded
 * @returns {Promise<{url: string, key: string, size: number, storage: string}>}
 */
async function uploadFile(buffer, { context = 'general', extension = 'jpeg', contentType = 'image/jpeg', userId } = {}) {
  // Sanitize inputs to prevent path traversal
  const safeContext = context.replace(/[^a-z0-9_-]/gi, '');
  const safeExtension = extension.replace(/[^a-z0-9]/gi, '');
  const filename = `${uuidv4()}.${safeExtension}`;
  const key = `${safeContext}/${new Date().toISOString().slice(0, 7)}/${filename}`;

  if (IS_CLOUD_CONFIGURED) {
    try {
      const result = await uploadToCloud(buffer, key, contentType);
      logger.info({ key, size: buffer.length, context: safeContext }, '[Storage] Uploaded to cloud');
      return { ...result, storage: 'cloud' };
    } catch (err) {
      logger.error({ err, key }, '[Storage] Cloud upload failed, falling back to local');
      // Fall through to local
    }
  }

  // Local filesystem fallback — verify paths stay within uploads dir
  const localDir = path.resolve(LOCAL_UPLOADS_DIR, safeContext);
  if (!localDir.startsWith(path.resolve(LOCAL_UPLOADS_DIR))) {
    throw new Error('Invalid upload context');
  }
  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });

  const localPath = path.resolve(localDir, filename);
  if (!localPath.startsWith(path.resolve(LOCAL_UPLOADS_DIR))) {
    throw new Error('Invalid upload path');
  }
  fs.writeFileSync(localPath, buffer);

  const localUrl = `/uploads/${safeContext}/${filename}`;
  logger.info({ key: localUrl, size: buffer.length, context: safeContext }, '[Storage] Saved locally (dev mode)');
  return { url: localUrl, key: localUrl, size: buffer.length, storage: 'local' };
}

/**
 * Delete a file from storage
 * @param {string} key - Storage key
 * @returns {Promise<boolean>}
 */
async function deleteFile(key) {
  if (IS_CLOUD_CONFIGURED) {
    const url = new URL(`${R2_ENDPOINT}/${R2_BUCKET_NAME}/${key}`);
    const headers = { 'host': url.hostname };
    signV4('DELETE', `/${R2_BUCKET_NAME}/${key}`, headers, '');

    return new Promise((resolve) => {
      const transport = url.protocol === 'https:' ? https : http;
      const req = transport.request({
        hostname: url.hostname,
        port: url.port,
        path: `/${R2_BUCKET_NAME}/${key}`,
        method: 'DELETE',
        headers,
      }, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 300);
      });
      req.on('error', () => resolve(false));
      req.end();
    });
  }

  // Local delete — sanitize key to prevent path traversal
  const sanitizedKey = key.replace(/^\/uploads\//, '').replace(/\.\./g, '').replace(/[^a-z0-9_\-/.]/gi, '');
  const localPath = path.join(LOCAL_UPLOADS_DIR, sanitizedKey);

  // Verify resolved path is within uploads directory
  const resolvedPath = path.resolve(localPath);
  if (!resolvedPath.startsWith(path.resolve(LOCAL_UPLOADS_DIR))) {
    return false;
  }

  if (fs.existsSync(resolvedPath)) {
    fs.unlinkSync(resolvedPath);
    return true;
  }
  return false;
}

/**
 * Parse and validate a base64 data URL
 * @param {string} dataUrl - base64 encoded image
 * @returns {{valid: boolean, buffer?: Buffer, extension?: string, contentType?: string, error?: string}}
 */
function parseBase64Image(dataUrl) {
  const match = dataUrl.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/);
  if (!match) return { valid: false, error: 'Invalid format. Must be base64 JPEG, PNG or WebP.' };

  const extension = match[1] === 'jpg' ? 'jpeg' : match[1];
  const buffer = Buffer.from(match[2], 'base64');

  if (buffer.length > 10 * 1024 * 1024) {
    return { valid: false, error: 'Image exceeds 10MB limit.' };
  }

  return { valid: true, buffer, extension, contentType: `image/${extension}` };
}

module.exports = { uploadFile, deleteFile, parseBase64Image, IS_CLOUD_CONFIGURED };
