import './App.css';
import * as THREE from 'three';
import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from 'react-three-fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { DDSLoader } from 'three/examples/jsm/loaders/DDSLoader';
import Model from './components/model';
import { useFileUpload } from 'use-file-upload';
import axios from 'axios';

const App = () => {

  THREE.DefaultLoadingManager.addHandler(/\.dds$/i, new DDSLoader());

  const [view, setView] = useState(false);
  const [modelType, setModelType] = useState('');
  const [modelUrl, setModelUrl] = useState(null);
  const [mtlUrl, setMtlUrl] = useState('');
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [positionZ, setPositionZ] = useState(0);
  const [isModelUploading, setIsModelUploading] = useState(null);
  const [isMtlUploading, setIsMtlUploading] = useState(null);
  const [startModelUploading, setStartModelUploading] = useState(false);
  const [startMtlUploading, setStartMtlUploading] = useState(false);
  const [textureFiles, setTextureFiles] = useState();
  const [selectedModelName, setSelectedModelName] = useState('');
  const [selectedMtlName, setSelectedMtlName] = useState('');
  const [enableView, setEnableView] = useState(false);
  const [model, setModel] = useState(null);

  const [modelFiles, selectModelFiles] = useFileUpload();
  const [mtlFiles, selectMtlFiles] = useFileUpload();

  const modelView = () => {
    if (enableView) {
      setStartModelUploading(false);
      setStartMtlUploading(false);

      setPositionX(0 * 70);
      setPositionY(-0.638 * 70);
      setPositionZ(0.025 * 70);
      setView(true);
    };
  };

  useEffect(() => {
    if (modelUrl !== null) setIsModelUploading(true);
    if (mtlUrl !== null) setIsMtlUploading(true);
  }, [modelUrl, mtlUrl]);

  const selectModelFile = () => {
    selectModelFiles({ accept: ".obj, .fbx, .glb, .gltf" }, async ({ file }) => {
      var modelExtention = file.name.split(".").pop();
      setModelType(modelExtention);
      setSelectedModelName(file.name);
      setStartModelUploading(true);

      console.log(modelExtention);

      setModel(file);
      const formData = new FormData();
      formData.append('asset', file);
      const response = await axios.post('http://3.229.85.229:3001/api/assets/upload-asset', formData);
      if (response !== null) {
        console.log('model url->', response.data.upload_url);
        setModelUrl(response.data.upload_url[0]);
        setEnableView(true);
      };
    });
  };

  const selectMtlFile = () => {
    if (modelType === 'obj' || modelType === 'fbx' || modelType === 'gltf') {
      selectMtlFiles({ accept: ".mtl, .bin" }, async ({ file }) => {

        var file = file, read = new FileReader();
        read.readAsBinaryString(file);

        var nameArray = [];

        const formData = new FormData();

        console.log('model-->', model);
        formData.append('asset', model);
        formData.append('asset', file);

        read.onloadend = function () {
          console.log('onloadend');
          read.result.split(' ').forEach(items => {
            items.split('\n').forEach((item) => {
              if (item.includes('.png') || item.includes('.jpg') || item.includes('.img') || item.includes('.tga')) {
                nameArray.push(item.replace('\r', ''));
              }
            });
          });

          setStartMtlUploading(true);
          setSelectedMtlName(file.name);
          if (textureFiles) {
            if (modelType === 'gltf') {
              for (let i = 0; i < textureFiles.length; i++) {
                formData.append('asset', textureFiles[i]);
              }
            }
            else {
              for (let index = 0; index < textureFiles.length; index++) {
                for (let i = 0; i < nameArray.length; i++) {
                  if (textureFiles[index].name == nameArray[i]) {
                    formData.append('asset', textureFiles[index]);
                  }
                }
              }
            }
          }
          post();
        }

        const post = async () => {
          const response = await axios.post('http://3.229.85.229:3001/api/assets/upload-asset', formData);
          if (response !== null) {
            console.log('model & mtl ->', response.data.upload_url);
            if (file.name.split('.').pop() === 'mtl' || file.name.split('.').pop() === 'bin') {
              setModelUrl(response.data.upload_url[0]);
              setMtlUrl(response.data.upload_url[1]);
              setEnableView(true);
            }
          };
        }
      });
    }
  };

  return (
    <div className='main-layout'>
      <div className='list-layout'>
        <div className='list'>
          <div className='button' onClick={selectModelFile}>
            {
              !startModelUploading ? 'Model Upload' : (!isModelUploading ? 'Uploading...' : selectedModelName)
            }
          </div>
          <div className='button' onClick={selectMtlFile}>
            {
              !startMtlUploading ? 'Material Upload' : (!isMtlUploading ? 'Uploading...' : selectedMtlName)
            }
          </div>
          <div className='choose-files'>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                setTextureFiles(event.target.files);
              }}
              multiple
            />
          </div>
        </div>
        {
          modelUrl &&
          <div className='button' onClick={modelView} >
            VIEW
          </div>
        }
      </div>
      <div className='canvas'>
        <Suspense fallback={null} >
          <Canvas camera={{ position: [0, 1, 1], fov: 100 }}>
            <ambientLight intensity={1} />
            <pointLight position={[100, 30, 100]} intensity={0.2} />
            <Suspense fallback={null}>
              {
                view &&
                <Model modelType={modelType} modelUrl={modelUrl} mtlUrl={mtlUrl} positionX={positionX} positionY={positionY} positionZ={positionZ} />
              }
            </Suspense>
            <OrbitControls minDistance={200} maxDistance={250} />
          </Canvas>
        </Suspense>
      </div>
    </div>
  )
}

export default App;
