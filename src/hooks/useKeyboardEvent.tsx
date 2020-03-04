import { useEffect, useState } from 'react';

export default function(append: Function) {
  const [key, setKey] = useState('');

  const onDown = (event: any) => {
    setKey(event.key);
    switch(event.key) {
      // case 'Enter':
      //   parseString();
      //   break;
      // case 'BackSpace':
      //   deleteLast();
      // case 'Space':
      //   appendString(' ');
      default:
        if (/[a-zA-Z0-9-_]/.test(String.fromCharCode(event.keyCode))) {
          append(event.key);
        }
        break;
    }
    return key;
  }

  useEffect(() => {
    window.addEventListener("keydown", onDown)
    return () => {
      window.removeEventListener("keydown", onDown)
    }
  }, [key])
}


// useEffect(() => {
//   const handler = function(event: any) {
//     switch(event.key) {
//       case 'Enter':
//         parseString();
//         break;
//       case 'BackSpace':
//         deleteLast();
//       case 'Space':
//         appendString(' ');
//       default:
//         break;
//     }
//   }
