import React from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import styled from 'styled-components';

import 'react-image-crop/dist/ReactCrop.css';

const DEFAULT_MAX_HEIGHT = 200;
const DEFAULT_MAX_WEIGHT = 400;

interface IProps {
  maxHeight: number;
  maxWidth: number;
}

interface IState {
  src: string | ArrayBuffer | null;
  pixelCrops: PixelCrop[];
  crop: {
    aspect?: number;
    width?: number;
    height?: number | null;
    x?: number;
    y?: number;
  };
}

export class ImageTrivia extends React.PureComponent<IProps, IState> {
  state: IState = {
    src: null,
    pixelCrops: [],
    crop: {
      width: 50,
      x: 0,
      y: 0,
    },
  };

  private fileUrl: string;
  private imageRef: HTMLImageElement;

  onSelectFile = e => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => this.setState({ src: reader.result }));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  onImageLoaded = (image: HTMLImageElement, pixelCrop: PixelCrop) => {
    console.log('onImageLoaded', { image, pixelCrop });
    this.imageRef = image;

    // Make the library regenerate aspect crops if loading new images.
    const { crop } = this.state;

    if (crop.aspect && crop.height && crop.width) {
      this.setState({
        crop: { ...crop, height: null },
      });
    }
  };

  onCropComplete = (crop: Crop, pixelCrop: PixelCrop) => {
    console.log('onCropComplete', { crop, pixelCrop });
    // this.setState({ pixelCrop });
    // this.state.pixelCrops.push(pixelCrop);
    this.setState({ pixelCrops: [...this.state.pixelCrops, pixelCrop] });
  };

  onCropChange = (crop: Crop) => {
    this.setState({ crop });
  };

  render() {
    const { maxHeight, maxWidth } = this.props;
    const { crop, pixelCrops, src } = this.state;

    return (
      <div>
        <div>
          <input type="file" onChange={this.onSelectFile} />
        </div>
        <div className="asuna-image-crop">
          <div>
            {src && (
              <ReactCrop
                style={{
                  borderRadius: '5px',
                  boxShadow: '0 2px 5px 0 rgba(0, 0, 0, .26)',
                  maxHeight: maxHeight || DEFAULT_MAX_HEIGHT,
                  maxWidth: maxWidth || DEFAULT_MAX_WEIGHT,
                }}
                src={src as string}
                crop={crop as Crop}
                onImageLoaded={this.onImageLoaded as any}
                onComplete={this.onCropComplete}
                onChange={this.onCropChange}
              />
            )}
          </div>
          {/* language=CSS */}
          <style jsx>{`
            .asuna-image-crop div {
              display: inline-flex;
              margin: 1rem;
            }
          `}</style>
        </div>
        <div>
          {this.state.pixelCrops.map((pixelCrop, index) => (
            <pre key={index}>{JSON.stringify(pixelCrop, null, 2)}</pre>
          ))}
        </div>
      </div>
    );
  }
}
