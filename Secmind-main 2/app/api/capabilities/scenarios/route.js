import { spawn } from "node:child_process";
import path from "node:path";

const REPO_ROOT = path.resolve(process.cwd());
const PY_BIN = path.join(REPO_ROOT, "secmind-investigator", ".venv", "bin", "python");
const RUNNER_ARGS = ["-m", "secmind_investigator.runner", "--list"];
const CWD = path.join(REPO_ROOT, "secmind-investigator");

export const dynamic = "force-dynamic";

export async function GET() {
  const out = await new Promise((resolve, reject) => {
    const proc = spawn(PY_BIN, RUNNER_ARGS, { cwd: CWD });
    let stdout = "", stderr = "";
    proc.stdout.on("data", d => stdout += d);
    proc.stderr.on("data", d => stderr += d);
    proc.on("close", code =>
      code === 0 ? resolve(stdout) : reject(new Error(stderr || `exit ${code}`))
    );
  }).catch(e => ({ error: e.message }));

  if (out.error) {
    return Response.json({ error: out.error }, { status: 500 });
  }
  try {
    return Response.json(JSON.parse(out));
  } catch (e) {
    return Response.json({ error: "bad runner output", raw: out }, { status: 500 });
  }
}
