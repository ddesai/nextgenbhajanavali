export async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export class RateLimiter {
  private last = 0;

  constructor(private readonly minDelayMs: number) {}

  async throttle() {
    const now = Date.now();
    const wait = Math.max(0, this.minDelayMs - (now - this.last));
    if (wait > 0) await sleep(wait);
    this.last = Date.now();
  }
}
