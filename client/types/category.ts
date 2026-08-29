import { Channel } from "./channel"

export type Category = {
  id: string  // changed from id
  name: string
  server_id: string
  created_by: string
  channels: Channel[]  // added
}


export type CreateCategoryPayload = {
  name: string
  server_id: string
}
