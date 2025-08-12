// Import types from @cloudflare/workers-types
import '../worker-configuration';

export interface Env {
	// Example bindings
	// KV Namespace for storing metrics (optional)
	SPEEDTEST_KV?: KVNamespace;
	
	// Environment variables
	CORS_ORIGINS?: string; // Comma-separated list of allowed origins
	MAX_FILE_SIZE?: string; // Maximum file size for uploads
	ENABLE_METRICS?: string; // Whether to collect metrics
}

// Cloudflare Request interface extension
interface CloudflareRequest extends Request {
	cf?: {
		country?: string;
		colo?: string;
		[key: string]: any;
	};
}

export default {
	async fetch(request: CloudflareRequest, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const corsOrigins = env.CORS_ORIGINS?.split(',') || ['*'];
		const maxFileSize = parseInt(env.MAX_FILE_SIZE || '268435456'); // 256MB default
		const enableMetrics = env.ENABLE_METRICS === 'true';

		// CORS preflight handling
		if (request.method === 'OPTIONS') {
			return handleCORS(request, corsOrigins);
		}

		// Route handling
		switch (url.pathname) {
			case '/__down':
				return handleDownload(request, env, corsOrigins, enableMetrics);
			case '/__up':
				return handleUpload(request, env, corsOrigins, maxFileSize, enableMetrics);
			case '/health':
				return new Response('OK', { status: 200 });
			default:
				return new Response('Not Found', { status: 404 });
		}
	},
};

function handleCORS(request: Request, corsOrigins: string[]): Response {
	const origin = request.headers.get('Origin');
	const allowOrigin = corsOrigins.includes('*') || (origin && corsOrigins.includes(origin)) ? 
		(origin || '*') : corsOrigins[0];

	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': allowOrigin,
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
			'Access-Control-Max-Age': '86400',
		},
	});
}

async function handleDownload(
	request: CloudflareRequest, 
	env: Env, 
	corsOrigins: string[], 
	enableMetrics: boolean
): Promise<Response> {
	const startTime = Date.now();
	const url = new URL(request.url);
	
	// Get file size from query parameter
	const bytes = parseInt(url.searchParams.get('bytes') || '0');
	if (bytes < 0 || bytes > 268435456) { // Max 256MB
		return new Response('Invalid file size', { status: 400 });
	}

	// Generate random data
	const data = generateRandomData(bytes);
	
	const serverProcessingTime = Date.now() - startTime;
	
	// Set CORS headers
	const origin = request.headers.get('Origin');
	const allowOrigin = corsOrigins.includes('*') || (origin && corsOrigins.includes(origin)) ? 
		(origin || '*') : corsOrigins[0];

	const headers = new Headers({
		'Content-Type': 'application/octet-stream',
		'Content-Length': bytes.toString(),
		'Access-Control-Allow-Origin': allowOrigin,
		'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
		'Access-Control-Expose-Headers': 'Server-Timing, Content-Length',
		'Server-Timing': `cfworker;dur=${serverProcessingTime}`,
		'Cache-Control': 'no-cache, no-store, must-revalidate',
		'Pragma': 'no-cache',
		'Expires': '0',
	});

	// Optional: Log metrics
	if (enableMetrics && env.SPEEDTEST_KV) {
		logMetrics(env.SPEEDTEST_KV, 'download', bytes, serverProcessingTime, request);
	}

	return new Response(data, { headers });
}

async function handleUpload(
	request: CloudflareRequest, 
	env: Env, 
	corsOrigins: string[], 
	maxFileSize: number, 
	enableMetrics: boolean
): Promise<Response> {
	const startTime = Date.now();
	
	if (request.method !== 'POST') {
		return new Response('Method Not Allowed', { status: 405 });
	}

	// Check content length
	const contentLength = parseInt(request.headers.get('Content-Length') || '0');
	if (contentLength > maxFileSize) {
		return new Response('File too large', { status: 413 });
	}

	// Consume the request body (simulate processing)
	const body = await request.arrayBuffer();
	const actualBytes = body.byteLength;
	
	const serverProcessingTime = Date.now() - startTime;

	// Set CORS headers
	const origin = request.headers.get('Origin');
	const allowOrigin = corsOrigins.includes('*') || (origin && corsOrigins.includes(origin)) ? 
		(origin || '*') : corsOrigins[0];

	const headers = new Headers({
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': allowOrigin,
		'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
		'Access-Control-Expose-Headers': 'Server-Timing',
		'Server-Timing': `cfworker;dur=${serverProcessingTime}`,
		'Cache-Control': 'no-cache, no-store, must-revalidate',
	});

	// Optional: Log metrics
	if (enableMetrics && env.SPEEDTEST_KV) {
		logMetrics(env.SPEEDTEST_KV, 'upload', actualBytes, serverProcessingTime, request);
	}

	return new Response(
		JSON.stringify({ 
			bytes: actualBytes, 
			serverTime: serverProcessingTime 
		}), 
		{ headers }
	);
}

function generateRandomData(bytes: number): Uint8Array {
	if (bytes === 0) return new Uint8Array(0);
	
	// For small files, generate truly random data
	if (bytes <= 1024) {
		const data = new Uint8Array(bytes);
		crypto.getRandomValues(data);
		return data;
	}
	
	// For larger files, generate a pattern to save computation
	const data = new Uint8Array(bytes);
	const pattern = new Uint8Array(1024);
	crypto.getRandomValues(pattern);
	
	for (let i = 0; i < bytes; i++) {
		data[i] = pattern[i % 1024];
	}
	
	return data;
}

async function logMetrics(
	kv: KVNamespace, 
	type: 'download' | 'upload', 
	bytes: number, 
	serverTime: number, 
	request: CloudflareRequest
): Promise<void> {
	try {
		const cf = request.cf;
		const metric = {
			timestamp: Date.now(),
			type,
			bytes,
			serverTime,
			country: cf?.country || 'unknown',
			colo: cf?.colo || 'unknown',
			userAgent: request.headers.get('User-Agent') || 'unknown',
		};
		
		const key = `metric:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
		await kv.put(key, JSON.stringify(metric), { expirationTtl: 86400 }); // 24 hours
	} catch (error) {
		console.error('Failed to log metrics:', error);
	}
}