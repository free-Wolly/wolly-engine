import express from "express";
import sequelize from "./config/database";

import dotenv from "dotenv";
import cors from "cors";

// CUSTOMER ROUTES
import customerCleaningOrderRoutes from "./routes/customer/cutomerCleaningOrderRoutes";
import customerRoutes from "./routes/customer/customerRoutes";

// CRM ROUTES
import userRoutes from "./routes/crm/userRoutes";
import employeeRoutes from "./routes/crm/employeeRoutes";
import workScheduleRoutes from "./routes/crm/workScheduleRoutes";
import crmCleaningOrderRoutes from "./routes/crm/crmCleaningOrderRoutes";

//TODO: REMOVE THIS IMPORT AFTER REMOVING SEED ENDPOINT
import User from "./models/user";
import customerAddressRoutes from "./routes/customer/customerAddressRoutes";
import crmAddressRoutes from "./routes/crm/crmAddressRoutes";
dotenv.config();
if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set in the environment variables");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// CUSTOMER ROUTES
app.use("/api/customer", customerRoutes);
app.use("/api/cleaning-orders", customerCleaningOrderRoutes);
app.use("/api/address", customerAddressRoutes);

// CRM ROUTES
app.use("/api/crm/users", userRoutes);
app.use("/api/crm/employees", employeeRoutes);
app.use("/api/crm/work-schedules", workScheduleRoutes);
app.use("/api/crm/cleaning-orders", crmCleaningOrderRoutes);
app.use("/api/crm/addresses", crmAddressRoutes);

//TODO: REMOVE DEV ENDPOINT TO SEED ADMIN USER
app.post("/api/crm/seed", async (req, res) => {
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

// TODO: REMOVE SYNC DATABASE FOR DEVELOPMENT
sequelize.sync({ force: true }).then(() => {
  console.log("Database synchronized");
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
