// @ts-ignore
import { defineBoot } from '#q-app/wrappers'
// @ts-ignore
import { createI18n } from 'vue-i18n'

import messages from 'src/i18n';

import { useConfigStore } from '../stores/config-store'

export type MessageLanguages = keyof typeof messages;
// Type-define 'en-US' as the master schema for the resource
export type MessageSchema = typeof messages['en-EN'];

// See https://vue-i18n.intlify.dev/guide/advanced/typescript.html#global-resource-schema-type-definition
/* eslint-disable @typescript-eslint/no-empty-object-type */
// @ts-ignore
declare module 'vue-i18n' {
  // define the locale messages schema
  export interface DefineLocaleMessage extends MessageSchema {}

  // define the datetime format schema
  export interface DefineDateTimeFormat {}

  // define the number format schema
  export interface DefineNumberFormat {}
}
/* eslint-enable @typescript-eslint/no-empty-object-type */

export default defineBoot(({ app }) => {
  const config = useConfigStore()
  const i18n = createI18n<{ message: MessageSchema }, MessageLanguages>({
    locale: config.locale,
    legacy: false,
    messages,
  });
  // Set i18n instance on app
  app.use(i18n);
});
