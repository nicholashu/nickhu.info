
const content = {
  help: 'test test test',
  version: '1.0.0',
}
const available = Object.keys(content);

export const isCommand = (input: string) => available.includes(input.toLowerCase())
export const getContent = (key: string) => content[key.toLowerCase()]
