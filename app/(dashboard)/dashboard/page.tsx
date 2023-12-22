import { redis } from "@/lib/db";
import { getServerSession } from "next-auth";
import { FC } from "react";
import { options } from "../../api/auth/[...nextauth]/option";

interface pageProps {}

const page: FC<pageProps> = async ({}) => {
  const user = await getServerSession(options);

  return <div>{JSON.stringify(user)}</div>;
};

export default page;
