import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/api";
import { useCallback } from "react";

const client = generateClient<Schema>({
  authMode: "userPool",
});

const useAccount = () => {
  const loadProfile = async (userId: string) => {
    let entry;

    const user = await client.models.User.list({
      filter: {
        username: {
          eq: userId,
        },
      },
    });

    console.log("user :", user);

    if (user.data.length === 0) {
      const newUser = {
        username: userId,
        isActive: true,
      };
      const response = await client.models.User.create({
        ...newUser,
      });
      console.log("response: ", response);

      entry = newUser;
    } else {
      entry = user.data[0];
    }

    return entry;
  };

  const updateWalletAddress = useCallback(
    async (userId: string, walletAddress: string) => {
      await client.models.User.update({
        id: userId,
        walletAddress,
      });
    },
    []
  );

  const updateIsActive = useCallback(
    async (userId: string, isActive: boolean) => {
      await client.models.User.update({
        id: userId,
        isActive,
      });
    },
    []
  );

  return {
    loadProfile,
    updateWalletAddress,
    updateIsActive,
  };
};

export default useAccount;
