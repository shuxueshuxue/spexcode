import { existsSync } from 'node:fs'

// @@@ resilience - the backend reads the worktree set LIVE on every /api/layout & /api/board, and a
// dispatched worker can self-merge and have its worktree REMOVED at any instant (the merge ritual deletes
// the node branch + retires the worktree). That makes every per-worktree DETAIL read a RACE: a readFileSync
// can throw ENOENT because the directory vanished, and a `git diff`/`merge-base` can throw because a
// concurrent merge holds an index/ref LOCK. Such a throw used to propagate out of resolveLayout()/
// listSessions(), out of the request handler, and — as an unhandled async rejection — EXIT the process,
// taking the backend (and the Vite-proxied frontend) down with it.
//
// @@@ existence is not contingent on a detail read - the FIRST version of this guard conflated the two:
// ANY throw returned null and the caller DROPPED that worktree. That made a worktree's EXISTENCE — a
// definitive fact (it is in `git worktree list`, its directory is on disk) — hostage to a FLAKY detail
// read. Under a merge storm those detail reads throw on lock contention, so a LIVE worktree vanished from
// the board for a poll, and watchSessions then mis-read the absence as a `closed · removed`. The fix:
// guardWorktree decides omit-vs-degrade on the DIRECTORY, never on the read outcome. Dir gone → genuinely
// removed → omit (null). Dir still present → a transient DETAIL failure → return a DEGRADED row from the
// caller's fallback (raw facts + last-known), NEVER null. The board thus always lists every existing
// worktree. installProcessGuards is the last-resort net — any unforeseen uncaught error/rejection is logged
// and the process KEEPS SERVING. Nothing is swallowed silently: every omit, degrade, and caught crash is
// logged, so a real bug stays loud — it just no longer kills the server or drops a live worktree.

function describe(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

// run a per-worktree DETAIL read; on a throw, branch on whether the worktree DIRECTORY still exists.
//   dir gone   → the worktree was genuinely removed mid-read → return null so the caller omits it.
//   dir present → a flaky detail read (ENOENT race on a sibling file, or a git index/ref lock under a
//                 concurrent merge) → return the caller's `degraded` row so an EXISTING worktree is NEVER
//                 dropped from the board. read-failure != non-existence.
// `dir` is the worktree path (the existence fact). Accepts a sync OR async fn — resolveLayout's overlay
// read is async, listSessions' row read is sync; `degraded` is a sync raw-facts fallback.
export async function guardWorktree<T>(dir: string, fn: () => T | Promise<T>, degraded: () => T): Promise<T | null> {
  try {
    return await fn()
  } catch (e) {
    if (!existsSync(dir)) {
      console.warn(`spec-cli: worktree ${dir} gone from disk (removed mid-read), omitting: ${describe(e)}`)
      return null
    }
    console.warn(`spec-cli: worktree ${dir} detail-read failed (transient/lock); serving degraded row: ${describe(e)}`)
    return degraded()
  }
}

// the last-resort process net: log an otherwise-fatal async throw and KEEP SERVING. Registering these
// handlers is itself what overrides Node's default "print the stack and exit" — so the backend rides out
// a transient race it didn't anticipate instead of dropping the public port. Idempotent (guarded) so a
// double-install in one process can't stack duplicate handlers.
let guardsInstalled = false
export function installProcessGuards(): void {
  if (guardsInstalled) return
  guardsInstalled = true
  process.on('unhandledRejection', (reason) => {
    console.error(`spec-cli: unhandledRejection kept the server alive (investigate): ${reason instanceof Error ? reason.stack : describe(reason)}`)
  })
  process.on('uncaughtException', (err) => {
    console.error(`spec-cli: uncaughtException kept the server alive (investigate): ${err?.stack || describe(err)}`)
  })
}
