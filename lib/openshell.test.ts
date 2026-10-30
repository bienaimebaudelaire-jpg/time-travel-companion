import { describe, expect, it } from "vitest"
import {
  getOpenShellScenarioArgs,
  runOpenShellCommand,
} from "./openshell"

describe("OpenShell scenario commands", () => {
  it("maps scenario actions to OpenShell sandbox CLI arguments", () => {
    expect(getOpenShellScenarioArgs({ action: "create", name: "planner" })).toEqual([
      "sandbox",
      "create",
      "--name",
      "planner",
    ])
    expect(
      getOpenShellScenarioArgs({ action: "create", name: "planner", from: "agent-image:latest" })
    ).toEqual(["sandbox", "create", "--name", "planner", "--from", "agent-image:latest"])
    expect(getOpenShellScenarioArgs({ action: "list" })).toEqual(["sandbox", "list"])
    expect(getOpenShellScenarioArgs({ action: "delete", sandbox: "planner" })).toEqual([
      "sandbox",
      "delete",
      "planner",
    ])
    expect(
      getOpenShellScenarioArgs({
        action: "compose",
        sandbox: "planner",
        command: ["scenario-agent", "compose", "--city", "Paris"],
      })
    ).toEqual(["sandbox", "exec", "--name", "planner", "--", "scenario-agent", "compose", "--city", "Paris"])
  })

  it("only accepts lowercase DNS-1123 sandbox names and never a flag", () => {
    for (const sandbox of ["--all", "-x", "Upper", "under_score", "a.b", "", "-lead", "trail-", "a".repeat(64)]) {
      expect(() => getOpenShellScenarioArgs({ action: "delete", sandbox })).toThrow(TypeError)
      expect(() => getOpenShellScenarioArgs({ action: "create", name: sandbox })).toThrow(TypeError)
      expect(() => getOpenShellScenarioArgs({ action: "compose", sandbox, command: ["ls"] })).toThrow(TypeError)
    }
  })

  it("rejects image references that could be read as flags or contain unsafe characters", () => {
    for (const from of ["--gpu", "-x", "img; rm -rf /", "img name", ""]) {
      expect(() => getOpenShellScenarioArgs({ action: "create", name: "planner", from })).toThrow(TypeError)
    }
  })

  it("rejects invalid sandbox names and empty composition commands", () => {
    expect(() => getOpenShellScenarioArgs({ action: "delete", sandbox: "--help" })).toThrow(TypeError)
    expect(() =>
      getOpenShellScenarioArgs({ action: "compose", sandbox: "planner", command: [] })
    ).toThrow(TypeError)
  })
})

describe("runOpenShellCommand", () => {
  it("passes arguments literally without invoking a shell", async () => {
    const value = "Paris; echo injected"
    const result = await runOpenShellCommand(
      ["-e", "process.stdout.write(process.argv[1])", value],
      { executable: process.execPath }
    )
    expect(result.stdout).toBe(value)
    expect(result.exitCode).toBe(0)
  })

  it("rejects non-zero exits with captured output", async () => {
    await expect(
      runOpenShellCommand(["-e", "process.stderr.write('failed'); process.exit(2)"], {
        executable: process.execPath,
      })
    ).rejects.toMatchObject({
      name: "OpenShellCommandError",
      exitCode: 2,
      stderr: "failed",
    })
  })

  it("rejects null bytes in arguments", () => {
    expect(() => runOpenShellCommand(["bad\0argument"])).toThrow(TypeError)
  })

  it("rejects a command when it exceeds the configured timeout", async () => {
    await expect(
      runOpenShellCommand(["-e", "setInterval(() => {}, 1000)"], {
        executable: process.execPath,
        timeoutMs: 20,
      })
    ).rejects.toMatchObject({ message: "OpenShell command timed out after 20 ms." })
  })

  it("rejects output beyond the configured byte limit", async () => {
    await expect(
      runOpenShellCommand(["-e", "process.stdout.write('123456')"], {
        executable: process.execPath,
        maxOutputBytes: 5,
      })
    ).rejects.toMatchObject({ message: "OpenShell command output exceeded 5 bytes." })
  })
})
