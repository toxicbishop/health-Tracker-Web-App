import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretfallbackkey"; // Better to have this in .env

export class AuthService {
  async register(
    username: string,
    password: string,
  ): Promise<{ userId: string }> {
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new Error("Username already exists");
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Save user in MongoDB
    const newUser = await User.create({
      username,
      passwordHash,
    });

    return { userId: newUser._id.toString() };
  }

  async login(
    username: string,
    password: string,
  ): Promise<{ token: string; userId: string }> {
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error("Invalid username or password");
    }

    // Compare passwords
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid username or password");
    }

    const userId = user._id.toString();

    // Generate JWT
    const token = jwt.sign({ userId, username: user.username }, JWT_SECRET, {
      expiresIn: "24h",
    });

    return { token, userId };
  }
  async getProfile(
    userId: string,
  ): Promise<{ username: string; id: string; createdAt: Date }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user._id.toString(),
      username: user.username,
      createdAt: (user as any).createdAt,
    };
  }
}

export const authService = new AuthService();
