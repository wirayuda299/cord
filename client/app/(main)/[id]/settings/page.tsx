import { auth } from "@clerk/nextjs/server";
export default async function Settings() {
  await auth.protect();
  return (
    <p className="">Server settings</p>
  )
}
