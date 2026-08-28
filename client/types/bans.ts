export type BannedMemberRow = {
  id: string;
  name: string;
  initials: string;
  color: string;
  reason: string | null;
  bannedAt: string;
  bannedBy: string;
};
