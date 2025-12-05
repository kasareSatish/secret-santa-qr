import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

// List 1: Valid emails who can participate
const VALID_EMAILS = [
  "test@xyz.com",
  // Add more valid emails here
];

// List 2: Secret Santa matches (QR ID -> Santa name to show)
const SANTA_MATCHES: Record<number, string> = {
  1: "Santa Alice",
  2: "Santa Bob",
  3: "Santa Charlie",
  4: "Santa Diana",
  5: "Santa Edward",
  // Add more matches: QR studentId -> Santa name
};

export async function POST(request: NextRequest) {
  try {
    const { email, qrId } = await request.json();

    if (!email || !qrId) {
      return NextResponse.json(
        { error: "missing_fields", message: "Email and QR code are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Step 1: Check if email is in valid list
    if (!VALID_EMAILS.includes(normalizedEmail)) {
      return NextResponse.json(
        { error: "invalid_email", message: "This email is not registered for Secret Santa" },
        { status: 403 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("secret-santa");
    const scansCollection = db.collection("scans");
    const usedQRsCollection = db.collection("used_qrs");

    // Step 2: Check if this QR has already been used
    const usedQR = await usedQRsCollection.findOne({ qrId: qrId });
    if (usedQR) {
      return NextResponse.json(
        { error: "qr_used", message: "This QR code has already been scanned by someone else!" },
        { status: 403 }
      );
    }

    // Step 3: Check if this email already scanned a QR
    const existingScan = await scansCollection.findOne({ email: normalizedEmail });
    if (existingScan) {
      return NextResponse.json(
        {
          error: "already_scanned",
          message: "You have already scanned a QR code!",
          existingMatch: existingScan.santaMatch
        },
        { status: 403 }
      );
    }

    // Step 4: Get the Santa match for this QR
    const santaMatch = SANTA_MATCHES[qrId];
    if (!santaMatch) {
      return NextResponse.json(
        { error: "no_match", message: "No Secret Santa match found for this QR" },
        { status: 404 }
      );
    }

    // Step 5: Record the scan
    await scansCollection.insertOne({
      email: normalizedEmail,
      qrId: qrId,
      santaMatch: santaMatch,
      scannedAt: new Date(),
    });

    // Step 6: Mark this QR as used
    await usedQRsCollection.insertOne({
      qrId: qrId,
      usedBy: normalizedEmail,
      usedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      santaMatch: santaMatch,
      message: "Match found!",
    });

  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("secret-santa");
    const scansCollection = db.collection("scans");
    const usedQRsCollection = db.collection("used_qrs");

    const totalScans = await scansCollection.countDocuments();
    const usedQRs = await usedQRsCollection.countDocuments();
    const allMatches = await scansCollection.find({}).toArray();

    return NextResponse.json({
      totalScans,
      usedQRs,
      matches: allMatches.map(m => ({
        email: m.email,
        santaMatch: m.santaMatch,
        scannedAt: m.scannedAt,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
