import { NextRequest, NextResponse } from "next/server";

// In-memory store (resets on server restart)
// For production, use a database like Vercel KV, MongoDB, etc.
const scannedUsers = new Map<string, { studentName: string; timestamp: number }>();

export async function POST(request: NextRequest) {
  try {
    const { scannerName, studentId, studentName } = await request.json();

    if (!scannerName || !studentId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const normalizedName = scannerName.trim().toLowerCase();

    // Check if this person already scanned a QR
    if (scannedUsers.has(normalizedName)) {
      const existing = scannedUsers.get(normalizedName);
      return NextResponse.json(
        { 
          error: "already_scanned",
          message: "You have already scanned a QR code!",
          existingMatch: existing?.studentName
        },
        { status: 403 }
      );
    }

    // Record the scan
    scannedUsers.set(normalizedName, {
      studentName,
      timestamp: Date.now(),
    });

    return NextResponse.json({
      success: true,
      message: "Scan recorded successfully",
      studentName,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return count of scans (for debugging)
  return NextResponse.json({
    totalScans: scannedUsers.size,
  });
}
