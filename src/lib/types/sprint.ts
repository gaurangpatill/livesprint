export type SprintPhase = "PLANNING" | "CODING" | "REVIEW" | "RETRO";

export type TaskStatus =
  | "BACKLOG"
  | "READY"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "IN_REVIEW"
  | "DONE";

export type UserPresence = "online" | "away" | "offline";

export type ConflictRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type TimerState = {
  phase: SprintPhase;
  isRunning: boolean;
  durationSeconds: number;
  remainingSeconds: number;
  startedAt?: string;
  pausedAt?: string;
  resetAt?: string;
  updatedAt: string;
};

export type SprintUser = {
  id: string;
  name: string;
  role: string;
  avatarInitials: string;
  presence: UserPresence;
  currentTaskId?: string;
  joinedAt: string;
  lastSeenAt: string;
};

export type SprintTask = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  reporterId: string;
  assigneeId?: string;
  filePaths: string[];
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  blockedAt?: string;
  reviewRequestedAt?: string;
  completedAt?: string;
};

export type ActivityEvent = {
  id: string;
  type: string;
  message: string;
  actorId?: string;
  taskId?: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean | string[]>;
};

export type CommitEvent = {
  id: string;
  taskId?: string;
  userId: string;
  sha: string;
  message: string;
  branch: string;
  filesChanged: string[];
  committedAt: string;
};

export type ConflictRisk = {
  id: string;
  level: ConflictRiskLevel;
  affectedPath: string;
  involvedTaskIds: string[];
  involvedUserIds: string[];
  explanation: string;
  suggestedAction: string;
  createdAt: string;
  updatedAt: string;
};

export type SprintSession = {
  id: string;
  name: string;
  phase: SprintPhase;
  timer: TimerState;
  users: SprintUser[];
  tasks: SprintTask[];
  activity: ActivityEvent[];
  commits: CommitEvent[];
  conflictRisks: ConflictRisk[];
  createdAt: string;
  updatedAt: string;
};
