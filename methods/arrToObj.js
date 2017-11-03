
module.exports = {
  method(arr) {
    const obj = {};
    arr.forEach(kvp => {
      const kvArr = kvp.split('=');
      const kvar = kvArr.shift();
      obj[kvar] = kvArr.join('=');
    });

    return obj;
  }
};
