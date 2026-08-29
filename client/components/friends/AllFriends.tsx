import { getAllFriends } from "@/lib/queries/friends";
import FriendsList from "./FriendsList";

export default async function AllFriends({
  filter = "all",
}: {
  filter?: "all" | "online";
}) {
  const allFriend = await getAllFriends();

  if (!allFriend || allFriend.length <= 0) return "No friend yet";
  return <FriendsList friends={allFriend} filter={filter} />;
}
