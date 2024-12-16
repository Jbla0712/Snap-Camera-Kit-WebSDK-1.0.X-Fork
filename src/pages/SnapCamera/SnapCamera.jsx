import React, { useEffect, useRef } from 'react';
import { bootstrapCameraKit, CameraKitSession, createMediaStreamSource, Transform2D, Lens } from "@snap/camera-kit";
import './SnapCamera.css';

let mediaStream;

const SnapCamera = () => {
  const canvasRef = useRef(null);
  const apiToken = process.env.REACT_APP_API_TOKEN;
  const lensGroupId = process.env.REACT_APP_LENS_GROUP_ID;
  const cameraSelectRef = useRef(null);
  const lensSelectRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const cameraKit = await bootstrapCameraKit({ apiToken: apiToken });
      const session = await cameraKit.createSession();

      // Use the ref to get the canvas element
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.replaceWith(session.output.live);
      }

      const { lenses } = await cameraKit.lenses.repository.loadLensGroups([lensGroupId]);

      // Vérification si le lens existe avant de l'appliquer
      if (lenses[19]) {
        session.applyLens(lenses[19]);
      } else {
        console.error("Lens avec l'index 19 non trouvé.");
      }

      await setCameraKitSource(session);
      await attachCamerasToSelect(session);
      console.log('attachCamerasToSelect is called');
      await attachLensesToSelect(lenses, session);
      console.log('attachLensesToSelect is called');
    };

    init();
  }, []);

  const setCameraKitSource = async (session, deviceId) => {
    if (mediaStream) {
      session.pause();
      mediaStream.getVideoTracks()[0].stop();
    }

    // Forcer la résolution 16:9 (ex : 1920x1080)
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId,
        width: { ideal: 1920 },  // Résolution 16:9
        height: { ideal: 1080 }
      }
    });

    const source = createMediaStreamSource(mediaStream);

    await session.setSource(source);

    source.setTransform(Transform2D.MirrorX);

    session.play();
  };

  const attachCamerasToSelect = async (session) => {
    cameraSelectRef.current.innerHTML = '';
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(({ kind }) => kind === 'videoinput');

    cameras.forEach((camera) => {
      const option = document.createElement('option');
      option.value = camera.deviceId;
      option.text = camera.label;
      cameraSelectRef.current.appendChild(option);
    });

    cameraSelectRef.current.addEventListener('change', (event) => {
      const deviceId = event.target.selectedOptions[0].value;
      setCameraKitSource(session, deviceId);
    });
  };

  const attachLensesToSelect = async (lenses, session) => {
    lensSelectRef.current.innerHTML = '';
    lenses.forEach((lens) => {
      const option = document.createElement('option');
      option.value = lens.id;
      option.text = lens.name;
      lensSelectRef.current.appendChild(option);
    });

    lensSelectRef.current.addEventListener('change', (event) => {
      const lensId = event.target.selectedOptions[0].value;
      const lens = lenses.find((lens) => lens.id === lensId);
      if (lens) {
        session.applyLens(lens);
      } else {
        console.error("Lens non trouvé pour l'ID sélectionné.");
      }
    });
  };

  return (
    <div className="container">
      <canvas ref={canvasRef} id="canvas-container" width="1920" height="1080"></canvas>
      <div className="footer">
        <select ref={cameraSelectRef} className="styled-select"></select>
        <select ref={lensSelectRef} className="styled-select"></select>
      </div>
    </div>
  );
};

export default SnapCamera;
