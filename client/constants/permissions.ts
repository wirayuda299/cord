
export const PERMISSIONS = [
  {
    label: "view_channel",
    desc: "Allows members to view channels and read messages",
  },
  {
    label: "manage_channel",
    desc: "Allows members to create, edit, and delete channels",
  },
  {
    label: "manage_role",
    desc: "Allows members to create, edit, and delete roles below their own",
  },
  {
    label: "kick_member",
    desc: "Allows members to remove other members from the server",
  },
  {
    label: "ban_member",
    desc: "Allows members to permanently ban other members from the server",
  },
  {
    label: "attach_file",
    desc: "Allows members to upload files and images in text channels",
  },
  {
    label: "manage_thread",
    desc: "Allows members to create, edit, and delete threads in channels",
  },
  {
    label: "manage_message",
    desc: "Allows members to delete and pin messages from other members",
  },
] as const


export enum PermissionKey {
  ViewChannel = "view_channel",
  ManageChannel = "manage_channel",
  ManageRole = "manage_role",
  KickMember = "kick_member",
  BanMember = "ban_member",
  AttachFile = "attach_file",
  ManageThread = "manage_thread",
  ManageMessage = "manage_message"
}