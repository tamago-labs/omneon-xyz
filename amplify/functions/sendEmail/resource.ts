

import { defineFunction } from '@aws-amplify/backend';
import { secret } from '@aws-amplify/backend';

export const sendEmail = defineFunction({ 
  name: 'sendEmail', 
  entry: './handler.ts',
  environment: {
    // APTOS_MANAGED_KEY: secret('APTOS_MANAGED_KEY')
  },
  timeoutSeconds: 60
});