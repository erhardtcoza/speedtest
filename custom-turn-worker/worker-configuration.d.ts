// TypeScript definitions for Cloudflare Workers
interface Env {
	REALTIME_TURN_TOKEN_ID?: string;
	REALTIME_TURN_TOKEN_SECRET?: string;
	REALTIME_TURN_TOKEN_TTL_SECONDS?: string;
	REALTIME_TURN_ORIGINS?: string;
}

declare global {
	interface ExportedHandler<T = unknown> {
		fetch?(request: Request, env: T, ctx: ExecutionContext): Promise<Response> | Response;
		scheduled?(event: ScheduledEvent, env: T, ctx: ExecutionContext): Promise<void> | void;
		queue?(batch: MessageBatch, env: T, ctx: ExecutionContext): Promise<void> | void;
	}
	
	interface ExecutionContext {
		waitUntil(promise: Promise<any>): void;
		passThroughOnException(): void;
	}

	interface ScheduledEvent {
		scheduledTime: number;
		cron: string;
	}

	interface MessageBatch {
		messages: Message[];
		queue: string;
	}

	interface Message {
		body: any;
		id: string;
		timestamp: Date;
	}
}

export {};