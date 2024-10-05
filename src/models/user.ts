import { Model, DataTypes } from "sequelize";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sequelize from "../config/database";

interface UserAttributes {
  id?: number;
  email: string;
  passwordHash: string;
  role: "ADMIN" | "USER";
}

interface UserCreationAttributes extends Omit<UserAttributes, "id"> {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number;
  public email!: string;
  public passwordHash!: string;
  public role!: "ADMIN" | "USER";

  public generateToken(): string {
    return jwt.sign(
      { id: this.id, email: this.email, role: this.role },
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
  },
  {
    sequelize,
    modelName: "User",
  }
);

User.beforeCreate(async (user: User) => {
  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
});

export default User;
