/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
import React, {
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
  useEffect,
} from 'react';
import { Canvas, useThree, extend } from '@react-three/fiber';
import { OrbitControls, Plane, Text } from '@react-three/drei';
import * as THREE from 'three';
import { seatData } from './utils';

extend({ OrbitControls });

const Circles = React.memo(
  ({ seats, theatreDimensions, handleHover, handleUnhover }) => {
    const { height, width } = theatreDimensions;
    const instancedMeshRef = useRef();
    const [clickedIds, setClickedIds] = useState([]);

    useLayoutEffect(() => {
      performance.mark('circles-start');
    }, []);

    useEffect(() => {
      if (!instancedMeshRef) return;
      performance.mark('circles-end');

      performance.measure(
        'circles-render-time',
        'circles-start',
        'circles-end'
      );

      const measure = performance.getEntriesByName('circles-render-time').pop();
      console.log(`Rendering time for circles: ${measure.duration}ms`);

      performance.clearMarks();
      performance.clearMeasures('circles-render-time');
    }, [instancedMeshRef]);

    useLayoutEffect(() => {
      if (!instancedMeshRef.current) return;

      performance.mark('interaction-start');

      const tempObject = new THREE.Object3D();
      const color = new THREE.Color();

      Object.keys(seats).forEach((seat, index) => {
        const { x, y } = seats[seat];

        tempObject.position.set(width / 2 - x, height / 2 - y, 1);
        tempObject.updateMatrix();
        instancedMeshRef.current.setMatrixAt(index, tempObject.matrix);

        if (clickedIds.includes(index)) {
          color.set('red');
        } else if (index > 500 && index < 850) {
          color.set('orange');
        } else {
          color.set('#e2e2e2');
        }

        instancedMeshRef.current.setColorAt(index, color);
      });

      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
      instancedMeshRef.current.instanceColor.needsUpdate = true;

      performance.mark('interaction-end');

      performance.measure(
        'interaction-time',
        'interaction-start',
        'interaction-end'
      );

      const measure = performance.getEntriesByName('interaction-time').pop();
      console.log(`This interaction took: ${measure.duration}ms`);
    }, [seats, height, width, clickedIds, instancedMeshRef]);

    return (
      <instancedMesh
        ref={instancedMeshRef}
        args={[null, null, Object.keys(seats).length]}
        onPointerOver={(e) => {
          const instanceId = e.instanceId;
          if (instanceId > 500 && instanceId < 850) {
            const title = Object.keys(seats)[instanceId].split('-').pop();
            handleHover(e, title);
          }
        }}
        onPointerLeave={() => {
          handleUnhover();
        }}
        onClick={(e) => {
          const id = e.instanceId;

          if (id > 500 && id < 850) {
            setClickedIds((prevIds) => {
              const index = prevIds.indexOf(id);
              if (index > -1) {
                return prevIds.filter((clickedId) => clickedId !== id);
              } else {
                return [...prevIds, id];
              }
            });
          }
        }}
      >
        <circleGeometry args={[7, 32]} />
        <meshStandardMaterial
          vertexColors={THREE.VertexColors}
          smoothShading={true}
        />
      </instancedMesh>
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
  const [apiData] = useState(seatData);

  const { camera, gl } = useThree();
  const controlRef = useRef(null);

  const setPosition = (x, y) => {
    if (camera.position.z < 250) return;
    const newCameraPosition = new THREE.Vector3(x, y, 200);
    camera.position.copy(newCameraPosition);
    camera.lookAt(new THREE.Vector3(x, y, 0));
    camera.updateProjectionMatrix();

    if (controlRef.current) {
      controlRef.current.target = new THREE.Vector3(x, y, 0);
      controlRef.current.update();
      // console.log(camera);
    }
  };

  return (
    <group>
      <Circles
        theatreDimensions={{ height: apiData.width, width: apiData.height }}
        seats={apiData.seats}
        handleHover={handleHover}
        handleUnhover={handleUnhover}
        setPosition={setPosition}
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
        enableDamping={true}
        dampingFactor={1}
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

const WebGl = () => {
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
        antialias='true'
        dpr={window.devicePixelRatio || 1}
        camera={{
          position: [0, 10, 500],
          fov: fov,
        }}
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

export default WebGl;
