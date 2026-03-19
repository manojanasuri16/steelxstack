// ─── Strava API Integration ───

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string;
  start_date_local: string;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  calories?: number;
  suffer_score?: number;
  kudos_count: number;
  photo_count: number;
  map?: { summary_polyline?: string };
}

let cachedToken: { access_token: string; expires_at: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) return null;

  // Use cached token if still valid (with 60s buffer)
  if (cachedToken && cachedToken.expires_at > Date.now() / 1000 + 60) {
    return cachedToken.access_token;
  }

  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    console.error("Strava token refresh failed:", res.status);
    return null;
  }

  const data = await res.json();
  cachedToken = { access_token: data.access_token, expires_at: data.expires_at };
  return data.access_token;
}

export async function getStravaActivities(count = 10): Promise<StravaActivity[]> {
  try {
    const token = await getAccessToken();
    if (!token) return [];

    const res = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=${count}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 300 }, // Cache for 5 min
      }
    );

    if (!res.ok) {
      console.error("Strava activities fetch failed:", res.status);
      return [];
    }

    return res.json();
  } catch (e) {
    console.error("Strava error:", e);
    return [];
  }
}

// ─── Helpers ───

export function formatDistance(meters: number): string {
  const km = meters / 1000;
  return km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(meters)} m`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatPace(metersPerSec: number, type: string): string {
  // For runs/walks: min/km, for rides: km/h
  if (type.toLowerCase().includes("ride") || type.toLowerCase().includes("cycle")) {
    return `${(metersPerSec * 3.6).toFixed(1)} km/h`;
  }
  if (metersPerSec <= 0) return "—";
  const paceSeconds = 1000 / metersPerSec;
  const min = Math.floor(paceSeconds / 60);
  const sec = Math.round(paceSeconds % 60);
  return `${min}:${sec.toString().padStart(2, "0")} /km`;
}

export function getActivityIcon(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("run")) return "🏃";
  if (t.includes("ride") || t.includes("cycle")) return "🚴";
  if (t.includes("swim")) return "🏊";
  if (t.includes("walk") || t.includes("hike")) return "🚶";
  if (t.includes("weight") || t.includes("crossfit") || t.includes("workout")) return "🏋️";
  if (t.includes("yoga")) return "🧘";
  return "💪";
}

export function getActivityColor(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("run")) return "#FC4C02"; // Strava orange
  if (t.includes("ride") || t.includes("cycle")) return "#00C853";
  if (t.includes("swim")) return "#2196F3";
  if (t.includes("weight") || t.includes("crossfit") || t.includes("workout")) return "#FF6B6B";
  return "#FC4C02";
}
