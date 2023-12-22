import { addFriendValidator } from "@/lib/vaildators/add-friend";
import axios from "axios";
import { getServerSession } from "next-auth";
import { options } from "../../auth/[...nextauth]/option";
import { redis } from "@/lib/db";
import { fetchRedis } from "@/helpers/redis";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email: emailToAdd } = addFriendValidator.parse(body.email);

    const response = await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/get/user:email:${emailToAdd}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        },
        cache: "no-store",
      }
    );
    const data = (await response.json()) as { result: string | null };

    const id = data.result;

    //If the person does not exist in the database
    if (!id) {
      return new Response("This person does not exists", { status: 400 });
    }

    const session = await getServerSession(options);

    //If person is not logged in
    if (!session) {
      return new Response("Unauthorizes", { status: 400 });
    }

    //if user is trying to add himself
    if (id === session.user.id) {
      return new Response("You cannot add yourself as a friend", {
        status: 400,
      });
    }

    //if friend request has already been sent
    const isAlreadySendFriendRequestOnce = (await fetchRedis(
      "sismember",
      `user:${id}:incoming_friend_request`,
      session.user.id
    )) as 0 | 1;

    if (isAlreadySendFriendRequestOnce) {
      return new Response("Friend request has been already sent", {
        status: 400,
      });
    }

    //if already a friend
    const isAlreadyFriend = await fetchRedis(
      "sismember",
      `user:${id}:friends`,
      session.user.id
    );

    if (isAlreadyFriend) {
      return new Response("Already friends with this user", { status: 400 });
    }

    // validated, send friend request
    redis.sadd(`user:${id}:incoming_friend_request`, session.user.id);
    return new Response("Friend request sent");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response("Invalid request payload", { status: 422 });
    }
    return new Response("Invalid request", { status: 400 });
  }
}
