import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("secret-santa");
    const participants = await db.collection("participants").find({}).toArray();
    return NextResponse.json({ participants: participants.map(p => ({ id: p._id, email: p.email, santaName: p.santaName, qrId: p.qrId })) });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, santaName } = await request.json();
    if (!email || !santaName) {
      return NextResponse.json({ error: "Email and Santa name required" }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db("secret-santa");
    const existing = await db.collection("participants").findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }
    const count = await db.collection("participants").countDocuments();
    const qrId = count + 1;
    await db.collection("participants").insertOne({ email: email.toLowerCase(), santaName, qrId, createdAt: new Date() });
    return NextResponse.json({ success: true, qrId });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const client = await clientPromise;
    const db = client.db("secret-santa");
    await db.collection("participants").deleteMany({});
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
