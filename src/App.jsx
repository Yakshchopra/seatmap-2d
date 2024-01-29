/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
import './App.css';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas, useThree, extend } from '@react-three/fiber';
import { OrbitControls, Plane, Text } from '@react-three/drei';
import * as THREE from 'three';
import { seatData } from './utils';

extend({ OrbitControls });

const Circle = React.memo(
  ({
    color,
    x,
    y,
    size = 10,
    handleHover,
    handleUnhover,
    title,
    setPosition,
    setSelectedSeat,
  }) => {
    const onHover = useCallback(
      (e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        const section = title.split('-').pop();
        handleHover(e, section);
      },
      [title, handleHover]
    );

    const onUnhover = useCallback(() => {
      document.body.style.cursor = 'auto';
      handleUnhover();
    }, [handleUnhover]);

    const handleClick = useCallback(
      (e) => {
        e.stopPropagation();
        setPosition(title, x, y);
        setSelectedSeat(title);
        setClicked((prev) => !prev);
      },
      [title, x, y, setPosition, setSelectedSeat]
    );

    const [clicked, setClicked] = useState(false);

    return (
      <group>
        <mesh
          onClick={handleClick}
          position={[x, y, 1]}
          onPointerOver={color === 'orange' && onHover}
          onPointerOut={color === 'orange' && onUnhover}
        >
          <circleGeometry args={[size, 32]} />
          <meshStandardMaterial color={color} />
        </mesh>
        {clicked && (
          <mesh position={[x, y, 2]}>
            <boxGeometry args={[size / 1.5, size / 1.5, 0]} />
            <meshBasicMaterial color='white' />
          </mesh>
        )}
      </group>
    );
  }
);

const RenderScreen = React.memo(({ shapes, theatreDimensions }) => {
  return shapes.map((shape, index) => (
    <Plane
      key={index}
      position={[
        theatreDimensions.width / 2 - shape.x,
        theatreDimensions.height / 2 - shape.y,
        0,
      ]}
      args={[shape.width, shape.height]}
    >
      <meshBasicMaterial
        attach='material'
        color={shape.ShapeFillColour}
        opacity={1}
      />
    </Plane>
  ));
});

const RenderSeats = React.memo(
  ({
    seats,
    theatreDimensions,
    handleHover,
    handleUnhover,
    setPosition,
    setSelectedSeat,
  }) => {
    return Object.keys(seats).map((seat, index) => {
      const seatDetails = seats[seat];
      return (
        <Circle
          key={index}
          y={theatreDimensions.height / 2 - seatDetails.y}
          x={theatreDimensions.width / 2 - seatDetails.x}
          size={7}
          handleHover={handleHover}
          seat={seatDetails}
          color={index > 500 && index < 850 ? 'orange' : '#e2e2e2'}
          handleUnhover={handleUnhover}
          setPosition={setPosition}
          title={seat}
          setSelectedSeat={setSelectedSeat}
        />
      );
    });
  }
);

const RenderLabels = React.memo(({ labels, theatreDimensions }) => {
  return labels.map((label, index) => (
    <Text
      key={index}
      position={[
        theatreDimensions.width / 2 - label.x,
        theatreDimensions.height / 2 - label.y,
        2,
      ]}
      fontSize={label.size}
      color={label.color}
      anchorX='center'
      anchorY='middle'
    >
      {label.content}
    </Text>
  ));
});

const Scene = React.memo(({ handleHover, handleUnhover }) => {
  const [apiData, setApiData] = useState(seatData); // Assuming seatData doesn't change often
  const [selectedSeat, setSelectedSeat] = useState(null);
  const { camera, gl } = useThree();
  const controlRef = useRef(null);

  // useEffect(() => {
  //   if (controlRef.current) {
  //     controlRef.current.enableDamping = true; // Enable damping
  //     controlRef.current.dampingFactor = 0.1; // Damping factor for rotation
  //     controlRef.current.zoomDampingFactor = 5000; // Damping factor for zoom
  //   }
  // }, [controlRef]);

  const setPosition = useCallback(
    (seat, x, y) => {
      if (seat === selectedSeat || camera.position.z < 250) return;
      const newCameraPosition = new THREE.Vector3(x, y, 200);
      camera.position.copy(newCameraPosition);
      camera.lookAt(new THREE.Vector3(x, y, 0));
      camera.updateProjectionMatrix();
      if (controlRef.current) {
        controlRef.current.target = new THREE.Vector3(x, y, 0);
        controlRef.current.update();
      }
    },
    [selectedSeat, camera]
  );

  return (
    <group>
      <RenderSeats
        theatreDimensions={{ height: apiData.width, width: apiData.height }}
        handleHover={handleHover}
        handleUnhover={handleUnhover}
        seats={apiData.seats}
        setPosition={setPosition}
        setSelectedSeat={setSelectedSeat}
      />
      <RenderScreen
        theatreDimensions={{ height: apiData.width, width: apiData.height }}
        shapes={apiData.shapes}
      />
      <RenderLabels
        theatreDimensions={{ height: apiData.width, width: apiData.height }}
        labels={apiData['text-elements']}
      />
      <ambientLight intensity={4} />
      <OrbitControls
        ref={controlRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={false}
        touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE }}
        minDistance={50}
        maxDistance={500}
        mouseButtons={{
          LEFT: THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.ZOOM,
          RIGHT: THREE.MOUSE.ROTATE,
        }}
        args={[camera, gl.domElement]}
      />
    </group>
  );
});

const App = () => {
  const [tooltip, setTooltip] = useState({
    show: false,
    x: 0,
    y: 0,
    content: '',
  });

  const handleHover = useCallback((e, content) => {
    setTooltip({
      show: true,
      x: e.clientX,
      y: e.clientY,
      content: content,
    });
  }, []);

  const handleUnhover = useCallback(() => {
    setTooltip((prev) => ({ ...prev, show: false }));
  }, []);

  const isMobile = window.matchMedia('(max-width: 600px)').matches;
  const fov = isMobile ? 145 : 120;

  return (
    <>
      <Canvas
        style={{
          width: '100vw',
          height: '100vh',
          background: 'white',
          touchAction: 'none',
        }}
        dpr={window.devicePixelRatio || 1}
        camera={{
          position: [0, 10, 500],
          fov: fov,
        }}
        frameloop='demand'
      >
        <Scene handleHover={handleHover} handleUnhover={handleUnhover} />
      </Canvas>
      {tooltip.show && (
        <div
          className='tooltip'
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          <p>{tooltip.content}</p>
        </div>
      )}
    </>
  );
};

export default App;
