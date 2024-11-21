import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Injectable, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheConfigService {
    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) {}

    async saveToCache(key: string, value: any): Promise<void> {
        await this.cacheManager.set(key, value);
    }

    async getFromCache<T>(key: string): Promise<T | null> {
        return await this.cacheManager.get<T>(key);
    }

    async removeFromCache(key: string): Promise<void> {
        await this.cacheManager.del(key);
    }
}
