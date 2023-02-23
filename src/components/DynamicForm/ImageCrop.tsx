import * as React from 'react';
import ReactCrop, { Crop, PercentCrop, PixelCrop } from 'react-image-crop';
import styled from 'styled-components';

import { getBase64 } from '../../helpers/upload';

const CroppedImage = styled.img`
  border-radius: 5px;
  box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.26);
  max-height: ${(props: IProps) => props.maxHeight || DEFAULT_MAX_HEIGHT}px;
  max-width: ${(props: IProps) => props.maxWidth || DEFAULT_MAX_WEIGHT}px;
`;

const DEFAULT_MAX_HEIGHT = 200;
const DEFAULT_MAX_WEIGHT = 400;

interface IProps {
  maxHeight: number;
  maxWidth: number;
}

interface IState {
  src: string | ArrayBuffer | null;
  croppedImageUrl?: string;
  crop: PixelCrop;
}

export class ImageCrop extends React.PureComponent<IProps, IState> {
  state: IState = {
    src: null,
    crop: { width: 50, height: 50, x: 0, y: 0, unit: 'px' },
  };

  private fileUrl: string;
  private imageRef: HTMLImageElement;

  onSelectFile = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      this.setState({ src: await getBase64(e.target.files[0]) });
    }
  };

  onImageLoaded = (image: HTMLImageElement, pixelCrop) => {
    this.imageRef = image;

    // Make the library regenerate aspect crops if loading new images.
    const { crop } = this.state;

    if (/*crop.aspect && */ crop.height && crop.width) {
      this.setState({ crop: { ...crop } });
    } else {
      this.makeClientCrop(crop, pixelCrop);
    }
  };

  onCropComplete = (crop: PixelCrop, percentageCrop: PercentCrop) => {
    this.makeClientCrop(crop, percentageCrop);
  };

  onCropChange = (crop) => {
    this.setState({ crop });
  };

  async makeClientCrop(crop: PixelCrop, percentageCrop: PercentCrop) {
    if (this.imageRef && crop.width && crop.height) {
      const croppedImageUrl = (await this.getCroppedImg(this.imageRef, crop, 'newFile.jpeg')) as string;
      this.setState({ croppedImageUrl });
    }
  }

  getCroppedImg(image, pixelCrop: PixelCrop, fileName) {
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height,
      );
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob: (Blob | null) & { name: string }) => {
        if (blob) {
          blob.name = fileName;
          window.URL.revokeObjectURL(this.fileUrl);
          this.fileUrl = window.URL.createObjectURL(blob);
          resolve(this.fileUrl);
        } else {
          reject(this.fileUrl);
        }
      }, 'image/jpeg');
    });
  }

  render() {
    const { maxHeight, maxWidth } = this.props;
    const { crop, croppedImageUrl, src } = this.state;

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
                // src={src as string}
                // onImageLoaded={this.onImageLoaded as any}
                crop={crop as Crop}
                onComplete={this.onCropComplete}
                onChange={this.onCropChange}
              >
                <img src={src as string} alt="" />
              </ReactCrop>
            )}
          </div>
          <div>{croppedImageUrl && <CroppedImage {...this.props} src={croppedImageUrl} />}</div>
          {/* language=CSS */}
          <style jsx>{`
            .asuna-image-crop div {
              display: inline-flex;
              margin: 1rem;
            }
          `}</style>
        </div>
      </div>
    );
  }
}
