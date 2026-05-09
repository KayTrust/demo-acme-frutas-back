import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigEnvVars } from 'src/configs';
import { v4 as uuid } from 'uuid';

@Injectable()
export class SessionRegistryService implements OnModuleDestroy {
  private readonly sessions = new Map<string, number>(); // sessionId → expiresAt
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor(
    private readonly configService: ConfigService<ConfigEnvVars, true>,
  ) {
    const CLEANUP_INTERVAL_MS = this.configService.get('CLEANUP_INTERVAL_MS', { infer: true });
    this.cleanupInterval = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    clearInterval(this.cleanupInterval);
  }

  create(): string {
    const sessionId = uuid();
    const SESSION_TTL_MS = this.configService.get('SESSION_TTL_MS', { infer: true });
    this.sessions.set(sessionId, Date.now() + SESSION_TTL_MS);
    return sessionId;
  }

  exists(sessionId: string): boolean {
    if (!sessionId) return false;
    const expiresAt = this.sessions.get(sessionId);
    if (expiresAt === undefined) return false;
    if (Date.now() > expiresAt) {
      this.sessions.delete(sessionId);
      return false;
    }
    return true;
  }

  remove(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /** Reemplaza una sesión existente por una nueva. */
  rotate(prevSessionId?: string): string {
    if (prevSessionId) this.remove(prevSessionId);
    return this.create();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [id, expiresAt] of this.sessions) {
      if (now > expiresAt) this.sessions.delete(id);
    }
  }
}
