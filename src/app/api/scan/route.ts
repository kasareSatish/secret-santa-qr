import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

// List 1: Valid emails who can participate
const VALID_EMAILS = [
  "john.smith@gmail.com",
  "emma.wilson@yahoo.com",
];

// List 2: Secret Santa matches (QR ID -> Santa name to show)
const SANTA_MATCHES: Record<number, string> = {
  1: "Michael Johnson",
  2: "Sarah Parker",
};

// Total participants
const TOTAL_PARTICIPANTS = 2;

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

    if (!VALID_EMAILS.includes(normalizedEmail)) {
      return NextResponse.json(
        { error: "invalid_email", message: "This email is not registered for Secret Santa" },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db("secret-santa");
    const scansCollection = db.collection("scans");
    const usedQRsCollection = db.collection("used_qrs");

    const usedQR = await usedQRsCollection.findOne({ qrId: qrId });
    if (usedQR) {
      return NextResponse.json(
        { error: "qr_used", message: "This QR code has already been scanned!" },
        { status: 403 }
      );
    }

    const existingScan = await scansCollection.findOne({ email: normalizedEmail });
    if (existingScan) {
      return NextResponse.json(
        { error: "already_scanned", message: "You have already scanned a QR code!", existingMatch: existingScan.santaMatch },
        { status: 403 }
      );
    }

    const santaMatch = SANTA_MATCHES[qrId];
    if (!santaMatch) {
      return NextResponse.json(
        { error: "no_match", message: "No Secret Santa match found for this QR" },
        { status: 404 }
      );
    }

    await scansCollection.insertOne({
      email: normalizedEmail,
      qrId: qrId,
      santaMatch: santaMatch,
      scannedAt: new Date(),
    });

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
      totalParticipants: TOTAL_PARTICIPANTS,
      completedScans: totalScans,
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

export async function DELETE() {
  try {
    const client = await clientPromise;
    const db = client.db("secret-santa");
    
    await db.collection("scans").deleteMany({});
    await db.collection("used_qrs").deleteMany({});

    return NextResponse.json({ success: true, message: "Database cleaned!" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to clean database" }, { status: 500 });
  }
}
