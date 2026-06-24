import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BASE_URL = "https://ecampus.psgtech.ac.in/studzone";

// ── Types ──

interface AttendanceRow {
  courseCode: string;
  subject: string;
  totalHours: number;
  totalPresent: number;
  totalAbsent: number;
  percentage: number;
  attended: number;
  conducted: number;
}

interface StudentInfo {
  name: string;
  registerNumber: string;
  department: string;
  semester: string;
  section: string;
}

interface TimetableEntry {
  day: string;
  period: number;
  subject: string;
  staff: string;
  room: string;
}

// ── Service Layer: PSG eCampus Parser ──

class PSGeCampusService {
  private cookies: string;

  constructor(cookies: string) {
    this.cookies = cookies;
  }

  async fetchPage(path: string): Promise<string> {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        "Cookie": this.cookies,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch ${path}: ${res.status}`);
    }

    return res.text();
  }

  parseStudentInfo(html: string): StudentInfo {
    const info: StudentInfo = {
      name: "",
      registerNumber: "",
      department: "",
      semester: "",
      section: "",
    };

    // Try multiple patterns for student info extraction
    const patterns = {
      name: [
        /Name\s*:\s*<\/?\w*>\s*([^<]+)/i,
        /<label[^>]*>Name<\/label>\s*:\s*<[^>]*>\s*([^<]+)/i,
        /<td[^>]*>\s*([A-Z][A-Za-z\s]+)\s*<\/td>/i,
      ],
      registerNumber: [
        /Reg\s*\.?\s*No\s*\.?\s*:\s*<\/?\w*>\s*([^<]+)/i,
        /Register\s*Number[^>]*>\s*:\s*([^<]+)/i,
        /(\d{2}[A-Z]{2,4}\d{4,6})/i,
      ],
      department: [
        /Dept\s*\.?\s*:\s*<\/?\w*>\s*([^<]+)/i,
        /Department[^>]*>\s*:\s*([^<]+)/i,
        /<td[^>]*>\s*([A-Z][A-Za-z\s&]+(?:Engineering|Technology|Science))\s*<\/td>/i,
      ],
      semester: [
        /Sem\s*\.?\s*:\s*<\/?\w*>\s*([^<]+)/i,
        /Semester[^>]*>\s*:\s*(\d+)/i,
      ],
      section: [
        /Sec\s*\.?\s*:\s*<\/?\w*>\s*([^<]+)/i,
        /Section[^>]*>\s*:\s*([A-Z])/i,
      ],
    };

    for (const [key, regexList] of Object.entries(patterns)) {
      for (const regex of regexList) {
        const match = html.match(regex);
        if (match?.[1]) {
          (info as Record<string, string>)[key] = match[1].trim();
          break;
        }
      }
    }

    return info;
  }

  parseAttendancePercentage(html: string): AttendanceRow[] {
    const rows: AttendanceRow[] = [];

    // Parse the attendance table from StudentPercentage page
    // Expected format: Course Code | Subject | Total Hours | Present | Absent | Percentage
    const tableRowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;

    while ((rowMatch = tableRowRegex.exec(html)) !== null) {
      const rowContent = rowMatch[1];
      const cells = this.extractCells(rowContent);

      // Skip header rows or empty rows
      if (cells.length < 5 || cells[0]?.toLowerCase().includes("course") || cells[0]?.toLowerCase().includes("subject")) {
        continue;
      }

      // Parse cells based on table structure
      const courseCode = cells[0]?.trim() || "";
      const subject = cells[1]?.trim() || "";
      const totalHours = parseInt(cells[2]?.replace(/[^\d]/g, "") || "0", 10);
      const totalPresent = parseInt(cells[3]?.replace(/[^\d]/g, "") || "0", 10);
      const totalAbsent = parseInt(cells[4]?.replace(/[^\d]/g, "") || "0", 10);
      const percentageStr = cells[5]?.replace(/[^\d.]/g, "") || "0";
      const percentage = parseFloat(percentageStr) || (totalHours > 0 ? (totalPresent / totalHours) * 100 : 0);

      // Only add valid rows with meaningful data
      if (courseCode && subject && totalHours > 0) {
        rows.push({
          courseCode,
          subject,
          totalHours,
          totalPresent,
          totalAbsent,
          percentage: Math.round(percentage * 100) / 100,
          attended: totalPresent,
          conducted: totalHours,
        });
      }
    }

    // Fallback: Try alternative table format with less columns
    if (rows.length === 0) {
      rows.push(...this.parseAttendanceAlternative(html));
    }

    return rows;
  }

  private extractCells(rowHtml: string): string[] {
    const cells: string[] = [];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      let cellContent = cellMatch[1];
      // Remove inner tags and clean up
      cellContent = cellContent.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
      cells.push(cellContent);
    }

    return cells;
  }

  private parseAttendanceAlternative(html: string): AttendanceRow[] {
    const rows: AttendanceRow[] = [];

    // Try simpler regex for attendance data
    const simpleRowRegex = /<tr[^>]*>\s*<td[^>]*>([^<]*)<\/td>\s*<td[^>]*>([^<]*)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>([\d.]+)%?<\/td>\s*<\/tr>/gi;
    let match;

    while ((match = simpleRowRegex.exec(html)) !== null) {
      const totalHours = parseInt(match[3], 10);
      const totalPresent = parseInt(match[4], 10);
      const totalAbsent = parseInt(match[5], 10);
      const percentage = parseFloat(match[6]) || (totalHours > 0 ? (totalPresent / totalHours) * 100 : 0);

      rows.push({
        courseCode: match[1]?.trim() || "",
        subject: match[2]?.trim() || "",
        totalHours,
        totalPresent,
        totalAbsent,
        percentage: Math.round(percentage * 100) / 100,
        attended: totalPresent,
        conducted: totalHours,
      });
    }

    return rows;
  }

  parseTimetable(html: string): TimetableEntry[] {
    const entries: TimetableEntry[] = [];
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    let currentDay = "";

    while ((rowMatch = rowRegex.exec(html)) !== null) {
      const rowContent = rowMatch[1];
      const cells = this.extractCells(rowContent);

      if (cells.length === 0) continue;

      // Check if first cell is a day
      const dayMatch = days.find(d =>
        cells[0]?.toLowerCase().includes(d.toLowerCase()) ||
        cells[0]?.toLowerCase() === d.toLowerCase().substring(0, 3)
      );

      if (dayMatch) {
        currentDay = dayMatch;
        cells.shift();
      }

      // Parse periods
      if (currentDay && cells.length > 0) {
        for (let i = 0; i < cells.length; i++) {
          const text = cells[i].trim();
          if (text && text !== "-" && text !== "&nbsp;") {
            const parts = text.split(/\s*\/\s*|\s*-\s*/);
            entries.push({
              day: currentDay,
              period: i + 1,
              subject: parts[0]?.trim() || text,
              staff: parts[1]?.trim() || "",
              room: parts[2]?.trim() || "",
            });
          }
        }
      }
    }

    return entries;
  }
}

// ── Authentication ──

async function loginToEcampus(username: string, password: string): Promise<string> {
  const loginUrl = `${BASE_URL}/Default.aspx`;

  // Step 1: Get login page and extract ViewState
  const loginRes = await fetch(loginUrl, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "text/html,application/xhtml+xml",
    },
  });

  const loginHtml = await loginRes.text();
  const cookies = loginRes.headers.get("set-cookie") ?? "";

  // Extract ASP.NET hidden fields
  const viewstate = loginHtml.match(/__VIEWSTATE[^>]*value="([^"]*)"/i)?.[1] ?? "";
  const viewstateGenerator = loginHtml.match(/__VIEWSTATEGENERATOR[^>]*value="([^"]*)"/i)?.[1] ?? "";
  const eventValidation = loginHtml.match(/__EVENTVALIDATION[^>]*value="([^"]*)"/i)?.[1] ?? "";

  // Step 2: Submit login form
  const formData = new URLSearchParams();
  formData.set("__VIEWSTATE", viewstate);
  formData.set("__VIEWSTATEGENERATOR", viewstateGenerator);
  formData.set("__EVENTVALIDATION", eventValidation);
  formData.set("txtUserName", username);
  formData.set("txtPassword", password);
  formData.set("btnLogin", "Login");

  const authRes = await fetch(loginUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": cookies,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "text/html,application/xhtml+xml",
    },
    body: formData.toString(),
    redirect: "manual",
  });

  // Combine cookies
  const authCookies = [cookies, authRes.headers.get("set-cookie") ?? ""]
    .filter(Boolean)
    .join("; ");

  // Check for login success
  if (authRes.status === 302 || authRes.status === 301) {
    // Successful redirect means login worked
    return authCookies;
  }

  const responseText = await authRes.text();

  // Check for error messages
  if (
    responseText.includes("Invalid") ||
    responseText.includes("incorrect") ||
    responseText.includes("failed") ||
    responseText.includes("Invalid credentials") ||
    responseText.includes("Login Failed")
  ) {
    throw new Error("Invalid credentials");
  }

  // Check if we're still on login page (login failed)
  if (responseText.includes("txtPassword") && responseText.includes("btnLogin")) {
    throw new Error("Invalid credentials");
  }

  // Assume success if no error indicators
  return authCookies;
}

// ── Main Handler ──

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { username, password, fetchTimetable } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: "Register number and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authenticate with PSG eCampus
    let cookies: string;
    try {
      cookies = await loginToEcampus(username, password);
    } catch (err) {
      if (err.message === "Invalid credentials") {
        return new Response(
          JSON.stringify({ error: "Invalid credentials. Please check your register number and password." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw err;
    }

    const service = new PSGeCampusService(cookies);

    // Fetch attendance from StudentPercentage page
    let attendance: AttendanceRow[] = [];
    let studentInfo: StudentInfo = {
      name: "",
      registerNumber: username,
      department: "",
      semester: "",
      section: "",
    };

    try {
      const attHtml = await service.fetchPage("/Attendance/StudentPercentage");
      attendance = service.parseAttendancePercentage(attHtml);
      studentInfo = service.parseStudentInfo(attHtml);
    } catch {
      // Try alternative attendance page
      try {
        const altHtml = await service.fetchPage("/AttndStaffSubwise.aspx");
        attendance = service.parseAttendancePercentage(altHtml);
        studentInfo = service.parseStudentInfo(altHtml);
      } catch {
        // Last resort
        const homeHtml = await service.fetchPage("/Home.aspx");
        studentInfo = service.parseStudentInfo(homeHtml);
      }
    }

    // Enrich student info from profile if needed
    if (!studentInfo.name) {
      try {
        const profileHtml = await service.fetchPage("/MyProfile.aspx");
        const profileInfo = service.parseStudentInfo(profileHtml);
        studentInfo = { ...studentInfo, ...profileInfo };
      } catch {
        // Profile fetch failed, use what we have
      }
    }

    // Ensure register number is set
    if (!studentInfo.registerNumber) {
      studentInfo.registerNumber = username;
    }

    // Validate we got attendance data
    if (attendance.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Attendance data unavailable. The attendance page may be empty or temporarily inaccessible."
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch timetable if requested
    let timetable: TimetableEntry[] = [];
    if (fetchTimetable) {
      try {
        const ttHtml = await service.fetchPage("/TimeTable.aspx");
        timetable = service.parseTimetable(ttHtml);
      } catch {
        // Timetable not critical, continue without it
      }
    }

    return new Response(
      JSON.stringify({ studentInfo, attendance, timetable }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("eCampus proxy error:", err);

    const message = err.message.includes("fetch")
      ? "Unable to connect to PSG eCampus. Please try again later."
      : `Failed to fetch attendance: ${err.message}`;

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
