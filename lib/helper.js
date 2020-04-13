function trimNewLine(input) {
  return typeof(input) === 'string'
    ? input.replace(/\n/g, '')
    : input;
}

function findLast(array) {
  return array && array.length > 0
    ? array[array.length - 1]
    : undefined;
}

module.exports = {
  trimNewLine: trimNewLine,
  findLast: findLast,
};