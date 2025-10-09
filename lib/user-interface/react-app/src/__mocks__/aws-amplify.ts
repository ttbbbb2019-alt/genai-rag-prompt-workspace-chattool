export const API = {
  graphql: jest.fn(),
};

export const Auth = {
  currentAuthenticatedUser: jest.fn(),
  signOut: jest.fn(),
};

export const Hub = {
  listen: jest.fn(),
  remove: jest.fn(),
};

export default {
  API,
  Auth,
  Hub,
};
