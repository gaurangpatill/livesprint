import { normalizeFilePaths } from "@/lib/tasks/filePaths";
import type { ConflictRisk, SprintTask } from "@/lib/types";

const activeStatuses = new Set<SprintTask["status"]>(["IN_PROGRESS"]);

type PathTouch = {
  path: string;
  directory: string;
  task: SprintTask;
};

function getDirectory(path: string) {
  const lastSlashIndex = path.lastIndexOf("/");

  if (lastSlashIndex <= 0) {
    return ".";
  }

  return path.slice(0, lastSlashIndex);
}

function getActiveTouches(tasks: SprintTask[]): PathTouch[] {
  return tasks
    .filter((task) => activeStatuses.has(task.status))
    .flatMap((task) =>
      normalizeFilePaths(task.filePaths).map((path) => ({
        path,
        directory: getDirectory(path),
        task,
      })),
    );
}

function unique(values: string[]) {
  return Array.from(new Set(values)).sort();
}

function createRiskId(level: ConflictRisk["level"], affectedPath: string) {
  return `risk-${level.toLowerCase()}-${affectedPath.replace(/[^a-zA-Z0-9]+/g, "-")}`;
}

function createRisk(
  level: ConflictRisk["level"],
  affectedPath: string,
  tasks: SprintTask[],
  now: string,
): ConflictRisk {
  const involvedTaskIds = unique(tasks.map((task) => task.id));
  const involvedUserIds = unique(
    tasks.flatMap((task) => (task.assigneeId ? [task.assigneeId] : [])),
  );

  if (level === "HIGH") {
    return {
      id: createRiskId(level, affectedPath),
      level,
      affectedPath,
      involvedTaskIds,
      involvedUserIds,
      explanation: `${tasks.length} active tasks are touching the exact same file: ${affectedPath}.`,
      suggestedAction:
        "Coordinate ownership immediately or split the file changes before continuing.",
      createdAt: now,
      updatedAt: now,
    };
  }

  if (level === "MEDIUM") {
    return {
      id: createRiskId(level, affectedPath),
      level,
      affectedPath,
      involvedTaskIds,
      involvedUserIds,
      explanation: `${tasks.length} active tasks are touching files in ${affectedPath}.`,
      suggestedAction:
        "Confirm module boundaries and agree on ownership before merging.",
      createdAt: now,
      updatedAt: now,
    };
  }

  return {
    id: createRiskId(level, affectedPath),
    level,
    affectedPath,
    involvedTaskIds,
    involvedUserIds,
    explanation: `One active task is touching ${affectedPath}.`,
    suggestedAction: "No immediate action needed; keep file ownership visible.",
    createdAt: now,
    updatedAt: now,
  };
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const key = getKey(item);
    groups[key] = [...(groups[key] ?? []), item];
    return groups;
  }, {});
}

function preserveCreatedAt(
  risks: ConflictRisk[],
  previousRisks: ConflictRisk[],
) {
  const previousById = new Map(previousRisks.map((risk) => [risk.id, risk]));

  return risks.map((risk) => ({
    ...risk,
    createdAt: previousById.get(risk.id)?.createdAt ?? risk.createdAt,
  }));
}

export function detectConflictRisks(
  tasks: SprintTask[],
  now: string,
  previousRisks: ConflictRisk[] = [],
): ConflictRisk[] {
  const touches = getActiveTouches(tasks);

  if (touches.length === 0) {
    return [];
  }

  const risks: ConflictRisk[] = [];
  const touchesByPath = groupBy(touches, (touch) => touch.path);
  const highRiskDirectories = new Set<string>();

  for (const [path, pathTouches] of Object.entries(touchesByPath)) {
    const tasksForPath = unique(pathTouches.map((touch) => touch.task.id)).map(
      (taskId) => pathTouches.find((touch) => touch.task.id === taskId)?.task,
    ).filter((task): task is SprintTask => Boolean(task));

    if (tasksForPath.length >= 2) {
      highRiskDirectories.add(getDirectory(path));
      risks.push(createRisk("HIGH", path, tasksForPath, now));
    }
  }

  const touchesByDirectory = groupBy(touches, (touch) => touch.directory);

  for (const [directory, directoryTouches] of Object.entries(touchesByDirectory)) {
    if (highRiskDirectories.has(directory)) {
      continue;
    }

    const tasksForDirectory = unique(
      directoryTouches.map((touch) => touch.task.id),
    ).map((taskId) => directoryTouches.find((touch) => touch.task.id === taskId)?.task)
      .filter((task): task is SprintTask => Boolean(task));

    if (tasksForDirectory.length >= 2) {
      risks.push(createRisk("MEDIUM", directory, tasksForDirectory, now));
    }
  }

  if (risks.length === 0) {
    const activeTasks = unique(touches.map((touch) => touch.task.id));

    if (activeTasks.length === 1) {
      const firstTouch = touches[0];
      if (firstTouch) {
        risks.push(createRisk("LOW", firstTouch.path, [firstTouch.task], now));
      }
    }
  }

  return preserveCreatedAt(
    risks.sort((left, right) => {
      const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return severityOrder[left.level] - severityOrder[right.level];
    }),
    previousRisks,
  );
}

export function getRiskSignature(risk: ConflictRisk) {
  return [
    risk.level,
    risk.affectedPath,
    risk.involvedTaskIds.join(","),
    risk.involvedUserIds.join(","),
  ].join("|");
}

export function getNewSignificantRisks(
  previousRisks: ConflictRisk[],
  nextRisks: ConflictRisk[],
) {
  const previousSignatures = new Set(
    previousRisks
      .filter((risk) => risk.level === "MEDIUM" || risk.level === "HIGH")
      .map(getRiskSignature),
  );

  return nextRisks.filter(
    (risk) =>
      (risk.level === "MEDIUM" || risk.level === "HIGH") &&
      !previousSignatures.has(getRiskSignature(risk)),
  );
}
