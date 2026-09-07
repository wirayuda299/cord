import { startConversation } from "@/lib/actions/conversations";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
   auth: {
      protect: vi.fn(),
   },
}));

vi.mock("next/navigation", () => ({
   redirect: vi.fn(),
}));

describe("conversation test", () => {
   it("should return unauthenticated on userId null", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue(null),
         userId: null,
      } as never);

      await expect(startConversation(new FormData())).rejects.toMatchObject(
         new Error("unauthenticated"),
      );
   });

   it("should failed when given invalid args", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
         userId: "user_123",
      } as never);

      await expect(startConversation(new FormData())).rejects.toMatchObject(
         new Error("Target user id is missing"),
      );
   });

   it("should failed when API call failed", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
         userId: "user_123",
      } as never);

      const data = new FormData();
      data.append("targeted_user_id", "user_1221");

      vi.spyOn(global, "fetch").mockRejectedValue(
         new Error("Invalid response from server"),
      );

      await expect(startConversation(data)).rejects.toMatchObject(
         new Error("Invalid response from server"),
      );
   });

   it("should success when API call ", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
         userId: "user_123",
      } as never);

      const data = new FormData();
      data.append("targeted_user_id", "user_1221");

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(
            JSON.stringify({
               success: true,
               message: "conversation created",
               data: { channel_id: "1223" },
            }),
         ),
      );

      await expect(startConversation(data)).resolves.toBeUndefined();
      expect(redirect).toHaveBeenCalledWith("/direct-messages/1223");
   });
});
