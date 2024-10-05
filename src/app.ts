import express from "express";
import sequelize from "./config/database";
import userRoutes from "./routes/userRoutes";
import employeeRoutes from "./routes/employeeRoutes";
import dotenv from "dotenv";
import Employee from "./models/employee";
import WorkSchedule from "./models/workSchedule";

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set in the environment variables");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/employees", employeeRoutes);

// SYNC DATABASE FOR DEVELOPMENT
sequelize.sync({ force: true }).then(() => {
  console.log("Database synchronized");
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
