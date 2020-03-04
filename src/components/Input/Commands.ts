
const content = {
  help: `nickhu.info website\nUSAGE:\nversion: Print out the current version\nbio: Learn about the creator`,
  version: '1.0.0',
  bio: `Hi! :D i‘m Nick Hu. I am a web developer based in the picturesque Perth, Western Australia.\n
    I like to create beautiful web applications both inside and out.\n
    React + Next.js + Craft CMS + GraphQL is my main JAM. ;)\n
    Javascript is where I feel at home, but i'm not afraid to use PHP, Ruby, Python when need be.`,
  contact: 'feel free to email me via email: nick@nickhu.info',
  examples: `I currently work for The League Agency in Perth, Western Australia as a Full Stack Web Developer.\n
    I‘ve had my hands all over the place. Some of our coolest projects include:\n
    Discovery Channel: https://discoverychannel.com.au\n
    TLC Australia: https://ilovetlc.com.au\n
    John Hughes: https://johnhughes.com.au\n
    Jesters Pies: https://jesters.com.au\n`
}
const available = Object.keys(content);

export const isCommand = (input: string) => available.includes(input.toLowerCase())
export const getContent = (key: string) => content[key.toLowerCase()]
