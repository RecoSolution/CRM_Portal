// Wraps async controller functions so we don't need
// try/catch in every single controller
// Usage: router.get('/', asyncHandler(async (req, res) => { ... }))

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
