import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';
import { sendEmail } from './functions/sendEmail/resource';
import * as iam from "aws-cdk-lib/aws-iam"

const backend = defineBackend({
  auth,
  data,
  sendEmail
});

backend.sendEmail.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
  actions: ['ses:SendEmail', 'ses:SendRawEmail'],
  resources: ['*']
}))