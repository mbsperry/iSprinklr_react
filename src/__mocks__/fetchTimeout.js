export const fetchTimeout = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  })
);
