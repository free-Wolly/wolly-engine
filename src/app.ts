import express from "express";
import sequelize from "./config/database";
import userRoutes from "./routes/userRoutes";
import dotenv from "dotenv";
import cors from "cors";

import employeeRoutes from "./routes/employeeRoutes";
import workScheduleRoutes from "./routes/workScheduleRoutes";
import User from "./models/user";

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set in the environment variables");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/work-schedules", workScheduleRoutes);

// DEV ENDPOINT TO SEED ADMIN USER
app.post("/api/seed", async (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  const user = await User.findOne({ where: { email } });

  if (user) {
    return res.status(400).json({ error: "User email in use" });
  }

  User.create({
    email,
    name,
    passwordHash: password,
    role: "ADMIN",
  });
  res.status(201).json({ message: "Admin user created" });
});

// SYNC DATABASE FOR DEVELOPMENT
sequelize.sync({ force: true }).then(() => {
  console.log("Database synchronized");
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
