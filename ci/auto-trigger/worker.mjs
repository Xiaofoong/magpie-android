const upstream = "repos/yetone/magpie-releases/releases/latest";
const android = "repos/Xiaofoong/magpie-android";
const workflow = android + "/actions/workflows/follow-official.yml";

async function github(path, token, send, body) {
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: "Bearer " + token,
    "User-Agent": "Magpie-Android-release-check",
  };
  if (body) headers["Content-Type"] = "application/json";
  const response = await send("https://api.github.com/" + path, {
    headers,
    method: body ? "POST" : "GET",
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`GitHub API ${response.status} for ${path}`);
  if (!body) return response.json();
}

function shouldBuild(official, published) {
  const incoming = /^v(\d+)\.(\d+)\.(\d+)$/.exec(official.tag_name);
  const existing = /^android-v(\d+)\.(\d+)\.(\d+)-r\d+$/.exec(published.tag_name);
  if (!incoming || !existing || official.draft || official.prerelease) {
    throw new Error("Unexpected stable release metadata");
  }
  for (let i = 1; i <= 3; i++) {
    const difference = Number(incoming[i]) - Number(existing[i]);
    if (difference !== 0) return difference > 0;
  }
  return false;
}

export async function checkForUpdate(token, send = fetch) {
  if (!token) throw new Error("GITHUB_ACTIONS_TOKEN is missing");
  const [official, published] = await Promise.all([
    github(upstream, token, send),
    github(android + "/releases/latest", token, send),
  ]);
  if (!shouldBuild(official, published)) return "current";

  const runs = await github(workflow + "/runs?branch=main&per_page=10", token, send);
  if (runs.workflow_runs.some(run => run.status !== "completed")) return "running";

  await github(workflow + "/dispatches", token, send, {
    ref: "main",
    inputs: { verify_native_ui: false },
  });
  return "dispatched";
}

export default {
  async scheduled(_controller, env) {
    console.log(await checkForUpdate(env.GITHUB_ACTIONS_TOKEN));
  },
};
