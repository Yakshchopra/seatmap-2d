import WebGl from './WebGl';
import './App.css';
import { SVGRenderer } from './Svg';
import { useState } from 'react';
import CustomZoom from './CustomZoom';

const App = () => {
  const [category, setCategory] = useState('webgl');

  return (
    <>
      {category === 'webgl' ? <WebGl /> : <SVGRenderer />}
      {/* <CustomZoom /> */}
      <div className='category-btn'>
        <button onClick={() => setCategory('webgl')}>WebGl</button>
        <button onClick={() => setCategory('svg')}>SVG</button>
      </div>
    </>
  );
};

export default App;
