import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("secret-santa");
    const emails = await db.collection("emails").find({}).toArray();
    const santaNames = await db.collection("santa_names").find({}).toArray();
    return NextResponse.json({
      emails: emails.map(e => ({ id: e._id.toString(), email: e.email })),
      santaNames: santaNames.map(s => ({ id: s._id.toString(), name: s.name, email: s.email, assigned: s.assigned || false }))
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, value, email } = await request.json();
    if (!type || !value) {
      return NextResponse.json({ error: "Type and value required" }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db("secret-santa");

    if (type === "email") {
      const normalizedEmail = value.trim().toLowerCase();
      const existing = await db.collection("emails").findOne({ email: normalizedEmail });
      if (existing) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 });
      }
      await db.collection("emails").insertOne({ email: normalizedEmail, createdAt: new Date() });
      return NextResponse.json({ success: true, message: "Email added" });
    } else if (type === "santa") {
      const santaEmail = email?.trim().toLowerCase() || "";
      const existing = await db.collection("santa_names").findOne({ name: value.trim() });
      if (existing) {
        return NextResponse.json({ error: "Santa name already exists" }, { status: 400 });
      }
      await db.collection("santa_names").insertOne({ 
        name: value.trim(), 
        email: santaEmail,
        assigned: false, 
        createdAt: new Date() 
      });
      return NextResponse.json({ success: true, message: "Santa name added" });
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to add" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const client = await clientPromise;
    const db = client.db("secret-santa");

    if (type === "emails") {
      await db.collection("emails").deleteMany({});
      return NextResponse.json({ success: true, message: "Emails cleared" });
    } else if (type === "santas") {
      await db.collection("santa_names").deleteMany({});
      return NextResponse.json({ success: true, message: "Santa names cleared" });
    } else {
      await db.collection("emails").deleteMany({});
      await db.collection("santa_names").deleteMany({});
      await db.collection("scans").deleteMany({});
      return NextResponse.json({ success: true, message: "All data cleared" });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
