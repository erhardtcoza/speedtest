// TypeScript definitions for Cloudflare Workers
interface Env {
	SPEEDTEST_KV?: KVNamespace;
	CORS_ORIGINS?: string;
	MAX_FILE_SIZE?: string;
	ENABLE_METRICS?: string;
}

declare global {
	interface KVNamespace {
		get(key: string, options?: any): Promise<string | null>;
		put(key: string, value: string, options?: any): Promise<void>;
		delete(key: string): Promise<void>;
		list(options?: any): Promise<any>;
	}
	
	interface ExecutionContext {
		waitUntil(promise: Promise<any>): void;
		passThroughOnException(): void;
	}
}

export {};