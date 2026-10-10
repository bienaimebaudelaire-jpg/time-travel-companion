import { spawn } from "node:child_process"

const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_MAX_OUTPUT_BYTES = 1024 * 1024
// OpenShell sandbox names are lowercase DNS-1123 labels (max 63 chars).
const SANDBOX_NAME_PATTERN = /^[a-z0-9]([-a-z0-9]{0,61}[a-z0-9])?$/
const IMAGE_REFERENCE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/@-]{0,255}$/

export type OpenShellRunOptions = {
  executable?: string
  timeoutMs?: number
  maxOutputBytes?: number
}

export type OpenShellCommandResult = {
  stdout: string
  stderr: string
  exitCode: number
}

export type OpenShellScenarioCommand =
  | { action: "compose"; sandbox: string; command: readonly string[] }
  | { action: "list" }
  | { action: "create"; name: string; from?: string }
  | { action: "delete"; sandbox: string }

export class OpenShellCommandError extends Error {
  constructor(
    message: string,
    readonly exitCode?: number,
    readonly stdout = "",
    readonly stderr = ""
  ) {
    super(message)
    this.name = "OpenShellCommandError"
  }
}

export function getOpenShellScenarioArgs(command: OpenShellScenarioCommand): string[] {
  switch (command.action) {
    case "compose":
      validateSandboxName(command.sandbox)
      validateArguments(command.command)
      if (command.command.length === 0) {
        throw new TypeError("A scenario composition command cannot be empty.")
      }
      // Documented syntax: `openshell sandbox exec --name <name> -- <command...>`.
      return ["sandbox", "exec", "--name", command.sandbox, "--", ...command.command]
    case "list":
      return ["sandbox", "list"]
    case "create":
      validateSandboxName(command.name)
      if (command.from !== undefined) validateImageReference(command.from)
      return [
        "sandbox",
        "create",
        "--name",
        command.name,
        ...(command.from === undefined ? [] : ["--from", command.from]),
      ]
    case "delete":
      validateSandboxName(command.sandbox)
      return ["sandbox", "delete", command.sandbox]
  }
}

export async function runOpenShellScenarioCommand(
  command: OpenShellScenarioCommand,
  options: OpenShellRunOptions = {}
): Promise<OpenShellCommandResult> {
  return runOpenShellCommand(getOpenShellScenarioArgs(command), options)
}

export function runOpenShellCommand(
  args: readonly string[],
  options: OpenShellRunOptions = {}
): Promise<OpenShellCommandResult> {
  validateArguments(args)
  if (!Number.isSafeInteger(options.timeoutMs ?? DEFAULT_TIMEOUT_MS) || (options.timeoutMs ?? DEFAULT_TIMEOUT_MS) <= 0) {
    throw new TypeError("OpenShell timeoutMs must be a positive safe integer.")
  }
  if (
    !Number.isSafeInteger(options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES) ||
    (options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES) <= 0
  ) {
    throw new TypeError("OpenShell maxOutputBytes must be a positive safe integer.")
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const maxOutputBytes = options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES
  const executable = options.executable ?? process.env.OPENSHELL_CLI ?? "openshell"

  return new Promise((resolve, reject) => {
    const child = spawn(executable, [...args], {
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    })
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []
    let outputBytes = 0
    let failure: OpenShellCommandError | undefined
    let settled = false

    const finish = (error?: OpenShellCommandError, exitCode = 0) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      const result = {
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
        exitCode,
      }
      if (error) {
        reject(new OpenShellCommandError(error.message, error.exitCode, result.stdout, result.stderr))
      } else {
        resolve(result)
      }
    }

    const stopWithError = (message: string) => {
      if (failure) return
      failure = new OpenShellCommandError(message)
      child.kill("SIGKILL")
    }

    const collect = (target: Buffer[], chunk: Buffer) => {
      const remaining = maxOutputBytes - outputBytes
      if (remaining > 0) target.push(chunk.subarray(0, remaining))
      outputBytes += chunk.length
      if (outputBytes > maxOutputBytes) stopWithError(`OpenShell command output exceeded ${maxOutputBytes} bytes.`)
    }

    child.stdout.on("data", (chunk: Buffer) => collect(stdout, chunk))
    child.stderr.on("data", (chunk: Buffer) => collect(stderr, chunk))
    child.once("error", (error) => finish(new OpenShellCommandError(`Unable to start OpenShell CLI: ${error.message}`)))
    child.once("close", (code) => {
      if (failure) {
        finish(failure, code ?? 1)
      } else if (code !== 0) {
        finish(
          new OpenShellCommandError(`OpenShell CLI exited with status ${code ?? "unknown"}.`, code ?? undefined),
          code ?? 1
        )
      } else {
        finish(undefined, code)
      }
    })

    const timer = setTimeout(() => stopWithError(`OpenShell command timed out after ${timeoutMs} ms.`), timeoutMs)
  })
}

function validateSandboxName(name: string): void {
  if (typeof name !== "string" || !SANDBOX_NAME_PATTERN.test(name)) {
    throw new TypeError(
      "Sandbox names must be lowercase DNS-1123 labels: 1–63 characters, lowercase letters, numbers or hyphens, starting and ending with a letter or number."
    )
  }
}

function validateImageReference(reference: string): void {
  if (typeof reference !== "string" || !IMAGE_REFERENCE_PATTERN.test(reference)) {
    throw new TypeError("The sandbox image reference contains unsupported characters.")
  }
}

function validateArguments(args: readonly string[]): void {
  if (!Array.isArray(args) || args.some((arg) => typeof arg !== "string" || arg.includes("\0"))) {
    throw new TypeError("OpenShell arguments must be strings without null bytes.")
  }
}
