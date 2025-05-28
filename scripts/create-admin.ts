#!/usr/bin/env tsx

import { createInterface } from "readline";
import { storage } from "../server/storage";
import { hashPassword } from "../server/auth";
import { db } from "../server/db";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function questionHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    
    let input = "";
    const onData = (char: Buffer) => {
      const c = char.toString();
      if (c === "\r" || c === "\n") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener("data", onData);
        console.log();
        resolve(input);
      } else if (c === "\u0003") {
        // Ctrl+C
        process.exit(0);
      } else if (c === "\u007f") {
        // Backspace
        if (input.length > 0) {
          input = input.slice(0, -1);
          process.stdout.write("\b \b");
        }
      } else if (c >= " ") {
        input += c;
        process.stdout.write("*");
      }
    };
    
    process.stdin.on("data", onData);
  });
}

async function main() {
  try {
    console.log("🔐 Admin User Setup");
    console.log("==================");
    
    // Check if any admin users already exist
    const adminCount = await storage.countAdminUsers();
    if (adminCount > 0) {
      console.log("❌ Admin users already exist. This script only works for initial setup.");
      console.log("Use the admin interface to create additional admin users.");
      process.exit(1);
    }

    console.log("Creating the first admin user for your Activity Streak app.\n");

    // Get username
    let username: string;
    do {
      username = await question("Username (min 3 characters): ");
      if (username.length < 3) {
        console.log("❌ Username must be at least 3 characters long.");
      }
    } while (username.length < 3);

    // Check if username already exists
    const existingAdmin = await storage.getAdminByUsername(username);
    if (existingAdmin) {
      console.log("❌ Username already exists. Please choose a different username.");
      process.exit(1);
    }

    // Get password
    let password: string;
    let confirmPassword: string = "";
    do {
      password = await questionHidden("Password (min 8 characters): ");
      if (password.length < 8) {
        console.log("❌ Password must be at least 8 characters long.");
        continue;
      }
      
      confirmPassword = await questionHidden("Confirm password: ");
      if (password !== confirmPassword) {
        console.log("❌ Passwords do not match. Please try again.");
      }
    } while (password.length < 8 || password !== confirmPassword);

    // Hash password and create admin user
    console.log("\n🔄 Creating admin user...");
    const hashedPassword = await hashPassword(password);
    
    const admin = await storage.createAdminUser({
      username,
      passwordHash: hashedPassword,
      isActive: true,
    });

    console.log("✅ Admin user created successfully!");
    console.log(`👤 Username: ${admin.username}`);
    console.log(`🆔 User ID: ${admin.id}`);
    console.log("\nYou can now log in to the admin interface.");
    
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Run the script
main();