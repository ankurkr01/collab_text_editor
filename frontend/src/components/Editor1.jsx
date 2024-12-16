import React, { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { QuillBinding } from "y-quill";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../App.css";

const COLORS = ["#FF5733", "#33FF57", "#3357FF", "#FFC300", "#8E44AD", "#1ABC9C"];

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const Editor = () => {
  const reactQuillRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const username = `User-${Math.floor(Math.random() * 1000)}`; // Random username for simplicity
  const userColor = getRandomColor();

  const [ydoc, setYdoc] = useState(null);
  console.log(comments)

  useEffect(() => {
    const ydocInstance = new Y.Doc();
    setYdoc(ydocInstance);

    const provider = new WebsocketProvider("ws://localhost:1234", "shared-room", ydocInstance);
    const awareness = provider.awareness;
    awareness.setLocalStateField("user", { name: username, color: userColor });

    const ytext = ydocInstance.getText("quill");
    const ycomments = ydocInstance.getMap("comments"); // Shared Y.Map to store comments

    // Sync comments to local state
    const syncComments = () => {
      setComments(Array.from(ycomments.values()));
    };
    ycomments.observe(syncComments); // Observe changes to ycomments map

    const yhighlight = ydocInstance.getMap("highlight");
    const syncHighlights = () => {
      const quill = reactQuillRef.current.getEditor();
      const decorations = Array.from(yhighlight.values());
      quill.formatText(0, quill.getLength(), "background", null);
      decorations.forEach(({ range, color }) => {
        quill.formatText(range.index, range.length, "background", color);
      });
    };
    yhighlight.observe(syncHighlights);

    if (reactQuillRef.current) {
      const quill = reactQuillRef.current.getEditor();
      new QuillBinding(ytext, quill);

      quill.on("selection-change", (range) => {
        if (range && range.length > 0) {
          const text = quill.getText(range.index, range.length);
          awareness.setLocalStateField("selection", { range, text });
          yhighlight.set(username, { range, color: userColor });
        } else {
          awareness.setLocalStateField("selection", null);
          yhighlight.delete(username);
        }
      });

      const handleAwarenessChange = () => {
        const states = Array.from(awareness.getStates().values());
        const users = states
          .filter((state) => state.user)
          .map((state) => state.user);
        setOnlineUsers(users);

        renderCursorsAndHighlights(quill, states);
      };

      awareness.on("change", handleAwarenessChange);

      return () => {
        awareness.off("change", handleAwarenessChange);
        provider.destroy();
        ydocInstance.destroy();
      };
    }
  }, []);

  const renderCursorsAndHighlights = (quill, states) => {
    quill.formatText(0, quill.getLength(), "background", false);
    const cursorOverlay = quill.container.querySelector(".ql-cursor-overlay");
    if (!cursorOverlay) {
      const overlay = document.createElement("div");
      overlay.className = "ql-cursor-overlay";
      overlay.style.position = "relative";
      overlay.style.zIndex = "10";
      quill.container.appendChild(overlay);
    } else {
      cursorOverlay.innerHTML = "";
    }

    states.forEach((state) => {
      if (state.user && state.selection) {
        const { range } = state.selection;
        const { color, name } = state.user;

        if (range && range.length > 0) {
          quill.formatText(range.index, range.length, "background", color);
          const bounds = quill.getBounds(range.index, range.length);
          const highlightLabel = document.createElement("div");
          highlightLabel.style.position = "absolute";
          highlightLabel.style.top = `${bounds.top - 20}px`;
          highlightLabel.style.left = `${bounds.left}px`;
          highlightLabel.style.backgroundColor = color;
          highlightLabel.style.color = "#fff";
          highlightLabel.style.padding = "2px 5px";
          highlightLabel.style.borderRadius = "3px";
          highlightLabel.style.zIndex = "10";
          highlightLabel.innerText = name;

          cursorOverlay.appendChild(highlightLabel);
        }

        if (range && range.length === 0) {
          const cursorElement = document.createElement("span");
          cursorElement.style.borderLeft = `2px solid ${color}`;
          cursorElement.style.marginLeft = "-2px";
          cursorElement.style.height = "1em";
          cursorElement.style.position = "absolute";
          cursorElement.style.zIndex = "10";
          cursorElement.setAttribute("data-username", name);

          const cursorPosition = quill.getBounds(range.index);
          cursorElement.style.top = `${cursorPosition.top}px`;
          cursorElement.style.left = `${cursorPosition.left}px`;

          cursorOverlay.appendChild(cursorElement);
        }
      }
    });
  };

  const handleAddComment = () => {
    const quill = reactQuillRef.current.getEditor();
    const range = quill.getSelection();
    if (range && range.length > 0) {
      const selectedText = quill.getText(range.index, range.length);
      const comment = prompt("Add your comment:");
      if (comment && ydoc) {
        const ycomments = ydoc.getMap("comments");
        const commentData = {
          id: Date.now(),
          user: username,
          color: userColor,
          text: selectedText,
          comment,
        };
        ycomments.set(commentData.id, commentData);
      }
    } else {
      alert("Please select text to comment.");
    }
  };

  const handleDeleteComment = (id) => {
    if (ydoc) {
      const ycomments = ydoc.getMap("comments");
      if (ycomments.has(id)) {
        ycomments.delete(id);
      }
    }
  };

  return (
    <div className="editor-container">
      <div className="online-users">
        <h3>Online Users</h3>
        <ul>
          {onlineUsers.map((user, index) => (
            <li key={index} style={{ color: user.color }}>
              {user.name}
            </li>
          ))}
        </ul>
      </div>
      <div className="editor-actions">
        <button onClick={handleAddComment}>Add Comment</button>
      </div>
      <ReactQuill ref={reactQuillRef} theme="snow" placeholder="Start collaborating..." />
      <div className="comments-sidebar">
        <h3>Comments</h3>
        <ul>
          {comments.map((comment) => (
            <li key={comment.id} style={{ borderLeft: `4px solid ${comment.color}` }}>
              <p>
                <strong>{comment.user}:</strong> {comment.comment}
              </p>
              <p style={{ fontStyle: "italic" }}>On: "{comment.text}"</p>
              {comment.user === username && (
                <button onClick={() => handleDeleteComment(comment.id)}>Delete</button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Editor;
