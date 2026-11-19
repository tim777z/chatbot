/*
 * Ambient declarations for the legacy browser globals used by the plugin.
 * These let `tsc --noEmit -p jsconfig.json` type-check the source without
 * forcing a module-system or framework migration.
 */
declare var $: any;
declare var jQuery: any;
declare var require: any;
declare var module: any;
declare var global: any;

interface Window {
  validateApiResponse?: any;
  ChatBotSanitize?: any;
}
