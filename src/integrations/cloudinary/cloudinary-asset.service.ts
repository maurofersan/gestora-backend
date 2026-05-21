import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import type {
  CloudinaryDestroyOutcome,
  CloudinaryDestroyResult,
  CloudinaryRuntimeConfig,
} from './cloudinary.types';

@Injectable()
export class CloudinaryAssetService {
  private readonly logger = new Logger(CloudinaryAssetService.name);
  private configured = false;

  constructor(private readonly configService: ConfigService) {
    const runtime = this.readRuntimeConfig();
    if (runtime) {
      cloudinary.config({
        cloud_name: runtime.cloudName,
        api_key: runtime.apiKey,
        api_secret: runtime.apiSecret,
        secure: true,
      });
      this.configured = true;
    } else {
      this.logger.warn(
        'Cloudinary no configurado (CLOUDINARY_*). DELETE de evidencias solo borrará MongoDB.',
      );
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  /**
   * Best-effort destroy: never throws for "asset not found" (manual delete in console).
   * Network/API misconfiguration still surfaces as errors.
   */
  async destroyByPublicId(publicId: string): Promise<CloudinaryDestroyResult> {
    if (!this.configured) {
      return { publicId, outcome: 'skipped' };
    }

    try {
      const response = await cloudinary.uploader.destroy(publicId, {
        invalidate: true,
        resource_type: 'image',
      });

      const outcome = this.mapDestroyResult(response.result);
      if (outcome === 'not_found') {
        this.logger.warn(`Cloudinary asset no encontrado (public_id=${publicId})`);
      }
      return { publicId, outcome };
    } catch (error) {
      if (this.isNotFoundError(error)) {
        this.logger.warn(`Cloudinary asset no encontrado (public_id=${publicId})`);
        return { publicId, outcome: 'not_found' };
      }
      throw error;
    }
  }

  async destroyByPublicIds(publicIds: string[]): Promise<CloudinaryDestroyResult[]> {
    const unique = [...new Set(publicIds.filter(Boolean))];
    return Promise.all(unique.map((id) => this.destroyByPublicId(id)));
  }

  private readRuntimeConfig(): CloudinaryRuntimeConfig | null {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');
    if (!cloudName || !apiKey || !apiSecret) {
      return null;
    }
    return { cloudName, apiKey, apiSecret };
  }

  private mapDestroyResult(result: string | undefined): CloudinaryDestroyOutcome {
    if (result === 'ok') return 'ok';
    if (result === 'not found') return 'not_found';
    return 'not_found';
  }

  private isNotFoundError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const httpCode = (error as { http_code?: number }).http_code;
    return httpCode === 404;
  }
}
