import React, { useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import Quill from 'quill';
import { QuillBinding } from '../lib/y-quill';

import 'quill/dist/quill.bubble.css';  // Use a different theme for Editor2

const Editor2 = () => {
  const editorRef = useRef(null);

  useEffect(() => {
    const ydoc = new Y.Doc();  // Create a new Yjs document for Editor2

    const provider = new WebsocketProvider('ws://localhost:1234', 'shared-doc2', ydoc);  // Unique document name
    const ytext = ydoc.getText('quill');  // Create a Y.Text type for shared text
    const editor = new Quill(editorRef.current, { 
      theme: 'bubble',  // Different theme for Editor2
      placeholder: 'Write something here...',
      modules: {
        toolbar: [
          [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['bold', 'italic', 'underline'],
          ['link'],
          ['blockquote'],
          [{ 'align': [] }],
          ['clean']
        ],
      }
    });

    new QuillBinding(ytext, editor);  // Bind Quill editor with Yjs document

    provider.on('status', (event) => {
      console.log(`WebSocket status: ${event.status}`);
    });

    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, []);

  return <div ref={editorRef} style={{ height: '400px', border: '1px solid #ccc' }} />;
};

export default Editor2;
