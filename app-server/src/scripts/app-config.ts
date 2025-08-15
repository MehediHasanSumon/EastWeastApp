import dotenv from "dotenv";
import inquirer from "inquirer";
import { Permission } from "../app/models/Permission";
import { Role } from "../app/models/Role";
import User from "../app/models/Users";
import connectDatabase from "../config/Database";
import { hashPassword } from "../utils/password";

dotenv.config();
const mongoUri: string | any = process.env.MONGO_URI;

async function main() {
  await connectDatabase(mongoUri);

  const answers = await inquirer.prompt([
    { type: "input", name: "name", message: "Name:" },
    { type: "input", name: "email", message: "Email:" },
    { type: "password", name: "password", message: "Password:", mask: "*" },
    {
      type: "password",
      name: "confirmPassword",
      message: "Confirm Password:",
      mask: "*",
    },
  ]);

  const { name, email, password, confirmPassword } = answers;

  if (password !== confirmPassword) {
    console.error("❌ Passwords do not match");
    process.exit(1);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    console.error("❌ User with this email already exists");
    process.exit(1);
  }

  const hashed = await hashPassword(password);

  const permissionsList = [
    "create-user",
    "update-user",
    "delete-user",
    "view-user",
    "create-role",
    "update-role",
    "delete-role",
    "view-role",
    "create-permission",
    "update-permission",
    "delete-permission",
    "view-permission",
  ];

  const permissions: any[] = [];

  for (const perm of permissionsList) {
    let permission = await Permission.findOne({ name: perm });
    if (!permission) {
      permission = await Permission.create({ name: perm });
      console.log(`✅ Created permission: ${perm}`);
    }
    permissions.push(permission);
  }

  const roleNames = ["user", "admin", "super-admin"];
  const rolesMap: Record<string, any> = {};

  for (const roleName of roleNames) {
    let role = await Role.findOne({ name: roleName });
    if (!role) {
      role = await Role.create({ name: roleName, permissions: [] });
      console.log(`✅ Created role: ${roleName}`);
    }
    rolesMap[roleName] = role;
  }

  rolesMap["super-admin"].permissions = permissions.map((p) => p._id);
  await rolesMap["super-admin"].save();
  console.log("🎉 Assigned all permissions to super-admin role");

  const user = await User.create({
    name,
    email,
    password: hashed,
    verify_at: new Date(),
    roles: [rolesMap["super-admin"]._id],
  });

  console.log(`🎉 Super admin created: ${user.email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
