const upstashRedisRestUrl = process.env.UPSTASH_REDIS_REST_URL;
const authToken = process.env.UPSTASH_REDIS_REST_TOKEN;

type Command = "zrange" | "sismember" | "get" | "smembers";

export async function fetchRedis(
  command: Command,
  ...args: (string | number)[]
) {
  const commandUrl = `https://gusc1-actual-porpoise-30592.upstash.io/${command}/${args.join(
    "/"
  )}`;

  const response = await fetch(commandUrl, {
    headers: {
      Authorization: `Bearer AXeAACQgZTQ4OGQxMzAtNDAxOS00ZDljLWJkNTctZjAyNzk2N2VkNjhlNzM4N2NmMTdlMGZmNDFhYzg4YmFhN2ZjYTc2NzFkYjk=`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    console.log(response);
    throw new Error(`Error executing Redis command: ${response.statusText}`);
  }

  const data = await response.json();
  return data.result;
}
