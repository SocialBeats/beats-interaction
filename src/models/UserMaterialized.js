import mongoose from 'mongoose';

const UserMaterializedSchema = new mongoose.Schema(
  {
    userId: { type: String, index: true },
    username: { type: String, index: true },
    email: { type: String, index: true },
    roles: [String],
    createdAt: Date,
    updatedAt: Date,
  },
  {
    collection: 'users_view',
    timestamps: false,
  }
);
UserMaterializedSchema.index({ username: 1 });
UserMaterializedSchema.index({ email: 1 });
UserMaterializedSchema.index({ roles: 1 });

const UserMaterialized = mongoose.model(
  'UserMaterialized',
  UserMaterializedSchema
);

export default UserMaterialized;
