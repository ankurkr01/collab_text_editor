import React from 'react';
import Editor1 from './components/Editor1';
import Editor2 from './components/Editor2';

const App = () => {
  return (
    <div>
      <h1>Collaborative Editors</h1>
      <div>
        <h2>Editor 1</h2>
        <Editor1 />
      </div>
      {/* <div>
        <h2>Editor 2</h2>
        <Editor2 />
      </div> */}
    </div>
  );
};

export default App;
