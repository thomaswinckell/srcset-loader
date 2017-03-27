const sizeOf = require('image-size');
const loaderUtils = require('loader-utils');
const path = require('path');
const gm = require('gm').subClass({ imageMagick: true });


function resizeImage(content, width, ext) {
  const source = sizeOf(content);

  // dont scale up images, let the browser do that
  // and btw. wtf stop trying to fool me :P
  if (source.width < width) {
    return Promise.resolve(content);
  }

  return new Promise(resolve => {
      gm(content).resize(width).toBuffer(ext, (err, buf) => resolve(buf));
  });
}

module.exports = function resizeLoader(content) {
  if (this.cacheable) {
    this.cacheable();
  }
  const callback = this.async();

  const query = loaderUtils.parseQuery(this.query);
  const size = parseInt(query.size, 10);
  const ext = path.parse(this.resourcePath).ext.slice(1);

  resizeImage(content, size, ext).then((buffer) => {
    callback(null, buffer);
  }, (err) => {
    callback(err);
  });
};

module.exports.raw = true;
