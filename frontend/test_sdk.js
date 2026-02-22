import { LingoDotDevEngine } from "lingo.dev/sdk";
const lingo = new LingoDotDevEngine({ apiKey: "api_kmylpyr29edjsihfwwhcv2r4" });
async function run() {
  const t = await lingo.localizeText("Hello, welcome to SignBridge", { sourceLocale: "en", targetLocale: "hi" });
  console.log(t);
}
run();
