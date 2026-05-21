import { Module } from '@nestjs/common';
import { CloudinaryAssetService } from './cloudinary-asset.service';

@Module({
  providers: [CloudinaryAssetService],
  exports: [CloudinaryAssetService],
})
export class CloudinaryModule {}
