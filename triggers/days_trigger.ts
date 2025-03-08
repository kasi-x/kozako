import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import DaysWorkflow from "../workflows/days_workflow.ts";

/**
 * 月の日付表示ワークフローのトリガー
 *
 * このトリガーを使用すると、ユーザーは月を選択して、その月のすべての日付を
 * 個別のメッセージとして表示することができます。
 */
const daysTrigger: Trigger<typeof DaysWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "月の日付表示",
  description: "選択した月のすべての日付を個別のメッセージとして表示します",
  workflow: `#/workflows/${DaysWorkflow.definition.callback_id}`,
  inputs: {
    interactivity: {
      value: TriggerContextData.Shortcut.interactivity,
    },
    channel: {
      value: TriggerContextData.Shortcut.channel_id,
    },
  },
};

export default daysTrigger;
