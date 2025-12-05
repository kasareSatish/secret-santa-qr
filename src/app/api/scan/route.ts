import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const { email, qrId } = await request.json();
    if (!email || !qrId) {
      return NextResponse.json({ error: "missing_fields", message: "Email and QR code are required" }, { status: 400 });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const client = await clientPromise;
    const db = client.db("secret-santa");

    // Check if email is registered
    const participant = await db.collection("participants").findOne({ email: normalizedEmail });
    if (!participant) {
      return NextResponse.json({ error: "invalid_email", message: "This email is not registered for Secret Santa" }, { status: 403 });
    }

    // Check if QR already used
    const usedQR = await db.collection("used_qrs").findOne({ qrId: qrId });
    if (usedQR) {
      return NextResponse.json({ error: "qr_used", message: "This QR code has already been scanned!" }, { status: 403 });
    }

    // Check if email already scanned - DON'T show existing match
    const existingScan = await db.collection("scans").findOne({ email: normalizedEmail });
    if (existingScan) {
      return NextResponse.json({ error: "already_scanned", message: "You have already registered!" }, { status: 403 });
    }

    // Get santa match from participants collection by qrId
    const matchParticipant = await db.collection("participants").findOne({ qrId: qrId });
    if (!matchParticipant) {
      return NextResponse.json({ error: "no_match", message: "No match found for this QR" }, { status: 404 });
    }

    // Record scan
    await db.collection("scans").insertOne({ email: normalizedEmail, qrId, santaMatch: matchParticipant.santaName, scannedAt: new Date() });
    await db.collection("used_qrs").insertOne({ qrId, usedBy: normalizedEmail, usedAt: new Date() });

    return NextResponse.json({ success: true, santaMatch: matchParticipant.santaName });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json({ error: "server_error", message: "Something went wrong" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("secret-santa");
    const totalParticipants = await db.collection("participants").countDocuments();
    const completedScans = await db.collection("scans").countDocuments();
    const matches = await db.collection("scans").find({}).toArray();
    return NextResponse.json({ totalParticipants, completedScans, matches: matches.map(m => ({ email: m.email, santaMatch: m.santaMatch, scannedAt: m.scannedAt })) });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const client = await clientPromise;
    const db = client.db("secret-santa");
    await db.collection("scans").deleteMany({});
    await db.collection("used_qrs").deleteMany({});
    return NextResponse.json({ success: true, message: "Scan data cleared!" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to clear" }, { status: 500 });
  }
}
