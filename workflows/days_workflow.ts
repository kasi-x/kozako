import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { DaysFunctionDefinition } from "../functions/days_function.ts";

/**
 * 選択した月の日付を表示するワークフロー
 *
 * このワークフローでは、ユーザーが月を選択すると、その月のすべての日付が
 * 「YYYY年MM月DD日(曜日W)」の形式で個別のメッセージとして表示されます。
 * 曜日は日本語（日、月、火、水、木、金、土）で表示され、Wはその月の何週目かを示します。
 */
const DaysWorkflow = DefineWorkflow({
  callback_id: "days_workflow",
  title: "月の日付表示",
  description: "選択した月のすべての日付を個別のメッセージとして表示します",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      channel: {
        type: Schema.slack.types.channel_id,
      },
    },
    required: ["interactivity", "channel"],
  },
});

// Get current date
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth(); // 0-indexed (0 = January)

// Generate options for months (current month + 13 months ahead)
const monthOptions = [];
for (let i = 0; i < 14; i++) {
  const monthIndex = (currentMonth + i) % 12;
  const year = currentYear + Math.floor((currentMonth + i) / 12);

  // Format as YYYY年MM月
  const monthNumber = monthIndex + 1; // Convert to 1-indexed
  const formattedMonth = `${year}年${
    monthNumber.toString().padStart(2, "0")
  }月`;

  monthOptions.push({
    value: formattedMonth,
    title: formattedMonth,
  });
}

// Open a form for the user to select a month
const monthSelectionForm = DaysWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "月を選択",
    interactivity: DaysWorkflow.inputs.interactivity,
    submit_label: "選択",
    fields: {
      elements: [{
        name: "selected_month",
        title: "月を選択してください",
        type: Schema.types.string,
        enum: monthOptions.map((option) => option.value),
        choices: monthOptions,
      }],
      required: ["selected_month"],
    },
  },
);

// Post days for the selected month
const daysFunction = DaysWorkflow.addStep(
  DaysFunctionDefinition,
  {
    selected_month: monthSelectionForm.outputs.fields.selected_month,
    channel_id: DaysWorkflow.inputs.channel,
  },
);

// Send a confirmation message
DaysWorkflow.addStep(Schema.slack.functions.SendMessage, {
  channel_id: DaysWorkflow.inputs.channel,
  message: daysFunction.outputs.result,
});

export default DaysWorkflow;
