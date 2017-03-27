const imageSize = require('image-size');
const DataUri = require('datauri');
const getPixels = require('get-pixels');
const path = require('path');
const gm = require('gm').subClass({ imageMagick: true });

function resizeImage(buffer, ext, width, blur, sigma) {
  return new Promise(resolve => {
    gm(buffer)
      .resize(width)
      .blur(blur, sigma)
      .toBuffer(ext, (err, buf) => resolve(buf));
  });
}

function bufferToDataUri(type, buffer) {
  return new DataUri().format(type, buffer).content;
}

function getColor(buffer, size, ext) {
  return new Promise((resolve, reject) => {
    gm(buffer).resize(2, 2).toBuffer(ext, (err, shrinkedImageBuffer) => {
      const type = `image/${size.type}`;
      getPixels(shrinkedImageBuffer, type, (err, pixels) => {
        if (err) {
          return reject(err);
        }
        return resolve([pixels.data[0], pixels.data[1], pixels.data[2], pixels.data[3]]);
      });
    });
  });
}

function createPlaceholder(content, ext, width = 20, blur = 40, sigma = undefined) {
  return resizeImage(content, ext, width, blur, sigma).then((resizedBuffer) => {
    const size = imageSize(resizedBuffer);
    const ratio = (size.height / size.width);
    return {
      url: bufferToDataUri('.' + ext, new Buffer(resizedBuffer, 'utf8')),
      ratio,
      size,
    };
  }).then((placeholder) => {
    return getColor(content, placeholder.size, ext).then((color) => {
      return {
        color,
        url: placeholder.url,
        ratio: placeholder.ratio,
      };
    });
  });
}

module.exports = function placeholderLoader(content) {
  if (this.cacheable) {
    this.cacheable();
  }
  const callback = this.async();

  const ext = path.parse(this.resourcePath).ext.slice(1);

  createPlaceholder(content, ext)
    .then((placeholder) => {
      callback(null, `module.exports = ${JSON.stringify(placeholder)}`);
    }, callback);
};

module.exports.raw = true;
