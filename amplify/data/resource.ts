import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { sendEmail } from "../functions/sendEmail/resource";

const schema = a.schema({
  SendEmail: a
    .query()
    .arguments({
      userId: a.string(),
      walletAddress: a.string()
    })
    .returns(a.json())
    .handler(a.handler.function(sendEmail))
    .authorization((allow) => [allow.authenticated()])
  ,
  User: a
    .model({
      username: a.string().required(),
      email: a.string(),
      walletAddress: a.string(),
      isActive: a.boolean().default(true),
      isQuiteHours: a.boolean().default(false),
      isVerified: a.boolean().default(false),
    })
    .authorization((allow) => [
      allow.guest().to(["read"]),
      allow.authenticated(),
    ]),
}).authorization((allow) => [
  allow.resource(sendEmail)
]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
