#!/usr/bin/env node

/**
 * Test script for the forgot password functionality
 * This script tests the API endpoints and validates the implementation
 */

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api";

// Test token from the user's message
const TEST_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImEyZGEyOWNlLWRkYTgtNDRjYS05NjBhLTgyMzgwZGFlNThjZCIsIm5hbWUiOiJnYW1hbjAyMjEiLCJvd25lcklkIjoiYWEyMTJmOTEtZTg1Yy00ZDI0LWI3MjItNzA1NzQ2YzllYTk5Iiwicm9sZSI6Ik1lbWJlciIsImV4cCI6MTc1ODkyNjE4Mn0.NA6tjysckoPINIA1lwvFWebE6l964Bq1bpJeD7JehKA";

async function testForgotPassword() {
  console.log("🧪 Testing Forgot Password Implementation\n");

  try {
    // Test 1: Forgot Password Request
    console.log("1. Testing forgot password request...");
    const forgotPasswordResponse = await fetch(
      `${API_BASE_URL}/user/forgot-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "test@example.com",
        }),
      }
    );

    if (forgotPasswordResponse.ok) {
      const forgotPasswordData = await forgotPasswordResponse.json();
      console.log("✅ Forgot password request successful");
      console.log("   Response:", forgotPasswordData);
    } else {
      console.log("❌ Forgot password request failed");
      console.log("   Status:", forgotPasswordResponse.status);
      console.log("   Response:", await forgotPasswordResponse.text());
    }

    console.log("");

    // Test 2: Reset Password Request
    console.log("2. Testing reset password request...");
    const resetPasswordResponse = await fetch(
      `${API_BASE_URL}/user/reset-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: "NewPassword123",
          token: TEST_TOKEN,
        }),
      }
    );

    if (resetPasswordResponse.ok) {
      const resetPasswordData = await resetPasswordResponse.json();
      console.log("✅ Reset password request successful");
      console.log("   Response:", resetPasswordData);
    } else {
      console.log("❌ Reset password request failed");
      console.log("   Status:", resetPasswordResponse.status);
      console.log("   Response:", await resetPasswordResponse.text());
    }

    console.log("");

    // Test 3: Token Validation
    console.log("3. Testing token validation...");
    try {
      const tokenParts = TEST_TOKEN.split(".");
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log("✅ Token structure is valid");
        console.log("   Token payload:", payload);

        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp > now) {
          console.log("✅ Token is not expired");
        } else {
          console.log("⚠️  Token appears to be expired");
        }
      } else {
        console.log("❌ Invalid token structure");
      }
    } catch (error) {
      console.log("❌ Token validation failed:", error.message);
    }

    console.log("");

    // Test 4: Frontend Pages Accessibility
    console.log("4. Testing frontend pages accessibility...");
    const pages = [
      { name: "Login Page", url: "http://localhost:3000/login" },
      {
        name: "Forgot Password Page",
        url: "http://localhost:3000/forgot-password",
      },
      {
        name: "Reset Password Page",
        url: "http://localhost:3000/reset-password",
      },
    ];

    for (const page of pages) {
      try {
        const response = await fetch(page.url);
        if (response.ok) {
          console.log(`✅ ${page.name} is accessible`);
        } else {
          console.log(`❌ ${page.name} returned status: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${page.name} is not accessible: ${error.message}`);
      }
    }

    console.log("");
    console.log("🎉 Forgot password implementation test completed!");
    console.log("");
    console.log("📋 Test Summary:");
    console.log("   - Forgot password API endpoint tested");
    console.log("   - Reset password API endpoint tested");
    console.log("   - Token validation tested");
    console.log("   - Frontend pages accessibility tested");
    console.log("");
    console.log("🔗 Manual Testing URLs:");
    console.log("   - Login: http://localhost:3000/login");
    console.log("   - Forgot Password: http://localhost:3000/forgot-password");
    console.log(
      `   - Reset Password: http://localhost:3000/reset-password?token=${TEST_TOKEN}`
    );
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
  }
}

// Run the test
testForgotPassword();
