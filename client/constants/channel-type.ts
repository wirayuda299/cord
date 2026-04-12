import { Hash, Megaphone, Volume2 } from "lucide-react"

export const channelTypes = [
  {
    id: "text",
    name: "Text",
    description: "Send messages, images, GIFs, emoji, opinions, and puns",
    icon: Hash,
  },
  {
    id: "audio",
    name: "Audio",
    description: "Hang out together with voice, video, and screen share",
    icon: Volume2,
  },
  {
    id: "forum",
    name: "Forum",
    description: "Important update your community can follow",
    icon: Megaphone,
  },
]
