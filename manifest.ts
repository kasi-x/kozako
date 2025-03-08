import { Manifest } from "deno-slack-sdk/mod.ts";
import DaysWorkflow from "./workflows/days_workflow.ts";

/**
 * The app manifest contains the app's configuration. This
 * file defines attributes like app name and description.
 * https://api.slack.com/automation/manifest
 */
export default Manifest({
  name: "kozako",
  description: "選択した月の日付を個別のメッセージとして表示するアプリ",
  icon: "assets/default_new_app_icon.png",
  workflows: [DaysWorkflow],
  outgoingDomains: [],
  botScopes: ["commands", "chat:write", "chat:write.public"],
});
