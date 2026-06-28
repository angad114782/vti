import mongoose, { Schema } from 'mongoose';

const rolePermissionSchema = new Schema({
  role: { type: String, required: true },
  module: { type: String, required: true },
  permission: { type: String, required: true },
  isGranted: { type: Boolean, default: false },
}, { timestamps: true });

rolePermissionSchema.index({ role: 1, permission: 1 }, { unique: true });

rolePermissionSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('RolePermission', rolePermissionSchema);
