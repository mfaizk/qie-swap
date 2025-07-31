import axios from "axios";

export const url = "https://dex-logo.qie.digital/api";
// export const url = "http://129.212.162.187:3001/api";

export const api = axios.create({
  baseURL: url,
  // headers: {
  //   "Content-Type": "application/json",
  // },
});

api.interceptors.request.use((config) => {
  return config;
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // toast.error(error.response.data.message);
      if (error.response.status === 401) {
        setTimeout(() => {
          // window.location.href = '/';
        }, 1000);
      }
      console.log(error.response.status);
      console.log(error.response.headers);
    } else if (error.request) {
      console.log(error.request);
    } else {
      console.log("Error", error.message);
    }
    return Promise.reject(error);
  }
);

export const get = async (url, params = {}, customHeaders = {}) => {
  try {
    const response = await api.get(url, {
      params,
      headers: {
        ...customHeaders,
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const post = async (url, data = {}, customHeaders = {}) => {
  try {
    const response = await api.post(url, data, {
      headers: {
        ...customHeaders,
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const put = async (url, data = {}, customHeaders = {}) => {
  try {
    const response = await api.put(url, data, {
      headers: {
        ...customHeaders,
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const del = async (url, customHeaders = {}) => {
  try {
    const response = await api.delete(url, {
      headers: {
        ...customHeaders,
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
};
