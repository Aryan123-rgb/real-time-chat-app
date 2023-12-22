import { getServerSession } from "next-auth";
import { options } from "../../auth/[...nextauth]/option";
import { z } from "zod";
import { redis } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const session = await getServerSession(options);

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id: idToDeny } = z.object({ id: z.string() }).parse(body);

    // remove the id from incoming request section
    await redis.srem(`user:${session.user.id}:incoming_friend_request`, idToDeny);

    return new Response("OK");
  } catch (error) {
    console.log(error);

    if (error instanceof z.ZodError) {
      return new Response("Invalid request payload", { status: 422 });
    }

    return new Response("Invalid request", { status: 400 });
  }
}
