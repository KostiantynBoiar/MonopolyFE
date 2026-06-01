export async function getOnlinePlayerCount(): Promise<number | undefined> {
  // TODO(backend): fetch from /stats/online when the endpoint is ready.
  // Return undefined so the landing page omits the stat rather than showing a fake count.
  return undefined;
}
