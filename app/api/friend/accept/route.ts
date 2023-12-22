import { getServerSession } from "next-auth";
import { z } from "zod";
import { options } from "../../auth/[...nextauth]/option";
import { fetchRedis } from "@/helpers/redis";
import { redis } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { id: idToAdd } = z.object({ id: z.string() }).parse(body);

    const session = await getServerSession(options);

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    //verfiy both users are not already friends
    const isAlreadyFriends = (await fetchRedis(
      "sismember",
      `user:${session.user.id}:friends`,
      idToAdd
    )) as 0 | 1;

    if (isAlreadyFriends) {
      return new Response("Already friends", { status: 400 });
    }

    // friend request should be present
    const hasFriendRequest = (await fetchRedis(
      "sismember",
      `user:${session.user.id}:incoming_friend_request`,
      idToAdd
    )) as 0 | 1;

    if (!hasFriendRequest) {
      console.log("no friend request");
      return new Response("No friend request", { status: 400 });
    }

    // fetch the datas of user and friend (user to be added)
    const [userRaw, friendRaw] = (await Promise.all([
      fetchRedis("get", `user:${session.user.id}`),
      fetchRedis("get", `user:${idToAdd}`),
    ])) as [string, string];

    const user = JSON.parse(userRaw) as User;
    const friend = JSON.parse(friendRaw) as User;

    //add the ids in friends section and remove from incoming_friend_requests section
    await Promise.all([
      redis.sadd(`user:${session.user.id}:friends`, idToAdd),
      redis.sadd(`user:${idToAdd}:friends`, session.user.id),
      redis.srem(`user:${session.user.id}:incoming_friend_request`, idToAdd),
    ]);

    return new Response("ok");
  } catch (error) {
    console.log(error);

    if (error instanceof z.ZodError) {
      return new Response("Invalid request payload", { status: 422 });
    }

    return new Response("Invalid request", { status: 400 });
  }
}
