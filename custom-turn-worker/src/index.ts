interface Env {
	REALTIME_TURN_TOKEN_ID?: string;
	REALTIME_TURN_TOKEN_SECRET?: string;
	REALTIME_TURN_TOKEN_TTL_SECONDS?: string;
	REALTIME_TURN_ORIGINS?: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// check URL is /turn-credentials
		const url = new URL(request.url);
		if (url.pathname !== '/turn-credentials') {
			return new Response('Not found', {
				status: 404,
				headers: {
					'Content-Type': 'application/json'
				}
			});
		}

		// CORS preflight handling
		if (request.method === 'OPTIONS') {
			return handleCORS(request, env);
		}

		// check if referrer URL is allowed
		const referrer = getRefererURL(request);
		const allowedOrigins = env.REALTIME_TURN_ORIGINS?.split(',') || ['*'];
		
		if (referrer === null || (allowedOrigins[0] !== '*' && allowedOrigins.indexOf(referrer.origin) === -1)) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: {
					'Content-Type': 'application/json'
				}
			});
		}

		// request API keys from Cloudflare Realtime
		const res = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${env.REALTIME_TURN_TOKEN_ID}/credentials/generate`, {
			method: 'post',
			headers: {
				authorization: `Bearer ${env.REALTIME_TURN_TOKEN_SECRET}`,
				'content-type': 'application/json',
			},
			body: JSON.stringify({
				ttl: parseInt(env.REALTIME_TURN_TOKEN_TTL_SECONDS || '86400'),
			}),
		});

		// check response is acceptable
		if (res.status !== 201) {
			console.log(`Bad response from Cloudflare Realtime API (${res.status} ${res.statusText}): ${await res.text()}`);
			return new Response(JSON.stringify({ error: 'Internal server error' }), {
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			});
		}

		// parse JSON
		const creds = await res.json() as {
			iceServers: {
				urls: string[];
				username: string;
				credential: string;
			};
		};

		// Set CORS headers
		const corsHeaders = {
			'content-type': 'application/json',
			'access-control-allow-origin': referrer?.origin || allowedOrigins[0],
			'access-control-allow-methods': 'GET, POST, OPTIONS',
			'access-control-allow-headers': 'Content-Type, X-Requested-With',
		};

		// return to client
		return new Response(
			JSON.stringify({
				urls: creds.iceServers.urls.filter((urlString) => {
					const url = new URL(urlString);
					return url.protocol === 'turn:' && url.searchParams.get('transport') === 'udp';
				}),
				username: creds.iceServers.username,
				credential: creds.iceServers.credential,
			}),
			{
				headers: corsHeaders,
			},
		);
	},
} satisfies ExportedHandler<Env>;

function handleCORS(request: Request, env: Env): Response {
	const origin = request.headers.get('Origin');
	const allowedOrigins = env.REALTIME_TURN_ORIGINS?.split(',') || ['*'];
	const allowOrigin = allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin)) ? 
		(origin || '*') : allowedOrigins[0];

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

function getRefererURL(request: Request) {
	const referer = request.headers.get('Referer');
	if (referer === null) {
		return null;
	}

	try {
		return new URL(referer);
	} catch (e) {
		return null;
	}
}