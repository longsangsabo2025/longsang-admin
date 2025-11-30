/**
 * VNPay Payment Integration for Vietnam
 * https://sandbox.vnpayment.vn/apis/docs/huong-dan-tich-hop/
 */

const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const querystring = require("querystring");
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// VNPay Configuration
const vnpayConfig = {
  vnp_TmnCode: process.env.VNPAY_TMN_CODE || "YOUR_TMN_CODE",
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET || "YOUR_HASH_SECRET",
  vnp_Url: process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnp_ReturnUrl: `${process.env.VITE_APP_URL || "http://localhost:5173"}/payment-vnpay-return`,
  vnp_IpnUrl: `${process.env.VITE_API_URL || "http://localhost:3001"}/api/vnpay/ipn`,
};

/**
 * Sort object keys alphabetically
 */
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  keys.forEach((key) => {
    sorted[key] = obj[key];
  });
  return sorted;
}

/**
 * Create HMAC SHA512 signature
 */
function createSignature(data, secretKey) {
  return crypto.createHmac("sha512", secretKey).update(Buffer.from(data, "utf-8")).digest("hex");
}

/**
 * Create VNPay Payment URL
 * POST /api/vnpay/create-payment-url
 */
router.post("/create-payment-url", async (req, res) => {
  try {
    const { planId, userId, amount, orderInfo } = req.body;

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    if (userError) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate unique transaction reference
    const date = new Date();
    const createDate = date
      .toISOString()
      .replace(/[-:T.Z]/g, "")
      .slice(0, 14);
    const orderId = `${userId}_${planId}_${Date.now()}`;

    // Calculate amount in VND (VNPay uses smallest unit - no decimals)
    // If amount in USD, convert to VND (1 USD ≈ 25,000 VND)
    const amountVND = Math.round((amount || plan.price_monthly) * 25000);

    // Build VNPay parameters
    let vnpParams = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: vnpayConfig.vnp_TmnCode,
      vnp_Amount: amountVND * 100, // VNPay amount = actual amount * 100
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo || `Thanh toan goi ${plan.display_name}`,
      vnp_OrderType: "other",
      vnp_Locale: "vn",
      vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
      vnp_IpAddr: req.ip || req.connection.remoteAddress || "127.0.0.1",
      vnp_CreateDate: createDate,
    };

    // Sort parameters
    vnpParams = sortObject(vnpParams);

    // Create signature data
    const signData = querystring.stringify(vnpParams, { encode: false });
    const signature = createSignature(signData, vnpayConfig.vnp_HashSecret);

    // Add signature to params
    vnpParams.vnp_SecureHash = signature;

    // Build payment URL
    const paymentUrl =
      vnpayConfig.vnp_Url + "?" + querystring.stringify(vnpParams, { encode: false });

    // Store pending transaction
    await supabase.from("payment_history").insert({
      user_id: userId,
      plan_id: planId,
      amount: amountVND / 100,
      currency: "VND",
      status: "pending",
      payment_method: "vnpay",
      transaction_id: orderId,
      metadata: JSON.stringify({ vnp_TxnRef: orderId }),
      created_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      paymentUrl,
      orderId,
      amount: amountVND,
    });
  } catch (error) {
    console.error("VNPay payment URL error:", error);
    res.status(500).json({
      error: "Failed to create payment URL",
      message: error.message,
    });
  }
});

/**
 * VNPay Return URL Handler
 * GET /api/vnpay/return
 */
router.get("/return", async (req, res) => {
  try {
    let vnpParams = req.query;
    const secureHash = vnpParams.vnp_SecureHash;

    // Remove hash and hash type from params
    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;

    // Sort parameters
    vnpParams = sortObject(vnpParams);

    // Verify signature
    const signData = querystring.stringify(vnpParams, { encode: false });
    const checkSum = createSignature(signData, vnpayConfig.vnp_HashSecret);

    if (secureHash !== checkSum) {
      return res.redirect(`${process.env.VITE_APP_URL}/payment-failed?error=invalid_signature`);
    }

    const orderId = vnpParams.vnp_TxnRef;
    const responseCode = vnpParams.vnp_ResponseCode;
    const transactionNo = vnpParams.vnp_TransactionNo;
    const amount = parseInt(vnpParams.vnp_Amount) / 100;

    // Update payment status
    if (responseCode === "00") {
      // Payment success
      await handlePaymentSuccess(orderId, transactionNo, amount);
      return res.redirect(`${process.env.VITE_APP_URL}/payment-success?orderId=${orderId}`);
    } else {
      // Payment failed
      await handlePaymentFailed(orderId, responseCode);
      return res.redirect(`${process.env.VITE_APP_URL}/payment-failed?code=${responseCode}`);
    }
  } catch (error) {
    console.error("VNPay return handler error:", error);
    res.redirect(`${process.env.VITE_APP_URL}/payment-failed?error=processing_error`);
  }
});

