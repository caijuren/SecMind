import { spawn } from "node:child_process";
import path from "node:path";

const REPO_ROOT = path.resolve(process.cwd());
const PY_BIN = path.join(REPO_ROOT, "secmind-investigator", ".venv", "bin", "python");
const RUNNER_ARGS = ["-m", "secmind_investigator.runner"];
const CWD = path.join(REPO_ROOT, "secmind-investigator");

export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await request.json();
  const out = await new Promise((resolve, reject) => {
    const proc = spawn(PY_BIN, RUNNER_ARGS, { cwd: CWD });
    let stdout = "", stderr = "";
    proc.stdout.on("data", d => stdout += d);
    proc.stderr.on("data", d => stderr += d);
    proc.on("close", code => resolve({ stdout, stderr, code }));
    proc.stdin.write(JSON.stringify(body));
    proc.stdin.end();
  });

  if (out.code !== 0 && !out.stdout) {
    return Response.json(
      { ok: false, error: out.stderr || "runner failed" },
      { status: 500 }
    );
  }
  try {
    return Response.json(JSON.parse(out.stdout));
  } catch (e) {
    return Response.json(
      { ok: false, error: "bad runner output", raw: out.stdout, stderr: out.stderr },
      { status: 500 }
    );
  }
}
