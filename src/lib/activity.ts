import "server-only";

import { db } from "./db";
import { activityLog } from "./schema";

export type ActorType = "staff" | "partner" | "student" | "visitor" | "ai" | "system";

export interface ActivityInput {
  actorType: ActorType;
  /** Email, partner username, model id or job name. */
  actor?: string | null;
  /** Dotted verb, e.g. "application.trash", "chat.reply", "staff.add". */
  action: string;
  targetType?: string;
  targetId?: string | number | null;
  /** Small metadata only — never message bodies or document contents. */
  detail?: Record<string, unknown>;
}

/**
 * Append one entry to the activity log. Never throws: a logging failure must
 * not fail the action being logged.
 */
export async function logActivity(entry: ActivityInput): Promise<void> {
  try {
    await db.insert(activityLog).values({
      actorType: entry.actorType,
      actor: entry.actor ?? null,
      action: entry.action,
      targetType: entry.targetType ?? null,
      targetId: entry.targetId == null ? null : String(entry.targetId),
      detail: entry.detail ?? null,
    });
  } catch (e) {
    console.error("[activity] failed to log", entry.action, e);
  }
}
