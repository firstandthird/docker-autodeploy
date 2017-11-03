
module.exports = {
  method(obj) {
    const arr = [];
    Object.keys(obj).forEach(key => {
      const str = `${key}=${obj[key]}`;
      arr.push(str);
    });

    return arr;
  }
};
