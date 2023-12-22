import { fetchRedis } from "./redis";

export const getFriendsByUserId = async (userId: string) => {
  //retrive friends for current users
  const friendIds: string[] = await fetchRedis(
    "smembers",
    `user:${userId}:friends`
  );

  const friends = await Promise.all(
    friendIds.map(async (friendId) => {
      const friend: string = await fetchRedis("get", `user:${friendId}`);
      const parsedFriend = JSON.parse(friend) as User;
      return parsedFriend;
    })
  );

  return friends;
};
