import { Model, DataTypes } from "sequelize";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sequelize from "../config/database";
import { v4 as uuidv4 } from "uuid";

interface UserAttributes {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "ADMIN" | "USER";
  createdAt: Date;
  updatedAt: Date;
}

interface UserCreationAttributes
  extends Omit<UserAttributes, "id" | "createdAt" | "updatedAt"> {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: string;
  public name!: string;
  public email!: string;
  public passwordHash!: string;
  public role!: "ADMIN" | "USER";
  public createdAt!: Date;
  public updatedAt!: Date;

  public generateToken(): string {
    return jwt.sign(
      {
        id: this.id,
        name: this.name,
        email: this.email,
        role: this.role,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1h" }
    );
  }

  public async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }
}

User.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: () => `USER-${uuidv4()}`,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("ADMIN", "USER"),
      allowNull: false,
      defaultValue: "USER",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "User",
  }
);

User.beforeCreate(async (user: User) => {
  const salt = await bcrypt.genSalt(10);
  const date = new Date();
  user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
  user.createdAt = date;
  user.updatedAt = date;
});

User.beforeUpdate(async (user: User) => {
  user.updatedAt = new Date();
});

export default User;
