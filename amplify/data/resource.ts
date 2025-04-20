import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  User: a
    .model({
      username: a.string().required(),
      walletAddress: a.string(),
      isActive: a.boolean().default(true),
      isQuiteHours: a.boolean().default(false),
    })
    .authorization((allow) => [
      allow.guest().to(["read"]),
      allow.authenticated(),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
