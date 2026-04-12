export type Channel = {
  id: string
  name: string
  channel_type: string
  server_id: string
  topic: string
}

export type ChannelsGrouped = {
  channels: Channel[]
}
