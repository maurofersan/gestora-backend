import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PushDevice, PushDeviceDocument } from './schemas/push-device.schema';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';

@Injectable()
export class PushDeviceService {
  constructor(
    @InjectModel(PushDevice.name) private readonly pushDeviceModel: Model<PushDeviceDocument>,
  ) {}

  async register(userId: Types.ObjectId, dto: RegisterPushTokenDto): Promise<void> {
    await this.pushDeviceModel.findOneAndUpdate(
      { expoPushToken: dto.expoPushToken },
      { userId, expoPushToken: dto.expoPushToken, platform: dto.platform },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  async tokensForUsers(userIds: Types.ObjectId[]): Promise<string[]> {
    const map = await this.tokensByUserMap(userIds);
    return [...new Set([...map.values()].flat())];
  }

  async tokensByUserMap(userIds: Types.ObjectId[]): Promise<Map<string, string[]>> {
    const map = new Map<string, string[]>();
    if (userIds.length === 0) return map;

    const devices = await this.pushDeviceModel
      .find({ userId: { $in: userIds } })
      .select('userId expoPushToken')
      .lean()
      .exec();

    for (const device of devices) {
      const key = device.userId.toString();
      const list = map.get(key) ?? [];
      list.push(device.expoPushToken);
      map.set(key, list);
    }
    return map;
  }

  async removeTokens(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;
    await this.pushDeviceModel.deleteMany({ expoPushToken: { $in: tokens } }).exec();
  }
}
