import { CacheModule } from "@nestjs/cache-manager";
import { Global, Module } from "@nestjs/common";
import { CacheConfigService } from "./config.service";

@Global()
@Module({
    imports: [
        CacheModule.registerAsync({
            useFactory: async () => ({
                ttl: 60480000,
                max: 20,
            }),
        }),
    ],
    providers: [CacheConfigService],
    exports: [CacheModule, CacheConfigService]
})
export class CacheConfigModule {}