import type { PullRequestStatus } from "@/lib/types";

export type MockCommitPayload = {
  authorId?: string;
  taskId: string;
  message: string;
  filesChanged: string[];
};

export type MockPullRequestPayload = {
  authorId?: string;
  taskId: string;
  title: string;
  status: PullRequestStatus;
  filesChanged: string[];
};
