export const API = {
  graphql: jest.fn().mockResolvedValue({ data: {} }),
  get: jest.fn().mockResolvedValue({}),
  post: jest.fn().mockResolvedValue({}),
  put: jest.fn().mockResolvedValue({}),
  del: jest.fn().mockResolvedValue({}),
};

export const Auth = {
  currentAuthenticatedUser: jest.fn().mockResolvedValue({}),
  signOut: jest.fn().mockResolvedValue({}),
};

export const Storage = {
  get: jest.fn().mockResolvedValue(''),
  put: jest.fn().mockResolvedValue({}),
  remove: jest.fn().mockResolvedValue({}),
};