/**
 * VNPay IPN (Instant Payment Notification) Handler
 * POST /api/vnpay/ipn
 */
router.post("/ipn", async (req, res) => {
  try {
    let vnpParams = req.query;
    const secureHash = vnpParams.vnp_SecureHash;

    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;

    vnpParams = sortObject(vnpParams);
    const signData = querystring.stringify(vnpParams, { encode: false });
    const checkSum = createSignature(signData, vnpayConfig.vnp_HashSecret);

    if (secureHash !== checkSum) {
      return res.status(200).json({ RspCode: "97", Message: "Invalid signature" });
    }

    const orderId = vnpParams.vnp_TxnRef;
    const responseCode = vnpParams.vnp_ResponseCode;

    // Check if order exists
    const { data: payment } = await supabase
      .from("payment_history")
      .select("*")
      .eq("transaction_id", orderId)
      .single();

    if (!payment) {
      return res.status(200).json({ RspCode: "01", Message: "Order not found" });
    }

    if (payment.status === "succeeded") {
      return res.status(200).json({ RspCode: "02", Message: "Order already confirmed" });
    }

    if (responseCode === "00") {
      const amount = parseInt(vnpParams.vnp_Amount) / 100;
      await handlePaymentSuccess(orderId, vnpParams.vnp_TransactionNo, amount);
      return res.status(200).json({ RspCode: "00", Message: "Success" });
    } else {
      await handlePaymentFailed(orderId, responseCode);
      return res.status(200).json({ RspCode: "00", Message: "Success" });
    }
  } catch (error) {
    console.error("VNPay IPN error:", error);
    res.status(200).json({ RspCode: "99", Message: "Unknown error" });
  }
});

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(orderId, transactionNo, amount) {
  try {
    // Get payment record
    const { data: payment } = await supabase
      .from("payment_history")
      .select("user_id, plan_id")
      .eq("transaction_id", orderId)
      .single();

    if (!payment) return;

    // Update payment status
    await supabase
      .from("payment_history")
      .update({
        status: "succeeded",
        transaction_id: transactionNo,
        updated_at: new Date().toISOString(),
      })
      .eq("transaction_id", orderId);

    // Get plan details
    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", payment.plan_id)
      .single();

    // Update user subscription
    await supabase.from("user_subscriptions").upsert({
      user_id: payment.user_id,
      plan_id: payment.plan_id,
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Get user details for email
    const { data: user } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", payment.user_id)
      .single();

    // Send success email
    try {
      await sendEmail(user?.email, "invoice", {
        name: user?.full_name || "Người dùng",
        planName: plan?.display_name || "Premium",
        amount: (amount / 100).toFixed(0),
        invoiceNumber: transactionNo,
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("vi-VN"),
        dashboardUrl: `${process.env.VITE_APP_URL}/admin/subscription`,
      });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
    }

    console.log(`VNPay payment success: ${orderId} - ${amount} VND`);
  } catch (error) {
    console.error("Handle payment success error:", error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(orderId, responseCode) {
  try {
    await supabase
      .from("payment_history")
      .update({
        status: "failed",
        metadata: JSON.stringify({ response_code: responseCode }),
        updated_at: new Date().toISOString(),
      })
      .eq("transaction_id", orderId);

    console.log(`VNPay payment failed: ${orderId} - Code: ${responseCode}`);
  } catch (error) {
    console.error("Handle payment failed error:", error);
  }
}

/**
 * Send email helper
 */
async function sendEmail(to, template, data) {
  try {
    const response = await fetch(`http://localhost:3001/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, template, data }),
    });
    if (!response.ok) throw new Error("Email API error");
  } catch (error) {
    console.error("Email send error:", error);
  }
}

/**
 * Query transaction status
 * POST /api/vnpay/query-transaction
 */
router.post("/query-transaction", async (req, res) => {
  try {
    const { orderId } = req.body;

    const { data: payment } = await supabase
      .from("payment_history")
      .select("*")
      .eq("transaction_id", orderId)
      .single();

    if (!payment) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({
      success: true,
      transaction: {
        orderId: payment.transaction_id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        createdAt: payment.created_at,
      },
    });
  } catch (error) {
    console.error("Query transaction error:", error);
    res.status(500).json({ error: "Failed to query transaction" });
  }
});

module.exports = router;
