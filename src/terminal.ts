export const commands = [
  'help',
  'about',
  'work',
  'stack',
  'contact',
  'theme',
  'clear',
  'reset',
  'version',
  'bio',
  'examples',
  'background',
  'text',
] as const;
export type Command = (typeof commands)[number];
export const themes = ['green', 'amber', 'ice'] as const;
export type Theme = (typeof themes)[number];
export function parseCommand(input: string): {
  command: Command | 'unknown';
  args: string;
  raw: string;
} {
  const raw = input.trim().slice(0, 500);
  const [name = '', ...args] = raw.toLowerCase().split(/\s+/);
  return {
    command: commands.includes(name as Command) ? (name as Command) : 'unknown',
    args: args.join(' '),
    raw,
  };
}
export function completeCommand(input: string): string {
  const matches = commands.filter((command) =>
    command.startsWith(input.trim().toLowerCase()),
  );
  return matches.length === 1 ? matches[0] : input;
}
export function navigateHistory(
  history: string[],
  cursor: number,
  direction: 'up' | 'down',
  draft: string,
) {
  const next = Math.max(
    0,
    Math.min(history.length, cursor + (direction === 'up' ? -1 : 1)),
  );
  return {
    cursor: next,
    value: next === history.length ? draft : (history[next] ?? draft),
  };
}
