

import { defineFunction } from '@aws-amplify/backend';
import { secret } from '@aws-amplify/backend';

export const sendEmail = defineFunction({ 
  name: 'sendEmail', 
  entry: './handler.ts',
  environment: {
    ANTHROPIC_API_KEY: secret('ANTHROPIC_API_KEY'),
  },
  timeoutSeconds: 60
});