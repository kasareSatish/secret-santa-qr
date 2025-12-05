import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "missing_fields", message: "Email is required" }, { status: 400 });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const client = await clientPromise;
    const db = client.db("secret-santa");

    // Check if email is registered
    const validEmail = await db.collection("emails").findOne({ email: normalizedEmail });
    if (!validEmail) {
      return NextResponse.json({ error: "invalid_email", message: "This email is not registered for Secret Santa" }, { status: 403 });
    }

    // Check if email already scanned
    const existingScan = await db.collection("scans").findOne({ email: normalizedEmail });
    if (existingScan) {
      return NextResponse.json({ error: "already_scanned", message: "You have already registered!" }, { status: 403 });
    }

    // Get available santa names (not yet assigned)
    const availableSantas = await db.collection("santa_names").find({ assigned: { $ne: true } }).toArray();
    if (availableSantas.length === 0) {
      return NextResponse.json({ error: "no_santas", message: "No santa matches available!" }, { status: 404 });
    }

    // Randomly pick one
    const randomSanta = availableSantas[Math.floor(Math.random() * availableSantas.length)];

    // Mark santa as assigned
    await db.collection("santa_names").updateOne({ _id: randomSanta._id }, { $set: { assigned: true, assignedTo: normalizedEmail, assignedAt: new Date() } });

    // Record scan
    await db.collection("scans").insertOne({ email: normalizedEmail, santaMatch: randomSanta.name, scannedAt: new Date() });

    return NextResponse.json({ success: true, santaMatch: randomSanta.name });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json({ error: "server_error", message: "Something went wrong" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("secret-santa");
    const totalEmails = await db.collection("emails").countDocuments();
    const totalSantas = await db.collection("santa_names").countDocuments();
    const completedScans = await db.collection("scans").countDocuments();
    const matches = await db.collection("scans").find({}).toArray();
    return NextResponse.json({
      totalParticipants: Math.min(totalEmails, totalSantas),
      totalEmails,
      totalSantas,
      completedScans,
      matches: matches.map(m => ({ email: m.email, santaMatch: m.santaMatch, scannedAt: m.scannedAt }))
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const client = await clientPromise;
    const db = client.db("secret-santa");
    await db.collection("scans").deleteMany({});
    await db.collection("santa_names").updateMany({}, { $set: { assigned: false }, $unset: { assignedTo: "", assignedAt: "" } });
    return NextResponse.json({ success: true, message: "Scan data cleared and santa assignments reset!" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to clear" }, { status: 500 });
  }
}
