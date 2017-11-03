
module.exports = {
  method(arr) {
    const obj = {};
    arr.forEach(kvp => {
      const [ kvar, kval ] = kvp.split('=');
      obj[kvar] = kval;
    });

    return obj;
  }
};
