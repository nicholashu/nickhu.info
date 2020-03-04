
const content = {
  help: `nickhu.info website\n
    USAGE:\n
    version: Print out the current version\n
    bio: Learn more about me\n
    contact: See how to contact the me\n
    examples: Discover what else I have made\n
    background: change the background colour e.g., background orange\n
    text: change the text colour e.g., text black,
    reset: start all over
    `,
  version: '1.0.0',
  bio: `Hi! :D i‘m Nick Hu. I am a web developer based in the picturesque Perth, Western Australia.\n
    I like to create beautiful web applications both inside and out.\n
    React + Next.js + Craft CMS + GraphQL is my main JAM. ;)\n
    Javascript is where I feel at home, but i'm not afraid to use PHP, Ruby, Python when need be.`,
  contact: `feel free to email me via <a href="mailto:nick@nickhu.info">nick@nickhu.info</a>,
    check out my <a href="https://github.com/nicholashu" target="_blank">GitHub</a>, or follow me on <a href="https://www.linkedin.com/in/nick-hu-104b231a1/" target="_blank">linkedIn</a>`,
  examples: `I currently work for <a href="https://league.agency" target="_blank">The League Agency</a> in Perth, Western Australia as a Full Stack Web Developer.\n
    I‘ve had my hands all over the place. Some of our coolest projects include:\n
    <a href="https://www.discoverychannel.com.au/" target="_blank">Discovery Channel Australia</a>\n
    <a href="https://www.ilovetlc.com.au/" target="_blank">TLC Australia</a>\n
    <a href="https://johnhughes.com.au" target="_blank">John Hughes</a>\n
    <a href="https://dvg.com.au" target="_blank">DVG</a>\n
    <a href="https://www.jesters.com.au/" target="_blank">Jesters Pies</a>\n`,
}
const available = Object.keys(content);

export const isCommand = (input: string) => available.includes(input.toLowerCase())
export const getContent = (key: string) => content[key.toLowerCase()]
