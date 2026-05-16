import * as fs from "fs"
import * as path from "path"

const SRC_DIR = path.join(__dirname, "..", "src")
const CHINESE_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/

interface Finding {
  file: string
  line: number
  text: string
  column: number
}

function stripTCalls(line: string): string {
  let result = ""
  let i = 0

  while (i < line.length) {
    if (
      line[i] === "t" &&
      (i === 0 || /\W/.test(line[i - 1])) &&
      i + 1 < line.length &&
      line[i + 1] === "("
    ) {
      let j = i + 2
      let depth = 1
      while (j < line.length && depth > 0) {
        if (line[j] === "(") depth++
        else if (line[j] === ")") depth--
        j++
      }
      result += " ".repeat(j - i)
      i = j
      continue
    }

    if (line[i] === "/" && i + 1 < line.length) {
      if (line[i + 1] === "/") {
        result += " ".repeat(line.length - i)
        break
      }
      if (line[i + 1] === "*") {
        const end = line.indexOf("*/", i + 2)
        if (end !== -1) {
          result += " ".repeat(end + 2 - i)
          i = end + 2
          continue
        }
      }
    }

    result += line[i]
    i++
  }

  return result
}

function scanFile(filePath: string): Finding[] {
  const findings: Finding[] = []
  const content = fs.readFileSync(filePath, "utf-8")
  const lines = content.split("\n")

  let inBlockComment = false

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const rawLine = lines[lineNum]

    if (inBlockComment) {
      const endIdx = rawLine.indexOf("*/")
      if (endIdx !== -1) {
        inBlockComment = false
      }
      continue
    }

    const blockStart = rawLine.indexOf("/*")
    const blockEnd = rawLine.indexOf("*/")
    if (blockStart !== -1 && (blockEnd === -1 || blockEnd < blockStart)) {
      inBlockComment = true
    }

    const stripped = stripTCalls(rawLine)

    const match = CHINESE_REGEX.exec(stripped)
    if (match) {
      const snippet = rawLine.trim().slice(0, 120)
      findings.push({
        file: filePath,
        line: lineNum + 1,
        text: snippet,
        column: match.index + 1,
      })
    }
  }

  return findings
}

function walkDir(dir: string, extensions: string[]): string[] {
  const files: string[] = []
  let entries: fs.Dirent[]

  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return files
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "i18n") {
        continue
      }
      files.push(...walkDir(fullPath, extensions))
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      files.push(fullPath)
    }
  }

  return files
}

function main() {
  console.log("Scanning for hardcoded Chinese characters...")
  console.log(`  Source directory: ${SRC_DIR}`)
  console.log()

  const files = walkDir(SRC_DIR, [".tsx", ".ts"])
  console.log(`  Found ${files.length} files to scan`)
  console.log()

  const allFindings: Finding[] = []

  for (let idx = 0; idx < files.length; idx++) {
    const file = files[idx]
    if ((idx + 1) % 20 === 0 || idx === files.length - 1) {
      process.stdout.write(`  Scanning... ${idx + 1}/${files.length}\r`)
    }
    const findings = scanFile(file)
    allFindings.push(...findings)
  }

  console.log()

  if (allFindings.length === 0) {
    console.log("No hardcoded Chinese characters found!")
    return
  }

  console.log("=".repeat(80))
  console.log("HARDCODED CHINESE CHARACTERS REPORT")
  console.log("=".repeat(80))
  console.log()

  const grouped: Record<string, Finding[]> = {}
  for (const f of allFindings) {
    const relPath = path.relative(path.join(__dirname, ".."), f.file)
    if (!grouped[relPath]) grouped[relPath] = []
    grouped[relPath].push(f)
  }

  for (const [file, findings] of Object.entries(grouped).sort()) {
    console.log(`  ${file}`)
    for (const f of findings) {
      console.log(`    Line ${f.line} (col ${f.column}): ${f.text}`)
    }
    console.log()
  }

  console.log("=".repeat(80))
  console.log(`TOTAL: ${allFindings.length} occurrence(s) across ${Object.keys(grouped).length} file(s)`)
  console.log("=".repeat(80))
  console.log()
  console.log("Tip: Replace hardcoded strings with t('key.path') calls using useLocaleStore().")
}

main()