import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  completeCommand,
  navigateHistory,
  parseCommand,
  themes,
} from './terminal';
import type { Theme } from './terminal';

const recentProjects = [
  {
    name: 'KURB',
    context: ' · co-founder & CTO',
    href: 'https://kurb.online',
    description:
      'I co-founded KURB to help people find things across hundreds of marketplaces. I build the search, recommendations and deal alerts, help shape the product, and keep it running.',
  },
  {
    name: 'TopTeacher / CreAItor',
    context: ' · Airteam',
    href: 'https://topteacher.com.au',
    description:
      'Helped build a tool that uses AI to make classroom worksheets. I worked on generation and quality checks, right down to checking the finished PDFs actually work on paper.',
  },
  {
    name: 'AI-assisted website editing',
    context: ' · Airteam',
    description:
      'Built a tool that lets designers request website changes directly from the CMS, with AI preparing the code and engineers reviewing it before release.',
  },

  {
    name: 'Museums of History NSW',
    context: ' & CSIRO · Airteam',
    href: 'https://mhnsw.au',
    description:
      'Built accessible web applications, content tools and complex forms, and connected them to external services.',
  },
  {
    name: 'News Corp',
    context: ' · Airteam',
    description:
      'Built interactive data visualisations and a responsive interface for exploring large datasets.',
  },
];
const toolkit = [
  [
    'Applications',
    'Python, TypeScript, Node.js, React, Next.js, GraphQL, REST APIs',
  ],
  [
    'Applied AI',
    'LLM workflows, structured outputs, evaluations, agentic coding, LangSmith',
  ],
  [
    'Search & data',
    'PostgreSQL, ParadeDB, embeddings, vector search, recommendation systems',
  ],
  [
    'Cloud & systems',
    'AWS, Hetzner, Docker, Terraform, CI/CD, infrastructure as code',
  ],
];
const shortcuts = [
  ['about', 'What I do and how I work'],
  ['work', 'Recent projects and earlier work'],
  ['stack', 'The tools I work with'],
  ['contact', 'Email, GitHub, and LinkedIn'],
];
function External({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span aria-hidden="true"> ↗</span>
    </a>
  );
}
function Output({ command }: { command: string }) {
  switch (command) {
    case 'about':
    case 'bio':
      return (
        <>
          <p>
            Hi! I’m Nick, a developer in Perth, Western Australia. I’ve spent
            the last 10+ years building things for the web and keeping them
            running.
          </p>
          <p>
            I’m Co-Founder &amp; CTO at{' '}
            <External href="https://kurb.online">KURB</External> and a Senior
            Fullstack Engineer at{' '}
            <External href="https://airteam.com.au">Airteam</External>. That means
            working on everything from the interface to the data and servers
            behind it.
          </p>
          <p>
            Lately, I’ve been working on marketplace search, recommendations and
            AI tools. I like getting into the details: messy data, useful
            results, and what happens when something breaks.
          </p>
        </>
      );
    case 'work':
    case 'examples':
      return (
        <>
          <p>A few things I’ve worked on:</p>
          <div className="recent-projects">
            {recentProjects.map(({ name, context, href, description }) => (
              <section key={name}>
                <h2>
                  {href ? <External href={href}>{name}</External> : name}
                  <span className="muted">{context}</span>
                </h2>
                <p>{description}</p>
              </section>
            ))}
          </div>
          <h2 className="output-heading">Before that</h2>
          <p>
            Senior Web Developer at League Agency &amp; Auto League (2018–2021),
            building client applications, automating AWS deployments, and
            mentoring graduates.
          </p>
          <p>
            Earlier roles included Online Manager &amp; Developer at Grand Cru
            Wine Shop, and Director of IT at The International School in Genoa,
            where I also taught Computer Science.
          </p>
        </>
      );
    case 'stack':
      return (
        <>
          <p>Mostly TypeScript and Python these days. Here’s what I reach for:</p>
          <dl className="toolkit">
            {toolkit.map(([area, tools]) => (
              <div key={area}>
                <dt>{area}</dt>
                <dd>{tools}</dd>
              </div>
            ))}
          </dl>
          <p className="muted">
            This site keeps it small: React, TypeScript, and Vite.
          </p>
        </>
      );
    case 'contact':
      return (
        <>
          <p>
            Have something in mind, or just want to say hi? Drop me a line.
          </p>
          <div className="contact-links">
            <a href="mailto:nick@nickhu.info">nick@nickhu.info ↗</a>
            <External href="https://github.com/nicholashu">GitHub</External>
            <External href="https://www.linkedin.com/in/nick-hu-perth/">
              LinkedIn
            </External>
          </div>
        </>
      );
    case 'help':
      return (
        <div className="help-list">
          {[
            ...shortcuts,
            ['theme green|amber|ice', 'Choose a terminal colour'],
            ['clear', 'Clear command output'],
            ['reset', 'Clear output, history, and custom colours'],
            ['version', 'Show the site version and stack'],
            ['background / text <color>', 'Set a custom CSS colour'],
            ['bio / examples', 'Aliases for about / work'],
          ].map(([name, description]) => (
            <div key={name}>
              <code>{name}</code>
              <span>{description}</span>
            </div>
          ))}
        </div>
      );
    case 'version':
      return <p>nickhu.info v2.0.0 · React 19 · TypeScript · Vite 8</p>;
    default:
      return null;
  }
}
export default function App() {
  const [theme, setTheme] = useState<Theme>('green');
  const [custom, setCustom] = useState<CSSProperties>({});
  const [entries, setEntries] = useState<
    { id: number; raw: string; command: string; message?: string }[]
  >([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const latestEntryRef = useRef<HTMLElement>(null);
  const id = useRef(0);
  useEffect(() => {
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches)
      inputRef.current?.focus({ preventScroll: true });
  }, []);
  useLayoutEffect(() => {
    const output = outputRef.current;
    const entry = latestEntryRef.current;
    if (!output) return;
    if (!entries.length || !entry) {
      output.scrollTop = 0;
      return;
    }
    const padding = parseFloat(getComputedStyle(output).paddingTop);
    const entryTop =
      output.scrollTop +
      entry.getBoundingClientRect().top -
      output.getBoundingClientRect().top -
      padding;
    // Show the prompt when it fits, without scrolling past the new reply's start.
    output.scrollTop = Math.max(
      0,
      Math.min(entryTop, output.scrollHeight - output.clientHeight),
    );
  }, [entries]);
  function run(value: string, focusInput = false) {
    const { command, args, raw } = parseCommand(value);
    if (!raw) return;
    const nextHistory = [...history, raw].slice(-100);
    setHistory(nextHistory);
    setCursor(nextHistory.length);
    setInput('');
    setDraft('');
    let message: string | undefined;
    if (command === 'clear' || command === 'reset') {
      setEntries([]);
      if (command === 'reset') {
        setTheme('green');
        setCustom({});
        setHistory([]);
        setCursor(0);
      }
    } else {
      if (command === 'theme') {
        if (themes.includes(args as Theme)) {
          setTheme(args as Theme);
          setCustom({});
          message = `Theme set to ${args}.`;
        } else
          message = 'Choose a theme: theme green, theme amber, or theme ice.';
      } else if (command === 'background' || command === 'text') {
        if (args && CSS.supports('color', args)) {
          setCustom((prev) => ({
            ...prev,
            ...(command === 'background'
              ? { '--terminal-bg': args }
              : {
                  '--ink': args,
                  '--accent': args,
                  '--muted': args,
                  '--error': args,
                }),
          }));
          message = `${command} set to ${args}. Use reset to restore defaults.`;
        } else
          message =
            'Enter a valid CSS color, e.g. background #151915 or text white.';
      } else if (command === 'unknown')
        message = `Command not found: ${raw}. Type help for available commands.`;
      setEntries((prev) =>
        [...prev, { id: id.current++, raw, command, message }].slice(-50),
      );
    }
    if (focusInput) inputRef.current?.focus({ preventScroll: true });
  }
  return (
    <main className="site terminal" data-theme={theme} style={custom}>
      <div
        className="terminal-output"
        ref={outputRef}
        tabIndex={0}
        aria-label="Terminal output"
      >
        <h1>nickhu.info</h1>
        <p className="welcome-copy">
          Hi, I’m Nick. I build things for the web from Perth.
          <br />
          I co-founded <External href="https://kurb.online">KURB</External> and
          work at <External href="https://airteam.com.au">Airteam</External>.
        </p>
        <p className="welcome-tip muted">Type a command, or choose one:</p>
        <div className="quick-commands">
          {[...shortcuts, ['help']].map(([name]) => (
            <button onClick={() => run(name)} key={name}>
              {name}
            </button>
          ))}
        </div>
        <div role="log" aria-live="polite" aria-relevant="additions">
          {entries.map((entry, index) => (
            <article
              className="entry"
              key={entry.id}
              ref={index === entries.length - 1 ? latestEntryRef : null}
            >
              <div className="command-echo">
                <span aria-hidden="true">&gt;</span>
                <span>{entry.raw}</span>
              </div>
              <div
                className={`response ${entry.command === 'unknown' ? 'error' : ''}`}
              >
                {entry.message ? (
                  <p>{entry.message}</p>
                ) : (
                  <Output command={entry.command} />
                )}
              </div>
            </article>
          ))}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            run(input, true);
          }}
          className="prompt"
        >
          <label htmlFor="command">
            <span aria-hidden="true">&gt;</span>
          </label>
          <input
            id="command"
            ref={inputRef}
            value={input}
            maxLength={500}
            aria-label="Terminal command"
            placeholder="try about"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            onChange={(event) => {
              setInput(event.target.value);
              setCursor(history.length);
              setDraft(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;
              if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                event.preventDefault();
                const next = navigateHistory(
                  history,
                  cursor,
                  event.key === 'ArrowUp' ? 'up' : 'down',
                  draft,
                );
                setCursor(next.cursor);
                setInput(next.value);
              }
              if (event.key === 'Tab' && !event.shiftKey && input.trim()) {
                const completion = completeCommand(input);
                if (completion !== input) {
                  event.preventDefault();
                  setInput(completion);
                  setDraft(completion);
                  setCursor(history.length);
                }
              }
              if (event.key === 'l' && event.ctrlKey) {
                event.preventDefault();
                setEntries([]);
              }
            }}
          />
          <button
            className="submit-command"
            type="submit"
            aria-label="Run command"
          >
            ↵
          </button>
        </form>
        <p className="keyboard-hint muted">
          <kbd>↑</kbd> <kbd>↓</kbd> history · <kbd>Tab</kbd> complete ·{' '}
          <kbd>Ctrl+L</kbd> clear
        </p>
      </div>
    </main>
  );
}
