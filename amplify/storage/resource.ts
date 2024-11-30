import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'zapchart',
  access: (allow) => ({
    'charts/*': [
      allow.guest.to(['read']),
      allow.entity('identity').to(['read', 'write', 'delete'])
    ],
  })
});