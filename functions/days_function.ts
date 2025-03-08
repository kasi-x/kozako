import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

/**
 * 選択した月の日付を投稿する関数
 *
 * この関数は、ユーザーが選択した月のすべての日付を「YYYY年MM月DD日(曜日W)」の形式で
 * 個別のメッセージとして投稿します。各メッセージの間には小さな遅延（50ミリ秒）を
 * 設けることで、メッセージが正しい順序で表示されるようにしています。
 *
 * 効率的な処理のために、日付の計算を最適化し、処理時間を短縮しています。
 */
export const DaysFunctionDefinition = DefineFunction({
  callback_id: "days_function",
  title: "月の日付を投稿",
  description: "選択した月のすべての日付を個別のメッセージとして投稿します",
  source_file: "functions/days_function.ts",
  input_parameters: {
    properties: {
      selected_month: {
        type: Schema.types.string,
        description: "選択された月の値（例：2025年05月）",
      },
      channel_id: {
        type: Schema.slack.types.channel_id,
        description: "投稿先のチャンネルID",
      },
    },
    required: ["selected_month", "channel_id"],
  },
  output_parameters: {
    properties: {
      result: {
        type: Schema.types.string,
        description: "日付投稿の結果メッセージ",
      },
    },
    required: ["result"],
  },
});

export default SlackFunction(
  DaysFunctionDefinition,
  async ({ inputs, client }) => {
    const { selected_month, channel_id } = inputs;

    // 選択された月を解析（形式：YYYY年MM月）
    const match = selected_month.match(/(\d{4})年(\d{2})月/);
    if (!match) {
      return {
        outputs: {
          result: `無効な月の形式です: ${selected_month}`,
        },
      };
    }

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // Convert to 0-indexed month

    // 日本語の曜日名
    const dayOfWeekJP = ["日", "月", "火", "水", "木", "金", "土"];

    // 対象月の日数を取得
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 月の最初の日を事前計算（処理効率化のため）
    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay();

    try {
      // 繰り返し計算を避けるため、すべてのメッセージを先に準備
      const messages = [];
      for (let day = 1; day <= daysInMonth; day++) {
        // 各日ごとに新しいDateオブジェクトを作成せずに曜日を計算（処理効率化）
        const dayOfWeek = (firstDayOfWeek + day - 1) % 7;

        // 月の週番号をより効率的に計算
        const weekOfMonth = Math.floor((day - 1 + firstDayOfWeek) / 7) + 1;

        // 「YYYY年MM月DD日(曜日W)」の形式でフォーマット
        const formattedMonth = (month + 1).toString().padStart(2, "0");
        const formattedDay = day.toString().padStart(2, "0");
        const formattedDate = `${year}年${formattedMonth}月${formattedDay}日(${
          dayOfWeekJP[dayOfWeek]
        }${weekOfMonth})`;

        messages.push(formattedDate);
      }

      // 各メッセージの間に小さな遅延を設けて順番に投稿
      for (let i = 0; i < messages.length; i++) {
        // メッセージを投稿
        await client.chat.postMessage({
          channel: channel_id,
          text: messages[i],
        });

        // メッセージが正しい順序で表示されるように小さな遅延を追加
        // ただし、時間制限に引っかからないよう、遅延は短く設定
        if (i < messages.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      return {
        outputs: {
          result:
            `${selected_month}の${daysInMonth}日分の日付を正常に投稿しました`,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      return {
        outputs: {
          result: `日付の投稿中にエラーが発生しました: ${errorMessage}`,
        },
      };
    }
  },
);
