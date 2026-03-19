import { NextResponse } from "next/server";
import { getStravaActivities } from "@/lib/strava";
import { getSession } from "@/lib/auth";

export async function GET() {
  const valid = await getSession();
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasEnv = !!(process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET && process.env.STRAVA_REFRESH_TOKEN);
  if (!hasEnv) {
    return NextResponse.json({ error: "Strava env vars not set", vars: { id: !!process.env.STRAVA_CLIENT_ID, secret: !!process.env.STRAVA_CLIENT_SECRET, token: !!process.env.STRAVA_REFRESH_TOKEN } });
  }

  const activities = await getStravaActivities(5);
  return NextResponse.json({ count: activities.length, activities: activities.map((a) => ({ name: a.name, type: a.type, date: a.start_date_local })) });
}
