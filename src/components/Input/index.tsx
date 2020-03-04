import React, { useState, useRef } from "react";
import { useKeyPressEvent } from 'react-use';
import { isCommand, getContent } from './Commands';

import styles from './styles.module.scss';

const Input = () => {
  const [history, setHistory] = useState(['Welcome to https://nickhu.info! type HELP for more info']);
  const [buffer, setBuffer] = useState('');
  const inputRef = useRef(null);

  const appendString = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBuffer(e.target.value);
  }

  const saveLine = () => {
    let newHistory = [...history, `> ${buffer}`];
    setHistory(newHistory);
    if (isCommand(buffer)) {
      newHistory = [...newHistory, getContent(buffer)];
      setHistory(newHistory);
    }
    setBuffer('');
  }

  if (inputRef && inputRef.current) {
    // @ts-ignore
    inputRef.current.focus();
  }

  useKeyPressEvent('Enter', saveLine);

  return (
    <div className={styles.window}>
      <input onChange={appendString} ref={inputRef} value={buffer}/>
      {history.map((hi: string) => (
        hi.split('\n').map((line: string) => (
          <div key={`${hi}${Math.random().toString(36)}`} className={styles.line}>{line}</div>
        ))
      ))}
      <div className={styles.buffer}>
        > {buffer}
        <div className={styles.input} />
      </div>
    </div>
  )
};

export default Input;
