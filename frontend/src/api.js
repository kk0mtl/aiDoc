import axios from 'axios';

// const jwt = localStorage.getItem('token');

const instance = axios.create({
  baseURL: process.env.REACT_APP_BACKEND,
  // headers: {
  //   Authorization: `${jwt}`
  // }
});

export default instance;
